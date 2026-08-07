/**
 * Compact ECO opening book.
 * Keys are space-joined SAN prefixes; the longest matching prefix wins.
 */
export type OpeningEntry = { eco: string; name: string };

const BOOK: Record<string, OpeningEntry> = {
  // --- First moves -----------------------------------------------------
  "e4": { eco: "B00", name: "King's Pawn Opening" },
  "d4": { eco: "A40", name: "Queen's Pawn Opening" },
  "c4": { eco: "A10", name: "English Opening" },
  "Nf3": { eco: "A04", name: "Réti Opening" },
  "g3": { eco: "A00", name: "Benko / Hungarian Opening" },
  "b3": { eco: "A01", name: "Nimzo-Larsen Attack" },
  "f4": { eco: "A02", name: "Bird's Opening" },
  "b4": { eco: "A00", name: "Polish (Sokolsky) Opening" },
  "Nc3": { eco: "A00", name: "Van Geet Opening" },
  "e3": { eco: "A00", name: "Van 't Kruijs Opening" },
  "d3": { eco: "A00", name: "Mieses Opening" },
  "g4": { eco: "A00", name: "Grob's Attack" },

  // --- 1.e4 replies ----------------------------------------------------
  "e4 e5": { eco: "C20", name: "King's Pawn Game" },
  "e4 c5": { eco: "B20", name: "Sicilian Defence" },
  "e4 e6": { eco: "C00", name: "French Defence" },
  "e4 c6": { eco: "B10", name: "Caro-Kann Defence" },
  "e4 d5": { eco: "B01", name: "Scandinavian Defence" },
  "e4 d6": { eco: "B07", name: "Pirc Defence" },
  "e4 g6": { eco: "B06", name: "Modern Defence" },
  "e4 Nf6": { eco: "B02", name: "Alekhine's Defence" },
  "e4 Nc6": { eco: "B00", name: "Nimzowitsch Defence" },
  "e4 b6": { eco: "B00", name: "Owen's Defence" },

  // Open games
  "e4 e5 Nf3": { eco: "C40", name: "King's Knight Opening" },
  "e4 e5 Nf3 Nc6": { eco: "C44", name: "King's Knight, Normal Variation" },
  "e4 e5 Nf3 Nc6 Bb5": { eco: "C60", name: "Ruy López (Spanish Game)" },
  "e4 e5 Nf3 Nc6 Bb5 a6": { eco: "C68", name: "Ruy López, Morphy Defence" },
  "e4 e5 Nf3 Nc6 Bb5 a6 Ba4": { eco: "C70", name: "Ruy López, Morphy Defence" },
  "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6": { eco: "C78", name: "Ruy López, Closed" },
  "e4 e5 Nf3 Nc6 Bb5 a6 Bxc6": { eco: "C68", name: "Ruy López, Exchange Variation" },
  "e4 e5 Nf3 Nc6 Bb5 Nf6": { eco: "C65", name: "Ruy López, Berlin Defence" },
  "e4 e5 Nf3 Nc6 Bc4": { eco: "C50", name: "Italian Game" },
  "e4 e5 Nf3 Nc6 Bc4 Bc5": { eco: "C50", name: "Giuoco Piano" },
  "e4 e5 Nf3 Nc6 Bc4 Bc5 b4": { eco: "C51", name: "Evans Gambit" },
  "e4 e5 Nf3 Nc6 Bc4 Nf6": { eco: "C55", name: "Two Knights Defence" },
  "e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5": { eco: "C57", name: "Two Knights, Fried Liver Attack" },
  "e4 e5 Nf3 Nc6 d4": { eco: "C44", name: "Scotch Game" },
  "e4 e5 Nf3 Nc6 d4 exd4 Nxd4": { eco: "C45", name: "Scotch Game, Main Line" },
  "e4 e5 Nf3 Nc6 Nc3": { eco: "C46", name: "Three Knights Game" },
  "e4 e5 Nf3 Nc6 Nc3 Nf6": { eco: "C46", name: "Four Knights Game" },
  "e4 e5 Nf3 Nf6": { eco: "C42", name: "Petrov's (Russian) Defence" },
  "e4 e5 Nf3 d6": { eco: "C41", name: "Philidor Defence" },
  "e4 e5 Nf3 f5": { eco: "C40", name: "Latvian Gambit" },
  "e4 e5 f4": { eco: "C30", name: "King's Gambit" },
  "e4 e5 f4 exf4": { eco: "C33", name: "King's Gambit Accepted" },
  "e4 e5 f4 d5": { eco: "C31", name: "King's Gambit Declined, Falkbeer" },
  "e4 e5 Bc4": { eco: "C23", name: "Bishop's Opening" },
  "e4 e5 Nc3": { eco: "C25", name: "Vienna Game" },
  "e4 e5 d4": { eco: "C21", name: "Centre Game" },

  // Sicilian
  "e4 c5 Nf3": { eco: "B27", name: "Sicilian Defence" },
  "e4 c5 Nf3 d6": { eco: "B50", name: "Sicilian, Modern Variations" },
  "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3": { eco: "B56", name: "Sicilian, Classical" },
  "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6": { eco: "B90", name: "Sicilian, Najdorf" },
  "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6": { eco: "B70", name: "Sicilian, Dragon" },
  "e4 c5 Nf3 d6 Bb5+": { eco: "B51", name: "Sicilian, Moscow Variation" },
  "e4 c5 Nf3 Nc6": { eco: "B30", name: "Sicilian, Old Sicilian" },
  "e4 c5 Nf3 Nc6 Bb5": { eco: "B30", name: "Sicilian, Rossolimo Attack" },
  "e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 e5": { eco: "B32", name: "Sicilian, Löwenthal" },
  "e4 c5 Nf3 e6": { eco: "B40", name: "Sicilian, French Variation" },
  "e4 c5 Nf3 e6 d4 cxd4 Nxd4 a6": { eco: "B42", name: "Sicilian, Kan Variation" },
  "e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6": { eco: "B44", name: "Sicilian, Taimanov" },
  "e4 c5 Nc3": { eco: "B23", name: "Sicilian, Closed" },
  "e4 c5 c3": { eco: "B22", name: "Sicilian, Alapin Variation" },
  "e4 c5 d4": { eco: "B21", name: "Sicilian, Smith-Morra Gambit" },
  "e4 c5 f4": { eco: "B21", name: "Sicilian, Grand Prix Attack" },

  // French
  "e4 e6 d4": { eco: "C00", name: "French Defence" },
  "e4 e6 d4 d5": { eco: "C01", name: "French Defence, Main Line" },
  "e4 e6 d4 d5 e5": { eco: "C02", name: "French, Advance Variation" },
  "e4 e6 d4 d5 exd5": { eco: "C01", name: "French, Exchange Variation" },
  "e4 e6 d4 d5 Nc3": { eco: "C10", name: "French, Paulsen Variation" },
  "e4 e6 d4 d5 Nc3 Bb4": { eco: "C15", name: "French, Winawer Variation" },
  "e4 e6 d4 d5 Nc3 Nf6": { eco: "C11", name: "French, Classical Variation" },
  "e4 e6 d4 d5 Nd2": { eco: "C03", name: "French, Tarrasch Variation" },

  // Caro-Kann
  "e4 c6 d4": { eco: "B12", name: "Caro-Kann Defence" },
  "e4 c6 d4 d5": { eco: "B12", name: "Caro-Kann, Main Line" },
  "e4 c6 d4 d5 Nc3": { eco: "B15", name: "Caro-Kann, Main Line" },
  "e4 c6 d4 d5 Nd2": { eco: "B15", name: "Caro-Kann, Modern Variation" },
  "e4 c6 d4 d5 e5": { eco: "B12", name: "Caro-Kann, Advance Variation" },
  "e4 c6 d4 d5 exd5": { eco: "B13", name: "Caro-Kann, Exchange Variation" },
  "e4 c6 d4 d5 exd5 cxd5 c4": { eco: "B13", name: "Caro-Kann, Panov-Botvinnik Attack" },
  "e4 c6 Nf3": { eco: "B10", name: "Caro-Kann, Two Knights" },

  // Scandinavian / Alekhine / Pirc / Modern
  "e4 d5 exd5": { eco: "B01", name: "Scandinavian Defence" },
  "e4 d5 exd5 Qxd5": { eco: "B01", name: "Scandinavian, Main Line" },
  "e4 d5 exd5 Nf6": { eco: "B01", name: "Scandinavian, Modern Variation" },
  "e4 Nf6 e5": { eco: "B03", name: "Alekhine's Defence" },
  "e4 Nf6 e5 Nd5 d4 d6 c4": { eco: "B03", name: "Alekhine, Four Pawns Attack" },
  "e4 d6 d4 Nf6 Nc3": { eco: "B07", name: "Pirc Defence" },
  "e4 d6 d4 Nf6 Nc3 g6": { eco: "B08", name: "Pirc, Classical" },
  "e4 g6 d4 Bg7": { eco: "B06", name: "Modern Defence" },

  // --- 1.d4 ------------------------------------------------------------
  "d4 d5": { eco: "D00", name: "Queen's Pawn Game" },
  "d4 Nf6": { eco: "A45", name: "Indian Defence" },
  "d4 f5": { eco: "A80", name: "Dutch Defence" },
  "d4 e6": { eco: "A40", name: "Queen's Pawn, Horwitz Defence" },
  "d4 d6": { eco: "A41", name: "Old Indian Defence" },
  "d4 g6": { eco: "A40", name: "Modern Defence" },
  "d4 c5": { eco: "A43", name: "Old Benoni Defence" },

  "d4 d5 c4": { eco: "D06", name: "Queen's Gambit" },
  "d4 d5 c4 dxc4": { eco: "D20", name: "Queen's Gambit Accepted" },
  "d4 d5 c4 e6": { eco: "D30", name: "Queen's Gambit Declined" },
  "d4 d5 c4 e6 Nc3 Nf6 Bg5": { eco: "D50", name: "QGD, Classical Variation" },
  "d4 d5 c4 e6 Nc3 c5": { eco: "D32", name: "QGD, Tarrasch Defence" },
  "d4 d5 c4 c6": { eco: "D10", name: "Slav Defence" },
  "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4": { eco: "D15", name: "Slav, Main Line" },
  "d4 d5 c4 c6 Nf3 Nf6 Nc3 e6": { eco: "D43", name: "Semi-Slav Defence" },
  "d4 d5 c4 Nc6": { eco: "D07", name: "Queen's Gambit, Chigorin Defence" },
  "d4 d5 c4 Bf5": { eco: "D06", name: "Queen's Gambit, Baltic Defence" },
  "d4 d5 Nf3": { eco: "D02", name: "Queen's Pawn, Zukertort" },
  "d4 d5 Bf4": { eco: "D00", name: "Queen's Pawn, London System" },
  "d4 d5 Nf3 Nf6 Bf4": { eco: "D02", name: "London System" },
  "d4 d5 e4": { eco: "D00", name: "Blackmar-Diemer Gambit" },
  "d4 d5 Nc3": { eco: "D00", name: "Queen's Pawn, Veresov Attack" },

  "d4 Nf6 c4": { eco: "A50", name: "Indian Game" },
  "d4 Nf6 c4 e6": { eco: "E00", name: "Indian, East Indian Defence" },
  "d4 Nf6 c4 e6 Nc3 Bb4": { eco: "E20", name: "Nimzo-Indian Defence" },
  "d4 Nf6 c4 e6 Nf3 b6": { eco: "E12", name: "Queen's Indian Defence" },
  "d4 Nf6 c4 e6 g3": { eco: "E00", name: "Catalan Opening" },
  "d4 Nf6 c4 g6": { eco: "E60", name: "King's Indian Defence" },
  "d4 Nf6 c4 g6 Nc3 Bg7 e4": { eco: "E70", name: "King's Indian, Main Line" },
  "d4 Nf6 c4 g6 Nc3 d5": { eco: "D80", name: "Grünfeld Defence" },
  "d4 Nf6 c4 c5": { eco: "A56", name: "Benoni Defence" },
  "d4 Nf6 c4 c5 d5 e6": { eco: "A60", name: "Modern Benoni" },
  "d4 Nf6 c4 c5 d5 b5": { eco: "A57", name: "Benko Gambit" },
  "d4 Nf6 c4 e5": { eco: "A56", name: "Budapest Gambit" },
  "d4 Nf6 Bg5": { eco: "A45", name: "Trompowsky Attack" },
  "d4 Nf6 Nf3 g6 Bf4": { eco: "A48", name: "London System" },
  "d4 f5 g3": { eco: "A81", name: "Dutch Defence, Fianchetto" },
  "d4 f5 c4 Nf6 g3 e6": { eco: "A90", name: "Dutch, Stonewall / Classical" },

  // --- 1.c4 / 1.Nf3 ----------------------------------------------------
  "c4 e5": { eco: "A20", name: "English Opening, Reversed Sicilian" },
  "c4 c5": { eco: "A30", name: "English, Symmetrical Variation" },
  "c4 Nf6": { eco: "A15", name: "English, Anglo-Indian Defence" },
  "c4 e6": { eco: "A13", name: "English Opening, Agincourt Defence" },
  "c4 c6": { eco: "A11", name: "English, Caro-Kann Defensive System" },
  "c4 g6": { eco: "A10", name: "English, Great Snake Variation" },
  "Nf3 d5": { eco: "A06", name: "Réti Opening" },
  "Nf3 d5 c4": { eco: "A09", name: "Réti Gambit" },
  "Nf3 Nf6 c4": { eco: "A15", name: "English, Anglo-Indian" },
  "Nf3 Nf6 g3": { eco: "A05", name: "King's Indian Attack" },
};

/** Longest-prefix opening lookup for a SAN move list. */
export function detectOpening(san: string[]): (OpeningEntry & { ply: number }) | null {
  let found: (OpeningEntry & { ply: number }) | null = null;
  const max = Math.min(san.length, 16);
  for (let i = 1; i <= max; i++) {
    const hit = BOOK[san.slice(0, i).join(" ")];
    if (hit) found = { ...hit, ply: i };
  }
  return found;
}

/**
 * Opening label after each ply (null while the position is still unnamed).
 * Index 0 corresponds to the position after move 1.
 */
export function openingByPly(san: string[]): (OpeningEntry | null)[] {
  const out: (OpeningEntry | null)[] = [];
  let current: OpeningEntry | null = null;
  for (let i = 0; i < san.length; i++) {
    const hit = i < 16 ? BOOK[san.slice(0, i + 1).join(" ")] : undefined;
    if (hit) current = hit;
    out.push(current);
  }
  return out;
}

