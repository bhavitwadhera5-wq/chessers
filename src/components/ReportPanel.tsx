import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { REPORT_REASONS, reportOpponent } from "@/lib/moderation.functions";

/** Report the opponent of a finished online game. */
export function ReportPanel({ gameId }: { gameId: string }) {
  const submit = useServerFn(reportOpponent);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0].id);
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  if (state === "done")
    return (
      <p className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
        Thanks — our fair play team will review this game.
      </p>
    );

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        Report opponent
      </button>
    );

  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        What went wrong?
      </p>
      <div className="flex flex-wrap gap-1.5">
        {REPORT_REASONS.map((r) => (
          <button
            key={r.id}
            onClick={() => setReason(r.id)}
            className={`rounded-md border px-2 py-1 text-xs ${
              reason === r.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="Anything else we should know? (optional)"
        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
      />
      {message && <p className="text-xs text-destructive">{message}</p>}
      <div className="flex gap-2">
        <button
          disabled={state === "busy"}
          onClick={async () => {
            setState("busy");
            setMessage(null);
            try {
              await submit({ data: { gameId, reason, details } });
              setState("done");
            } catch {
              setState("error");
              setMessage("Could not send the report. Please try again.");
            }
          }}
          className="flex-1 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {state === "busy" ? "Sending…" : "Send report"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

