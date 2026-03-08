import axiosInstance from "./axiosInstance";

export const getSalesDetails = async (payload: any) => {
  try {

    console.log("[getSalesDetails] Request Payload:", payload);

    const response = await axiosInstance.post(
      "DashBoard/GetSalesDetails",
      payload
    );

    console.log(
      "[getSalesDetails] Response received:",
      JSON.stringify(response.data, null, 2)
    );

    return response.data;

  } catch (error: any) {
    if (error.response) {
      console.error("[getSalesDetails] API Error Data:", error.response.data);
      console.error("[getSalesDetails] API Error Status:", error.response.status);
    } else {
      console.error("[getSalesDetails] API Error Message:", error.message);
    }
    throw error;
  }
};