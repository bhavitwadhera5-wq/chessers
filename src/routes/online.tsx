import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/online")({
  component: OnlineLobby,
});

type Game = {
  id: string;
  white_player: string | null;
  black_player: string | null;
  white_username: string | null;
  black_username: string | null;
  status: string;
  fen: string;
  turn: string;
  winner: string | null;
  created_at: string;
  updated_at: string;
};

function OnlineLobby() {
  const navigate = useNavigate();
  const { user, username } = useAuth();

  const [games, setGames] = useState<Game[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    loadGames();

    const channel = supabase
      .channel("online-games-lobby")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
        },
        () => {
          loadGames();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function loadGames() {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("status", "waiting")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setMessage(error.message);
      return;
    }

    setGames((data ?? []) as Game[]);
  }

  async function createGame() {
    if (!user || !username) return;

    setBusy(true);
    setMessage(null);

    const { data, error } = await supabase
      .from("games")
      .insert({
        white_player: user.id,
        white_username: username,
        status: "waiting",
        fen: "start",
        turn: "w",
      })
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }

    setBusy(false);

    navigate({
      to: "/play/$gameId",
      params: {
        gameId: data.id,
      },
    });
  }

  async function joinGame(game: Game) {
    if (!user || !username) return;

    if (game.white_player === user.id) {
      navigate({
        to: "/play/$gameId",
        params: {
          gameId: game.id,
        },
      });

      return;
    }

    setBusy(true);
    setMessage(null);

    const { error } = await supabase
      .from("games")
      .update({
        black_player: user.id,
        black_username: username,
        status: "playing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", game.id)
      .eq("status", "waiting");

    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }

    setBusy(false);

    navigate({
      to: "/play/$gameId",
      params: {
        gameId: game.id,
      },
    });
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-2xl font-bold">
            Sign in required
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Sign in before playing online.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl">

        <button
          onClick={() => navigate({ to: "/" })}
          className="mb-6 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Chessers
        </button>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">

          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Multiplayer
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Play Online
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Create a game or join another player's game.
            </p>
          </div>

          <button
            onClick={createGame}
            disabled={busy}
            className="w-full rounded-xl bg-primary px-5 py-4 text-left font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <span className="block text-lg">
              ♟️ Create Game
            </span>

            <span className="block text-sm font-normal opacity-80">
              Wait for another player to join.
            </span>
          </button>

          {message && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {message}
            </div>
          )}

          <div className="mt-8">

            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">
                Open Games
              </h2>

              <button
                onClick={loadGames}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Refresh
              </button>
            </div>

            {games.length === 0 ? (
              <div className="rounded-xl border border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No open games right now.
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Create a game and wait for someone to join.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {games.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between rounded-xl border border-border p-4"
                  >
                    <div>
                      <p className="font-semibold">
                        {game.white_username ?? "Player"}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Waiting for opponent
                      </p>
                    </div>

                    <button
                      onClick={() => joinGame(game)}
                      disabled={busy}
                      className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold hover:opacity-80 disabled:opacity-50"
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>
      </div>
    </main>
  );
}