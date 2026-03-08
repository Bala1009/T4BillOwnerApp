import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Image,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { loginUser } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { hp, ms, useTheme, wp } from "../theme";

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { setAuthData } = useAuth();

  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userNameError, setUserNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const successScale = useSharedValue(0.5);
  const successOpacity = useSharedValue(0);

  // Entrance animations
  const fadeUpValue = useSharedValue(50);
  const fadeOpacity = useSharedValue(0);

  // Floating background blobs
  const blob1Y = useSharedValue(0);
  const blob2Y = useSharedValue(0);

  useEffect(() => {
    // Trigger entrance animation
    fadeUpValue.value = withTiming(0, { duration: 800 });
    fadeOpacity.value = withTiming(1, { duration: 800 });

    // Floating background animations
    blob1Y.value = withRepeat(withTiming(-20, { duration: 3000 }), -1, true);
    blob2Y.value = withDelay(1000, withRepeat(withTiming(20, { duration: 3500 }), -1, true));

    if (isSuccess) {
      successScale.value = withSpring(1, { damping: 12 });
      successOpacity.value = withTiming(1, { duration: 500 });
    }
  }, [isSuccess, successOpacity, successScale]);

  const successAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successOpacity.value,
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
    transform: [{ translateY: fadeUpValue.value }],
  }));

  const blob1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: blob1Y.value }],
  }));

  const blob2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: blob2Y.value }],
  }));

  const validateUserName = (text: string) => {
    if (!text) return "Username is required";
    return "";
  };

  const handleLogin = async () => {
    Keyboard.dismiss();

    const uError = validateUserName(userName);
    const pError = password ? "" : "Password is required";

    setUserNameError(uError);
    setPasswordError(pError);

    if (!uError && !pError) {
      setIsLoading(true);

      try {
        console.log("Login attempt:", { userName, password });

        const res = await loginUser(userName, password, "device123");

        console.log("Login response:", res);

        // Validate response
        const result = res?.data?.result || "";

        if (!result.includes("Success")) {
          Alert.alert("Login Failed", "Invalid username or password");
          setPasswordError("Invalid username or password");
          return;
        }

        // Extract ClientID from result (e.g., "Success-1234")
        const resultParts = result.split("~");
        const clientID = resultParts.length > 1 ? resultParts[1] : null;
        console.log("Extracted ClientID:", clientID);
        // Extract token
        const token = res.headers?.authtoken || res.headers?.["authtoken"];

        await setAuthData({
          authtoken: token || null,
          ClientID: clientID,
          userDetails: res.data ? { ...res.data, loginUserName: userName } : { loginUserName: userName },
        });

        // Only success if API confirms login
        setIsSuccess(true);
      } catch (error) {
        console.error("Login failed:", error);

        Alert.alert(
          "Login Failed",
          "Unable to login. Please check your credentials.",
        );

        setPasswordError("Invalid username or password");
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
        <StatusBar
          barStyle={colors.statusBar}
          backgroundColor={colors.statusBarBg}
        />
        <View style={[styles.successContainer, { backgroundColor: colors.bg }]}>
          <Animated.View
            style={[
              styles.successCard,
              { backgroundColor: colors.card },
              successAnimatedStyle,
            ]}
          >
            <View style={styles.checkCircle}>
              <Feather name="check" size={ms(40)} color="#FFFFFF" />
            </View>
            <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
              Login Successful!
            </Text>
            <Text
              style={[styles.successSubtitle, { color: colors.textSecondary }]}
            >
              Welcome back to your analytics workspace.
            </Text>
            <TouchableOpacity
              style={[
                styles.continueButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Main" }],
                });
              }}
            >
              <Text style={styles.continueButtonText}>Go to Dashboard</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={colors.statusBar}
        backgroundColor={colors.statusBarBg}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.inner, { backgroundColor: colors.bg, overflow: 'hidden' }]}>
              
              {/* Creative Animated Background Blobs */}
              <Animated.View style={[styles.blob1, { backgroundColor: colors.primary + '15' }, blob1Style]} />
              <Animated.View style={[styles.blob2, { backgroundColor: colors.blue + '15' }, blob2Style]} />

              <Animated.View style={[styles.header, formAnimatedStyle]}>
                <Image
                  source={require("../assets/images/app-icon.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  Welcome Back
                </Text>
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  Login to continue
                </Text>
              </Animated.View>

              <Animated.View style={[styles.formContainer, formAnimatedStyle]}>
                {/* Username Field */}
                <View style={styles.inputWrapper}>
                  <Text
                    style={[styles.inputLabel, { color: colors.textPrimary }]}
                  >
                    Username
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        backgroundColor: colors.inputBg,
                        borderColor: userNameError
                          ? colors.red
                          : colors.inputBorder,
                      },
                    ]}
                  >
                    <Feather
                      name="user"
                      size={ms(20)}
                      color={userNameError ? colors.red : colors.placeholder}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.textInput, { color: colors.textPrimary }]}
                      placeholder="Enter your username"
                      placeholderTextColor={colors.placeholder}
                      autoCapitalize="none"
                      value={userName}
                      onChangeText={(text) => {
                        setUserName(text);
                        if (userNameError) setUserNameError("");
                      }}
                    />
                  </View>
                  {userNameError ? (
                    <Text style={[styles.errorText, { color: colors.red }]}>
                      {userNameError}
                    </Text>
                  ) : null}
                </View>

                {/* Password Field */}
                <View style={styles.inputWrapper}>
                  <Text
                    style={[styles.inputLabel, { color: colors.textPrimary }]}
                  >
                    Password
                  </Text>

                  <View
                    style={[
                      styles.inputContainer,
                      {
                        backgroundColor: colors.inputBg,
                        borderColor: passwordError
                          ? colors.red
                          : colors.inputBorder,
                      },
                    ]}
                  >
                    {/* Lock Icon */}
                    <Feather
                      name="lock"
                      size={ms(20)}
                      color={passwordError ? colors.red : colors.placeholder}
                      style={styles.inputIcon}
                    />

                    {/* Password Input */}
                    <TextInput
                      style={[styles.textInput, { color: colors.textPrimary }]}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.placeholder}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (passwordError) setPasswordError("");
                      }}
                    />

                    {/* Eye Icon */}
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Feather
                        name={showPassword ? "eye" : "eye-off"}
                        size={ms(20)}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Error Message */}
                  {passwordError ? (
                    <Text style={[styles.errorText, { color: colors.red }]}>
                      {passwordError}
                    </Text>
                  ) : null}
                </View>
                {/* Forgot Password */}
                <TouchableOpacity style={styles.forgotPasswordContainer}>
                  <Text
                    style={[styles.forgotPasswordText, { color: colors.blue }]}
                  >
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    { backgroundColor: colors.primary },
                    isLoading && styles.loginButtonDisabled,
                  ]}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.loginButtonText}>Login</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
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
  inner: {
    flex: 1,
    paddingHorizontal: wp(24),
    justifyContent: "center",
  },
  header: {
    marginBottom: hp(40),
    marginTop: hp(60),
    alignItems: "flex-start",
  },
  logo: {
    width: wp(64),
    height: wp(64),
    marginBottom: hp(24),
    borderRadius: wp(16),
  },
  title: {
    fontSize: ms(32),
    fontWeight: "bold",
    marginBottom: hp(8),
  },
  subtitle: {
    fontSize: ms(16),
  },
  formContainer: {
    width: "100%",
  },
  inputWrapper: {
    marginBottom: hp(20),
  },
  inputLabel: {
    fontSize: ms(14),
    fontWeight: "600",
    marginBottom: hp(8),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: wp(12),
    paddingHorizontal: wp(16),
    height: hp(56),
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: wp(12),
  },
  textInput: {
    flex: 1,
    fontSize: ms(16),
    height: "100%",
  },
  eyeIcon: {
    padding: wp(4),
  },
  errorText: {
    fontSize: ms(12),
    marginTop: hp(6),
    marginLeft: wp(4),
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: hp(32),
  },
  forgotPasswordText: {
    fontWeight: "600",
    fontSize: ms(14),
  },
  loginButton: {
    height: hp(56),
    borderRadius: wp(12),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loginButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: ms(16),
    fontWeight: "bold",
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: wp(24),
  },
  successCard: {
    width: "100%",
    padding: wp(32),
    borderRadius: wp(24),
    alignItems: "center",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  checkCircle: {
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: hp(24),
  },
  successTitle: {
    fontSize: ms(24),
    fontWeight: "bold",
    marginBottom: hp(12),
  },
  successSubtitle: {
    fontSize: ms(16),
    textAlign: "center",
    marginBottom: hp(32),
    lineHeight: ms(24),
  },
  continueButton: {
    width: "100%",
    height: hp(56),
    borderRadius: wp(12),
    justifyContent: "center",
    alignItems: "center",
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: ms(16),
    fontWeight: "bold",
  },
  blob1: {
    position: 'absolute',
    top: hp(-50),
    right: wp(-50),
    width: wp(200),
    height: wp(200),
    borderRadius: wp(100),
  },
  blob2: {
    position: 'absolute',
    bottom: hp(100),
    left: wp(-80),
    width: wp(160),
    height: wp(160),
    borderRadius: wp(80),
  },
});
