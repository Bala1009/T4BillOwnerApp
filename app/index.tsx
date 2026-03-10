import {
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { ActivityIndicator, View } from "react-native";
import AppNavigator from "../Src/navigation/AppNavigator";
import { ThemeProvider } from "../Src/theme";
import { AuthProvider } from "../Src/context/AuthContext";
import { DateFilterProvider } from "../Src/context/DateFilterContext";

export default function Index() {
  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F172A" }}>
        <ActivityIndicator size="large" color="#7C84F8" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <DateFilterProvider>
          <AppNavigator />
        </DateFilterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}