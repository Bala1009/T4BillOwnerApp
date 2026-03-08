import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { DeviceEventEmitter } from 'react-native';

const BASE_URL = 'https://api.touch4bill.com/V1.0/';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // Increased timeout to prevent Network Error on slow queries
});

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("authtoken");

      if (token) {
        config.headers.authtoken = token;
      }

    } catch (error) {
      console.error("Error fetching token from AsyncStorage", error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Optional: console.log(`[Axios] Response from ${response.config.url}`, response.status);
    return response;
  },
  async (error) => {
    // Enhanced error logging for network errors
    if (error.isAxiosError) {
      console.error(`[Axios Error] API: ${error.config?.url} | message: ${error.message} | code: ${error.code}`);
      if (!error.response) {
         console.error("[Axios Error] Server unreachable or request timed out (Network Error).");
      }
    }

    if (error.response && error.response.status === 401) {
      try {

        const userName = await AsyncStorage.getItem("username");
        const password = await AsyncStorage.getItem("password");

        if (userName && password) {

          // Re-login to get new token
          const res = await axios.post(
            "https://api.touch4bill.com/V1.0/Login/GetLogin",
            {
              userName,
              passWord: password,
              deviceID: "device123"
            }
          );

          const newToken = res.headers.authtoken;

          if (newToken) {
            await AsyncStorage.setItem("authtoken", newToken);
          }

          // Retry original request
          error.config.headers.authtoken = newToken;

          return axiosInstance(error.config);

        } else {
          DeviceEventEmitter.emit("AUTH_FAILED");
        }

      } catch (_e) {

        await AsyncStorage.removeItem("authtoken");
        await AsyncStorage.removeItem("userDetails");

        DeviceEventEmitter.emit("AUTH_FAILED");
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
