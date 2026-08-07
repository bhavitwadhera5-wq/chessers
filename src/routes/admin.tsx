import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  adminFairPlay,
  adminReports,
  adminSearchPlayers,
  adminSetBan,
  adminSetElo,
  adminSetPassword,
  adminSetRole,
  amIAdmin,
  setReportStatus,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Moderation Dashboard — Chessers" },
      {
        name: "description",
        content:
          "Admin-only moderation dashboard for Chessers: review player reports and fair-play engine analysis.",
      },
      { property: "og:title", content: "Moderation Dashboard — Chessers" },
      {
        property: "og:description",
        content: "Review reports and fair-play flags for Chessers players.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Admin,
});

type Report = {
  id: string;
  reported_username: string | null;
  reported_id: string | null;
  reason: string;
  details: string | null;
  status: string;
  engine_match: number | null;
  accuracy: number | null;
  game_id: string | null;
  created_at: string;
};

type Flag = {
  id: string;
  player_id: string;
  engine_match: number;
  accuracy: number;
  moves: number;
  suspicion: string;
  created_at: string;
};

const STATUSES = ["open", "reviewing", "resolved", "dismissed"];

type Player = {
  id: string;
  username: string;
  elo: number;
  banned: boolean;
  ban_reason: string | null;
  banned_at: string | null;
  isAdmin: boolean;
};

function PlayerAdmin() {
  const search = useServerFn(adminSearchPlayers);
  const setBan = useServerFn(adminSetBan);
  const setElo = useServerFn(adminSetElo);
  const setRole = useServerFn(adminSetRole);
  const setPassword = useServerFn(adminSetPassword);
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const run = useCallback(
    async (q: string) => {
      setBusy(true);
      setError(null);
      try {
        setPlayers((await search({ data: { query: q } })) as Player[]);
      } catch {
        setError("Could not load players.");
      } finally {
        setBusy(false);
      }
    },
    [search],
  );

  useEffect(() => {
    void run("");
  }, [run]);

  async function act(fn: () => Promise<unknown>, message?: string) {
    setError(null);
    setNotice(null);
    try {
      await fn();
      if (message) setNotice(message);
      await run(query);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-lg font-medium">Players</h2>
      <div className="mb-3 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run(query)}
          placeholder="Search username…"
          maxLength={40}
          className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        />
        <button
          onClick={() => run(query)}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
        >
          Search
        </button>
      </div>
      {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
      {notice && <p className="mb-2 text-sm text-primary">{notice}</p>}
      {busy && <p className="text-sm text-muted-foreground">Loading…</p>}
      <div className="space-y-2">
        {!busy && players.length === 0 && (
          <p className="text-sm text-muted-foreground">No players found.</p>
        )}
        {players.map((p) => (
          <article
            key={p.id}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3"
          >
            <div className="min-w-[9rem] flex-1">
              <p className="font-medium">
                {p.username}
                {p.isAdmin && (
                  <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-xs text-primary">
                    admin
                  </span>
                )}
                {p.banned && (
                  <span className="ml-2 rounded bg-destructive/15 px-1.5 py-0.5 text-xs text-destructive">
                    banned
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                Rating {p.elo}
                {p.ban_reason ? ` · ${p.ban_reason}` : ""}
              </p>
            </div>
            <input
              type="number"
              defaultValue={p.elo}
              min={100}
              max={4000}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                const elo = Number((e.target as HTMLInputElement).value);
                void act(() => setElo({ data: { userId: p.id, elo } }), "Rating saved.");
              }}
              className="w-24 rounded-md border border-border bg-background px-2 py-1 text-sm"
              aria-label={`Rating for ${p.username}`}
            />
            <button
              onClick={() => {
                const pw = window.prompt(`New password for ${p.username} (min 6 characters)`);
                if (!pw) return;
                void act(
                  () => setPassword({ data: { userId: p.id, password: pw } }),
                  `Password updated for ${p.username}.`,
                );
              }}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold hover:bg-secondary"
            >
              Reset password
            </button>
            <button
              onClick={() => {
                if (
                  !window.confirm(
                    p.isAdmin
                      ? `Remove admin powers from ${p.username}?`
                      : `Make ${p.username} an admin? They get full moderation powers.`,
                  )
                )
                  return;
                void act(
                  () => setRole({ data: { userId: p.id, admin: !p.isAdmin } }),
                  p.isAdmin ? "Admin removed." : "Admin granted.",
                );
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                p.isAdmin
                  ? "border border-border text-foreground hover:bg-secondary"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {p.isAdmin ? "Remove admin" : "Make admin"}
            </button>
            <button
              onClick={() => {
                const reason = p.banned
                  ? null
                  : window.prompt(`Reason for banning ${p.username}?`, "Fair play violation");
                if (!p.banned && reason === null) return;
                void act(() => setBan({ data: { userId: p.id, banned: !p.banned, reason } }));
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                p.banned
                  ? "border border-border text-foreground hover:bg-secondary"
                  : "bg-destructive text-destructive-foreground"
              }`}
            >
              {p.banned ? "Unban" : "Ban"}
            </button>
          </article>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Press Enter in the rating box to save a new rating. Passwords are stored one-way encrypted,
        so nobody can read them — you can only set a new one.
      </p>
    </section>
  );
}


function Admin() {
  const { user, loading: authLoading } = useAuth();
  const checkAdmin = useServerFn(amIAdmin);
  const loadReports = useServerFn(adminReports);
  const loadFlags = useServerFn(adminFairPlay);
  const updateStatus = useServerFn(setReportStatus);

  const [state, setState] = useState<"loading" | "denied" | "ok">("loading");
  const [reports, setReports] = useState<Report[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);

  const refresh = useCallback(async () => {
    const [r, f] = await Promise.all([loadReports(), loadFlags()]);
    setReports(r as Report[]);
    setFlags(f as Flag[]);
  }, [loadReports, loadFlags]);


  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setState("denied");
      return;
    }
    let active = true;
    (async () => {
      try {
        const { isAdmin } = await checkAdmin();
        if (!active) return;
        if (!isAdmin) return setState("denied");
        await refresh();
        if (active) setState("ok");
      } catch {
        if (active) setState("denied");
      }
    })();
    return () => {
      active = false;
    };
  }, [authLoading, user, checkAdmin, refresh]);

  async function onStatus(id: string, status: string) {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    await updateStatus({ data: { id, status } });
  }

  if (state === "loading")
    return <main className="p-8 text-center text-muted-foreground">Loading…</main>;

  if (state === "denied")
    return (
      <main className="mx-auto max-w-md p-8 text-center">
        <h1 className="mb-2 text-2xl font-semibold">Admins only</h1>
        <p className="mb-6 text-muted-foreground">
          Sign in with the admin account to open the moderation dashboard.
        </p>
        <Link to="/" className="text-primary underline">
          Back to home
        </Link>
      </main>
    );

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-4 sm:p-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Moderation dashboard</h1>
        <Link to="/" className="text-sm text-primary underline">
          Home
        </Link>
      </header>

      <PlayerAdmin />



      <section>
        <h2 className="mb-3 text-lg font-medium">Reports ({reports.length})</h2>
        <div className="space-y-3">
          {reports.length === 0 && (
            <p className="text-sm text-muted-foreground">No reports filed yet.</p>
          )}
          {reports.map((r) => (
            <article key={r.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {r.reported_username ?? r.reported_id ?? "Unknown player"}
                    <span className="ml-2 text-sm text-muted-foreground">{r.reason}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                    {r.engine_match != null && ` · engine match ${r.engine_match}%`}
                    {r.accuracy != null && ` · accuracy ${r.accuracy}%`}
                  </p>
                </div>
                <select
                  value={STATUSES.includes(r.status) ? r.status : "open"}
                  onChange={(e) => onStatus(r.id, e.target.value)}
                  className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              {r.details && <p className="mt-2 text-sm">{r.details}</p>}
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Fair-play analysis</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-2">Player</th>
                <th className="p-2">Engine match</th>
                <th className="p-2">Accuracy</th>
                <th className="p-2">Moves</th>
                <th className="p-2">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {flags.length === 0 && (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={5}>
                    No analysed games yet.
                  </td>
                </tr>
              )}
              {flags.map((f) => (
                <tr key={f.id} className="border-t border-border">
                  <td className="p-2 font-mono text-xs">{f.player_id.slice(0, 8)}</td>
                  <td className="p-2">{f.engine_match}%</td>
                  <td className="p-2">{f.accuracy}%</td>
                  <td className="p-2">{f.moves}</td>
                  <td className="p-2">{f.suspicion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

