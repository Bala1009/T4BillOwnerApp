/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  type LayoutChangeEvent,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import { getBranchMaster } from "../api/branchService";
import { getSalesDetails } from "../api/dashboardService";
import {
  BranchDropdown,
  Card,
  DateRangePicker,
  EmptyBranchState,
  GradientHeader,
  ScreenWrapper,
  SectionHeader,
  type DateRangePickerRef,
} from "../components";
import { useAuth } from "../context/AuthContext";
import { useDateFilter } from "../context/DateFilterContext";
import { useDashboard } from "../context/DashboardContext";
import type { ThemeColors } from "../theme";
import { hp, ms, useTheme, wp } from "../theme";

function buildAreaPath(
  data: number[],
  width: number,
  height: number,
  padding: number = 4,
): { linePath: string; areaPath: string } {
  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  const range = maxVal - minVal;
  const stepX = (width - padding * 2) / (data.length - 1);

  // If all values are 0 (or identical zeros), draw a flat line at the bottom
  const allZero = maxVal === 0 && minVal === 0;

  const points = data.map((v, i) => ({
    x: padding + i * stepX,
    y: allZero
      ? height - padding // flat line at the bottom
      : padding + (1 - (v - minVal) / (range || 1)) * (height - padding * 2),
  }));

  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx1 = prev.x + stepX * 0.4;
    const cpx2 = curr.x - stepX * 0.4;
    linePath += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return { linePath, areaPath };
}

// ─── Main Dashboard ─────────────────────────────────────────
export default function DashboardScreen() {
  const { authData } = useAuth();
  const { colors, isDark } = useTheme();
  // ── Global date filter (shared across all screens) ────────
  const { dateRange, activeFilter, startDate, endDate, setDateFilter } =
    useDateFilter();

  // ── Global dashboard context ──────────────────────────────
  const globalCtx = useDashboard();

  const [selectedBranch, setSelectedBranch] = useState<any | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localErrorMsg, setLocalErrorMsg] = useState<string | null>(null);

  // Derive from context
  const dashboardData = globalCtx.dashboardData;
  const isLoading = globalCtx.isLoading;
  const errorMsg = localErrorMsg || globalCtx.errorMsg;

  // ── Branch availability tracking ──────────────────────────
  const [branchLoading, setBranchLoading] = useState(true);
  const [hasBranches, setHasBranches] = useState(false);

  const calendarRef = useRef<DateRangePickerRef>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!selectedBranch) {
      console.log("[Dashboard] ⚠️ No branch selected — skipping API call");
      return;
    }

    console.log("[Dashboard] Fetching via global context...");
    setLocalErrorMsg(null);

    try {
      await globalCtx.fetchDashboardData(selectedBranch, startDate, endDate);
      console.log("[Dashboard] ✅ Global data updated");
    } catch (error: any) {
      console.error("[Dashboard] ❌ Fetch Error:", error);
      setLocalErrorMsg(
        "Failed to load dashboard data. Please check your network connection and try again.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [startDate, endDate, selectedBranch, globalCtx.fetchDashboardData]);

  // ── Fetch dashboard data when branch is selected ───────────
  useEffect(() => {
    if (selectedBranch) {
      // Also update context's selected branch
      globalCtx.setSelectedBranch(selectedBranch);
      fetchDashboardData();
    }
  }, [fetchDashboardData]);

  // Removed — DateRangePicker now calls setDateFilter from context directly

  // Ensure arrays are typed consistently for ItemRankingSection
  const itemWiseSales = dashboardData?.dashBoardItemWiseSalesList || [];

  const mapItemToList = (items: any[], isQtyFirst: boolean) =>
    items.map((it: any) => ({
      name: it.productDescription || "Unknown",
      primary: isQtyFirst
        ? `${it.count}`
        : `₹${it.totalPrice?.toLocaleString() || 0}`,
      secondary: isQtyFirst
        ? `₹${it.totalPrice?.toLocaleString() || 0}`
        : `${it.count} qty`,
      pct:
        items.length > 0 && items[0]
          ? isQtyFirst
            ? it.count / Math.max(items[0].count, 1)
            : it.totalPrice / Math.max(items[0].totalPrice, 1)
          : 0,
    }));

  const topBySalesRaw = [...itemWiseSales].sort(
    (a, b) => (b.totalPrice || 0) - (a.totalPrice || 0),
  );
  const topByQtyRaw = [...itemWiseSales].sort(
    (a, b) => (b.count || 0) - (a.count || 0),
  );
  const lowBySalesRaw = [...itemWiseSales].sort(
    (a, b) => (a.totalPrice || 0) - (b.totalPrice || 0),
  );
  const lowByQtyRaw = [...itemWiseSales].sort(
    (a, b) => (a.count || 0) - (b.count || 0),
  );

  return (
    <ScreenWrapper edges={["bottom", "left", "right"]}>
      <GradientHeader
        title="Dashboard"
        onCalendarPress={() => calendarRef.current?.openModal()}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: wp(16),
          paddingBottom: hp(60),
          paddingTop: hp(8),
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              fetchDashboardData();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={{ paddingHorizontal: wp(0), paddingTop: hp(8) }}>
          <BranchSelectorWithConditionalRendering
            onBranchSelected={setSelectedBranch}
            onBranchesLoaded={(count) => {
              setHasBranches(count > 0);
              setBranchLoading(false);
            }}
          />
          <DateRangePicker
            ref={calendarRef}
            hideChip={true}
            dateRange={dateRange}
            activeFilter={activeFilter}
            onDateRangeChange={setDateFilter}
          />
        </View>
        {/* Show empty branch state when no branches are available */}
        {!branchLoading && !hasBranches ? (
          <EmptyBranchState
            title="No Branches Available"
            message="No branches are configured for your account. Dashboard data requires at least one branch. Please contact your administrator."
          />
        ) : isLoading ? (
          <View style={{ padding: hp(40), alignItems: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: hp(12), color: colors.textSecondary }}>
              Fetching dashboard data...
            </Text>
          </View>
        ) : errorMsg ? (
          <View style={{ padding: hp(40), alignItems: "center" }}>
            <Feather
              name="alert-circle"
              size={ms(48)}
              color={colors.red}
              style={{ marginBottom: hp(16) }}
            />
            <Text
              style={{
                textAlign: "center",
                color: colors.textPrimary,
                fontSize: ms(16),
                marginBottom: hp(24),
              }}
            >
              {errorMsg}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: wp(24),
                paddingVertical: hp(12),
                borderRadius: ms(8),
              }}
              onPress={fetchDashboardData}
            >
              <Text style={{ color: "#FFF", fontWeight: "bold" }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : dashboardData ? (
          <>
            <PremiumTotalSalesCard
              salesList={dashboardData.dashBoardSalesList || []}
              countData={dashboardData.dashBoardCount || {}}
              hourlyList={dashboardData.dashBoardHourlyList || []}
            />
            <KPIGrid
              data={dashboardData.dashBoardCount}
              salesList={dashboardData.dashBoardSalesList || []}
              hourlyList={dashboardData.dashBoardHourlyList || []}
            />
            <SalesChartSection
              salesData={dashboardData.dashBoardSalesList}
              hourlyData={dashboardData.dashBoardHourlyList}
            />
            <PaymentDonutSection data={dashboardData.paymentSplitupList} />
            <RevenueLeakage data={dashboardData.dashBoardCount} />
            <TaxSummarySection data={dashboardData.dashBoardTaxList} />
            <ExpensesSection data={dashboardData.expensessDashBoardList} />

            <ItemRankingSection
              title="Top Items by Sales"
              icon="trending-up"
              accentColor="green"
              data={mapItemToList(topBySalesRaw, false)}
              primaryLabel="Revenue"
              secondaryLabel="Qty"
            />
            <ItemRankingSection
              title="Top Items by Quantity"
              icon="bar-chart-2"
              accentColor="blue"
              data={mapItemToList(topByQtyRaw, true)}
              primaryLabel="Qty Sold"
              secondaryLabel="Revenue"
            />
            <ItemRankingSection
              title="Low Sales by Amount"
              icon="trending-down"
              accentColor="red"
              data={mapItemToList(lowBySalesRaw, false)}
              primaryLabel="Revenue"
              secondaryLabel="Qty"
            />
            <ItemRankingSection
              title="Low Sales by Quantity"
              icon="alert-triangle"
              accentColor="orange"
              data={mapItemToList(lowByQtyRaw, true)}
              primaryLabel="Qty Sold"
              secondaryLabel="Revenue"
            />
          </>
        ) : null}
        <View style={{ height: hp(32) }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

// ─── Branch Selector with Conditional Rendering ─────────────
// Fetches branches from API, manages loading state, and conditionally
// renders the BranchDropdown component.
//
// Rendering logic:
//   loading === true  → <ActivityIndicator />
//   branches.length > 0 → <BranchDropdown />
//   branches.length === 0 → null (nothing rendered)
function BranchSelectorWithConditionalRendering({
  onBranchSelected,
  onBranchesLoaded,
}: {
  onBranchSelected?: (branch: any) => void;
  onBranchesLoaded?: (count: number) => void;
}) {
  const { colors } = useTheme();
  const { authData } = useAuth();

  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Fetch branches ONLY after token is available ───────────
  useEffect(() => {
    if (authData?.authtoken) {
      console.log("[Dashboard] ✅ Token available — fetching branches...");
      fetchBranches();
    } else {
      console.log("[Dashboard] ⚠️ No token yet — waiting before fetching branches");
    }
  }, [authData?.authtoken]);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      console.log("[Dashboard] Fetching branches...");

      const branchList = await getBranchMaster();

      console.log("[Dashboard] Branches received:", branchList);
      console.log("[Dashboard] Branch count:", branchList.length);

      setBranches(branchList);
      console.log("[Dashboard] State updated:", branchList.length, "branches");

      // Notify parent about branch availability
      if (onBranchesLoaded) onBranchesLoaded(branchList.length);

      // Auto-select first branch as default
      if (branchList.length > 0) {
        const defaultBranch = branchList[0];
        console.log("[Dashboard] Selected Branch:", defaultBranch);
        setSelectedBranch(defaultBranch);

        if (onBranchSelected) {
          onBranchSelected(defaultBranch);
        }

        await AsyncStorage.setItem(
          "selectedBranch",
          JSON.stringify(defaultBranch),
        );
        DeviceEventEmitter.emit("BRANCH_CHANGED", defaultBranch);
      } else {
        console.warn("[Dashboard] ⚠️ No branches available from API");
      }
    } catch (error) {
      console.error("[Dashboard] Error fetching branches:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── Handle branch selection from dropdown ──────────────────
  const handleBranchSelect = async (branch: any) => {
    console.log("[Dashboard] Selected branch:", branch);
    setSelectedBranch(branch);
    if (onBranchSelected) onBranchSelected(branch);
    await AsyncStorage.setItem("selectedBranch", JSON.stringify(branch));
    DeviceEventEmitter.emit("BRANCH_CHANGED", branch);
  };

  // ── Conditional rendering ──────────────────────────────────
  return (
    <View>
      {loading ? (
        <View style={[s.branchSelector, { backgroundColor: colors.card }]}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : branches.length > 0 ? (
        <BranchDropdown
          branches={branches}
          selectedBranch={selectedBranch}
          onSelect={handleBranchSelect}
        />
      ) : null}
    </View>
  );
}

// ─── Greeting ───────────────────────────────────────────────
function Greeting() {
  const { colors } = useTheme();
  const { authData } = useAuth();

  const getGreetingMessage = () => {
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour < 12) {
      return "Good Morning";
    } else if (currentHour >= 12 && currentHour < 17) {
      return "Good Afternoon";
    } else if (currentHour >= 17 && currentHour < 22) {
      return "Good Evening";
    } else {
      return "Good Night";
    }
  };

  const getFirstName = () => {
    const userDetails = authData?.userDetails || {};
    // Check login API response for userName or name. If not available, fallback to username entered during login
    const mappedName =
      userDetails?.userName ||
      userDetails?.name ||
      userDetails?.loginUserName ||
      "";

    // Ensure the value is not empty before displaying
    if (!mappedName) return "User";

    // Capitalize the first letter just in case it's completely lowercase (optional but nice)
    return mappedName.charAt(0).toUpperCase() + mappedName.slice(1);
  };

  return (
    <View style={s.greetingContainer}>
      <Text style={[s.greetingTitle, { color: colors.textPrimary }]}>
        {getGreetingMessage()}, {getFirstName()}
      </Text>
      <Text style={[s.greetingSubtitle, { color: colors.textSecondary }]}>
        Business insights for today
      </Text>
    </View>
  );
}

// ─── KPI Cards: SparklineMini with path animation ─────────────
function SparklineMini({
  data,
  color,
  width = 70,
  height = 28,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const w = wp(width);
  const h = hp(height);
  const gradId = `spark_${color.replace("#", "")}`;

  // Check whether there is any meaningful data to plot
  const hasValues = data.some((v) => v !== 0);

  // Compute the full path immediately
  const { linePath, areaPath } = buildAreaPath(data, w, h);

  // Use RN Animated to animate the stroke-dashoffset from full length → 0
  // giving a "drawing" effect whenever data changes
  const { Animated: RNAnimated } = require("react-native");
  const progress = useRef(new RNAnimated.Value(0)).current;
  // Re-run animation whenever data identity changes (key array joined)
  const dataKey = data.join(",");
  useEffect(() => {
    progress.setValue(0);
    RNAnimated.timing(progress, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [dataKey]);

  // Approximate path length as width (good enough for short sparklines)
  const pathLen = w * 2;
  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [pathLen, 0],
  });

  // We render the area (static) + animated line overlay
  const AnimatedNativePath = RNAnimated.createAnimatedComponent(
    require("react-native-svg").Path,
  );

  // When all values are 0, render a subtle flat dashed line (no area fill)
  if (!hasValues) {
    return (
      <Svg width={w} height={h}>
        <Path
          d={`M 4 ${h - 4} L ${w - 4} ${h - 4}`}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeOpacity={0.25}
          strokeDasharray="4,4"
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={w} height={h}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.3" />
          <Stop offset="1" stopColor={color} stopOpacity="0.02" />
        </LinearGradient>
      </Defs>
      {/* Static area fill */}
      <Path d={areaPath} fill={`url(#${gradId})`} />
      {/* Animated stroke – draws from left to right */}
      <AnimatedNativePath
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={pathLen}
        strokeDashoffset={strokeDashoffset}
      />
    </Svg>
  );
}

type KPIDataType = {
  title: string;
  value: string;
  rawNum: number; // raw number for animated counter
  change: string;
  up: boolean;
  icon:
    | "trending-up"
    | "shopping-bag"
    | "credit-card"
    | "dollar-sign"
    | "arrow-up-right"
    | "arrow-down-right"
    | "users";
  colorKey: "green" | "blue" | "red" | "orange";
  bgKey: "greenBg" | "blueBg" | "redBg" | "orangeBg";
  sparkline: number[];
};

// ─── Animated KPI value counter ─────────────────────────────
function AnimatedKPIValue({
  rawNum,
  prefix = "",
  suffix = "",
  style,
}: {
  rawNum: number;
  prefix?: string;
  suffix?: string;
  style: any;
}) {
  const { Animated: RNAnimated } = require("react-native");
  const anim = useRef(new RNAnimated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    anim.setValue(0);
    RNAnimated.timing(anim, {
      toValue: rawNum,
      duration: 900,
      useNativeDriver: false,
    }).start();
    const id = anim.addListener(({ value }: { value: number }) =>
      setDisplay(Math.round(value)),
    );
    return () => anim.removeListener(id);
  }, [rawNum]);

  const formatted =
    display >= 1000
      ? display >= 100000
        ? `${(display / 100000).toFixed(1)}L`
        : `${(display / 1000).toFixed(1)}K`
      : `${display}`;

  return (
    <Text style={style} numberOfLines={1} adjustsFontSizeToFit>
      {prefix}
      {formatted}
      {suffix}
    </Text>
  );
}

function AnimatedKPICard({ item, colors }: { item: KPIDataType; colors: any }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  // Parse the raw numeric value from the item for counting animation
  const rawNum = item.rawNum ?? 0;
  const isRupee = item.value.startsWith("₹");

  return (
    <Animated.View style={[s.kpiCardWidth, animatedStyle]}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        style={[s.animatedKpiCard, { backgroundColor: colors.card }]}
      >
        {/* Top icon row */}
        <View style={s.kpiTopRow}>
          <View
            style={[s.kpiIconWrap, { backgroundColor: colors[item.bgKey] }]}
          >
            <Feather
              name={item.icon}
              size={ms(18)}
              color={colors[item.colorKey]}
            />
          </View>
          <View
            style={[
              s.kpiBadge,
              { backgroundColor: item.up ? colors.greenBg : colors.redBg },
            ]}
          >
            <Feather
              name={item.up ? "arrow-up-right" : "arrow-down-right"}
              size={ms(12)}
              color={item.up ? colors.green : colors.red}
            />
            <Text
              style={[
                s.kpiBadgeText,
                { color: item.up ? colors.green : colors.red },
              ]}
            >
              {item.change}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={s.kpiContentWrap}>
          <View style={s.kpiTextWrap}>
            <Text style={[s.kpiTitle, { color: colors.textTertiary }]}>
              {item.title}
            </Text>
            <AnimatedKPIValue
              rawNum={rawNum}
              prefix={isRupee ? "₹" : ""}
              style={[s.kpiValue, { color: colors.textPrimary }]}
            />
          </View>
          {/* Sparkline */}
          <View style={s.sparklineWrap}>
            <SparklineMini
              data={item.sparkline}
              color={colors[item.colorKey]}
              width={60}
              height={32}
            />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Helpers for building per-metric sparklines ─────────────────
function buildSparklines(salesList: any[], hourlyList: any[]) {
  // Prefer daily sales list; fall back to hourly if daily is empty
  const source =
    salesList?.length >= 2
      ? salesList
      : hourlyList?.length >= 2
        ? hourlyList
        : [];

  if (source.length < 2) {
    // Not enough points — return a flat line at zero (no misleading trend)
    return {
      revenue: [0, 0, 0],
      customers: [0, 0, 0],
      bills: [0, 0, 0],
      expenses: [0, 0, 0],
      profit: [0, 0, 0],
    };
  }

  const revenue = source.map((d: any) => Math.max(0, d.paidAmount || 0));
  const customers = source.map((d: any) =>
    Math.max(
      0,
      d.totalCustomer || d.customerCount || d.billCount || d.totalBills || 0,
    ),
  );
  const bills = source.map((d: any) =>
    Math.max(0, d.billCount || d.totalBills || 0),
  );
  const expenses = source.map((d: any) =>
    Math.max(0, d.expenseAmount || d.expense || 0),
  );
  const profit = source.map((d: any) => {
    const r = d.paidAmount || 0;
    const e = d.expenseAmount || d.expense || 0;
    return r - e;
  });

  // Ensure at least 2 distinct values so the path builder doesn't divide by zero.
  // If ALL values are 0, keep them at 0 so the sparkline stays flat (no false trend).
  const ensure = (arr: number[]) => {
    if (arr.every((v) => v === 0)) return arr; // all zeros → stay flat
    return arr.every((v) => v === arr[0])
      ? arr.map((v, i) => v + i * 0.001)
      : arr;
  };

  return {
    revenue: ensure(revenue),
    customers: ensure(customers),
    bills: ensure(bills),
    expenses: ensure(expenses),
    profit: ensure(profit),
  };
}

function KPIGrid({
  data,
  salesList,
  hourlyList,
}: {
  data: any;
  salesList?: any[];
  hourlyList?: any[];
}) {
  const { colors } = useTheme();

  if (!data) return null;

  const todaysPayments = data?.todaysPayments || 0;
  const todayExpenses = data?.todayExpenses || 0;
  const totalBills = data?.totalBills || 0;
  const cancelBills = data?.cancelBills || 0;
  const totalCustomer = data?.totalCustomer || 0;
  const profit = todaysPayments - todayExpenses;

  // Compute dynamic change indicators
  const profitMarginPct =
    todaysPayments > 0 ? Math.round((profit / todaysPayments) * 100) : 0;
  const expenseRatioPct =
    todaysPayments > 0 ? Math.round((todayExpenses / todaysPayments) * 100) : 0;
  const avgOrderValue =
    totalBills > 0 ? Math.round(todaysPayments / totalBills) : 0;

  const sparks = buildSparklines(salesList || [], hourlyList || []);

  // Zero-out sparkline data when the KPI aggregate value is 0
  // This prevents the graph from showing a misleading trend from
  // individual time-period data while the aggregate is actually zero.
  const FLAT = [0, 0, 0];

  const mappedData: KPIDataType[] = [
    {
      title: "Total Customers",
      value: `${totalCustomer}`,
      rawNum: totalCustomer,
      change: totalCustomer > 0 ? `+${totalCustomer} today` : `0 today`,
      up: totalCustomer >= 0,
      icon: "users",
      colorKey: "green",
      bgKey: "greenBg",
      sparkline: totalCustomer > 0 ? sparks.customers : FLAT,
    },
    {
      title: "Total Bills",
      value: `${totalBills}`,
      rawNum: totalBills,
      change: `Avg ₹${avgOrderValue.toLocaleString()}`,
      up: true,
      icon: "shopping-bag",
      colorKey: "blue",
      bgKey: "blueBg",
      sparkline: totalBills > 0 ? sparks.bills : FLAT,
    },
    {
      title: "Expenses",
      value: `₹${todayExpenses.toLocaleString()}`,
      rawNum: todayExpenses,
      change: `${expenseRatioPct}% of rev`,
      up: false,
      icon: "credit-card",
      colorKey: "red",
      bgKey: "redBg",
      sparkline: todayExpenses > 0 ? sparks.expenses : FLAT,
    },
    {
      title: "Profit",
      value: `₹${profit.toLocaleString()}`,
      rawNum: profit,
      change: `${profitMarginPct}%`,
      up: profit >= 0,
      icon: "dollar-sign",
      colorKey: profit >= 0 ? "green" : "red",
      bgKey: profit >= 0 ? "greenBg" : "redBg",
      sparkline: profit !== 0 ? sparks.profit : FLAT,
    },
  ];

  return (
    <View style={s.kpiGrid}>
      {mappedData.map((item, i) => (
        <AnimatedKPICard key={i} item={item} colors={colors} />
      ))}
    </View>
  );
}

// ─── Semi-Circular Gauge Component ──────────────────────────
function SemiCircularGauge({
  progress,
  size,
  strokeWidth,
}: {
  progress: number; // 0 to 1
  size: number;
  strokeWidth: number;
}) {
  const { Animated: RNAnimated, Easing: RNEasing } = require("react-native");
  const dashAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    dashAnim.setValue(0);
    RNAnimated.timing(dashAnim, {
      toValue: 1,
      duration: 900,
      easing: RNEasing.out(RNEasing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Animated numeric value for dash calculations
  const [animFraction, setAnimFraction] = useState(0);
  useEffect(() => {
    const id = dashAnim.addListener(({ value }: { value: number }) => {
      setAnimFraction(value * progress);
    });
    return () => dashAnim.removeListener(id);
  }, [dashAnim, progress]);

  // ── Geometry ──
  const pad = strokeWidth / 2 + 6; // padding to avoid clipping round caps
  const radius = (size - pad * 2) / 2;
  const cx = size / 2;
  const cy = pad + radius; // arc center at bottom of the half-circle
  const svgH = cy + strokeWidth / 2 + 6; // include bottom stroke + margin

  const trackThickness = strokeWidth * 0.55; // base track thinner than progress

  // Arc length of the full semi-circle
  const fullArcLen = Math.PI * radius;

  // Helper to get cartesian point on the arc
  // angle: 0 = right side, PI = left side  (standard math convention)
  // SVG y-axis is inverted, so we use cy - r*sin
  const arcX = (angle: number) => cx + radius * Math.cos(angle);
  const arcY = (angle: number) => cy - radius * Math.sin(angle);

  // Full semi-circle path from left (PI) to right (0)
  const trackPath = [
    `M ${arcX(Math.PI).toFixed(2)} ${arcY(Math.PI).toFixed(2)}`,
    `A ${radius.toFixed(2)} ${radius.toFixed(2)} 0 0 1 ${arcX(0).toFixed(2)} ${arcY(0).toFixed(2)}`,
  ].join(" ");

  // Progress arc — same path, but we use strokeDasharray to clip it
  // dashArray = [filled, gap]
  const filledLen = animFraction * fullArcLen;
  const gapLen = fullArcLen - filledLen;

  // End-marker: angle where the progress stops
  const progAngle = Math.PI * (1 - animFraction);
  const markerHalf = strokeWidth * 0.45;
  const mdx = Math.cos(progAngle);
  const mdy = -Math.sin(progAngle); // SVG y inverted
  const mX1 = cx + (radius - markerHalf) * mdx;
  const mY1 = cy + (radius - markerHalf) * mdy;
  const mX2 = cx + (radius + markerHalf) * mdx;
  const mY2 = cy + (radius + markerHalf) * mdy;

  return (
    <Svg width={size} height={svgH} viewBox={`0 0 ${size} ${svgH}`}>
      <Defs>
        <LinearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#3B82F6" stopOpacity="1" />
          <Stop offset="0.5" stopColor="#6366F1" stopOpacity="1" />
          <Stop offset="1" stopColor="#8B5CF6" stopOpacity="1" />
        </LinearGradient>
      </Defs>

      {/* Base track arc (thinner, light gray) */}
      <Path
        d={trackPath}
        fill="none"
        stroke="rgba(100,116,139,0.12)"
        strokeWidth={trackThickness}
        strokeLinecap="round"
      />

      {/* Progress arc (thicker, gradient, dash-clipped for smooth animation) */}
      {animFraction > 0.003 && (
        <Path
          d={trackPath}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filledLen.toFixed(2)}, ${gapLen.toFixed(2)}`}
        />
      )}

      {/* End-marker tick at progress stop */}
      {animFraction > 0.03 && animFraction < 0.97 && (
        <Path
          d={`M ${mX1.toFixed(2)} ${mY1.toFixed(2)} L ${mX2.toFixed(2)} ${mY2.toFixed(2)}`}
          stroke="rgba(100,116,139,0.3)"
          strokeWidth={2}
          strokeLinecap="round"
        />
      )}
    </Svg>
  );
}

// ─── Premium Total Sales Gauge Card ────────────────────────────
function PremiumTotalSalesCard({
  salesList,
  countData,
  hourlyList,
}: {
  salesList: any[];
  countData: any;
  hourlyList: any[];
}) {
  const { colors, isDark } = useTheme();
  const { Animated: RNAnimated, Easing: RNEasing } = require("react-native");

  // ── Extract total sales from dashBoardSalesList where hours === "Total " ──
  const totalEntry = (salesList || []).find(
    (item: any) => (item.hours || "").trim().toLowerCase() === "total",
  );
  const totalPaidAmt = totalEntry?.paidAmount || 0;

  // ── Sales amount counter animation ──
  const [animVal, setAnimVal] = useState(0);
  useEffect(() => {
    if (totalPaidAmt === 0) {
      setAnimVal(0);
      return;
    }
    const anim = new RNAnimated.Value(0);
    const id = anim.addListener(({ value }: { value: number }) => {
      setAnimVal(Math.round(value));
    });
    RNAnimated.timing(anim, {
      toValue: totalPaidAmt,
      duration: 950,
      easing: RNEasing.out(RNEasing.cubic),
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(id);
  }, [totalPaidAmt]);

  const formattedTotal =
    totalPaidAmt > 0 && animVal > 0 ? `₹${animVal.toLocaleString()}` : "₹0";

  // ── Progress (gauge fill ratio) ──
  // Calculate a meaningful progress percentage:
  // Use the highest individual entry (non-total) paidAmount as the max reference.
  // This way the total sales is always >= max entry, giving a ratio < 1.
  // Example: if hourly data has max ₹500 and total is ₹1904,
  //          then progress = 1904 / (1904 * some_scale) — we use a
  //          dynamic max to produce a visually meaningful gauge.

  let progressRatio = 0;

  if (totalPaidAmt > 0) {
    // Collect individual (non-total) entries
    const nonTotalEntries = (salesList || []).filter(
      (item: any) => (item.hours || "").trim().toLowerCase() !== "total",
    );
    // Also check hourlyList for finer-grained max
    const hourlyEntries = (hourlyList || []).filter(
      (item: any) => (item.hours || "").trim().toLowerCase() !== "total",
    );

    // Find the highest individual paidAmount across all entries
    const allEntries = [...nonTotalEntries, ...hourlyEntries];
    const maxEntryValue = allEntries.reduce(
      (max: number, e: any) => Math.max(max, e.paidAmount || 0),
      0,
    );

    if (maxEntryValue > 0 && maxEntryValue < totalPaidAmt) {
      // Total / (Total + MaxEntry) gives a ratio that's always < 1
      // and scales meaningfully with data distribution
      progressRatio = totalPaidAmt / (totalPaidAmt + maxEntryValue);
    } else if (nonTotalEntries.length > 1) {
      // Multiple entries: use count-based heuristic
      // More entries with data = higher achievement
      const entriesWithSales = nonTotalEntries.filter(
        (e: any) => (e.paidAmount || 0) > 0,
      ).length;
      progressRatio = Math.min(
        entriesWithSales / Math.max(nonTotalEntries.length, 1),
        0.95,
      );
    } else {
      // Single entry or no breakdown — use a moderate default
      progressRatio = 0.65;
    }

    // Clamp to [0.08, 0.95] for visual clarity
    progressRatio = Math.max(0.08, Math.min(progressRatio, 0.95));
  }
  // When totalPaidAmt is 0, progressRatio stays 0 → arc at starting position

  const progressPct = Math.round(progressRatio * 100);

  // ── Card press scale ──
  const [scaleAnim] = useState(new RNAnimated.Value(1));
  const handlePressIn = () =>
    RNAnimated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  const handlePressOut = () =>
    RNAnimated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();

  // Gauge size — responsive to full card width
  const [cardWidth, setCardWidth] = useState(0);
  const gaugeSize =
    cardWidth > 0 ? Math.min(cardWidth - wp(40), wp(280)) : wp(260);
  const strokeW = wp(20);

  return (
    <Card style={s.premiumCardOverride}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <RNAnimated.View
          style={[s.premiumCardContent, { transform: [{ scale: scaleAnim }] }]}
          onLayout={(e: LayoutChangeEvent) =>
            setCardWidth(e.nativeEvent.layout.width)
          }
        >
          {/* ── Header row ── */}
          <View style={s.gaugeHeaderRow}>
            <Text
              style={[s.premiumTitleGauge, { color: colors.textSecondary }]}
            >
              Total Sales
            </Text>
            <View style={[s.gaugeBadge, { backgroundColor: colors.blueBg }]}>
              <Feather name="trending-up" size={ms(12)} color={colors.blue} />
              <Text style={[s.gaugeBadgeText, { color: colors.blue }]}>
                Sales
              </Text>
            </View>
          </View>

          {/* ── Amount ── */}
          <Text style={[s.premiumAmount, { color: colors.textPrimary }]}>
            {formattedTotal}
          </Text>
          <Text style={[s.premiumSubLabel, { color: colors.textTertiary }]}>
            Total Paid Amount
          </Text>

          {/* ── Gauge ── */}
          <View style={s.gaugeSVGWrapper}>
            {cardWidth > 0 && (
              <SemiCircularGauge
                progress={progressRatio}
                size={gaugeSize}
                strokeWidth={strokeW}
              />
            )}
          </View>

          {/* ── Percentage label below gauge ── */}
          <View style={s.gaugeBottomRow}>
            <Text style={[s.gaugePctText, { color: "#6366F1" }]}>
              {progressPct}%
            </Text>
            <Text
              style={[s.gaugeAchievedText, { color: colors.textSecondary }]}
            >
              {totalPaidAmt > 0 ? "Achieved so far" : "No Sales Yet"}
            </Text>
          </View>
        </RNAnimated.View>
      </Pressable>
    </Card>
  );
}

// ─── Payment Pie Chart (Modern) ────────────────────────────

function SalesChartSection({
  salesData,
  hourlyData,
}: {
  salesData: any[];
  hourlyData: any[];
}) {
  const { colors } = useTheme();
  const [period, setPeriod] = useState<"sales" | "hourly">("sales");
  const [areaWidth, setAreaWidth] = useState(0);

  const formatXLabel = (val: string, currentPeriod: "sales" | "hourly") => {
    if (!val) return "-";
    const str = val.toString().trim();

    if (currentPeriod === "hourly") {
      // Handle time-range strings like "12 PM to 1 PM" or "12:00 - 13:00"
      const rangeMatch = str.match(
        /(\d+)\s*(?:PM|AM|pm|am)?\s*(?:to|-|–)\s*(\d+)\s*(PM|AM|pm|am)?/i,
      );
      if (rangeMatch) {
        const startH = parseInt(rangeMatch[1], 10);
        const endH = parseInt(rangeMatch[2], 10);
        const suffix = rangeMatch[3] || "";
        const fmtH = (h: number) => {
          const ampm = h >= 12 && h < 24 ? "PM" : "AM";
          return `${h % 12 || 12}${ampm}`;
        };
        return suffix
          ? `${startH % 12 || 12}-${endH % 12 || 12} ${suffix.toUpperCase()}`
          : `${fmtH(startH)}-${fmtH(endH)}`;
      }
      // Single hour like "14", "14:00"
      const numMatch = str.match(/^(\d+)/);
      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        if (!isNaN(num) && num >= 0 && num <= 24) {
          const ampm = num >= 12 && num < 24 ? "PM" : "AM";
          const h = num % 12 || 12;
          return `${h} ${ampm}`;
        }
      }
      return toTitleCase(str);
    }

    // ── "sales" period ──
    // Map known API shorthands to clean, readable labels
    const labelsMap: Record<string, string> = {
      ret: "Retail",
      can: "Cancelled",
      com: "Complimentary",
      tot: "Total",
      "cancel bills": "Cancel Bills",
      "compliment bills": "Complimentary",
      "complimentary bills": "Complimentary",
      "whole sales vendor": "Wholesale",
      "wholesale vendor": "Wholesale",
      "whole sales": "Wholesale",
      wholesale: "Wholesale",
    };

    const lowerStr = str.toLowerCase().trim();
    if (labelsMap[lowerStr]) return labelsMap[lowerStr];

    // Day name mappings
    const daysMap: Record<string, string> = {
      sunday: "Sun",
      monday: "Mon",
      tuesday: "Tue",
      wednesday: "Wed",
      thursday: "Thu",
      friday: "Fri",
      saturday: "Sat",
    };
    if (daysMap[lowerStr]) return daysMap[lowerStr];

    // Fallback: apply Title Case to any unrecognized label
    return toTitleCase(str);
  };

  /** Convert a string to Title Case: capitalize the first letter of each word */
  const toTitleCase = (s: string) =>
    s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  // For sales/overview, exclude the "Total" entry (it's shown in the gauge card)
  const rawData = period === "sales" ? salesData || [] : hourlyData || [];
  const activeData =
    period === "sales"
      ? rawData.filter(
          (d: any) => (d.hours || "").trim().toLowerCase() !== "total",
        )
      : rawData;
  const hasData = activeData.length > 0;
  const chartData = hasData
    ? activeData.map((d: any) => ({
        label: formatXLabel(d.hours, period),
        value: d.paidAmount || 0,
      }))
    : [];

  let maxVal = hasData ? Math.max(...chartData.map((d) => d.value)) : 0;
  if (maxVal === 0) maxVal = 1;

  const total = chartData.reduce((sum, d) => sum + d.value, 0);
  const dataPointCount = activeData.length;
  const summary = {
    total: `₹${total.toLocaleString()}`,
    change:
      dataPointCount > 0
        ? `${dataPointCount} ${period === "hourly" ? "hours" : "entries"}`
        : "No data",
    up: total > 0,
  };

  const emptyMessage =
    period === "hourly"
      ? "No hourly sales data available"
      : "No sales data available for this period";

  const chartH = hp(200);
  const ySteps = 4;
  const yLabels = Array.from(
    { length: ySteps + 1 },
    (_, i) => (maxVal / ySteps) * (ySteps - i),
  );

  // Derive bar sizes from measured width
  const barGap = areaWidth > 0 ? areaWidth * 0.03 : wp(6);
  const barWidth =
    areaWidth > 0
      ? (areaWidth - barGap * (chartData.length + 1)) / chartData.length
      : 0;

  return (
    <Card>
      <SectionHeader
        title="Sales Overview"
        rightElement={
          <View
            style={[s.chartPillsContainer, { backgroundColor: colors.cardAlt }]}
          >
            {(["sales", "hourly"] as const).map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                activeOpacity={0.7}
                style={[
                  s.chartPill,
                  period === p
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: "transparent" },
                ]}
              >
                <Text
                  style={[
                    s.chartPillText,
                    { color: period === p ? "#FFFFFF" : colors.textTertiary },
                  ]}
                >
                  {p === "sales" ? "Overview" : "Hourly"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        }
      />

      {/* Total */}
      <View style={s.chartTotalRow}>
        <Text style={[s.chartTotalValue, { color: colors.textPrimary }]}>
          {summary.total}
        </Text>
        <View
          style={[
            s.chartTotalBadge,
            { backgroundColor: summary.up ? colors.greenBg : colors.redBg },
          ]}
        >
          <Feather
            name={summary.up ? "trending-up" : "trending-down"}
            size={ms(12)}
            color={summary.up ? colors.green : colors.red}
          />
          <Text
            style={[
              s.chartTotalBadgeText,
              { color: summary.up ? colors.green : colors.red },
            ]}
          >
            {summary.change}
          </Text>
        </View>
      </View>

      {/* Chart */}
      {hasData ? (
        <View style={s.chartContainer}>
          {/* Y axis labels */}
          <View style={[s.yAxis, { height: chartH }]}>
            {yLabels.map((v, i) => (
              <Text key={i} style={[s.yLabel, { color: colors.textTertiary }]}>
                {v >= 1000
                  ? `₹${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}K`
                  : `₹${Math.round(v)}`}
              </Text>
            ))}
          </View>

          {/* Chart area — measure actual width */}
          <View
            style={{ flex: 1 }}
            onLayout={(e: LayoutChangeEvent) =>
              setAreaWidth(e.nativeEvent.layout.width)
            }
          >
            {areaWidth > 0 && (
              <>
                {/* Grid lines */}
                <View style={[s.chartGridArea, { height: chartH }]}>
                  {yLabels.map((_, i) => (
                    <View
                      key={i}
                      style={[s.gridLine, { backgroundColor: colors.border }]}
                    />
                  ))}
                </View>

                {/* Area Line Chart (Overview) or Bar Chart (Hourly) */}
                {period === "sales" ? (
                  <>
                    {/* ── Smooth Area Line Chart with integrated X labels ── */}
                    {(() => {
                      const pad = wp(16);
                      const innerW = areaWidth - pad * 2;
                      const topPad = hp(8);
                      const bottomPad = hp(30);
                      const innerH = chartH - topPad - bottomPad;
                      const stepX =
                        chartData.length > 1
                          ? innerW / (chartData.length - 1)
                          : 0;

                      // Build bezier-curved path
                      const pts = chartData.map((d, i) => ({
                        x: pad + i * stepX,
                        y: topPad + (1 - d.value / maxVal) * innerH,
                      }));

                      let linePath = `M ${pts[0].x} ${pts[0].y}`;
                      for (let i = 1; i < pts.length; i++) {
                        const prev = pts[i - 1];
                        const curr = pts[i];
                        const cpx1 = prev.x + stepX * 0.4;
                        const cpx2 = curr.x - stepX * 0.4;
                        linePath += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
                      }

                      // Area fill stops above X labels
                      const areaBottom = topPad + innerH;
                      const areaLinePath = `${linePath} L ${pts[pts.length - 1].x} ${areaBottom} L ${pts[0].x} ${areaBottom} Z`;

                      return (
                        <Svg
                          width={areaWidth}
                          height={chartH}
                          style={{ position: "absolute" }}
                        >
                          <Defs>
                            <LinearGradient
                              id="areaGrad"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <Stop
                                offset="0"
                                stopColor={colors.primary}
                                stopOpacity="0.25"
                              />
                              <Stop
                                offset="0.7"
                                stopColor={colors.primary}
                                stopOpacity="0.08"
                              />
                              <Stop
                                offset="1"
                                stopColor={colors.primary}
                                stopOpacity="0"
                              />
                            </LinearGradient>
                            <LinearGradient
                              id="lineGrad"
                              x1="0"
                              y1="0"
                              x2="1"
                              y2="0"
                            >
                              <Stop
                                offset="0"
                                stopColor={colors.blue}
                                stopOpacity="1"
                              />
                              <Stop
                                offset="1"
                                stopColor={colors.primary}
                                stopOpacity="1"
                              />
                            </LinearGradient>
                          </Defs>
                          {/* Gradient area fill */}
                          <Path d={areaLinePath} fill="url(#areaGrad)" />
                          {/* Smooth curve line */}
                          <Path
                            d={linePath}
                            fill="none"
                            stroke="url(#lineGrad)"
                            strokeWidth={2.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {/* Data point dots */}
                          {pts.map((p, i) => (
                            <G key={`dot-${i}`}>
                              <Circle
                                cx={p.x}
                                cy={p.y}
                                r={wp(5)}
                                fill={colors.card}
                                stroke={colors.primary}
                                strokeWidth={2}
                              />
                              <Circle
                                cx={p.x}
                                cy={p.y}
                                r={wp(2)}
                                fill={colors.primary}
                              />
                            </G>
                          ))}
                        </Svg>
                      );
                    })()}
                    {/* X-axis labels — fixed responsive layout */}
                    {(() => {
                      const pad = wp(16);
                      const innerW = areaWidth - pad * 2;
                      const stepX =
                        chartData.length > 1
                          ? innerW / (chartData.length - 1)
                          : 0;

                      return (
                        <View
                          style={{
                            width: areaWidth,
                            paddingTop: hp(8),
                            paddingBottom: hp(6),
                            height: hp(30),
                          }}
                        >
                          {chartData.map((d, i) => {
                            const maxLabels = 6;

                            const skipN =
                              chartData.length > maxLabels
                                ? Math.ceil(chartData.length / maxLabels)
                                : 1;

                            const showLabel =
                              chartData.length <= maxLabels ||
                              i % skipN === 0 ||
                              i === chartData.length - 1;

                            const xPos = pad + i * stepX;

                            const labelW = wp(72); // increased width for long labels

                            return (
                              <View
                                key={`xl-${i}`}
                                style={{
                                  position: "absolute",
                                  left: xPos - labelW / 2,
                                  width: labelW,
                                  alignItems: "center",
                                }}
                              >
                                {showLabel && (
                                  <Text
                                    style={[
                                      s.xLabel,
                                      {
                                        color: colors.textTertiary,
                                        fontSize: ms(8.5),
                                        textAlign: "center",
                                      },
                                    ]}
                                    numberOfLines={1} // prevent wrapping
                                    ellipsizeMode="tail"
                                  >
                                    {d.label}
                                  </Text>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      );
                    })()}
                  </>
                ) : (
                  <>
                    {/* ── Rounded Bar Chart (Hourly) ── */}
                    <Svg
                      width={areaWidth}
                      height={chartH}
                      style={{ position: "absolute" }}
                    >
                      <Defs>
                        <LinearGradient
                          id="barGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <Stop
                            offset="0"
                            stopColor={colors.primary}
                            stopOpacity="1"
                          />
                          <Stop
                            offset="1"
                            stopColor={colors.primary}
                            stopOpacity="0.4"
                          />
                        </LinearGradient>
                      </Defs>
                      {chartData.map((d, i) => {
                        const barH = (d.value / maxVal) * (chartH - hp(24));
                        const x = barGap + i * (barWidth + barGap);
                        const y = chartH - barH;
                        const radius = Math.min(barWidth / 2, wp(8));

                        const barPath = [
                          `M ${x} ${chartH}`,
                          `L ${x} ${y + radius}`,
                          `Q ${x} ${y}, ${x + radius} ${y}`,
                          `L ${x + barWidth - radius} ${y}`,
                          `Q ${x + barWidth} ${y}, ${x + barWidth} ${y + radius}`,
                          `L ${x + barWidth} ${chartH}`,
                          `Z`,
                        ].join(" ");

                        return (
                          <Path key={i} d={barPath} fill="url(#barGrad)" />
                        );
                      })}
                    </Svg>

                    {/* Value labels above bars */}
                    <View style={[s.barValueLabels, { height: chartH }]}>
                      {chartData.map((d, i) => {
                        const barH = (d.value / maxVal) * (chartH - hp(24));
                        return (
                          <View
                            key={i}
                            style={[
                              s.barValueWrap,
                              {
                                left: barGap + i * (barWidth + barGap),
                                width: barWidth,
                                bottom: barH + hp(4),
                              },
                            ]}
                          >
                            <Text
                              style={[
                                s.barValueText,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {d.value >= 1000
                                ? `${(d.value / 1000).toFixed(1)}k`
                                : d.value}
                            </Text>
                          </View>
                        );
                      })}
                    </View>

                    {/* X labels — skip some when many bars to prevent overlap */}
                    <View style={s.xAxis}>
                      {chartData.map((d, i) => {
                        const maxVisibleLabels = Math.max(
                          Math.floor(areaWidth / wp(50)),
                          6,
                        );
                        const skipEvery =
                          chartData.length > maxVisibleLabels
                            ? Math.ceil(chartData.length / maxVisibleLabels)
                            : 1;
                        const showLabel =
                          chartData.length <= maxVisibleLabels ||
                          i % skipEvery === 0 ||
                          i === chartData.length - 1;

                        return (
                          <View
                            key={i}
                            style={{
                              width: barWidth + barGap,
                              alignItems: "center",
                              justifyContent: "flex-start",
                              paddingTop: hp(4),
                            }}
                          >
                            {showLabel ? (
                              <Text
                                style={[
                                  s.xLabel,
                                  { color: colors.textTertiary },
                                ]}
                                numberOfLines={2}
                                adjustsFontSizeToFit
                                minimumFontScale={0.75}
                              >
                                {d.label}
                              </Text>
                            ) : null}
                          </View>
                        );
                      })}
                    </View>
                  </>
                )}
              </>
            )}
          </View>
        </View>
      ) : (
        <View style={{ paddingVertical: hp(40), alignItems: "center" }}>
          <Feather
            name="bar-chart-2"
            size={ms(40)}
            color={colors.textTertiary}
            style={{ marginBottom: hp(12), opacity: 0.4 }}
          />
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: ms(14),
              fontWeight: "500",
              textAlign: "center",
            }}
          >
            {emptyMessage}
          </Text>
        </View>
      )}
    </Card>
  );
}

// ─── Payment Pie Chart (Modern) ────────────────────────────
const PIE_DONUT_SIZE = 150;
const PIE_STROKE_W = 22;

const PAYMENT_ICONS: Record<string, string> = {
  Cash: "cash-outline",
  Card: "card-outline",
  Wallet: "wallet-outline",
  Due: "time-outline",
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`,
  ].join(" ");
}

function PaymentDonutSection({ data }: { data: any[] }) {
  const { colors } = useTheme();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <Card>
        <SectionHeader title="Payment Breakdown" />
        <View style={{ padding: 20, alignItems: "center" }}>
          <Text style={{ color: colors.textSecondary }}>
            No payment data available
          </Text>
        </View>
      </Card>
    );
  }

  const size = wp(PIE_DONUT_SIZE);
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - wp(PIE_STROKE_W)) / 2;
  const strokeW = wp(PIE_STROKE_W);

  const total = data.reduce((sum, d) => sum + (d.paidAmount || 0), 0);

  const mappedData = data.map((d, i) => {
    const colorKeys = ["green", "blue", "purple", "orange", "red"] as const;
    const colorKey = colorKeys[i % colorKeys.length];
    const pct = total > 0 ? (d.paidAmount || 0) / total : 0;
    return {
      label: d.payMode || "Unknown",
      amount: `₹${(d.paidAmount || 0).toLocaleString()}`,
      rawAmount: d.paidAmount || 0,
      pct,
      colorKey,
    };
  });

  // Build arcs
  let currentAngle = 0;
  const arcs = mappedData.map((p, _i) => {
    const sweep = p.pct * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sweep;
    currentAngle = endAngle;
    return {
      ...p,
      startAngle,
      endAngle,
      path: describeArc(cx, cy, r, startAngle, endAngle - 0.5),
    };
  });

  const selectedItem = selectedIdx !== null ? mappedData[selectedIdx] : null;

  return (
    <Card>
      <SectionHeader title="Payment Breakdown" />

      <View style={s.paymentLayout}>
        {/* Pie Chart */}
        <View style={s.pieContainer}>
          <Svg width={size} height={size}>
            {/* Background track */}
            <Circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={colors.border}
              strokeWidth={strokeW}
              opacity={0.15}
            />
            {/* Segments */}
            {arcs.map((arc, i) => (
              <Path
                key={i}
                d={arc.path}
                fill="none"
                stroke={colors[arc.colorKey]}
                strokeWidth={selectedIdx === i ? strokeW + wp(4) : strokeW}
                strokeLinecap="round"
                opacity={selectedIdx !== null && selectedIdx !== i ? 0.3 : 1}
                onPress={() => setSelectedIdx(selectedIdx === i ? null : i)}
              />
            ))}
          </Svg>
          {/* Center label */}
          <View style={[s.pieCenterLabel, { width: size, height: size }]}>
            {selectedItem ? (
              <>
                <Text
                  style={[
                    s.pieCenterValue,
                    { color: colors[selectedItem.colorKey] },
                  ]}
                >
                  {selectedItem.amount}
                </Text>
                <Text style={[s.pieCenterSub, { color: colors.textTertiary }]}>
                  {selectedItem.label}
                </Text>
              </>
            ) : (
              <>
                <Text style={[s.pieCenterValue, { color: colors.textPrimary }]}>
                  ₹{total.toLocaleString()}
                </Text>
                <Text style={[s.pieCenterSub, { color: colors.textTertiary }]}>
                  Total
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Legend */}
        <View style={s.paymentLegend}>
          {mappedData.map((p, i) => (
            <Pressable
              key={i}
              onPress={() => setSelectedIdx(selectedIdx === i ? null : i)}
              style={[
                s.payLegendRow,
                selectedIdx === i && {
                  backgroundColor: colors[p.colorKey] + "10",
                  borderRadius: wp(12),
                },
              ]}
            >
              <View
                style={[
                  s.payIconBubble,
                  { backgroundColor: colors[p.colorKey] + "18" },
                ]}
              >
                <Ionicons
                  name={"card-outline" as any}
                  size={ms(16)}
                  color={colors[p.colorKey]}
                />
              </View>
              <View style={s.payLegendText}>
                <Text
                  style={[s.payLegendLabel, { color: colors.textSecondary }]}
                >
                  {p.label}
                </Text>
                <Text
                  style={[s.payLegendAmount, { color: colors.textPrimary }]}
                >
                  {p.amount}
                </Text>
              </View>
              <View style={s.payLegendRight}>
                <Text style={[s.payLegendPct, { color: colors[p.colorKey] }]}>
                  {Math.round(p.pct * 100)}%
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </Card>
  );
}

// ─── Taxes Summary ──────────────────────────────────────────────
function TaxSummarySection({ data }: { data: any[] }) {
  const { colors } = useTheme();

  if (!data) {
    return (
      <Card>
        <SectionHeader title="Taxes Summary" />
        <View style={{ padding: hp(20), alignItems: "center" }}>
          <Text style={{ color: colors.textSecondary }}>
            Taxes data unavailable
          </Text>
        </View>
      </Card>
    );
  }

  if (data.length === 0) return null;

  return (
    <Card>
      <SectionHeader title="Taxes Summary" />
      <View style={{ gap: hp(16), marginTop: hp(10) }}>
        {data.map((tax, i) => {
          const isTotal = tax.taxName?.toLowerCase().includes("total");
          const isCGST = tax.taxName?.toLowerCase().includes("cgst");
          const isSGST = tax.taxName?.toLowerCase().includes("sgst");

          let iconName = "file-text";
          let iconColor = colors.textSecondary;
          let iconBg = colors.cardAlt;

          if (isTotal) {
            iconName = "pie-chart";
            iconColor = "#FFF";
            iconBg = colors.primary;
          } else if (isCGST) {
            iconName = "file";
            iconColor = colors.blue;
            iconBg = colors.blue + "15";
          } else if (isSGST) {
            iconName = "file-text";
            iconColor = "#8B5CF6"; // subtle purple
            iconBg = "#8B5CF615";
          }

          const value = tax.taxValue || 0;
          const isZero = value === 0;

          return (
            <View key={i}>
              {/* Divider above Total Tax row */}
              {isTotal && i > 0 && (
                <View
                  style={{
                    height: StyleSheet.hairlineWidth,
                    backgroundColor: colors.border,
                    marginBottom: hp(16),
                    marginTop: hp(4),
                  }}
                />
              )}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: ms(36),
                      height: ms(36),
                      borderRadius: ms(10),
                      backgroundColor: iconBg,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: wp(12),
                    }}
                  >
                    <Feather
                      name={iconName as any}
                      size={ms(18)}
                      color={iconColor}
                    />
                  </View>
                  <Text
                    style={{
                      color: isTotal
                        ? colors.textPrimary
                        : colors.textSecondary,
                      fontSize: ms(15),
                      fontWeight: isTotal ? "bold" : "500",
                    }}
                  >
                    {tax.taxName || "Unknown Tax"}
                  </Text>
                </View>
                <Text
                  style={{
                    color: isZero
                      ? colors.textTertiary
                      : isTotal
                        ? colors.primary
                        : colors.textPrimary,
                    fontSize: isTotal ? ms(16) : ms(14),
                    fontWeight: isTotal ? "bold" : "600",
                  }}
                >
                  ₹
                  {value.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

// ─── Revenue Leakage ────────────────────────────────────────
function RevenueLeakage({ data }: { data: any }) {
  const { colors } = useTheme();

  if (!data) return null;

  const leakageData = [
    {
      label: "Cancelled Bills",
      value: data.cancelBills || 0,
      icon: "close-circle-outline",
    },
    {
      label: "Compliment Bills",
      value: data.complimentaryBills || data.complimentBills || 0,
      icon: "gift-outline",
    },
    {
      label: "Reprint Bills",
      value: data.reprintBills || data.rePrintBills || 0,
      icon: "printer-outline",
    },
    {
      label: "Modified Bills",
      value: data.modifiedBills || data.modifedBills || 0,
      icon: "file-document-edit-outline",
    },
    {
      label: "Cancelled KOT",
      value: data.cancelledKOT || data.cancelKOT || 0,
      icon: "alert-circle-outline",
    },
    {
      label: "Deleted KOT",
      value: data.deletedKOT || data.deleteKOT || 0,
      icon: "trash-can-outline",
    },
  ];

  return (
    <Card>
      <SectionHeader
        title="Revenue Leakage"
        rightElement={
          <View style={[s.leakageBadge, { backgroundColor: colors.redBg }]}>
            <Feather name="alert-triangle" size={ms(12)} color={colors.red} />
            <Text style={[s.leakageBadgeText, { color: colors.red }]}>
              Attention
            </Text>
          </View>
        }
      />
      <View style={s.leakageGrid}>
        {leakageData.map((l, i) => (
          <View key={i} style={[s.leakageCard, { backgroundColor: colors.bg }]}>
            <View
              style={[s.leakageIconWrap, { backgroundColor: colors.redBg }]}
            >
              <MaterialCommunityIcons
                name={l.icon as any}
                size={ms(20)}
                color={colors.accent}
              />
            </View>
            <Text style={[s.leakageValue, { color: colors.textPrimary }]}>
              {l.value}
            </Text>
            <Text style={[s.leakageLabel, { color: colors.textSecondary }]}>
              {l.label}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

// ─── Expenses (Horizontal Stacked Bar) ──────────────────────
function ExpensesSection({ data }: { data: any[] }) {
  const { colors } = useTheme();

  if (!data || data.length === 0) {
    return (
      <Card>
        <SectionHeader title="Expenses" />
        <View style={{ padding: 20, alignItems: "center" }}>
          <Text style={{ color: colors.textSecondary }}>
            No expense data available
          </Text>
        </View>
      </Card>
    );
  }

  const total = data.reduce((sum, e) => sum + (e.expenseAmount || 0), 0);
  const mappedData = data.map((e, i) => {
    const colorKeys = [
      "primary",
      "orange",
      "teal",
      "textTertiary",
      "red",
      "blue",
    ] as const;
    const colorKey = colorKeys[i % colorKeys.length];
    return {
      label: e.categoryName || "Unknown",
      amount: `₹${(e.expenseAmount || 0).toLocaleString()}`,
      pct: total > 0 ? (e.expenseAmount || 0) / total : 0,
      colorKey,
    };
  });

  return (
    <Card>
      <SectionHeader
        title="Expenses"
        rightElement={
          <Text style={[s.expenseTotal, { color: colors.accent }]}>
            ₹{total.toLocaleString()}
          </Text>
        }
      />
      {/* Stacked bar */}
      <View style={[s.stackedBar, { backgroundColor: colors.border }]}>
        {mappedData.map((e, i) => (
          <View
            key={i}
            style={[
              s.stackedSegment,
              {
                width: `${e.pct * 100}%`,
                backgroundColor: colors[e.colorKey],
              },
              i === 0 && {
                borderTopLeftRadius: wp(6),
                borderBottomLeftRadius: wp(6),
              },
              i === mappedData.length - 1 && {
                borderTopRightRadius: wp(6),
                borderBottomRightRadius: wp(6),
              },
            ]}
          />
        ))}
      </View>
      {/* Legend */}
      <View style={s.expenseLegendGrid}>
        {mappedData.map((e, i) => (
          <View key={i} style={s.expenseLegendItem}>
            <View style={s.expenseLegendRow}>
              <View
                style={[s.legendDot, { backgroundColor: colors[e.colorKey] }]}
              />
              <Text
                style={[s.expenseLegendLabel, { color: colors.textSecondary }]}
              >
                {e.label}
              </Text>
            </View>
            <Text style={[s.expenseLegendAmt, { color: colors.textPrimary }]}>
              {e.amount}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}



// ─── Item Ranking Section (Accordion) ──────────────────────
type RankItem = {
  name: string;
  primary: string;
  secondary: string;
  pct: number;
};
type AccentKey = "green" | "blue" | "red" | "orange";
const ACCENT_BG_KEY: Record<AccentKey, keyof ThemeColors> = {
  green: "greenBg",
  blue: "blueBg",
  red: "redBg",
  orange: "orangeBg",
};

function ItemRankingSection({
  title,
  icon,
  accentColor,
  data,
  primaryLabel,
  secondaryLabel,
}: {
  title: string;
  icon: string;
  accentColor: AccentKey;
  data: RankItem[];
  primaryLabel: string;
  secondaryLabel: string;
}) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const chevronRotation = useSharedValue(0);

  const accent = colors[accentColor];
  const accentBg = colors[ACCENT_BG_KEY[accentColor]];

  const toggleExpand = useCallback(() => {
    setExpanded((prev) => !prev);
    chevronRotation.value = withTiming(expanded ? 0 : 1, { duration: 300 });
  }, [expanded, chevronRotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value * 180}deg` }],
  }));

  return (
    <Card>
      {/* Accordion Header */}
      <Pressable onPress={toggleExpand} style={s.irHeaderRow}>
        <View style={[s.irIconWrap, { backgroundColor: accentBg }]}>
          <Feather name={icon as any} size={ms(18)} color={accent} />
        </View>
        <View style={s.irHeaderText}>
          <Text style={[s.irTitle, { color: colors.textPrimary }]}>
            {title}
          </Text>
          <Text style={[s.irSubtitle, { color: colors.textTertiary }]}>
            {data.length} items
          </Text>
        </View>
        <Animated.View style={chevronStyle}>
          <Feather
            name="chevron-down"
            size={ms(20)}
            color={colors.textTertiary}
          />
        </Animated.View>
      </Pressable>

      {/* Collapsible Content */}
      {expanded && (
        <>
          {/* Column header */}
          <View style={[s.irColHeader, { borderBottomColor: colors.border }]}>
            <Text
              style={[s.irColLabel, { color: colors.textTertiary, flex: 1 }]}
            >
              Item
            </Text>
            <Text
              style={[
                s.irColLabel,
                {
                  color: colors.textTertiary,
                  width: wp(70),
                  textAlign: "right",
                },
              ]}
            >
              {primaryLabel}
            </Text>
            <Text
              style={[
                s.irColLabel,
                {
                  color: colors.textTertiary,
                  width: wp(60),
                  textAlign: "right",
                },
              ]}
            >
              {secondaryLabel}
            </Text>
          </View>

          {/* Item rows */}
          {data.map((item, i) => {
            const isTop3 = i < 3;
            return (
              <View
                key={i}
                style={[
                  s.irItemRow,
                  i < data.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                {/* Rank */}
                <View
                  style={[
                    s.irRank,
                    {
                      backgroundColor: isTop3 ? accentBg : colors.cardAlt,
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.irRankText,
                      { color: isTop3 ? accent : colors.textTertiary },
                    ]}
                  >
                    {i + 1}
                  </Text>
                </View>

                {/* Name + bar */}
                <View style={s.irItemContent}>
                  <Text
                    style={[s.irItemName, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <View style={[s.irBarBg, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        s.irBarFill,
                        {
                          width: `${Math.max(item.pct * 100, 4)}%`,
                          backgroundColor: isTop3 ? accent : accent + "50",
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Primary metric */}
                <Text style={[s.irPrimaryVal, { color: colors.textPrimary }]}>
                  {item.primary}
                </Text>

                {/* Secondary metric */}
                <Text
                  style={[s.irSecondaryVal, { color: colors.textTertiary }]}
                >
                  {item.secondary}
                </Text>
              </View>
            );
          })}
        </>
      )}
    </Card>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const s = StyleSheet.create({
  // Premium Total Sales Gauge Card
  premiumCardOverride: {
    padding: wp(16),
  },
  premiumCardContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeHeaderRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: hp(12),
  },
  premiumTitleGauge: {
    fontSize: ms(16),
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  gaugeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(10),
    paddingVertical: hp(5),
    borderRadius: wp(20),
    gap: wp(4),
  },
  gaugeBadgeText: {
    fontSize: ms(12),
    fontWeight: "700",
  },
  premiumAmount: {
    fontSize: ms(38),
    fontWeight: "800",
    letterSpacing: -1.2,
    alignSelf: "flex-start",
  },
  premiumSubLabel: {
    fontSize: ms(13),
    fontWeight: "500",
    alignSelf: "flex-start",
    marginBottom: hp(8),
  },
  gaugeSVGWrapper: {
    alignItems: "center",
    width: "100%",
    marginTop: hp(4),
    marginBottom: hp(-8),
  },
  gaugeBottomRow: {
    alignItems: "center",
    marginBottom: hp(4),
    marginTop: hp(4),
  },
  gaugePctText: {
    fontSize: ms(32),
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  gaugeAchievedText: {
    fontSize: ms(14),
    fontWeight: "600",
    marginTop: hp(2),
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: hp(12),
  },
  headerIcon: {
    width: wp(42),
    height: wp(42),
    borderRadius: wp(12),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  branchSelector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(16),
    paddingVertical: hp(10),
    marginHorizontal: wp(10),
    borderRadius: wp(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  branchText: {
    fontSize: ms(15),
    fontWeight: "600",
    flex: 1,
    paddingRight: wp(6),
  },
  notifDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
  },

  // Modal & Dropdown
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: wp(24),
  },
  dropdownContent: {
    width: "100%",
    maxHeight: hp(400),
    borderRadius: wp(16),
    padding: wp(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 4,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(12),
    paddingBottom: hp(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  dropdownTitle: {
    fontSize: ms(16),
    fontWeight: "700",
  },
  noDataText: {
    fontSize: ms(14),
    textAlign: "center",
    paddingVertical: hp(20),
  },
  dropdownCloseBtn: {
    padding: ms(4),
  },
  branchOptionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: hp(16),
    paddingHorizontal: wp(16),
    borderRadius: wp(12),
    marginBottom: hp(4),
  },
  branchOptionText: {
    fontSize: ms(15),
    flex: 1,
  },

  // Greeting
  greetingContainer: { marginTop: hp(16), marginBottom: hp(12) },
  greetingTitle: { fontSize: ms(24), fontWeight: "700", letterSpacing: -0.3 },
  greetingSubtitle: { fontSize: ms(14), marginTop: hp(6) },

  // (Date Filter styles are now inside DateRangePicker component)

  // KPI
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: wp(16),
    marginTop: hp(8),
    marginBottom: hp(4),
  },
  kpiCardWidth: {
    width: "47%",
    flexGrow: 1,
    maxWidth: "48.5%",
  },
  kpiTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(10),
  },
  animatedKpiCard: {
    padding: wp(16),
    borderRadius: wp(20),
    minHeight: hp(160),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  kpiIconWrap: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(12),
    justifyContent: "center",
    alignItems: "center",
  },
  kpiBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(6),
    paddingVertical: hp(4),
    borderRadius: wp(8),
    gap: wp(2),
  },
  kpiBadgeText: { fontSize: ms(11), fontWeight: "700" },
  kpiContentWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: hp(12),
    flex: 1,
  },
  kpiTextWrap: {
    flex: 1,
    marginRight: wp(6),
  },
  kpiTitle: { fontSize: ms(13), fontWeight: "600", marginBottom: hp(2) },
  kpiValue: { fontSize: ms(22), fontWeight: "800", letterSpacing: -0.5 },
  sparklineWrap: {
    alignItems: "flex-end",
    justifyContent: "flex-end",
    paddingBottom: hp(2),
  },

  // Sales Chart
  chartPillsContainer: {
    flexDirection: "row",
    borderRadius: wp(10),
    padding: wp(3),
  },
  chartPill: {
    paddingHorizontal: wp(14),
    paddingVertical: hp(6),
    borderRadius: wp(8),
  },
  chartPillText: { fontSize: ms(11), fontWeight: "700" },
  chartTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: hp(14),
    gap: wp(10),
  },
  chartTotalValue: { fontSize: ms(28), fontWeight: "800", letterSpacing: -0.5 },
  chartTotalBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(8),
    paddingVertical: hp(4),
    borderRadius: wp(8),
    gap: wp(4),
  },
  chartTotalBadgeText: { fontSize: ms(12), fontWeight: "700" },
  chartContainer: {
    flexDirection: "row",
    marginTop: hp(24),
    marginBottom: hp(8),
    marginHorizontal: hp(8),
  },
  yAxis: {
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginRight: wp(12),
    paddingBottom: hp(40), // reserve space for multiline x-axis labels
  },
  yLabel: { fontSize: ms(10), fontWeight: "600" },
  chartGridArea: {
    justifyContent: "space-between",
  },
  gridLine: { height: StyleSheet.hairlineWidth, opacity: 0.3 },
  barValueLabels: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  barValueWrap: {
    position: "absolute",
    alignItems: "center",
  },
  barValueText: {
    fontSize: ms(9),
    fontWeight: "700",
  },
  xAxis: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: hp(8),
    paddingLeft: wp(4),
  },
  xLabel: {
    fontSize: ms(11),
    fontWeight: "600",
    textAlign: "center",
    lineHeight: ms(15),
  },

  // Payment Breakdown
  paymentLayout: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: hp(16),
    gap: wp(12),
  },
  pieContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  pieCenterLabel: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  pieCenterValue: {
    fontSize: ms(18),
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  pieCenterSub: {
    fontSize: ms(10),
    fontWeight: "600",
    marginTop: hp(1),
  },
  paymentLegend: {
    flex: 1,
    gap: hp(4),
  },
  payLegendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(8),
    paddingHorizontal: wp(6),
  },
  payIconBubble: {
    width: wp(32),
    height: wp(32),
    borderRadius: wp(10),
    justifyContent: "center",
    alignItems: "center",
  },
  payLegendText: {
    flex: 1,
    marginLeft: wp(10),
  },
  payLegendLabel: {
    fontSize: ms(12),
    fontWeight: "500",
  },
  payLegendAmount: {
    fontSize: ms(14),
    fontWeight: "700",
    marginTop: hp(1),
  },
  payLegendRight: {
    paddingLeft: wp(8),
  },
  payLegendPct: {
    fontSize: ms(13),
    fontWeight: "700",
  },

  // Order Types
  otStackedBar: {
    flexDirection: "row",
    height: hp(10),
    borderRadius: wp(6),
    overflow: "hidden",
    marginTop: hp(18),
    gap: wp(3),
  },
  otStackedSeg: {
    height: "100%",
  },
  otCardsRow: {
    flexDirection: "row",
    gap: wp(10),
    marginTop: hp(16),
  },
  otCard: {
    flex: 1,
    borderRadius: wp(16),
    padding: wp(12),
    alignItems: "center",
  },
  otCardIcon: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(12),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: hp(8),
  },
  otCardLabel: {
    fontSize: ms(13),
    fontWeight: "700",
    marginBottom: hp(2),
  },
  otCardOrders: {
    fontSize: ms(11),
    fontWeight: "500",
    marginBottom: hp(6),
  },
  otCardSales: {
    fontSize: ms(15),
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: hp(8),
  },
  otPctBadge: {
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(8),
  },
  otPctText: {
    fontSize: ms(12),
    fontWeight: "700",
  },
  otTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: hp(14),
    paddingTop: hp(14),
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  otTotalLabel: {
    fontSize: ms(13),
    fontWeight: "500",
  },
  otTotalValue: {
    fontSize: ms(16),
    fontWeight: "800",
  },

  // Revenue Leakage
  leakageBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(8),
    gap: wp(4),
  },
  leakageBadgeText: { fontSize: ms(11), fontWeight: "600" },
  leakageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: hp(16),
    gap: wp(10),
  },
  leakageCard: {
    width: "30%",
    borderRadius: wp(12),
    padding: wp(12),
    alignItems: "center",
  },
  leakageIconWrap: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(10),
    justifyContent: "center",
    alignItems: "center",
  },
  leakageValue: { fontSize: ms(18), fontWeight: "700", marginTop: hp(6) },
  leakageLabel: {
    fontSize: ms(10),
    textAlign: "center",
    marginTop: hp(4),
    fontWeight: "500",
  },

  // Expenses
  expenseTotal: { fontSize: ms(16), fontWeight: "700" },
  stackedBar: {
    flexDirection: "row",
    height: hp(14),
    borderRadius: wp(7),
    marginTop: hp(16),
    overflow: "hidden",
  },
  stackedSegment: {
    height: "100%",
  },
  expenseLegendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: hp(14),
    gap: wp(6),
  },
  expenseLegendItem: {
    width: "47%",
    marginBottom: hp(4),
  },
  expenseLegendRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
  },
  expenseLegendLabel: {
    fontSize: ms(12),
    fontWeight: "500",
    marginLeft: wp(4),
  },
  expenseLegendAmt: {
    fontSize: ms(14),
    fontWeight: "700",
    marginTop: hp(2),
    marginLeft: wp(18),
  },


  // Item Ranking (Reusable)
  irHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(12),
  },
  irIconWrap: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(12),
    justifyContent: "center",
    alignItems: "center",
  },
  irHeaderText: {
    flex: 1,
  },
  irTitle: {
    fontSize: ms(16),
    fontWeight: "700",
  },
  irSubtitle: {
    fontSize: ms(11),
    fontWeight: "500",
    marginTop: hp(2),
  },
  irColHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(10),
    marginTop: hp(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingLeft: wp(38),
  },
  irColLabel: {
    fontSize: ms(10),
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  irItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(10),
  },
  irRank: {
    width: wp(26),
    height: wp(26),
    borderRadius: wp(8),
    justifyContent: "center",
    alignItems: "center",
  },
  irRankText: {
    fontSize: ms(11),
    fontWeight: "800",
  },
  irItemContent: {
    flex: 1,
    marginLeft: wp(10),
  },
  irItemName: {
    fontSize: ms(13),
    fontWeight: "600",
    marginBottom: hp(4),
  },
  irBarBg: {
    height: hp(4),
    borderRadius: wp(2),
    overflow: "hidden",
  },
  irBarFill: {
    height: hp(4),
    borderRadius: wp(2),
  },
  irPrimaryVal: {
    fontSize: ms(13),
    fontWeight: "700",
    width: wp(70),
    textAlign: "right",
  },
  irSecondaryVal: {
    fontSize: ms(11),
    fontWeight: "500",
    width: wp(60),
    textAlign: "right",
  },
});
