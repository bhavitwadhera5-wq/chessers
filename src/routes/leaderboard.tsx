import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      {
        title: "Chessers Leaderboard",
      },
      {
        name: "description",
        content:
          "Chessers global chess rankings for Rapid, Blitz and Bullet.",
      },
    ],
  }),
  component: Leaderboard,
});

type RatingType = "rapid" | "blitz" | "bullet";

type ProfileRow = {
  id: string;
  username: string;

  rapid_elo: number | null;
  rapid_rd: number | null;

  blitz_elo: number | null;
  blitz_rd: number | null;

  bullet_elo: number | null;
  bullet_rd: number | null;

  elo: number | null;
};

type GameRow = {
  id: string;

  white_id: string | null;
  black_id: string | null;

  result: string | null;

  created_at: string;

  time_control: number;

  bot_name: string | null;
};

type Row = {
  id: string;
  username: string;
  rating: number;
  rd: number;
  bot: boolean;
};

const BOT_RATINGS = [
  { name: "Lucas Morgan", rating: 680 },
  { name: "Emma Walker", rating: 760 },
  { name: "Jackson Reed", rating: 880 },
  { name: "Mia Foster", rating: 1000 },
  { name: "Gabriel Santos", rating: 1080 },
  { name: "Amelia Clarke", rating: 1180 },
  { name: "Daniel Park", rating: 1280 },
  { name: "Isabella Romano", rating: 1380 },
  { name: "Maximilian Fischer", rating: 1480 },
  { name: "Layla Hassan", rating: 1580 },
  { name: "Ryan Cooper", rating: 1680 },
  { name: "Nora Andersen", rating: 1780 },
  { name: "Victor Hughes", rating: 1890 },
  { name: "Camila Torres", rating: 2000 },
  { name: "Alexei Volkov", rating: 2110 },
  { name: "Kenji Tanaka", rating: 2200 },
  { name: "Olivia Hart", rating: 2320 },
];

const TABS: {
  id: RatingType;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    id: "rapid",
    label: "Rapid",
    icon: "♟",
    description: "10 minute games",
  },
  {
    id: "blitz",
    label: "Blitz",
    icon: "⚡",
    description: "5 minute games",
  },
  {
    id: "bullet",
    label: "Bullet",
    icon: "💨",
    description: "Fast games",
  },
];

function ratingField(type: RatingType) {
  return `${type}_elo`;
}

function rdField(type: RatingType) {
  return `${type}_rd`;
}

function getRating(
  profile: ProfileRow,
  type: RatingType,
) {
  const rating =
    profile[ratingField(type) as keyof ProfileRow];

  const rd =
    profile[rdField(type) as keyof ProfileRow];

  return {
    rating:
      typeof rating === "number"
        ? rating
        : typeof profile.elo === "number"
          ? profile.elo
          : 1000,

    rd:
      typeof rd === "number"
        ? rd
        : 350,
  };
}

function getTimeLabel(minutes: number) {
  if (minutes === 10) return "Rapid";
  if (minutes === 5) return "Blitz";
  return "Bullet";
}

function getGameType(
  minutes: number,
): RatingType {
  if (minutes === 10) return "rapid";
  if (minutes === 5) return "blitz";
  return "bullet";
}

function Leaderboard() {
  const { user, username } = useAuth();

  const [ratingType, setRatingType] =
    useState<RatingType>("rapid");

  const [profiles, setProfiles] =
    useState<ProfileRow[]>([]);

  const [games, setGames] =
    useState<GameRow[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * Load leaderboard and recent games.
   */
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      const [
        profilesResult,
        gamesResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            `
              id,
              username,
              elo,
              rapid_elo,
              rapid_rd,
              blitz_elo,
              blitz_rd,
              bullet_elo,
              bullet_rd
            `,
          )
          .limit(100),

        supabase
          .from("games")
          .select(
            `
              id,
              white_id,
              black_id,
              result,
              created_at,
              time_control,
              bot_name
            `,
          )
          .eq(
            "status",
            "finished",
          )
          .or(
            `white_id.eq.${user.id},black_id.eq.${user.id}`,
          )
          .order(
            "created_at",
            {
              ascending: false,
            },
          )
          .limit(30),
      ]);

      if (!active) return;

      if (profilesResult.error) {
        setError(
          profilesResult.error.message,
        );
        setLoading(false);
        return;
      }

      if (gamesResult.error) {
        setError(
          gamesResult.error.message,
        );
        setLoading(false);
        return;
      }

      setProfiles(
        (profilesResult.data ??
          []) as ProfileRow[],
      );

      setGames(
        (gamesResult.data ??
          []) as GameRow[],
      );

      setLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, [user]);

  /*
   * Build leaderboard.
   */
  const rows = useMemo<Row[]>(() => {
    const playerRows: Row[] =
      profiles.map((profile) => {
        const rating =
          getRating(
            profile,
            ratingType,
          );

        return {
          id: profile.id,
          username:
            profile.username,
          rating: rating.rating,
          rd: rating.rd,
          bot: false,
        };
      });

    const botRows: Row[] =
      BOT_RATINGS.map((bot) => ({
        id: `bot:${bot.name}`,
        username: bot.name,
        rating: bot.rating,
        rd: 100,
        bot: true,
      }));

    return [
      ...playerRows,
      ...botRows,
    ]
      .sort(
        (a, b) =>
          b.rating - a.rating,
      )
      .slice(0, 50);
  }, [
    profiles,
    ratingType,
  ]);

  /*
   * Current player's rating.
   */
  const myRating = useMemo(() => {
    if (!user) return null;

    const profile =
      profiles.find(
        (p) => p.id === user.id,
      );

    if (!profile) return null;

    return getRating(
      profile,
      ratingType,
    );
  }, [
    profiles,
    user,
    ratingType,
  ]);

  /*
   * Calculate record only for the
   * currently selected game type.
   */
  const record = useMemo(() => {
    const result = {
      wins: 0,
      draws: 0,
      losses: 0,
      games: 0,
    };

    if (!user) return result;

    for (const game of games) {
      const type =
        getGameType(
          game.time_control,
        );

      if (type !== ratingType) {
        continue;
      }

      const mine =
        game.white_id === user.id
          ? "white"
          : "black";

      result.games += 1;

      if (
        game.result === "draw"
      ) {
        result.draws += 1;
      } else if (
        game.result === mine
      ) {
        result.wins += 1;
      } else if (
        game.result
      ) {
        result.losses += 1;
      }
    }

    return result;
  }, [
    games,
    ratingType,
    user,
  ]);

  /*
   * Find leaderboard position.
   */
  const myRank = useMemo(() => {
    if (!user) return null;

    const index =
      rows.findIndex(
        (row) =>
          row.id === user.id,
      );

    return index >= 0
      ? index + 1
      : null;
  }, [
    rows,
    user,
  ]);

  /*
   * Recent games.
   */
  const recentGames =
    useMemo(() => {
      if (!user) return [];

      return games.filter(
        (game) =>
          getGameType(
            game.time_control,
          ) === ratingType,
      );
    }, [
      games,
      ratingType,
      user,
    ]);

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center bg-background px-4 py-8">
        <div className="w-full max-w-4xl">
          <header className="mb-8 text-center">
            <Link
              to="/"
              className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
            >
              ← Home
            </Link>

            <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-foreground">
              Chessers Leaderboard
            </h1>
          </header>

          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <h2 className="text-xl font-semibold text-card-foreground">
              Sign in to see the leaderboard
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Sign in from the Chessers home screen
              to view rankings and your statistics.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-5xl">

        {/* HEADER */}
        <header className="mb-8 text-center">
          <Link
            to="/"
            className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
          >
            ← Home
          </Link>

          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-foreground">
            Chessers Leaderboard
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Compete. Climb. Become number one.
          </p>
        </header>

        {/* RATING TABS */}
        <div className="mb-6 grid grid-cols-3 gap-2">
          {TABS.map((tab) => {
            const active =
              ratingType === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() =>
                  setRatingType(tab.id)
                }
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:bg-secondary"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {tab.icon}
                  </span>

                  <span
                    className={`font-semibold ${
                      active
                        ? "text-foreground"
                        : "text-card-foreground"
                    }`}
                  >
                    {tab.label}
                  </span>
                </div>

                <p className="mt-1 text-[11px] text-muted-foreground">
                  {tab.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <strong>
              Could not load leaderboard.
            </strong>

            <p className="mt-1">
              {error}
            </p>
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Loading rankings…
          </div>
        ) : (
          <div className="space-y-6">

            {/* YOUR STATS */}
            <section>
              <div className="mb-3">
                <h2 className="text-lg font-semibold text-foreground">
                  Your {TABS.find(
                    (t) =>
                      t.id === ratingType,
                  )?.label} rating
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">

                <Stat
                  label="Rating"
                  value={
                    myRating
                      ? myRating.rating
                      : "—"
                  }
                />

                <Stat
                  label="Rating Deviation"
                  value={
                    myRating
                      ? `±${myRating.rd}`
                      : "—"
                  }
                />

                <Stat
                  label="Rank"
                  value={
                    myRank
                      ? `#${myRank}`
                      : "—"
                  }
                />

                <Stat
                  label="Games"
                  value={record.games}
                />

              </div>
            </section>

            {/* RECORD */}
            <section className="grid grid-cols-3 gap-2">
              <Stat
                label="Wins"
                value={record.wins}
              />

              <Stat
                label="Draws"
                value={record.draws}
              />

              <Stat
                label="Losses"
                value={record.losses}
              />
            </section>

            {/* LEADERBOARD */}
            <section className="overflow-hidden rounded-2xl border border-border bg-card">

              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <h2 className="font-semibold text-card-foreground">
                    {TABS.find(
                      (t) =>
                        t.id === ratingType,
                    )?.label} rankings
                  </h2>

                  <p className="text-xs text-muted-foreground">
                    Top 50 players
                  </p>
                </div>

                <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                  {ratingType.toUpperCase()}
                </span>
              </div>

              <ol>
                {rows.map(
                  (row, index) => {
                    const isMe =
                      row.id ===
                      user.id;

                    return (
                      <li
                        key={row.id}
                        className={`flex items-center justify-between border-b border-border/60 px-4 py-3 last:border-0 ${
                          isMe
                            ? "bg-primary/10"
                            : "hover:bg-secondary/50"
                        }`}
                      >

                        <div className="flex min-w-0 items-center gap-3">

                          <span
                            className={`w-8 text-sm font-semibold ${
                              index < 3
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            #{index + 1}
                          </span>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">

                              <span className="truncate font-medium text-card-foreground">
                                {row.username}
                              </span>

                              {isMe && (
                                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                                  You
                                </span>
                              )}

                              {row.bot && (
                                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                                  BOT
                                </span>
                              )}

                            </div>

                            <p className="text-[11px] text-muted-foreground">
                              {row.rd <= 80
                                ? "Established rating"
                                : row.rd <= 150
                                  ? "Developing rating"
                                  : "Provisional rating"}
                            </p>
                          </div>

                        </div>

                        <div className="ml-3 text-right">

                          <div className="font-mono text-lg font-bold text-card-foreground">
                            {row.rating}
                          </div>

                          <div className="text-[10px] text-muted-foreground">
                            ±{row.rd}
                          </div>

                        </div>

                      </li>
                    );
                  },
                )}

                {rows.length === 0 && (
                  <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No players yet.
                  </li>
                )}
              </ol>

            </section>

            {/* RECENT GAMES */}
            <section className="overflow-hidden rounded-2xl border border-border bg-card">

              <div className="border-b border-border px-4 py-3">
                <h2 className="font-semibold text-card-foreground">
                  Recent{" "}
                  {TABS.find(
                    (t) =>
                      t.id === ratingType,
                  )?.label} games
                </h2>

                <p className="text-xs text-muted-foreground">
                  Your latest rated games
                </p>
              </div>

              <ul>
                {recentGames.map(
                  (game) => {
                    const mine =
                      game.white_id ===
                      user.id
                        ? "white"
                        : "black";

                    const won =
                      game.result ===
                      mine;

                    const draw =
                      game.result ===
                      "draw";

                    let outcome =
                      "Loss";

                    if (draw) {
                      outcome = "Draw";
                    } else if (
                      won
                    ) {
                      outcome = "Win";
                    }

                    const opponent =
                      mine === "white"
                        ? game.black_id
                        : game.white_id;

                    return (
                      <li
                        key={game.id}
                        className="flex items-center justify-between border-b border-border/60 px-4 py-3 last:border-0"
                      >
                        <div>
                          <p className="text-sm text-card-foreground">
                            {game.bot_name
                              ? `vs ${game.bot_name}`
                              : opponent
                                ? "vs opponent"
                                : "vs opponent"}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {getTimeLabel(
                              game.time_control,
                            )}{" "}
                            ·{" "}
                            {new Date(
                              game.created_at,
                            ).toLocaleDateString()}
                          </p>
                        </div>

                        <span
                          className={
                            outcome ===
                            "Win"
                              ? "font-semibold text-primary"
                              : outcome ===
                                  "Loss"
                                ? "font-semibold text-destructive"
                                : "font-semibold text-muted-foreground"
                          }
                        >
                          {outcome}
                        </span>
                      </li>
                    );
                  },
                )}

                {recentGames.length ===
                  0 && (
                    <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No finished{" "}
                      {TABS.find(
                        (t) =>
                          t.id ===
                          ratingType,
                      )?.label.toLowerCase()}{" "}
                      games yet.
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

function Stat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-4 text-center">
      <p className="text-xl font-bold text-card-foreground">
        {value}
      </p>

      <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}