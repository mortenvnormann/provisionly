/** Raw palette hex — for PWA/manifest/icon contexts only. UI must use CSS variables. */

export const lightPalette = {
  canvasWarm: "#FAFAF8",
  pureWhite: "#FFFFFF",
  inkWarm: "#2E2C28",
  inkMuted: "#7A7770",
  inkLabel: "#5C5954",
  sageBorder: "#E3E5DF",
  sageMuted: "#F3F2EE",
  terracotta: "#B86F56",
  terracottaDeep: "#9D5C46",
  destructiveWarm: "#C44B3F",
} as const;

export const darkPalette = {
  nightSlate: "#1A1D29",
  midnightBlack: "#11141D",
  deepFrost: "#333B53",
  weatheredCopper: "#6A6C79",
  glacierGray: "#B1B7C4",
  icyWhite: "#E4EAF2",
  lingonberryRed: "#E13C33",
} as const;
