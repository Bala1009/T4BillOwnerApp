import React, { createContext, useContext, useState, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSalesDetails } from '../api/dashboardService';
import { AUTH_TOKEN_KEY } from '../constants/storageKeys';

// ─── Types ───────────────────────────────────────────────────
type DashboardContextType = {
  dashboardData: any | null;
  selectedBranch: any | null;
  isLoading: boolean;
  errorMsg: string | null;
  setSelectedBranch: (branch: any) => void;
  setDashboardData: (data: any) => void;
  fetchDashboardData: (branch: any, startDate: string, endDate: string) => Promise<void>;
};

const DashboardContext = createContext<DashboardContextType>({
  dashboardData: null,
  selectedBranch: null,
  isLoading: false,
  errorMsg: null,
  setSelectedBranch: () => {},
  setDashboardData: () => {},
  fetchDashboardData: async () => {},
});

// ─── Provider ────────────────────────────────────────────────
export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dashboardData, setDashboardDataState] = useState<any | null>(null);
  const [selectedBranch, setSelectedBranchState] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const setSelectedBranch = useCallback((branch: any) => {
    console.log("[DashboardContext] Branch updated:", branch?.branchID || branch?.BranchID);
    setSelectedBranchState(branch);
  }, []);

  const setDashboardData = useCallback((data: any) => {
    setDashboardDataState(data);
    console.log("[DashboardContext] Global data updated");
    // Emit event so any screen not using context can also sync
    DeviceEventEmitter.emit("DASHBOARD_UPDATED", data);
  }, []);

  const fetchDashboardData = useCallback(async (
    branch: any,
    startDate: string,
    endDate: string,
  ) => {
    if (!branch) {
      console.log("[DashboardContext] ⚠️ No branch — skipping fetch");
      return;
    }

    // Check token
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      console.warn("[DashboardContext] ⚠️ No token — skipping fetch");
      return;
    }

    const branchID =
      branch?.branchID ||
      branch?.BranchID ||
      branch?.BranchId ||
      branch?.branchId ||
      branch?.id ||
      branch?.ID ||
      0;

    console.log("[DashboardContext] Fetching data for branchID:", branchID);

    const payload = {
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      phase: "",
      isActive: "",
      vendorID: 0,
      branchID,
    };

    console.log("[DashboardContext] Payload:", payload);

    try {
      setIsLoading(true);
      setErrorMsg(null);

      const data = await getSalesDetails(payload);

      console.log("[DashboardContext] Full Response:", JSON.stringify(data, null, 2)?.substring(0, 500));

      if (!data || Object.keys(data).length === 0) {
        console.warn("[DashboardContext] ⚠️ Empty response from API");
      }

      setDashboardData(data);
      console.log("[DashboardContext] ✅ Global data updated");
    } catch (error: any) {
      console.error("[DashboardContext] ❌ Fetch Error:", error);
      setErrorMsg("Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [setDashboardData]);

  return (
    <DashboardContext.Provider
      value={{
        dashboardData,
        selectedBranch,
        isLoading,
        errorMsg,
        setSelectedBranch,
        setDashboardData,
        fetchDashboardData,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

// ─── Hook ────────────────────────────────────────────────────
export function useDashboard() {
  return useContext(DashboardContext);
}
