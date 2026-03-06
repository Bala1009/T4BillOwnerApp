import { Feather, Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DashboardScreen from "../screens/DashboardScreen";
import InventoryScreen from "../screens/InventoryScreen";
import ProfileScreen from "../screens/ProfileScreen";
import PurchaseOrdersScreen from "../screens/PurchaseOrdersScreen";
import { ms, useTheme, wp } from "../theme";

const Tab = createBottomTabNavigator();

const TABS = [
  { name: "Dashboard", label: "Dashboard", icon: "grid", iconType: "feather" },
  { name: "Inventory", label: "Inventory", icon: "cube-outline", iconType: "ionicons" },
  { name: "PurchaseOrders", label: "Orders", icon: "file-text", iconType: "feather" },
  { name: "Profile", label: "Profile", icon: "user", iconType: "feather" },
] as const;

// ─── Tab Bar Constants ──────────────────────────────────────
const TAB_BAR_CONTENT_HEIGHT = 60; // Slightly taller for modern look
const TAB_CORNER_RADIUS = 24;
const ICON_SIZE_FEATHER = 22;
const ICON_SIZE_IONICONS = 24;
const LABEL_FONT_SIZE = 11;
const ACTIVE_PILL_WIDTH = 56;
const ACTIVE_PILL_HEIGHT = 32;
const ACTIVE_PILL_RADIUS = 16;

// ─── Animated Tab Item ──────────────────────────────────────
function AnimatedTabItem({
  route,
  isFocused,
  onPress,
  color,
  tabConfig,
  colors,
}: {
  route: any;
  isFocused: boolean;
  onPress: () => void;
  color: string;
  tabConfig: (typeof TABS)[number];
  colors: any;
}) {
  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(isFocused ? 1.15 : 1, {
            damping: 10,
            stiffness: 100,
          }),
        },
        {
          translateY: withSpring(isFocused ? -2 : 0, {
            damping: 10,
            stiffness: 100,
          }),
        },
      ],
    };
  });

  const animatedPillStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isFocused ? 1 : 0, { duration: 250 }),
      transform: [
        {
          scale: withSpring(isFocused ? 1 : 0.4, {
            damping: 14,
            stiffness: 120,
          }),
        },
      ],
    };
  });

  const animatedLabelStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isFocused ? 1 : 0.6, { duration: 200 }),
      transform: [
        {
          translateY: withSpring(isFocused ? 0 : 2, {
            damping: 10,
            stiffness: 100,
          }),
        },
      ],
    };
  });

  const renderIcon = () => {
    if (tabConfig.iconType === "ionicons") {
      return (
        <Ionicons
          name={tabConfig.icon as any}
          size={ms(ICON_SIZE_IONICONS)}
          color={color}
        />
      );
    }
    return (
      <Feather
        name={tabConfig.icon as any}
        size={ms(ICON_SIZE_FEATHER)}
        color={color}
      />
    );
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={tabConfig.label}
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.tab}
    >
      <View style={styles.iconWrapper}>
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: colors.tabActiveBg || colors.primary + "1A", // fallback if tabActiveBg is missing
              borderRadius: wp(ACTIVE_PILL_RADIUS),
            },
            animatedPillStyle,
          ]}
        />
        <Animated.View style={animatedIconStyle}>
          {renderIcon()}
        </Animated.View>
      </View>
      <Animated.Text
        style={[styles.label, { color }, animatedLabelStyle]}
        numberOfLines={1}
      >
        {tabConfig.label}
      </Animated.Text>
    </TouchableOpacity>
  );
}

// ─── Custom Tab Bar ─────────────────────────────────────────
function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const bottomPadding = Math.max(insets.bottom, 12);

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.tabBg }]}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.tabBg,
            paddingBottom: bottomPadding,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const tabConfig = TABS[index];
          const isFocused = state.index === index;
          const color = isFocused ? colors.primary : colors.tabInactive;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <AnimatedTabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              onPress={onPress}
              color={color}
              tabConfig={tabConfig as any}
              colors={colors}
            />
          );
        })}
      </View>
    </View>
  );
}

import { useNavigation, CommonActions } from "@react-navigation/native";
import { DeviceEventEmitter } from "react-native";

// ─── Main Tabs Navigator ────────────────────────────────────
export default function MainTabs() {
  const navigation = useNavigation<any>();

  React.useEffect(() => {
    const subscription = DeviceEventEmitter.addListener("AUTH_FAILED", () => {
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    });

    return () => subscription.remove();
  }, [navigation]);

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="PurchaseOrders" component={PurchaseOrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    shadowColor: "#1A237E",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 16,
    borderTopLeftRadius: wp(TAB_CORNER_RADIUS),
    borderTopRightRadius: wp(TAB_CORNER_RADIUS),
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderTopLeftRadius: wp(TAB_CORNER_RADIUS),
    borderTopRightRadius: wp(TAB_CORNER_RADIUS),
    paddingTop: 12,
    paddingHorizontal: wp(2),
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: TAB_BAR_CONTENT_HEIGHT,
  },
  iconWrapper: {
    width: wp(ACTIVE_PILL_WIDTH),
    height: ACTIVE_PILL_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  label: {
    fontSize: ms(LABEL_FONT_SIZE),
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});