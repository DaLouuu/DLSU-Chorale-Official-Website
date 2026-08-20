export const PALETTES = {
  light: {
    green: "#115E2B",
    greenDeep: "#0C4420",
    greenDark: "#083218",
    greenSoft: "#E6F0E9",
    greenMid: "#C5DBC9",
    cream: "#FBFAF6",
    paper: "#FFFFFF",
    ink: "#12201A",
    dim: "#5A6B61",
    line: "#E4E6E0",
    lineDark: "#CBD0C9",
    // Kept the "amber" key name to avoid touching every call site — the
    // brand accent moved from gold to teal, this is the only place it's defined.
    amber: "#1E7F76",
    amberSoft: "#E3F3F1",
    red: "#A93226",
    redSoft: "#F5E0DD",
    blue: "#2C5B8E",
    blueSoft: "#DDE7F2",
    bodyBg: "#E9E8E2",
  },
  dark: {
    green: "#3BA05A",
    greenDeep: "#4FB36D",
    greenDark: "#0A1E14",
    greenSoft: "#18372A",
    greenMid: "#2D5A40",
    cream: "#141B17",
    paper: "#1A2420",
    ink: "#EDEFE9",
    dim: "#8C9890",
    line: "#2A342E",
    lineDark: "#3A453E",
    amber: "#5FD3C4",
    amberSoft: "#173330",
    red: "#D9645A",
    redSoft: "#3A1E1B",
    blue: "#6A98CA",
    blueSoft: "#1C2A3A",
    bodyBg: "#0B120E",
  },
};

export const FONTS = {
  serif: `"Cormorant Garamond", "Playfair Display", Georgia, serif`,
  sans: `"Inter Tight", "Inter", system-ui, -apple-system, sans-serif`,
  mono: `"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace`,
};

export type ThemeMode = 'light' | 'dark';
export type Theme = typeof PALETTES.light;
