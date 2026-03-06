import axiosInstance from "./axiosInstance";

export const getBranchMaster = async (clientID?: number) => {
  try {
    console.log("[getBranchMaster] Request started...");

    const url = clientID
      ? `Master/GetBranchMaster?ClientID=${clientID}`
      : "Master/GetBranchMaster";

    console.log("[getBranchMaster] Request URL:", url);

    const response = await axiosInstance.get(url);

    console.log(
      "[getBranchMaster] Response received:",
      JSON.stringify(response.data, null, 2)
    );

    const branchList = response?.data?.branchMasterList || [];

    return branchList;

  } catch (error) {
    console.error("[getBranchMaster] API Error:", error);
    throw error;
  }
};