import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Chessers — Play Chess Online or Against a Bot",
      },
      {
        name: "description",
        content:
          "Sign in, play chess against a bot, play online, or solve tactical chess puzzles.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { user, username, isAdmin, loading } = useAuth();

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            Board is set
          </p>

          <h1 className="mt-3 text-5xl font-bold tracking-tight">
            Chessers
          </h1>

          <p className="mt-3 text-muted-foreground">
            Play against AI, play online, solve puzzles and improve your
            chess.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
          {loading ? (
            <p className="text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : user ? (
            <Menu
              username={username}
              isAdmin={isAdmin}
            />
          ) : (
            <AuthCard />
          )}
        </div>
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

    const err =
      mode === "in"
        ? await signIn(name, password)
        : await signUp(name, password);

    if (err) {
      setError(err);
    }

    setBusy(false);
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-5"
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
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              mode === m
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m === "in" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Username
        </label>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="username"
          required
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Password
        </label>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={
            mode === "in"
              ? "current-password"
              : "new-password"
          }
          required
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy
          ? "Please wait…"
          : mode === "in"
            ? "Sign in"
            : "Create account"}
      </button>
    </form>
  );
}

function Menu({
  username,
  isAdmin,
}: {
  username: string | null;
  isAdmin: boolean;
}) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [elo, setElo] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;

      supabase
        .from("profiles")
        .select("elo")
        .eq("id", data.user.id)
        .maybeSingle()
        .then(({ data: row }) => {
          setElo(row?.elo ?? null);
        });
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="mb-5">
        <p className="text-sm text-muted-foreground">
          Signed in as{" "}
          <span className="font-semibold text-foreground">
            {username ?? "…"}
          </span>
        </p>

        {elo !== null && (
          <p className="mt-1 text-sm text-muted-foreground">
            Rating:{" "}
            <span className="font-semibold text-foreground">
              {elo}
            </span>
          </p>
        )}
      </div>

      {isAdmin && (
        <button
          onClick={() =>
            navigate({ to: "/admin" })
          }
          className="w-full rounded-xl bg-destructive px-4 py-3 text-left font-semibold text-destructive-foreground transition-opacity hover:opacity-90"
        >
          🛠️ Admin Console

          <span className="block text-xs font-normal opacity-80">
            Manage players, ratings and fair play
          </span>
        </button>
      )}

      <button
        onClick={() =>
          navigate({ to: "/online" })
        }
        className="w-full rounded-xl bg-primary px-4 py-4 text-left font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        🌐 Play Online

        <span className="mt-1 block text-xs font-normal opacity-80">
          Play chess against another player online
        </span>
      </button>

      <button
        onClick={() =>
          navigate({ to: "/solo" })
        }
        className="w-full rounded-xl border border-border px-4 py-4 text-left font-semibold transition-colors hover:bg-secondary"
      >
        🤖 Play Against AI

        <span className="mt-1 block text-xs font-normal text-muted-foreground">
          Start an instant game against the computer
        </span>
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() =>
            navigate({ to: "/puzzles" })
          }
          className="rounded-xl border border-border px-4 py-4 text-left font-semibold transition-colors hover:bg-secondary"
        >
          🧩 Chess Puzzles

          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            Improve your tactics
          </span>
        </button>

        <button
          onClick={() =>
            navigate({ to: "/leaderboard" })
          }
          className="rounded-xl border border-border px-4 py-4 text-left font-semibold transition-colors hover:bg-secondary"
        >
          🏆 Leaderboard

          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            View the strongest players
          </span>
        </button>
      </div>

      <button
        onClick={signOut}
        className="w-full rounded-xl border border-border px-4 py-3 text-sm transition-colors hover:bg-secondary"
      >
        Sign Out
      </button>
    </div>
  );
}