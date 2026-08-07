import { useEffect, useState } from "react";
import type { Move } from "chess.js";
import { reviewGame, type ReviewSummary } from "@/lib/engine";

const TAG_COLOR: Record<string, string> = {
  Best: "text-accent",
  Great: "text-accent",
  Good: "text-foreground",
  Inaccuracy: "text-primary",
  Mistake: "text-primary",
  Blunder: "text-destructive",
};

export function GameOverDialog({
  open,
  headline,
  detail,
  history,
  whiteLabel,
  blackLabel,
  extra,
  reportSlot,
  onReview,
  onClose,
  onRematch,
}: {
  open: boolean;
  headline: string;
  detail?: string;
  history: Move[];
  whiteLabel: string;
  blackLabel: string;
  extra?: React.ReactNode;
  reportSlot?: React.ReactNode;
  onReview?: (review: ReviewSummary) => void;
  onClose: () => void;
  onRematch?: () => void;
}) {
  const [review, setReview] = useState<ReviewSummary | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setReview(null);
      setBusy(false);
    }
  }, [open]);

  if (!open) return null;

  const runReview = () => {
    setBusy(true);
    setTimeout(() => {
      const result = reviewGame(history);
      setReview(result);
      onReview?.(result);
      setBusy(false);
    }, 30);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-panel)]">
        <h2 className="font-serif text-2xl font-bold text-card-foreground">{headline}</h2>
        {detail && <p className="mt-1 text-sm text-muted-foreground">{detail}</p>}
        {extra && <div className="mt-4">{extra}</div>}

        {!review ? (
          <button
            onClick={runReview}
            disabled={busy || history.length === 0}
            className="mt-5 w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Analysing every move…" : "Game review & scorecard"}
          </button>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  [whiteLabel, review.accuracy.w],
                  [blackLabel, review.accuracy.b],
                ] as const
              ).map(([name, acc]) => (
                <div key={name} className="rounded-xl border border-border p-3 text-center">
                  <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">
                    {name}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{acc}%</p>
                  <p className="text-xs text-muted-foreground">accuracy</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border px-3 py-2 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Opening</p>
              {review.opening ? (
                <p className="mt-0.5 text-foreground">
                  <span className="font-mono text-xs text-muted-foreground">
                    {review.opening.eco}
                  </span>{" "}
                  {review.opening.name}
                  <span className="text-muted-foreground"> · book to move {Math.ceil(review.opening.ply / 2)}</span>
                </p>
              ) : (
                <p className="mt-0.5 text-muted-foreground">Unnamed / irregular opening</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {(
                [
                  [whiteLabel, review.fairPlay.w],
                  [blackLabel, review.fairPlay.b],
                ] as const
              ).map(([name, fp]) => (
                <div key={name} className="rounded-xl border border-border p-3">
                  <p className="truncate uppercase tracking-wide text-muted-foreground">{name}</p>
                  <p className="mt-1 text-foreground">
                    Engine match <span className="font-semibold">{fp.engineMatch}%</span>
                  </p>
                  <p
                    className={
                      fp.suspicion === "high"
                        ? "text-destructive"
                        : fp.suspicion === "review"
                          ? "text-primary"
                          : "text-accent"
                    }
                  >
                    Fair play:{" "}
                    {fp.suspicion === "high"
                      ? "engine-like"
                      : fp.suspicion === "review"
                        ? "worth a look"
                        : "clean"}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {Object.entries(review.counts).map(([tag, n]) => (
                <div key={tag} className="rounded-lg border border-border px-2 py-2">
                  <p className={`text-base font-semibold ${TAG_COLOR[tag]}`}>{n}</p>
                  <p className="text-muted-foreground">{tag}</p>
                </div>
              ))}
            </div>

            <div className="max-h-56 overflow-y-auto rounded-xl border border-border">
              {review.moves.map((m) => (
                <div
                  key={m.ply}
                  className="flex items-center justify-between border-b border-border px-3 py-1.5 text-sm last:border-0"
                >
                  <span className="text-muted-foreground">
                    {Math.ceil(m.ply / 2)}
                    {m.color === "w" ? "." : "…"} <span className="text-foreground">{m.san}</span>
                    {m.eco && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        {m.eco} {m.opening}
                      </span>
                    )}
                  </span>
                  <span className={TAG_COLOR[m.tag]}>{m.book ? "Book" : m.tag}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {reportSlot && <div className="mt-5">{reportSlot}</div>}

        <div className="mt-5 flex gap-2">
          {onRematch && (
            <button
              onClick={onRematch}
              className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
            >
              New game
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

