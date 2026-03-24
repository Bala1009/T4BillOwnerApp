import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AUTH_TOKEN_KEY, USERNAME_KEY, PASSWORD_KEY } from "../constants/storageKeys";
import { DeviceEventEmitter } from "react-native";

const BASE_URL = "https://api.touch4bill.com";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});


// 🔐 REQUEST INTERCEPTOR
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    console.log("[Axios] Token attached:", !!token);

    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// 🔁 RESPONSE INTERCEPTOR (401 HANDLE)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 🔥 Prevent infinite loop
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const userName = await AsyncStorage.getItem(USERNAME_KEY);
        const password = await AsyncStorage.getItem(PASSWORD_KEY);

        if (!userName || !password) {
          throw new Error("No saved credentials");
        }

        // 🔁 Re-login via V2.0 endpoint
        const res = await axios.post(`${BASE_URL}/V2.0/Login/GetLogin`, {
          userName,
          passWord: password,
          deviceID: "device123",
        });

        console.log("[Axios Refresh] HTTP Status:", res.status);
        console.log("[Axios Refresh] isSuccess:", res?.data?.isSuccess);

        // ✅ Validate login success
        if (!res?.data?.isSuccess) {
          throw new Error(res?.data?.message || "Token refresh login failed");
        }

        const newToken = res?.data?.token;

        if (!newToken) {
          throw new Error("No token received on refresh");
        }

        // ✅ Save new token
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken);
        console.log("[Axios Refresh] ✅ Token refreshed successfully");

        // 🔁 Retry original request
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

        return axiosInstance(originalRequest);

      } catch (refreshError) {
        console.error("[Axios Refresh] ❌ Token refresh failed");

        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);

        // 🔔 Trigger logout
        DeviceEventEmitter.emit("AUTH_FAILED");

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;