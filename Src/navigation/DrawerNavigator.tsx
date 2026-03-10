import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import MainTabs from "./MainTabs";
import CustomDrawerContent from "./CustomDrawerContent";
import ProfileScreen from "../screens/ProfileScreen";

const Drawer = createDrawerNavigator();

/**
 * Root drawer that wraps the bottom-tab MainTabs and gives access to
 * the Profile screen (which is no longer in the bottom tabs).
 */
export default function DrawerNavigator() {
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
      {/* MainTabs houses Dashboard / Inventory / Orders / Performance */}
      <Drawer.Screen name="MainTabs" component={MainTabs} />

      {/* Profile is only accessible via the sidebar */}
      <Drawer.Screen name="Profile" component={ProfileScreen} />
    </Drawer.Navigator>
  );
}