import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/play/$gameId")({
  component: OnlineGame,
});

type Color = "w" | "b";

type PieceType =
  | "p"
  | "r"
  | "n"
  | "b"
  | "q"
  | "k";

type Piece = {
  type: PieceType;
  color: Color;
};

type Board = (Piece | null)[][];

type Game = {
  id: string;
  white_player: string | null;
  black_player: string | null;
  white_username: string | null;
  black_username: string | null;
  status: string;
  fen: string | null;
  turn: Color;
  winner: string | null;
};

const START_BOARD: Board = [
  [
    { type: "r", color: "b" },
    { type: "n", color: "b" },
    { type: "b", color: "b" },
    { type: "q", color: "b" },
    { type: "k", color: "b" },
    { type: "b", color: "b" },
    { type: "n", color: "b" },
    { type: "r", color: "b" },
  ],
  [
    { type: "p", color: "b" },
    { type: "p", color: "b" },
    { type: "p", color: "b" },
    { type: "p", color: "b" },
    { type: "p", color: "b" },
    { type: "p", color: "b" },
    { type: "p", color: "b" },
    { type: "p", color: "b" },
  ],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [
    { type: "p", color: "w" },
    { type: "p", color: "w" },
    { type: "p", color: "w" },
    { type: "p", color: "w" },
    { type: "p", color: "w" },
    { type: "p", color: "w" },
    { type: "p", color: "w" },
    { type: "p", color: "w" },
  ],
  [
    { type: "r", color: "w" },
    { type: "n", color: "w" },
    { type: "b", color: "w" },
    { type: "q", color: "w" },
    { type: "k", color: "w" },
    { type: "b", color: "w" },
    { type: "n", color: "w" },
    { type: "r", color: "w" },
  ],
];

const PIECES: Record<string, string> = {
  wp: "♙",
  wr: "♖",
  wn: "♘",
  wb: "♗",
  wq: "♕",
  wk: "♔",

  bp: "♟",
  br: "♜",
  bn: "♞",
  bb: "♝",
  bq: "♛",
  bk: "♚",
};

function cloneBoard(board: Board): Board {
  return board.map((row) =>
    row.map((piece) =>
      piece ? { ...piece } : null,
    ),
  );
}

function parseBoard(fen: string | null): Board {
  if (!fen || fen === "start") {
    return cloneBoard(START_BOARD);
  }

  try {
    const parsed = JSON.parse(fen);

    if (
      Array.isArray(parsed) &&
      parsed.length === 8 &&
      parsed.every(
        (row) =>
          Array.isArray(row) &&
          row.length === 8,
      )
    ) {
      return parsed as Board;
    }
  } catch {
    // Fall back to starting position.
  }

  return cloneBoard(START_BOARD);
}

function inside(
  row: number,
  col: number,
): boolean {
  return (
    row >= 0 &&
    row < 8 &&
    col >= 0 &&
    col < 8
  );
}

function clearPath(
  board: Board,
  fr: number,
  fc: number,
  tr: number,
  tc: number,
): boolean {
  const rowStep = Math.sign(tr - fr);
  const colStep = Math.sign(tc - fc);

  let row = fr + rowStep;
  let col = fc + colStep;

  while (
    row !== tr ||
    col !== tc
  ) {
    if (board[row][col]) {
      return false;
    }

    row += rowStep;
    col += colStep;
  }

  return true;
}

/*
 * This function checks normal piece movement.
 *
 * IMPORTANT:
 * It does NOT determine check.
 * Check is handled separately by attacksSquare().
 */
function pieceCanMove(
  board: Board,
  from: [number, number],
  to: [number, number],
  color: Color,
): boolean {
  const [fr, fc] = from;
  const [tr, tc] = to;

  if (!inside(tr, tc)) {
    return false;
  }

  const piece = board[fr][fc];
  const target = board[tr][tc];

  if (!piece || piece.color !== color) {
    return false;
  }

  if (target?.color === color) {
    return false;
  }

  // The king is NEVER a capturable piece.
  if (target?.type === "k") {
    return false;
  }

  const dr = tr - fr;
  const dc = tc - fc;

  const adr = Math.abs(dr);
  const adc = Math.abs(dc);

  switch (piece.type) {
    case "p": {
      const direction =
        color === "w" ? -1 : 1;

      const startRow =
        color === "w" ? 6 : 1;

      // One square forward.
      if (
        dc === 0 &&
        dr === direction &&
        !target
      ) {
        return true;
      }

      // Two squares from starting position.
      if (
        dc === 0 &&
        dr === direction * 2 &&
        fr === startRow &&
        !target &&
        !board[fr + direction][fc]
      ) {
        return true;
      }

      // Diagonal capture.
      if (
        adc === 1 &&
        dr === direction &&
        target &&
        target.color !== color &&
        target.type !== "k"
      ) {
        return true;
      }

      return false;
    }

    case "r":
      return (
        (dr === 0 || dc === 0) &&
        clearPath(
          board,
          fr,
          fc,
          tr,
          tc,
        )
      );

    case "b":
      return (
        adr === adc &&
        clearPath(
          board,
          fr,
          fc,
          tr,
          tc,
        )
      );

    case "q":
      return (
        (
          dr === 0 ||
          dc === 0 ||
          adr === adc
        ) &&
        clearPath(
          board,
          fr,
          fc,
          tr,
          tc,
        )
      );

    case "n":
      return (
        (adr === 2 && adc === 1) ||
        (adr === 1 && adc === 2)
      );

    case "k":
      return (
        adr <= 1 &&
        adc <= 1
      );

    default:
      return false;
  }
}

/*
 * This is DIFFERENT from pieceCanMove().
 *
 * It asks:
 * "Does this piece ATTACK this square?"
 *
 * This is what we use to detect CHECK.
 */
function attacksSquare(
  board: Board,
  from: [number, number],
  to: [number, number],
): boolean {
  const [fr, fc] = from;
  const [tr, tc] = to;

  if (!inside(tr, tc)) {
    return false;
  }

  const piece = board[fr][fc];

  if (!piece) {
    return false;
  }

  const dr = tr - fr;
  const dc = tc - fc;

  const adr = Math.abs(dr);
  const adc = Math.abs(dc);

  // Pawn attacks diagonally.
  if (piece.type === "p") {
    const direction =
      piece.color === "w"
        ? -1
        : 1;

    return (
      dr === direction &&
      adc === 1
    );
  }

  // Knight attacks.
  if (piece.type === "n") {
    return (
      (adr === 2 && adc === 1) ||
      (adr === 1 && adc === 2)
    );
  }

  // King attacks adjacent squares.
  if (piece.type === "k") {
    return (
      adr <= 1 &&
      adc <= 1
    );
  }

  // Rook attacks.
  if (piece.type === "r") {
    return (
      (dr === 0 || dc === 0) &&
      clearPath(
        board,
        fr,
        fc,
        tr,
        tc,
      )
    );
  }

  // Bishop attacks.
  if (piece.type === "b") {
    return (
      adr === adc &&
      clearPath(
        board,
        fr,
        fc,
        tr,
        tc,
      )
    );
  }

  // Queen attacks.
  if (piece.type === "q") {
    return (
      (
        dr === 0 ||
        dc === 0 ||
        adr === adc
      ) &&
      clearPath(
        board,
        fr,
        fc,
        tr,
        tc,
      )
    );
  }

  return false;
}

function findKing(
  board: Board,
  color: Color,
): [number, number] | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];

      if (
        piece?.type === "k" &&
        piece.color === color
      ) {
        return [row, col];
      }
    }
  }

  return null;
}

function isInCheck(
  board: Board,
  color: Color,
): boolean {
  const king = findKing(
    board,
    color,
  );

  if (!king) {
    return true;
  }

  const opponent: Color =
    color === "w"
      ? "b"
      : "w";

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];

      if (
        !piece ||
        piece.color !== opponent
      ) {
        continue;
      }

      if (
        attacksSquare(
          board,
          [row, col],
          king,
        )
      ) {
        return true;
      }
    }
  }

  return false;
}

function tryMove(
  board: Board,
  from: [number, number],
  to: [number, number],
  color: Color,
): Board | null {
  if (
    !pieceCanMove(
      board,
      from,
      to,
      color,
    )
  ) {
    return null;
  }

  const target =
    board[to[0]][to[1]];

  // NEVER capture the king.
  if (target?.type === "k") {
    return null;
  }

  const next =
    cloneBoard(board);

  next[to[0]][to[1]] =
    next[from[0]][from[1]];

  next[from[0]][from[1]] =
    null;

  // Automatic promotion to queen.
  const movedPiece =
    next[to[0]][to[1]];

  if (
    movedPiece?.type === "p" &&
    (
      (
        movedPiece.color === "w" &&
        to[0] === 0
      ) ||
      (
        movedPiece.color === "b" &&
        to[0] === 7
      )
    )
  ) {
    next[to[0]][to[1]] = {
      type: "q",
      color: movedPiece.color,
    };
  }

  /*
   * CRITICAL:
   * After making the move, check whether
   * our own king is attacked.
   *
   * If yes, the move is illegal.
   */
  if (
    isInCheck(
      next,
      color,
    )
  ) {
    return null;
  }

  return next;
}

function hasLegalMove(
  board: Board,
  color: Color,
): boolean {
  for (let fr = 0; fr < 8; fr++) {
    for (let fc = 0; fc < 8; fc++) {
      const piece =
        board[fr][fc];

      if (
        !piece ||
        piece.color !== color
      ) {
        continue;
      }

      for (let tr = 0; tr < 8; tr++) {
        for (let tc = 0; tc < 8; tc++) {
          const result =
            tryMove(
              board,
              [fr, fc],
              [tr, tc],
              color,
            );

          if (result) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

function getGameState(
  board: Board,
  turn: Color,
): {
  status: "playing" | "checkmate" | "stalemate";
  inCheck: boolean;
  winner: Color | null;
} {
  const inCheck =
    isInCheck(
      board,
      turn,
    );

  const hasMove =
    hasLegalMove(
      board,
      turn,
    );

  if (
    inCheck &&
    !hasMove
  ) {
    return {
      status: "checkmate",
      inCheck: true,
      winner:
        turn === "w"
          ? "b"
          : "w",
    };
  }

  if (
    !inCheck &&
    !hasMove
  ) {
    return {
      status: "stalemate",
      inCheck: false,
      winner: null,
    };
  }

  return {
    status: "playing",
    inCheck,
    winner: null,
  };
}

function OnlineGame() {
  const navigate =
    useNavigate();

  const { user } =
    useAuth();

  const { gameId } =
    Route.useParams();

  const [game, setGame] =
    useState<Game | null>(null);

  const [board, setBoard] =
    useState<Board>(
      cloneBoard(
        START_BOARD,
      ),
    );

  const [selected, setSelected] =
    useState<
      [number, number] | null
    >(null);

  const [message, setMessage] =
    useState(
      "Loading game...",
    );

  const [connected, setConnected] =
    useState(false);

  const [result, setResult] =
    useState<
      "won" |
      "lost" |
      "draw" |
      null
    >(null);

  const [showResult, setShowResult] =
    useState(false);

  const [busy, setBusy] =
    useState(false);

  const myColor =
    useMemo<Color | null>(() => {
      if (!user || !game) {
        return null;
      }

      if (
        game.white_player ===
        user.id
      ) {
        return "w";
      }

      if (
        game.black_player ===
        user.id
      ) {
        return "b";
      }

      return null;
    }, [game, user]);

  function showGameStatus(
    currentGame: Game,
    currentBoard: Board,
  ) {
    if (
      currentGame.status ===
      "waiting"
    ) {
      setMessage(
        "Waiting for another player...",
      );
      return;
    }

    if (
      currentGame.status ===
      "finished"
    ) {
      if (
        currentGame.winner &&
        user?.id ===
          currentGame.winner
      ) {
        setResult("won");
        setShowResult(true);
        setMessage(
          "YOU WON!",
        );
      } else if (
        currentGame.winner
      ) {
        setResult("lost");
        setShowResult(true);
        setMessage(
          "YOU LOST",
        );
      } else {
        setResult("draw");
        setShowResult(true);
        setMessage(
          "DRAW",
        );
      }

      return;
    }

    const state =
      getGameState(
        currentBoard,
        currentGame.turn,
      );

    if (
      state.status ===
      "checkmate"
    ) {
      const winnerColor =
        state.winner;

      const winnerId =
        winnerColor === "w"
          ? currentGame.white_player
          : currentGame.black_player;

      if (
        winnerId &&
        user?.id === winnerId
      ) {
        setResult("won");
        setShowResult(true);
        setMessage(
          "CHECKMATE — YOU WON!",
        );
      } else {
        setResult("lost");
        setShowResult(true);
        setMessage(
          "CHECKMATE — YOU LOST!",
        );
      }

      return;
    }

    if (
      state.status ===
      "stalemate"
    ) {
      setResult("draw");
      setShowResult(true);
      setMessage(
        "STALEMATE — DRAW!",
      );
      return;
    }

    if (state.inCheck) {
      setMessage(
        currentGame.turn === "w"
          ? "WHITE IS IN CHECK!"
          : "BLACK IS IN CHECK!",
      );
      return;
    }

    setMessage(
      currentGame.turn === "w"
        ? "White to move"
        : "Black to move",
    );
  }

  useEffect(() => {
    let active = true;

    async function loadGame() {
      const { data, error } =
        await supabase
          .from("games")
          .select("*")
          .eq("id", gameId)
          .single();

      if (!active) {
        return;
      }

      if (error) {
        setMessage(
          error.message,
        );
        return;
      }

      const loaded =
        data as Game;

      const loadedBoard =
        parseBoard(
          loaded.fen,
        );

      setGame(loaded);
      setBoard(
        loadedBoard,
      );

      showGameStatus(
        loaded,
        loadedBoard,
      );
    }

    void loadGame();

    const channel =
      supabase
        .channel(
          `chess-game-${gameId}`,
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "games",
            filter:
              `id=eq.${gameId}`,
          },
          (payload) => {
            const updated =
              payload.new as Game;

            const updatedBoard =
              parseBoard(
                updated.fen,
              );

            setGame(
              updated,
            );

            setBoard(
              updatedBoard,
            );

            setSelected(
              null,
            );

            showGameStatus(
              updated,
              updatedBoard,
            );
          },
        )
        .subscribe(
          (status) => {
            setConnected(
              status ===
                "SUBSCRIBED",
            );
          },
        );

    return () => {
      active = false;

      void supabase.removeChannel(
        channel,
      );
    };
  }, [gameId]);

  async function makeMove(
    from: [number, number],
    to: [number, number],
  ) {
    if (
      !game ||
      !user ||
      !myColor ||
      busy
    ) {
      return;
    }

    if (
      game.status !==
      "playing"
    ) {
      return;
    }

    if (
      game.turn !==
      myColor
    ) {
      setMessage(
        "Wait for your turn.",
      );
      return;
    }

    /*
     * This is the important legality check.
     *
     * If the player is in check,
     * tryMove() will reject every
     * move that doesn't remove it.
     */
    const newBoard =
      tryMove(
        board,
        from,
        to,
        myColor,
      );

    if (!newBoard) {
      setMessage(
        "Illegal move.",
      );
      return;
    }

    const nextTurn: Color =
      myColor === "w"
        ? "b"
        : "w";

    const state =
      getGameState(
        newBoard,
        nextTurn,
      );

    let status:
      | "playing"
      | "finished" =
      "playing";

    let winner:
      | string
      | null = null;

    if (
      state.status ===
      "checkmate"
    ) {
      status =
        "finished";

      winner =
        myColor === "w"
          ? game.white_player
          : game.black_player;
    } else if (
      state.status ===
      "stalemate"
    ) {
      status =
        "finished";

      winner = null;
    }

    /*
     * Show our move immediately.
     */
    setBoard(
      newBoard,
    );

    setSelected(
      null,
    );

    setBusy(
      true,
    );

    const { error } =
      await supabase
        .from("games")
        .update({
          fen: JSON.stringify(
            newBoard,
          ),
          turn: nextTurn,
          status,
          winner,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          game.id,
        );

    setBusy(
      false,
    );

    if (error) {
      setMessage(
        error.message,
      );
      return;
    }

    /*
     * Update our local game state too.
     * The other player will receive the
     * same update through Supabase Realtime.
     */
    const updatedGame: Game = {
      ...game,
      fen: JSON.stringify(
        newBoard,
      ),
      turn: nextTurn,
      status,
      winner,
    };

    setGame(
      updatedGame,
    );

    showGameStatus(
      updatedGame,
      newBoard,
    );
  }

  async function resignGame() {
    if (
      !game ||
      !user ||
      !myColor ||
      busy
    ) {
      return;
    }

    if (
      game.status !==
      "playing"
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to resign?",
      );

    if (!confirmed) {
      return;
    }

    setBusy(
      true,
    );

    const winner =
      myColor === "w"
        ? game.black_player
        : game.white_player;

    const { error } =
      await supabase
        .from("games")
        .update({
          status:
            "finished",
          winner,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          game.id,
        )
        .eq(
          "status",
          "playing",
        );

    setBusy(
      false,
    );

    if (error) {
      setMessage(
        error.message,
      );
      return;
    }

    const updatedGame: Game = {
      ...game,
      status:
        "finished",
      winner,
    };

    setGame(
      updatedGame,
    );

    setResult(
      "lost",
    );

    setShowResult(
      true,
    );

    setMessage(
      "YOU RESIGNED",
    );
  }

  function handleSquareClick(
    displayRow: number,
    displayCol: number,
  ) {
    if (
      !game ||
      !user ||
      !myColor ||
      busy
    ) {
      return;
    }

    if (
      game.status !==
      "playing"
    ) {
      return;
    }

    if (
      game.turn !==
      myColor
    ) {
      setMessage(
        "Wait for your turn.",
      );
      return;
    }

    /*
     * Black sees the board from
     * Black's perspective.
     */
    const actualRow =
      myColor === "b"
        ? 7 - displayRow
        : displayRow;

    const actualCol =
      myColor === "b"
        ? 7 - displayCol
        : displayCol;

    const piece =
      board[actualRow][actualCol];

    /*
     * Nothing selected yet.
     */
    if (!selected) {
      if (
        piece &&
        piece.color ===
          myColor
      ) {
        setSelected([
          actualRow,
          actualCol,
        ]);

        setMessage(
          "Select a legal destination.",
        );
      }

      return;
    }

    /*
     * Click the same square to cancel.
     */
    if (
      selected[0] ===
        actualRow &&
      selected[1] ===
        actualCol
    ) {
      setSelected(
        null,
      );

      return;
    }

    /*
     * Select a different piece
     * of your own color.
     */
    if (
      piece &&
      piece.color ===
        myColor
    ) {
      setSelected([
        actualRow,
        actualCol,
      ]);

      return;
    }

    /*
     * Attempt the move.
     *
     * tryMove() will reject:
     * - illegal piece movement
     * - capturing the king
     * - moving into check
     * - leaving your king in check
     */
    void makeMove(
      selected,
      [
        actualRow,
        actualCol,
      ],
    );
  }

  if (!game) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <p className="text-xl font-bold">
            Loading game...
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            {message}
          </p>
        </div>
      </main>
    );
  }

  /*
   * Flip the board for Black.
   */
  const displayBoard =
    myColor === "b"
      ? [...board]
          .reverse()
          .map((row) =>
            [...row].reverse(),
          )
      : board;

  const displaySelected =
    selected &&
    myColor === "b"
      ? [
          7 - selected[0],
          7 - selected[1],
        ]
      : selected;

  return (
    <main className="min-h-screen bg-background px-4 py-8">

      {/* GAME RESULT POPUP */}
      {showResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-2xl">

            <div className="text-7xl">
              {result === "won"
                ? "🏆"
                : result === "lost"
                  ? "😔"
                  : "🤝"}
            </div>

            <h2 className="mt-5 text-4xl font-black">
              {result === "won"
                ? "YOU WON!"
                : result === "lost"
                  ? "YOU LOST"
                  : "DRAW"}
            </h2>

            <p className="mt-3 text-muted-foreground">
              {result === "won"
                ? "Checkmate! Excellent game."
                : result === "lost"
                  ? "Good game. Try again!"
                  : "The game ended in a draw."}
            </p>

            <button
              type="button"
              onClick={() => {
                setShowResult(
                  false,
                );

                navigate({
                  to: "/online",
                });
              }}
              className="mt-7 w-full rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Back to Online
            </button>

          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl">

        <button
          type="button"
          onClick={() =>
            navigate({
              to: "/online",
            })
          }
          className="mb-5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to Online
        </button>

        {/* HEADER */}
        <div className="mb-5 text-center">

          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Multiplayer Chess
          </p>

          <h1 className="mt-2 text-3xl font-black">
            {game.white_username ??
              "White"}

            <span className="mx-2 text-muted-foreground">
              vs
            </span>

            {game.black_username ??
              "Waiting..."}
          </h1>

          <div className="mt-3 flex flex-wrap justify-center gap-2">

            <span className="rounded-full border border-border px-3 py-1 text-sm">
              You are{" "}
              <strong>
                {myColor === "w"
                  ? "White"
                  : myColor === "b"
                    ? "Black"
                    : "Spectator"}
              </strong>
            </span>

            <span
              className={`rounded-full px-3 py-1 text-sm ${
                connected
                  ? "bg-green-500/15 text-green-400"
                  : "bg-destructive/15 text-destructive"
              }`}
            >
              {connected
                ? "● Live"
                : "● Connecting..."}
            </span>

          </div>

          <p
            className={`mt-3 font-bold ${
              message.includes(
                "CHECK",
              )
                ? "text-red-500"
                : ""
            }`}
          >
            {message}
          </p>

        </div>

        {/* BOARD */}
        <div className="mx-auto max-w-[680px] overflow-hidden rounded-2xl border-4 border-border shadow-2xl">

          <div className="grid grid-cols-8">

            {displayBoard.map(
              (
                row,
                displayRow,
              ) =>
                row.map(
                  (
                    piece,
                    displayCol,
                  ) => {

                    const dark =
                      (
                        displayRow +
                        displayCol
                      ) %
                        2 ===
                      1;

                    const selectedHere =
                      displaySelected?.[0] ===
                        displayRow &&
                      displaySelected?.[1] ===
                        displayCol;

                    return (
                      <button
                        key={`${displayRow}-${displayCol}`}
                        type="button"
                        onClick={() =>
                          handleSquareClick(
                            displayRow,
                            displayCol,
                          )
                        }
                        className={`
                          relative
                          aspect-square
                          flex
                          items-center
                          justify-center
                          select-none
                          ${
                            dark
                              ? "bg-[#9b4a00]"
                              : "bg-[#fff3c4]"
                          }
                          ${
                            selectedHere
                              ? "ring-4 ring-inset ring-yellow-400"
                              : ""
                          }
                          ${
                            piece?.color ===
                            myColor
                              ? "cursor-pointer"
                              : "cursor-default"
                          }
                        `}
                      >

                        {piece && (
                          <span
                            className={`
                              relative
                              z-10
                              font-serif
                              text-[clamp(2.5rem,8vw,4.7rem)]
                              leading-none
                              ${
                                piece.color ===
                                "w"
                                  ? "text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.95),0_0_2px_#000]"
                                  : "text-[#111] [text-shadow:0_1px_3px_rgba(255,255,255,0.8)]"
                              }
                            `}
                          >
                            {
                              PIECES[
                                `${piece.color}${piece.type}`
                              ]
                            }
                          </span>
                        )}

                        {selectedHere && (
                          <span className="pointer-events-none absolute inset-1 rounded-lg border-4 border-yellow-400" />
                        )}

                      </button>
                    );
                  },
                ),
            )}

          </div>

        </div>

        {/* PLAYERS */}
        <div className="mx-auto mt-5 grid max-w-[680px] grid-cols-2 gap-3">

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              White
            </p>

            <p className="mt-1 font-bold">
              {game.white_username ??
                "Waiting..."}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Black
            </p>

            <p className="mt-1 font-bold">
              {game.black_username ??
                "Waiting..."}
            </p>
          </div>

        </div>

        {/* RESIGN */}
        {game.status ===
          "playing" && (
          <div className="mx-auto mt-4 max-w-[680px]">

            <button
              type="button"
              disabled={busy}
              onClick={
                resignGame
              }
              className="w-full rounded-xl border border-destructive/40 px-5 py-3 font-bold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
            >
              🏳️ Resign
            </button>

          </div>
        )}

        {/* STATUS */}
        <div className="mx-auto mt-4 max-w-[680px] rounded-xl border border-border bg-card p-4 text-center">

          {game.status ===
          "waiting" ? (
            <p className="text-sm text-muted-foreground">
              Waiting for another
              player to join...
            </p>
          ) : game.status ===
            "finished" ? (
            <p className="font-bold">
              {message}
            </p>
          ) : game.turn ===
            myColor ? (
            <p className="font-bold">
              Your turn — select
              a piece.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Opponent's turn.
            </p>
          )}

        </div>

      </div>
    </main>
  );
}