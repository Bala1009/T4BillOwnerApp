import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { DarkColors, LightColors, type ThemeColors } from "./colors";

type ThemeMode = "light" | "dark";
type ThemePreference = "system" | "light" | "dark";

interface ThemeContextType {
    mode: ThemeMode;
    preference: ThemePreference;
    colors: ThemeColors;
    isDark: boolean;
    isSystem: boolean;
    toggleTheme: () => void;
    setTheme: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    mode: "light",
    preference: "system",
    colors: LightColors,
    isDark: false,
    isSystem: true,
    toggleTheme: () => { },
    setTheme: () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemScheme = useColorScheme(); // "light" | "dark" | null
    const [preference, setPreference] = useState<ThemePreference>("system");

    // Resolve the actual mode from preference + system
    const resolvedMode: ThemeMode = useMemo(() => {
        if (preference === "system") {
            return systemScheme === "dark" ? "dark" : "light";
        }
        return preference;
    }, [preference, systemScheme]);

    const toggleTheme = useCallback(() => {
        setPreference((prev) => {
            if (prev === "system") {
                // If system is light, toggle to dark (and vice versa)
                return systemScheme === "dark" ? "light" : "dark";
            }
            return prev === "light" ? "dark" : "light";
        });
    }, [systemScheme]);

    const setTheme = useCallback((pref: ThemePreference) => {
        setPreference(pref);
    }, []);

    const value = useMemo<ThemeContextType>(
        () => ({
            mode: resolvedMode,
            preference,
            colors: resolvedMode === "light" ? LightColors : DarkColors,
            isDark: resolvedMode === "dark",
            isSystem: preference === "system",
            toggleTheme,
            setTheme,
        }),
        [resolvedMode, preference, toggleTheme, setTheme]
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextType {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}

export default ThemeContext;
