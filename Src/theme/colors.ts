import type { StatusBarStyle } from "react-native";

// ─── Light & Dark color palettes ────────────────────────────

interface ThemePalette {
    bg: string;
    card: string;
    cardAlt: string;
    primary: string;
    primaryLight: string;
    accent: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    green: string;
    greenBg: string;
    red: string;
    redBg: string;
    blue: string;
    blueBg: string;
    orange: string;
    orangeBg: string;
    purple: string;
    purpleBg: string;
    teal: string;
    tealBg: string;
    border: string;
    shadow: string;
    inputBg: string;
    inputBorder: string;
    placeholder: string;
    statusBar: StatusBarStyle;
    statusBarBg: string;
    tabBg: string;
    tabInactive: string;
    tabActiveBg: string;
    splashBg: string;
    splashCard: string;
    splashText: string;
    splashSubtext: string;
    splashFooter: string;
}
export const LightColors: ThemePalette = {
    // Backgrounds
    bg: "#F5F7FA",
    card: "#FFFFFF",
    cardAlt: "#F0F2F5",

    // Primary & Accent
    primary: "#1A237E",
    primaryLight: "#EAECF9",
    accent: "#E53935",

    // Text
    textPrimary: "#1A1A2E",
    textSecondary: "#4A5568",
    textTertiary: "#A0AEC0",

    // Semantic
    green: "#38A169",
    greenBg: "#F0FFF4",
    red: "#E53935",
    redBg: "#FFF5F5",
    blue: "#3182CE",
    blueBg: "#EBF4FF",
    orange: "#DD6B20",
    orangeBg: "#FFFAF0",
    purple: "#805AD5",
    purpleBg: "#FAF5FF",
    teal: "#319795",
    tealBg: "#E6FFFA",

    // UI Elements
    border: "#EDF2F7",
    shadow: "#000000",
    inputBg: "#FFFFFF",
    inputBorder: "#E2E8F0",
    placeholder: "#94A3B8",

    // Status bar
    statusBar: "dark-content",
    statusBarBg: "#F5F7FA",

    // Tab bar
    tabBg: "#FFFFFF",
    tabInactive: "#9CA3AF",
    tabActiveBg: "#EAECF9",

    // Splash
    splashBg: "#0F172A",
    splashCard: "#1E293B",
    splashText: "#FFFFFF",
    splashSubtext: "#94A3B8",
    splashFooter: "#475569",
};

export const DarkColors: ThemePalette = {
    // Backgrounds
    bg: "#0F1117",
    card: "#1A1D2E",
    cardAlt: "#242738",

    // Primary & Accent
    primary: "#7C84F8",
    primaryLight: "#2A2D44",
    accent: "#FF6B6B",

    // Text
    textPrimary: "#F1F5F9",
    textSecondary: "#94A3B8",
    textTertiary: "#64748B",

    // Semantic
    green: "#48BB78",
    greenBg: "#1A2E1A",
    red: "#FF6B6B",
    redBg: "#2E1A1A",
    blue: "#63B3ED",
    blueBg: "#1A2236",
    orange: "#F6AD55",
    orangeBg: "#2E2418",
    purple: "#B794F4",
    purpleBg: "#261A36",
    teal: "#4FD1C5",
    tealBg: "#1A2E2C",

    // UI Elements
    border: "#2D3148",
    shadow: "#000000",
    inputBg: "#1A1D2E",
    inputBorder: "#2D3148",
    placeholder: "#64748B",

    // Status bar
    statusBar: "light-content",
    statusBarBg: "#0F1117",

    // Tab bar
    tabBg: "#161826",
    tabInactive: "#64748B",
    tabActiveBg: "#2A2D44",

    // Splash (same in dark)
    splashBg: "#0F172A",
    splashCard: "#1E293B",
    splashText: "#FFFFFF",
    splashSubtext: "#94A3B8",
    splashFooter: "#475569",
};

export type ThemeColors = ThemePalette;
