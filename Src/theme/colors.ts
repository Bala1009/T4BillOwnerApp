import type { StatusBarStyle } from "react-native";

// ─── Fresh, Modern Color Palettes ────────────────────────────
// Inspired by premium SaaS dashboards (Linear, Vercel, Stripe)
// with vibrant yet harmonious tones.

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
    // Backgrounds — warm off-white for a fresh feel
    bg: "#F8FAFC",
    card: "#FFFFFF",
    cardAlt: "#F1F5F9",

    // Primary — vibrant indigo-blue with warm undertone
    primary: "#4F46E5",
    primaryLight: "#EEF2FF",
    accent: "#F43F5E",

    // Text — rich, readable hierarchy
    textPrimary: "#0F172A",
    textSecondary: "#475569",
    textTertiary: "#94A3B8",

    // Semantic — vivid and distinct
    green: "#10B981",
    greenBg: "#ECFDF5",
    red: "#EF4444",
    redBg: "#FEF2F2",
    blue: "#3B82F6",
    blueBg: "#EFF6FF",
    orange: "#F59E0B",
    orangeBg: "#FFFBEB",
    purple: "#6366F1",
    purpleBg: "#EEF2FF",
    teal: "#14B8A6",
    tealBg: "#F0FDFA",

    // UI Elements
    border: "#E2E8F0",
    shadow: "#0F172A",
    inputBg: "#FFFFFF",
    inputBorder: "#CBD5E1",
    placeholder: "#94A3B8",

    // Status bar
    statusBar: "dark-content",
    statusBarBg: "#F8FAFC",

    // Tab bar
    tabBg: "#FFFFFF",
    tabInactive: "#94A3B8",
    tabActiveBg: "#EEF2FF",

    // Splash
    splashBg: "#0F172A",
    splashCard: "#1E293B",
    splashText: "#FFFFFF",
    splashSubtext: "#94A3B8",
    splashFooter: "#475569",
};

export const DarkColors: ThemePalette = {
    // Backgrounds — deep, rich dark with subtle blue undertone
    bg: "#0C0F1A",
    card: "#161B2E",
    cardAlt: "#1E2438",

    // Primary — luminous indigo for dark mode
    primary: "#818CF8",
    primaryLight: "#252A40",
    accent: "#FB7185",

    // Text — clear contrast on dark backgrounds
    textPrimary: "#F1F5F9",
    textSecondary: "#94A3B8",
    textTertiary: "#64748B",

    // Semantic — brighter variants for dark mode readability
    green: "#34D399",
    greenBg: "#0D2818",
    red: "#FB7185",
    redBg: "#2A1520",
    blue: "#60A5FA",
    blueBg: "#152040",
    orange: "#FBBF24",
    orangeBg: "#2A2210",
    purple: "#A78BFA",
    purpleBg: "#1E1840",
    teal: "#2DD4BF",
    tealBg: "#0D2828",

    // UI Elements
    border: "#1E293B",
    shadow: "#000000",
    inputBg: "#161B2E",
    inputBorder: "#1E293B",
    placeholder: "#64748B",

    // Status bar
    statusBar: "light-content",
    statusBarBg: "#0C0F1A",

    // Tab bar
    tabBg: "#111525",
    tabInactive: "#64748B",
    tabActiveBg: "#252A40",

    // Splash
    splashBg: "#0F172A",
    splashCard: "#1E293B",
    splashText: "#FFFFFF",
    splashSubtext: "#94A3B8",
    splashFooter: "#475569",
};

export type ThemeColors = ThemePalette;
