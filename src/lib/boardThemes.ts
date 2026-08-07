export type BoardTheme = "green" | "classic";

export const BOARD_THEMES: {
  id: BoardTheme;
  label: string;
  light: string;
  dark: string;
  frame: string;
  selected: string;
  last: string;
  hint: string;
}[] = [
  {
    id: "green",
    label: "Green & Yellow",
    light: "oklch(0.93 0.11 105)",
    dark: "oklch(0.52 0.11 148)",
    frame: "oklch(0.36 0.07 150)",
    selected: "oklch(0.78 0.14 95)",
    last: "oklch(0.83 0.13 110)",
    hint: "oklch(0.35 0.08 150 / 55%)",
  },
  {
    id: "classic",
    label: "White & Black",
    light: "oklch(0.97 0 0)",
    dark: "oklch(0.35 0 0)",
    frame: "oklch(0.22 0 0)",
    selected: "oklch(0.72 0.13 240)",
    last: "oklch(0.78 0.11 100)",
    hint: "oklch(0.55 0.02 250 / 60%)",
  },
];

export function themeById(id: BoardTheme) {
  return BOARD_THEMES.find((t) => t.id === id) ?? BOARD_THEMES[0];
}

export const THEME_KEY = "clickchess.theme";

