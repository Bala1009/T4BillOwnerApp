import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect } from "react";
import {
    Image,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
    withRepeat,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { hp, ms, useTheme, wp } from "../theme";

export default function SplashScreen() {
    const navigation = useNavigation<any>();
    const { colors } = useTheme();

    const logoScale = useSharedValue(0.3);
    const logoOpacity = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    
    // Analytics bouncing bars
    const bar1 = useSharedValue(0.2);
    const bar2 = useSharedValue(0.2);
    const bar3 = useSharedValue(0.2);
    const bar4 = useSharedValue(0.2);

    useEffect(() => {
        logoScale.value = withTiming(1, { duration: 800 });
        logoOpacity.value = withTiming(1, { duration: 800 });
        textOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));

        // Start chart animations
        const animateBar = (bar: any, delay: number) => {
            bar.value = withDelay(
                delay,
                withRepeat(withTiming(1, { duration: 500 }), -1, true)
            );
        };

        animateBar(bar1, 0);
        animateBar(bar2, 150);
        animateBar(bar3, 300);
        animateBar(bar4, 450);

        const checkLoginStatus = async () => {
            try {
                const token = await AsyncStorage.getItem('authtoken');
                navigation.reset({
                    index: 0,
                    routes: [{ name: token ? "Main" : "Login" }],
                });
            } catch (error) {
                console.error("Error checking token in splash", error);
                navigation.reset({
                    index: 0,
                    routes: [{ name: "Login" }],
                });
            }
        };

        const timer = setTimeout(() => {
            checkLoginStatus();
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    const logoAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: logoScale.value }],
        opacity: logoOpacity.value,
    }));

    const textAnimatedStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
    }));

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.splashBg }]}>
            <StatusBar barStyle="light-content" backgroundColor={colors.splashBg} />
            <View style={[styles.container, { backgroundColor: colors.splashBg }]}>
                <Animated.View style={[styles.logoContainer, { backgroundColor: colors.splashCard }, logoAnimatedStyle]}>
                    <Image
                        source={require("../assets/images/app-icon.png")}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </Animated.View>

                <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
                    <Text style={[styles.appName, { color: colors.splashText }]}>T4Bill</Text>
                    <Text style={[styles.tagline, { color: colors.splashSubtext }]}>Owner App</Text>
                    
                    {/* Analytics Animated Graph */}
                    <View style={styles.chartContainer}>
                        <Animated.View style={[styles.bar, { backgroundColor: '#3B82F6', transform: [{ scaleY: bar1 }] }]} />
                        <Animated.View style={[styles.bar, { backgroundColor: '#8B5CF6', transform: [{ scaleY: bar2 }] }]} />
                        <Animated.View style={[styles.bar, { backgroundColor: '#10B981', transform: [{ scaleY: bar3 }] }]} />
                        <Animated.View style={[styles.bar, { backgroundColor: '#F59E0B', transform: [{ scaleY: bar4 }] }]} />
                    </View>
                </Animated.View>

                <Animated.View style={[styles.footer, textAnimatedStyle]}>
                    <Text style={[styles.footerText, { color: colors.splashFooter }]}>
                        Powered by Touch4Bill
                    </Text>
                </Animated.View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    logoContainer: {
        width: wp(120),
        height: wp(120),
        borderRadius: wp(28),
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#3B82F6",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    logo: {
        width: wp(80),
        height: wp(80),
    },
    textContainer: {
        alignItems: "center",
        marginTop: hp(24),
    },
    appName: {
        fontSize: ms(32),
        fontWeight: "bold",
        letterSpacing: 2,
    },
    tagline: {
        fontSize: ms(16),
        marginTop: hp(4),
        letterSpacing: 1,
    },
    footer: {
        position: "absolute",
        bottom: hp(48),
    },
    footerText: {
        fontSize: ms(13),
        letterSpacing: 0.5,
    },
    chartContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "center",
        height: hp(32),
        marginTop: hp(24),
        gap: wp(8),
    },
    bar: {
        width: wp(6),
        height: "100%",
        borderRadius: wp(3),
    },
});
