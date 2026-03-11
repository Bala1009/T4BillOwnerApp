import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { useNavigation } from "@react-navigation/native";
import { DeviceEventEmitter } from "react-native";
import CustomDrawerContent from "./CustomDrawerContent";
import ProfileScreen from "../screens/ProfileScreen";
import DashboardScreen from "../screens/DashboardScreen";
import InventoryScreen from "../screens/InventoryScreen";
import PurchaseOrdersScreen from "../screens/PurchaseOrdersScreen";
import PerformanceScreen from "../screens/PerformanceScreen";

const Drawer = createDrawerNavigator();

/**
 * Root drawer that exposes all main screens directly in the sidebar.
 * The bottom tab navigator has been removed — sidebar is the sole
 * navigation mechanism for switching between main screens.
 */
export default function DrawerNavigator() {
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
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: "slide",
        overlayColor: "transparent",
        drawerStyle: { width: "75%" },
        swipeEdgeWidth: 60,
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Inventory" component={InventoryScreen} />
      <Drawer.Screen name="PurchaseOrders" component={PurchaseOrdersScreen} />
      <Drawer.Screen name="Performance" component={PerformanceScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
    </Drawer.Navigator>
  );
}