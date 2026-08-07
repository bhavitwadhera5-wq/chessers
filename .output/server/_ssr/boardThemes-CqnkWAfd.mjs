//#region node_modules/.nitro/vite/services/ssr/assets/boardThemes-CqnkWAfd.js
var BOARD_THEMES = [{
	id: "green",
	label: "Green & Yellow",
	light: "oklch(0.93 0.11 105)",
	dark: "oklch(0.52 0.11 148)",
	frame: "oklch(0.36 0.07 150)",
	selected: "oklch(0.78 0.14 95)",
	last: "oklch(0.83 0.13 110)",
	hint: "oklch(0.35 0.08 150 / 55%)"
}, {
	id: "classic",
	label: "White & Black",
	light: "oklch(0.97 0 0)",
	dark: "oklch(0.35 0 0)",
	frame: "oklch(0.22 0 0)",
	selected: "oklch(0.72 0.13 240)",
	last: "oklch(0.78 0.11 100)",
	hint: "oklch(0.55 0.02 250 / 60%)"
}];
function themeById(id) {
	return BOARD_THEMES.find((t) => t.id === id) ?? BOARD_THEMES[0];
}
var THEME_KEY = "clickchess.theme";
//#endregion
export { THEME_KEY as n, themeById as r, BOARD_THEMES as t };
