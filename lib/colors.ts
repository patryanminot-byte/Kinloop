// ─── V3 Design System ────────────────────────────────────────────────────────
// Five accent colors with warm undertones:
//   Violet   #7C5CFC  — primary action, brand
//   Golden   #F5C542  — accepted, celebration
//   Eucalyptus #3CC8A0 — success, positive outcomes
//   Coral    #F28B6E  — attention, needs action
//   Blue     #6BB8E8  — informational, neutral accent

export const colors = {
  // Backgrounds & surfaces
  bg: "#FAFAF7",
  card: "#FFFFFF",
  surface: "#F5F5F0",

  // Text hierarchy
  text: "#2D2D2D",
  textMuted: "#7A7A7A",
  textLight: "#A8A8A3",

  // Borders
  border: "#EEEEE8",
  borderLight: "#F5F5F0",

  // V3 accent palette
  violet: "#7C5CFC",
  violetLight: "#7C5CFC15",
  golden: "#F5C542",
  goldenLight: "#F5C54215",
  eucalyptus: "#3CC8A0",
  eucalyptusLight: "#3CC8A015",
  coral: "#F28B6E",
  coralLight: "#F28B6E15",
  blue: "#6BB8E8",
  blueLight: "#6BB8E815",

  // Semantic aliases
  success: "#3CC8A0",
  warning: "#F5C542",
  danger: "#F28B6E",

  // Legacy aliases (for gradual migration — remove once all screens updated)
  neonPink: "#F28B6E",
  neonPurple: "#7C5CFC",
  neonBlue: "#6BB8E8",
  neonCyan: "#3CC8A0",
  neonGreen: "#3CC8A0",
  neonYellow: "#F5C542",
  neonOrange: "#F28B6E",
};

export const gradientColors = {
  rainbow: ["#7C5CFC", "#6BB8E8", "#3CC8A0", "#F5C542", "#F28B6E"] as const,
  subtle: ["#FAF8FF", "#F0F7FF", "#F0FDF8", "#FFFCF0"] as const,
  button: ["#7C5CFC", "#6BB8E8"] as const,
  brand: ["#7C5CFC", "#F28B6E", "#F5C542"] as const,
};
