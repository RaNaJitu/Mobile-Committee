export const colors = {
  screenBackground: "#140B2F",
  cardBackground: "#1D1337",
  primary: "#FFC727",
  textPrimary: "#FFFFFF",
  textSecondary: "#B0B1CA",
  textMuted: "#B0B1CA",
  headingHighlight: "#FFC727",
  border: "#3B3259",
  inputBackground: "#2B2145",
  checkboxBorder: "#FFC727",
  checkboxFill: "#FFC727",
  error: "#FF6B6B",
} as const;

export type ColorName = keyof typeof colors;


