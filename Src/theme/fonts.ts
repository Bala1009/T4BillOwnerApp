/**
 * Font family constants for Poppins.
 * Use these in all StyleSheet definitions.
 */
export const Fonts = {
    light: "Poppins_300Light",
    regular: "Poppins_400Regular",
    medium: "Poppins_500Medium",
    semiBold: "Poppins_600SemiBold",
    bold: "Poppins_700Bold",
    extraBold: "Poppins_800ExtraBold",
} as const;

export type FontWeight = keyof typeof Fonts;
