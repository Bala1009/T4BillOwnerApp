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
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { hp, ms, useTheme, wp } from "../theme";

export default function SplashScreen() {
    const navigation = useNavigation<any>();
    const { colors } = useTheme();

    const logoScale = useSharedValue(0.3);
    const logoOpacity = useSharedValue(0);
    const textOpacity = useSharedValue(0);

    useEffect(() => {
        logoScale.value = withTiming(1, { duration: 800 });
        logoOpacity.value = withTiming(1, { duration: 800 });
        textOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));

        const timer = setTimeout(() => {
            navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
            });
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
                        source={require("../../assets/images/splash-icon.png")}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </Animated.View>

                <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
                    <Text style={[styles.appName, { color: colors.splashText }]}>T4Bill</Text>
                    <Text style={[styles.tagline, { color: colors.splashSubtext }]}>Owner App</Text>
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
});
