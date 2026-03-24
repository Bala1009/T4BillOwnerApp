import axiosInstance from "./axiosInstance";

/**
 * Fetches sales details for the dashboard.
 *
 * - Endpoint: /DashBoard/GetSalesDetails
 * - Authorization: Bearer token attached automatically via axios interceptor
 * - Payload: { startDate, endDate, phase, isActive, vendorID, branchID }
 */
export const getSalesDetails = async (payload: any) => {
  try {
    console.log("[Dashboard API] Payload:", payload);

    const response = await axiosInstance.post(
      "/DashBoard/GetSalesDetails",
      payload
    );

    console.log("[Dashboard API] HTTP Status:", response.status);
    console.log("[Dashboard API] Response:", response.data);

    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error(
        `[Dashboard API] ❌ HTTP ${error.response.status}:`,
        error.response.data
      );
    } else {
      console.error("[Dashboard API] ❌ Error:", error.message);
    }
    throw error;
  }
};
