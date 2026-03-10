import React from "react";
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    type StyleProp,
    type ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { hp, useTheme, wp } from "../theme";

interface ScreenWrapperProps {
    children: React.ReactNode;
    /** Enable scrollable content. Default: false */
    scrollable?: boolean;
    /** Extra style for the SafeAreaView */
    style?: StyleProp<ViewStyle>;
    /** Horizontal padding for scroll content. Default: 16 */
    paddingH?: number;
    /**
     * Which safe-area edges to respect.
     * Default: ['top','bottom','left','right']
     * Pass ['bottom','left','right'] on screens that render their own
     * header (e.g. GradientHeader) so the status bar area is not doubled.
     */
    edges?: Edge[];
}

/**
 * Common screen wrapper providing SafeAreaView + themed StatusBar.
 * Optionally wraps children in a ScrollView.
 */
export default function ScreenWrapper({
    children,
    scrollable = false,
    style,
    paddingH = 16,
    edges,
}: ScreenWrapperProps) {
    const { colors } = useTheme();

    if (scrollable) {
        return (
            <SafeAreaView
                edges={edges}
                style={[styles.safeArea, { backgroundColor: colors.bg }, style]}
            >
                <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingHorizontal: wp(paddingH), flexGrow: 1 },
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {children}
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            edges={edges}
            style={[styles.safeArea, { backgroundColor: colors.bg }, style]}
        >
            <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />
            {children}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: hp(24),
    },
});
