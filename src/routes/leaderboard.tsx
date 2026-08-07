import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { HUMAN_BOTS } from "@/lib/humanBots";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Chess Leaderboard & Player Stats — Chessers" },
      {
        name: "description",
        content:
          "See the top rated Chessers players, your win/loss/draw record and your recent online games.",
      },
      { property: "og:title", content: "Chess Leaderboard & Player Stats — Chessers" },
      {
        property: "og:description",
        content: "Global rankings by rating plus your personal record and game history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Leaderboard,
});

type Row = { id: string; username: string; elo: number };

/** Online personas that also appear in the public rankings. */
const BOT_ROWS: Row[] = HUMAN_BOTS.map((b) => ({
  id: `bot:${b.name}`,
  username: b.name,
  elo: b.elo,
}));
type GameRow = {
  id: string;
  white_id: string | null;
  black_id: string | null;
  result: string | null;
  created_at: string;
};

function Leaderboard() {
  const { user, username } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [games, setGames] = useState<GameRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      const [top, mine] = await Promise.all([
        supabase.from("profiles").select("id, username, elo").order("elo", { ascending: false }).limit(25),
        supabase
          .from("games")
          .select("id, white_id, black_id, result, created_at")
          .eq("status", "finished")
          .or(`white_id.eq.${user.id},black_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      if (!active) return;
      const profiles = (top.data ?? []) as Row[];
      const merged = [...profiles, ...BOT_ROWS]
        .sort((a, b) => b.elo - a.elo)
        .slice(0, 25);
      setRows(merged);
      setGames((mine.data ?? []) as GameRow[]);
      setNames(Object.fromEntries(merged.map((p) => [p.id, p.username])));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const record = games.reduce(
    (acc, g) => {
      const mine = g.white_id === user?.id ? "white" : "black";
      if (g.result === "draw") acc.d += 1;
      else if (g.result === mine) acc.w += 1;
      else if (g.result) acc.l += 1;
      return acc;
    },
    { w: 0, l: 0, d: 0 },
  );

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-8">
      <div className="w-full max-w-3xl">
        <header className="mb-6 text-center">
          <Link
            to="/"
            className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
          >
            ← Home
          </Link>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-foreground">
            Leaderboard
          </h1>
        </header>

        {!user ? (
          <p className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
            Sign in from the home screen to see rankings and your record.
          </p>
        ) : loading ? (
          <p className="text-center text-sm text-muted-foreground">Loading rankings…</p>
        ) : (
          <div className="space-y-6">
            <section className="grid grid-cols-3 gap-2">
              <Stat label="Wins" value={record.w} />
              <Stat label="Draws" value={record.d} />
              <Stat label="Losses" value={record.l} />
            </section>

            <section className="overflow-hidden rounded-xl border border-border bg-card">
              <h2 className="border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Top players
              </h2>
              <ol>
                {rows.map((r, i) => (
                  <li
                    key={r.id}
                    className={`flex items-center justify-between px-4 py-2 text-sm ${
                      r.username === username ? "bg-secondary font-semibold" : ""
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-6 text-muted-foreground">{i + 1}</span>
                      <span className="text-card-foreground">{r.username}</span>
                    </span>
                    <span className="font-mono text-card-foreground">{r.elo}</span>
                  </li>
                ))}
                {rows.length === 0 && (
                  <li className="px-4 py-3 text-sm text-muted-foreground">No players yet.</li>
                )}
              </ol>
            </section>

            <section className="overflow-hidden rounded-xl border border-border bg-card">
              <h2 className="border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Your recent games
              </h2>
              <ul>
                {games.map((g) => {
                  const mine = g.white_id === user.id ? "white" : "black";
                  const opponentId = mine === "white" ? g.black_id : g.white_id;
                  const outcome =
                    g.result === "draw" ? "Draw" : g.result === mine ? "Win" : "Loss";
                  return (
                    <li
                      key={g.id}
                      className="flex items-center justify-between px-4 py-2 text-sm text-card-foreground"
                    >
                      <span>
                        vs {opponentId ? names[opponentId] ?? "Opponent" : "Opponent"} ·{" "}
                        <span className="text-muted-foreground">{mine}</span>
                      </span>
                      <span
                        className={
                          outcome === "Win"
                            ? "text-primary"
                            : outcome === "Loss"
                              ? "text-destructive"
                              : "text-muted-foreground"
                        }
                      >
                        {outcome}
                      </span>
                    </li>
                  );
                })}
                {games.length === 0 && (
                  <li className="px-4 py-3 text-sm text-muted-foreground">
                    No finished online games yet.
                  </li>
                )}
              </ul>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-3 text-center">
      <p className="text-xl font-semibold text-card-foreground">{value}</p>
      <p className="text-[0.7rem] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

