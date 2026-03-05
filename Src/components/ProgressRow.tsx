import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { hp, ms, useTheme, wp } from "../theme";

interface ProgressRowProps {
    /** Left label text */
    label: string;
    /** Right-side amount text */
    amount: string;
    /** Fill percentage 0–1 */
    pct: number;
    /** Bar fill color */
    color: string;
}

/**
 * A row with label, amount, and a horizontal progress bar.
 * Used in Payment Breakdown, Expenses, and similar lists.
 */
export default function ProgressRow({ label, amount, pct, color }: ProgressRowProps) {
    const { colors } = useTheme();

    return (
        <View style={styles.row}>
            <View style={styles.labelRow}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
                <Text style={[styles.amount, { color: colors.textPrimary }]}>{amount}</Text>
            </View>
            <View style={[styles.barBg, { backgroundColor: colors.border }]}>
                <View
                    style={[
                        styles.barFill,
                        { width: `${pct * 100}%`, backgroundColor: color },
                    ]}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        marginBottom: hp(14),
    },
    labelRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: hp(6),
    },
    dot: {
        width: wp(8),
        height: wp(8),
        borderRadius: wp(4),
        marginRight: wp(8),
    },
    label: {
        flex: 1,
        fontSize: ms(13),
        fontWeight: "500",
    },
    amount: {
        fontSize: ms(13),
        fontWeight: "700",
    },
    barBg: {
        height: hp(6),
        borderRadius: wp(3),
        overflow: "hidden",
    },
    barFill: {
        height: hp(6),
        borderRadius: wp(3),
    },
});
