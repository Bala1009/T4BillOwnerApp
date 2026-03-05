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
const TAB_BAR_CONTENT_HEIGHT = 56; // Fixed content area (icon + label)
const TAB_CORNER_RADIUS = 20;
const ICON_SIZE_FEATHER = 22;
const ICON_SIZE_IONICONS = 24;
const LABEL_FONT_SIZE = 11;
const ACTIVE_PILL_WIDTH = 48;
const ACTIVE_PILL_HEIGHT = 32;
const ACTIVE_PILL_RADIUS = 16;

// ─── Custom Tab Bar ─────────────────────────────────────────
function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Use actual safe area bottom inset for proper spacing on all devices
  // Minimum 8px padding even on devices without home indicator
  const bottomPadding = Math.max(insets.bottom, 8);

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
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={tabConfig.label}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tab}
            >
              <View
                style={[
                  styles.iconContainer,
                  isFocused && {
                    backgroundColor: colors.tabActiveBg,
                  },
                ]}
              >
                {renderIcon()}
              </View>
              <Text
                style={[styles.label, { color }]}
                numberOfLines={1}
              >
                {tabConfig.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main Tabs Navigator ────────────────────────────────────
export default function MainTabs() {
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
    // This fills the area behind the rounded corners
    // so there's no gap on the sides
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderTopLeftRadius: wp(TAB_CORNER_RADIUS),
    borderTopRightRadius: wp(TAB_CORNER_RADIUS),
    paddingTop: 10,
    paddingHorizontal: wp(4),
    // Shadow
    shadowColor: "#1A237E",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: TAB_BAR_CONTENT_HEIGHT,
  },
  iconContainer: {
    width: wp(ACTIVE_PILL_WIDTH),
    height: ACTIVE_PILL_HEIGHT,
    borderRadius: wp(ACTIVE_PILL_RADIUS),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  label: {
    fontSize: ms(LABEL_FONT_SIZE),
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});