import { Feather } from "@expo/vector-icons";
import React from "react";
import {
    StyleSheet,
    Text,
    View,
} from "react-native";
import { ScreenWrapper } from "../components";
import { hp, ms, useTheme, wp } from "../theme";

export default function InventoryScreen() {
    const { colors } = useTheme();

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <View style={[styles.iconWrap, { backgroundColor: colors.blueBg }]}>
                    <Feather name="package" size={ms(48)} color={colors.primary} />
                </View>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Inventory</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Stock management & product list
                </Text>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center" },
    iconWrap: {
        width: wp(80),
        height: wp(80),
        borderRadius: wp(20),
        justifyContent: "center",
        alignItems: "center",
        marginBottom: hp(16),
    },
    title: { fontSize: ms(24), fontWeight: "bold" },
    subtitle: { fontSize: ms(14), marginTop: hp(4) },
});
