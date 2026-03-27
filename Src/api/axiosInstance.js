import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AUTH_TOKEN_KEY,
  USERNAME_KEY,
  PASSWORD_KEY,
} from "../constants/storageKeys";
import { DeviceEventEmitter } from "react-native";

const BASE_URL = "https://api.touch4bill.com";

// 🔧 AXIOS INSTANCE
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🧠 REFRESH CONTROL
let isRefreshing = false;
let failedQueue = [];

// 🔁 HANDLE QUEUE
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};



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



// 🔁 RESPONSE INTERCEPTOR
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    console.log("❌ API ERROR STATUS:", error.response?.status);
    console.log("❌ API ERROR DATA:", error.response?.data);

    // 🔥 HANDLE TOKEN EXPIRY (401 OR 500)
    if (
      (error.response?.status === 401 || error.response?.status === 500) &&
      !originalRequest._retry
    ) {
      // 🧠 IF ALREADY REFRESHING → QUEUE REQUESTS
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("🔄 Refreshing token...");

        const userName = await AsyncStorage.getItem(USERNAME_KEY);
        const password = await AsyncStorage.getItem(PASSWORD_KEY);

        if (!userName || !password) {
          throw new Error("No saved credentials");
        }

        // 🔁 AUTO LOGIN (REFRESH TOKEN LOGIC)
        const res = await axios.post(`${BASE_URL}/V2.0/Login/GetLogin`, {
          userName,
          passWord: password,
          deviceID: "device123",
        });

        console.log("[Refresh] Status:", res.status);
        console.log("[Refresh] Success:", res?.data?.isSuccess);

        if (!res?.data?.isSuccess) {
          throw new Error(res?.data?.message || "Refresh failed");
        }

        const newToken = res?.data?.token;

        if (!newToken) {
          throw new Error("No token received");
        }

        // ✅ SAVE NEW TOKEN
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken);

        // ✅ UPDATE AXIOS DEFAULT HEADER
        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newToken}`;

        console.log("✅ Token refreshed successfully");

        // 🔁 RESOLVE QUEUED REQUESTS
        processQueue(null, newToken);

        // 🔁 RETRY ORIGINAL REQUEST
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("❌ Token refresh failed");

        // ❌ REJECT ALL QUEUED REQUESTS
        processQueue(refreshError, null);

        // 🧹 CLEAR TOKEN
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);

        // 🔔 LOGOUT EVENT
        DeviceEventEmitter.emit("AUTH_FAILED");

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;