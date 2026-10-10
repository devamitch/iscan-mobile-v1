import type { Theme, ThemeColors } from "@/types"

const lightColors: ThemeColors = {
  primary: "#667eea",
  primaryDark: "#5a67d8",
  primaryLight: "#7c3aed",
  secondary: "#764ba2",
  secondaryDark: "#6b46c1",
  secondaryLight: "#8b5cf6",
  accent: "#4facfe",
  background: "#ffffff",
  surface: "#f8f9fa",
  card: "#ffffff",
  text: "#1a1a1a",
  textSecondary: "#6b7280",
  textDisabled: "#9ca3af",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  border: "#e5e7eb",
  divider: "#f3f4f6",
  glass: "rgba(255, 255, 255, 0.1)",
  glassLight: "rgba(255, 255, 255, 0.2)",
  glassDark: "rgba(0, 0, 0, 0.1)",
}

const darkColors: ThemeColors = {
  primary: "#667eea",
  primaryDark: "#5a67d8",
  primaryLight: "#7c3aed",
  secondary: "#764ba2",
  secondaryDark: "#6b46c1",
  secondaryLight: "#8b5cf6",
  accent: "#4facfe",
  background: "#0a0a0a",
  surface: "#1a1a1a",
  card: "#262626",
  text: "#ffffff",
  textSecondary: "#a1a1aa",
  textDisabled: "#71717a",
  success: "#22c55e",
  warning: "#eab308",
  error: "#f87171",
  info: "#60a5fa",
  border: "#374151",
  divider: "#1f2937",
  glass: "rgba(255, 255, 255, 0.05)",
  glassLight: "rgba(255, 255, 255, 0.1)",
  glassDark: "rgba(0, 0, 0, 0.3)",
}

const baseTheme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: "bold", lineHeight: 40 },
    h2: { fontSize: 24, fontWeight: "bold", lineHeight: 32 },
    h3: { fontSize: 20, fontWeight: "600", lineHeight: 28 },
    h4: { fontSize: 18, fontWeight: "600", lineHeight: 24 },
    body: { fontSize: 16, fontWeight: "400", lineHeight: 24 },
    caption: { fontSize: 12, fontWeight: "400", lineHeight: 16 },
    button: { fontSize: 16, fontWeight: "600", lineHeight: 20 },
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 16,
    round: 9999,
  },
  shadows: {
    small: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
}

export const lightTheme: Theme = {
  ...baseTheme,
  colors: lightColors,
}

export const darkTheme: Theme = {
  ...baseTheme,
  colors: darkColors,
}
