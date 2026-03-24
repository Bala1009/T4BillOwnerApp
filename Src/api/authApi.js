import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AUTH_TOKEN_KEY, USERNAME_KEY, PASSWORD_KEY } from "../constants/storageKeys";

const BASE_URL = "https://api.touch4bill.com";

export const loginUser = async (userName, passWord, deviceID = "device123") => {
  try {
    console.log("[Login] Request:", { userName, deviceID });

    const response = await axios.post(`${BASE_URL}/V2.0/Login/GetLogin`, {
      userName,
      passWord,
      deviceID,
    });

    // ── Log response details ─────────────────────────────────
    console.log("[Login] HTTP Status:", response.status);
    console.log("[Login] Response:", response.data);
    console.log("[Login] API Status:", response.data?.status);
    console.log("[Login] isSuccess:", response.data?.isSuccess);
    console.log("[Login] Message:", response.data?.message);

    // ── Validate login success ───────────────────────────────
    if (!response.data?.isSuccess) {
      console.error("[Login] Failed:", response.data?.message);
      throw { message: response.data?.message || "Login failed" };
    }

    // ── Extract and store token ──────────────────────────────
    const token = response.data?.token;

    if (!token) {
      throw { message: "Token not received from login API" };
    }

    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    await AsyncStorage.setItem(USERNAME_KEY, userName);
    await AsyncStorage.setItem(PASSWORD_KEY, passWord);

    console.log("[Login] ✅ Success — token stored");

    return response.data;

  } catch (error) {
    if (error.response) {
      console.error("[Login] ❌ API Error:", error.response.status, error.response.data);
      throw error.response.data;
    } else if (error.request) {
      console.error("[Login] ❌ Network Error — no response received");
      throw { message: "Network error. Please try again later." };
    } else {
      console.error("[Login] ❌ Error:", error.message || error);
      throw error;
    }
  }
};