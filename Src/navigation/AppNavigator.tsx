import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import LoginScreen from "../screens/loginScreen";
import SplashScreen from "../screens/splashScreen";
import ProductDetailScreen, { ProductDetailData } from "../screens/ProductDetailScreen";
import NotificationScreen from "../screens/NotificationScreen";
import DrawerNavigator from "./DrawerNavigator";

export type RootStackParamList = {
    Splash: undefined;
    Login: undefined;
    Main: undefined;
    ProductDetail: { product: ProductDetailData };
    Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Main" component={DrawerNavigator} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="Notifications" component={NotificationScreen} />
        </Stack.Navigator>
    );
}

