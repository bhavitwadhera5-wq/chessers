import { createFileRoute, Link } from "@tanstack/react-router";
import { ChessBoard } from "@/components/ChessBoard";

export const Route = createFileRoute("/solo")({
  head: () => ({
    meta: [
      { title: "Play Chess vs the Bot — Chessers" },
      {
        name: "description",
        content:
          "Click-to-move chess against a capture-hungry bot. Legal moves light up, no signup needed to play.",
      },
      { property: "og:title", content: "Play Chess vs the Bot — Chessers" },
      {
        property: "og:description",
        content: "Click-to-move chess board with legal move hints and an instant bot opponent.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Solo,
});

function Solo() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-8">
      <div className="w-full max-w-3xl">
        <header className="mb-8 text-center">
          <Link to="/" className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground">
            ← Home
          </Link>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-foreground">
            You vs the Bot
          </h1>
        </header>
        <ChessBoard />
      </div>
    </main>
  );
}

