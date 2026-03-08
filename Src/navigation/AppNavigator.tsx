import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import LoginScreen from "../screens/loginScreen";
import SplashScreen from "../screens/splashScreen";
import ProductDetailScreen, { ProductDetailData } from "../screens/ProductDetailScreen";
import MainTabs from "./MainTabs";

export type RootStackParamList = {
    Splash: undefined;
    Login: undefined;
    Main: undefined;
    ProductDetail: { product: ProductDetailData };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        </Stack.Navigator>
    );
}

