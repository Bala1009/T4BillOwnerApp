import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { hp, useTheme, wp } from "../theme";

interface CardProps {
    children: React.ReactNode;
    /** Extra style overrides */
    style?: StyleProp<ViewStyle>;
    /** Remove default top margin. Default: false */
    noMargin?: boolean;
    /** Custom padding. Default: 16 */
    padding?: number;
}

/**
 * Themed card with rounded corners, soft shadow, and white/dark background.
 * Used across Dashboard, Profile, and detail screens.
 */
export default function Card({
    children,
    style,
    noMargin = false,
    padding = 16,
}: CardProps) {
    const { colors } = useTheme();

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: colors.card,
                    padding: wp(padding),
                    borderColor: "rgba(0,0,0,0.03)",
                },
                noMargin && { marginTop: 0 },
                style,
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: wp(20),
        marginTop: hp(24),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
    },
});
