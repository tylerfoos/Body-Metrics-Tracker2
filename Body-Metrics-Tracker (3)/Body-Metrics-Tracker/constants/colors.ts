const Colors = {
  light: {
    text: "#1A1D26",
    textSecondary: "#6B7280",
    textTertiary: "#9CA3AF",
    background: "#F8F9FB",
    surface: "#FFFFFF",
    surfaceSecondary: "#F1F3F5",
    tint: "#0D9488",
    tintLight: "#CCFBF1",
    accent: "#F97066",
    accentLight: "#FEE2E2",
    border: "#E5E7EB",
    borderLight: "#F3F4F6",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: "#0D9488",
    success: "#10B981",
    warning: "#F59E0B",
    info: "#3B82F6",
    cardShadow: "rgba(0, 0, 0, 0.04)",
  },
  dark: {
    text: "#F9FAFB",
    textSecondary: "#9CA3AF",
    textTertiary: "#6B7280",
    background: "#0F1117",
    surface: "#1A1D26",
    surfaceSecondary: "#252830",
    tint: "#2DD4BF",
    tintLight: "#134E4A",
    accent: "#FB7185",
    accentLight: "#4C1D26",
    border: "#2D3039",
    borderLight: "#1F2229",
    tabIconDefault: "#6B7280",
    tabIconSelected: "#2DD4BF",
    success: "#34D399",
    warning: "#FBBF24",
    info: "#60A5FA",
    cardShadow: "rgba(0, 0, 0, 0.2)",
  },
};

export default Colors;

export function useThemeColors(isDark: boolean) {
  return isDark ? Colors.dark : Colors.light;
}
