import AsyncStorage from "@react-native-async-storage/async-storage";
import { AUTH_TOKEN_KEY } from "../constants/storageKeys";
import axiosInstance from "./axiosInstance";

/**
 * Fetches the branch master list from the API.
 *
 * - Endpoint: /Master/GetBranchMaster (NO query parameters)
 * - Authorization: Bearer token attached automatically via axios interceptor
 *
 * @returns An array of branch objects, or an empty array if none found.
 */
export const getBranchMaster = async () => {
  try {
    // Check token from AsyncStorage
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    console.log("[Branch] Token from storage:", token);
    console.log("[Branch] Token present:", !!token);

    if (!token) {
      console.warn("[Branch] ⚠️ No token found — skipping API call");
      return [];
    }

    // Make API request
    console.log("[Branch] Calling API...");
    console.log("[Branch] Request → GET /Master/GetBranchMaster");

    const response = await axiosInstance.get("/Master/GetBranchMaster");

    // Log response
    console.log("[Branch] HTTP Status:", response.status);
    console.log("[Branch] Raw Response:", response.data);

    // Extract branch list
    const branchList = response?.data?.branchMasterList || [];
    console.log("[Branch] Extracted Branches:", branchList);
    console.log("[Branch] Branch count:", branchList.length);

    if (branchList.length === 0) {
      console.warn("[Branch] ⚠️ No branches returned from API");
    }

    return branchList;
  } catch (error: any) {
    console.error("[Branch] API Error:", error);
    throw error;
  }
};