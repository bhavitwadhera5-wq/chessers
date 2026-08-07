import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BOARD_THEMES, THEME_KEY, type BoardTheme } from "@/lib/boardThemes";
import { findOrCreateGame } from "@/lib/games.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "chessers — Play Chess Online or Against a Bot" },
      {
        name: "description",
        content:
          "Sign in with a username, play chess against a bot, or challenge a friend online across devices with live turn-by-turn play.",
      },
      { property: "og:title", content: "chessers — Play Chess Online or Against a Bot" },
      {
        property: "og:description",
        content: "Username sign-in, live multiplayer chess, and an instant bot opponent.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { user, username, isAdmin, loading } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <header className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            Board is set
          </p>
          <h1 className="mt-2 font-serif text-5xl font-bold tracking-tight text-foreground">
            chessers
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Play the bot, or challenge a friend on any device.
          </p>
        </header>

        {loading ? (
          <p className="text-center text-sm text-muted-foreground">Loading…</p>
        ) : user ? (
          <Menu username={username} isAdmin={isAdmin} />
        ) : (
          <AuthCard />
        )}
      </div>
    </main>
  );
}

function AuthCard() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = mode === "in" ? await signIn(name, password) : await signUp(name, password);
    if (err) setError(err);
    setBusy(false);
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-panel)]"
    >
      <div className="flex rounded-lg border border-border p-1">
        {(["in", "up"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === m
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m === "in" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Username
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="username"
          required
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Password
        </span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          required
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
      </button>
      <p className="text-center text-xs text-muted-foreground">
        We remember you on this device, so you stay signed in.
      </p>
    </form>
  );
}

const COLORS = [
  { id: "w" as const, label: "White" },
  { id: "b" as const, label: "Black" },
  { id: "random" as const, label: "Random" },
];

const CLOCKS = [
  { id: 0, label: "No clock" },
  { id: 5, label: "5 min" },
  { id: 10, label: "10 min" },
];

function Menu({ username, isAdmin }: { username: string | null; isAdmin: boolean }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const startGame = useServerFn(findOrCreateGame);
  const [setup, setSetup] = useState(false);
  const [opponent, setOpponent] = useState("");
  const [color, setColor] = useState<"w" | "b" | "random">("random");
  const [minutes, setMinutes] = useState(0);
  const [theme, setTheme] = useState<BoardTheme>("green");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [elo, setElo] = useState<number | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY) as BoardTheme | null;
    if (saved && BOARD_THEMES.some((t) => t.id === saved)) setTheme(saved);
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase
        .from("profiles")
        .select("elo")
        .eq("id", data.user.id)
        .maybeSingle()
        .then(({ data: row }) => setElo(row?.elo ?? null));
    });
  }, []);

  const play = async () => {
    setBusy(true);
    setNote(null);
    window.localStorage.setItem(THEME_KEY, theme);
    try {
      const res = await startGame({
        data: { opponentUsername: opponent || null, color, minutes },
      });
      navigate({ to: "/play/$gameId", params: { gameId: res.gameId } });
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-panel)]">
      <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <span>Signed in as <span className="font-semibold text-foreground">{username ?? "…"}</span></span>
        {isAdmin && (
          <span className="rounded-md bg-destructive px-2 py-0.5 text-xs font-bold uppercase text-destructive-foreground">
            Admin
          </span>
        )}
        {elo !== null && (
          <span>
            · online rating{" "}
            <span className="font-semibold text-foreground">{elo}</span>
          </span>
        )}
      </p>

      {isAdmin && (
        <button
          onClick={() => navigate({ to: "/admin" })}
          className="w-full rounded-lg bg-destructive px-4 py-3 text-left font-semibold text-destructive-foreground transition-opacity hover:opacity-90"
        >
          Open Admin Console
          <span className="block text-xs font-normal opacity-80">
            Manage players, bans, ratings, roles, passwords, reports, and fair play
          </span>
        </button>
      )}

      <button
        onClick={() => navigate({ to: "/solo" })}
        className="w-full rounded-lg border border-border px-4 py-3 text-left font-medium text-foreground transition-colors hover:bg-secondary"
      >
        Play against the bot
        <span className="block text-xs font-normal text-muted-foreground">
          Instant offline game
        </span>
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate({ to: "/puzzles" })}
          className="rounded-lg border border-border px-4 py-3 text-left font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Puzzles
          <span className="block text-xs font-normal text-muted-foreground">Daily tactic</span>
        </button>
        <button
          onClick={() => navigate({ to: "/leaderboard" })}
          className="rounded-lg border border-border px-4 py-3 text-left font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Leaderboard
          <span className="block text-xs font-normal text-muted-foreground">Rankings & stats</span>
        </button>
      </div>


      {!setup ? (
        <button
          onClick={() => setSetup(true)}
          className="w-full rounded-lg bg-primary px-4 py-3 text-left font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Play online
          <span className="block text-xs font-normal opacity-80">
            Set up your match, then find an opponent
          </span>
        </button>
      ) : (
        <div className="space-y-3 rounded-lg border border-border p-4">
          <p className="font-medium text-foreground">Set up your online match</p>

          <SetupGroup label="Which colour do you want to play?">
            {COLORS.map((c) => (
              <Pick key={c.id} active={color === c.id} onClick={() => setColor(c.id)}>
                {c.label}
              </Pick>
            ))}
          </SetupGroup>

          <SetupGroup label="Time control">
            {CLOCKS.map((c) => (
              <Pick key={c.id} active={minutes === c.id} onClick={() => setMinutes(c.id)}>
                {c.label}
              </Pick>
            ))}
          </SetupGroup>

          <SetupGroup label="Board theme">
            {BOARD_THEMES.map((t) => (
              <Pick key={t.id} active={theme === t.id} onClick={() => setTheme(t.id)}>
                {t.label}
              </Pick>
            ))}
          </SetupGroup>

          <input
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
            placeholder="Friend's username (optional)"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={play}
            disabled={busy}
            className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Finding a game…" : "Find a match"}
          </button>
          <p className="text-xs text-muted-foreground">
            We match you with a player who picked the same time control and the other colour.
          </p>
          <button
            onClick={() => setSetup(false)}
            className="w-full rounded-lg px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          {note && <p className="text-sm text-destructive">{note}</p>}
        </div>
      )}

      <button
        onClick={signOut}
        className="w-full rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Sign out
      </button>
    </div>
  );
}

function SetupGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Pick({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}


