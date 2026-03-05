import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { hp, useTheme, wp } from "../theme";

interface CardProps {
    children: React.ReactNode;
    /** Extra style overrides */
    style?: StyleProp<ViewStyle>;
    /** Remove default top margin. Default: false */
    noMargin?: boolean;
    /** Custom padding. Default: 20 */
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
    padding = 20,
}: CardProps) {
    const { colors } = useTheme();

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: colors.card,
                    padding: wp(padding),
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
        borderRadius: wp(16),
        marginTop: hp(16),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
});
