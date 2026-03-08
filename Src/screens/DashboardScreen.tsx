import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useState, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  DeviceEventEmitter,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import {
  CalendarPicker,
  Card,
  ScreenWrapper,
  SectionHeader,
} from "../components";
import type { DateRange, QuickFilter } from "../components";
import type { ThemeColors } from "../theme";
import { hp, ms, useTheme, wp } from "../theme";
import axiosInstance from "../api/axiosInstance";
import { getBranchMaster } from "../api/branchService";
import { getSalesDetails } from "../api/dashboardService";
import { useAuth } from "../context/AuthContext";

// ─── Dummy Data Removed ─────────────────────────────────────

// ─── SVG Helpers ────────────────────────────────────────────

/** Build a smooth SVG path from data points */
function buildAreaPath(
  data: number[],
  width: number,
  height: number,
  padding: number = 4,
): { linePath: string; areaPath: string } {
  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  const range = maxVal - minVal || 1;
  const stepX = (width - padding * 2) / (data.length - 1);

  const points = data.map((v, i) => ({
    x: padding + i * stepX,
    y: padding + (1 - (v - minVal) / range) * (height - padding * 2),
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
  const { colors } = useTheme();
  
  const now = new Date();
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
  });
  const [activeFilter, setActiveFilter] = useState<QuickFilter>("this_month");
  const [selectedBranch, setSelectedBranch] = useState<any | null>(null);
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!authData?.ClientID || !selectedBranch) return;

    const formatAsYMD = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const branchIdNum = 
      selectedBranch?.BranchID ||
      selectedBranch?.branchID ||
      selectedBranch?.BranchId ||
      selectedBranch?.branchId ||
      selectedBranch?.id ||
      selectedBranch?.ID ||
      0;

    const vendorIdNum =
      selectedBranch?.VendorID ||
      selectedBranch?.vendorID ||
      selectedBranch?.VendorId ||
      selectedBranch?.vendorId ||
      0;
      
    const isActive = 
      selectedBranch?.IsActive || selectedBranch?.isActive ? true : false;

    const phaseValue = selectedBranch?.Phase || selectedBranch?.phase || null;

    const payload: any = {
      startDate: formatAsYMD(dateRange.start),
      endDate: formatAsYMD(dateRange.end),
      branchID: branchIdNum,
      clientID: Number(authData?.ClientID)
    };
    
    if (phaseValue !== null && phaseValue !== "") payload.phase = phaseValue;
    if (isActive) payload.isActive = isActive;
    if (vendorIdNum) payload.vendorID = vendorIdNum;

    console.log("[DashboardScreen] Request Payload:", JSON.stringify(payload, null, 2));

    try {
      setIsLoading(true);
      setErrorMsg(null);
      const dbData = await getSalesDetails(payload);
      console.log("[DashboardScreen] Dashboard Data received:", JSON.stringify(dbData, null, 2));
      setDashboardData(dbData);
    } catch (error: any) {
      console.error("[DashboardScreen] Fetch Data Error:", error);
      setErrorMsg("Failed to load dashboard data. Please check your network connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, selectedBranch, authData?.ClientID]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleDateRangeChange = useCallback(
    (range: DateRange, filter: QuickFilter) => {
      setDateRange(range);
      setActiveFilter(filter);
    },
    [],
  );

  // Ensure arrays are typed consistently for ItemRankingSection
  const itemWiseSales = dashboardData?.dashBoardItemWiseSalesList || [];
  
  const mapItemToList = (items: any[], isQtyFirst: boolean) => 
    items.map((it: any) => ({
      name: it.productDescription || "Unknown",
      primary: isQtyFirst ? `${it.count}` : `₹${it.totalPrice?.toLocaleString() || 0}`,
      secondary: isQtyFirst ? `₹${it.totalPrice?.toLocaleString() || 0}` : `${it.count} qty`,
      pct: items.length > 0 && items[0] ? (isQtyFirst ? (it.count / Math.max(items[0].count, 1)) : (it.totalPrice / Math.max(items[0].totalPrice, 1))) : 0,
    }));

  const topBySalesRaw = [...itemWiseSales].sort((a, b) => (b.totalPrice || 0) - (a.totalPrice || 0));
  const topByQtyRaw = [...itemWiseSales].sort((a, b) => (b.count || 0) - (a.count || 0));
  const lowBySalesRaw = [...itemWiseSales].sort((a, b) => (a.totalPrice || 0) - (b.totalPrice || 0));
  const lowByQtyRaw = [...itemWiseSales].sort((a, b) => (a.count || 0) - (b.count || 0));

  return (
    <ScreenWrapper scrollable>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hp(40) }}
      >
        <Header onBranchSelected={setSelectedBranch} />
        <Greeting />
        <CalendarPicker
          dateRange={dateRange}
          activeFilter={activeFilter}
          onDateRangeChange={handleDateRangeChange}
        />
        {isLoading ? (
          <View style={{ padding: hp(40), alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: hp(12), color: colors.textSecondary }}>Fetching dashboard data...</Text>
          </View>
        ) : errorMsg ? (
          <View style={{ padding: hp(40), alignItems: 'center' }}>
            <Feather name="alert-circle" size={ms(48)} color={colors.red} style={{ marginBottom: hp(16) }} />
            <Text style={{ textAlign: 'center', color: colors.textPrimary, fontSize: ms(16), marginBottom: hp(24) }}>
              {errorMsg}
            </Text>
            <TouchableOpacity 
              style={{ backgroundColor: colors.primary, paddingHorizontal: wp(24), paddingVertical: hp(12), borderRadius: ms(8) }}
              onPress={fetchDashboardData}
            >
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : dashboardData ? (
          <>
            <KPIGrid data={dashboardData.dashBoardCount} />
            <SalesChartSection 
              salesData={dashboardData.dashBoardSalesList} 
              hourlyData={dashboardData.dashBoardHourlyList} 
            />
            <PaymentDonutSection data={dashboardData.paymentSplitupList} />
            <RevenueLeakage data={dashboardData.dashBoardCount} />
            <TaxSummarySection data={dashboardData.dashBoardTaxList} />
            <ExpensesSection data={dashboardData.expensessDashBoardList} />
            <TopSellingSection data={topBySalesRaw} />
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

// ─── Header ─────────────────────────────────────────────────
function Header({ onBranchSelected }: { onBranchSelected?: (branch: any) => void }) {
  const { colors } = useTheme();
  const { authData } = useAuth();
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<any | null>(null);
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, [authData.ClientID]);

  const fetchBranches = async () => {
    try {
      setLoading(true);

      console.log(
        "[Dashboard] Fetching branches for ClientID:",
        authData.ClientID,
      );

      const clientIdNumber = authData.ClientID
        ? Number(authData.ClientID)
        : undefined;
      const branchList = await getBranchMaster(clientIdNumber);

      console.log(
        "[Dashboard] Branches received:",
        JSON.stringify(branchList, null, 2),
      );

      setBranches(branchList);

      if (branchList.length > 0) {
        setSelectedBranch(branchList[0]);
        if (onBranchSelected) onBranchSelected(branchList[0]);
        await AsyncStorage.setItem('selectedBranch', JSON.stringify(branchList[0]));
        DeviceEventEmitter.emit('BRANCH_CHANGED', branchList[0]);
      }
    } catch (error) {
      console.error("[Dashboard] Error fetching branches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBranchSelect = async (branch: any) => {
    console.log("[Dashboard] Selected branch:", branch);
    setSelectedBranch(branch);
    if (onBranchSelected) onBranchSelected(branch);
    await AsyncStorage.setItem('selectedBranch', JSON.stringify(branch));
    DeviceEventEmitter.emit('BRANCH_CHANGED', branch);
    setDropdownVisible(false);
  };

  // Branch Name mapping fallback if API returns a slightly unpredictable key
  const getBranchName = (b: any) =>
    b?.branchName || b?.BranchName || b?.name || "Unknown Branch";

  return (
    <View style={s.header}>
      <TouchableOpacity
        style={[s.headerIcon, { backgroundColor: colors.card }]}
      >
        <Feather name="menu" size={ms(22)} color={colors.textPrimary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.branchSelector, { backgroundColor: colors.card }]}
        onPress={() => setDropdownVisible(true)}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.textPrimary} />
        ) : (
          <>
            <Text
              style={[s.branchText, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {selectedBranch ? getBranchName(selectedBranch) : "Select Branch"}
            </Text>
            <Feather
              name="chevron-down"
              size={ms(16)}
              color={colors.textSecondary}
            />
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.headerIcon, { backgroundColor: colors.card }]}
      >
        <View>
          <Feather name="bell" size={ms(22)} color={colors.textPrimary} />
          <View style={[s.notifDot, { backgroundColor: colors.accent }]} />
        </View>
      </TouchableOpacity>

      {/* Branch Dropdown Modal */}
      <Modal
        visible={isDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDropdownVisible(false)}>
          <View style={s.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[s.dropdownContent, { backgroundColor: colors.card }]}
              >
                <View style={s.dropdownHeader}>
                  <Text
                    style={[s.dropdownTitle, { color: colors.textPrimary }]}
                  >
                    Select Branch
                  </Text>
                  <TouchableOpacity onPress={() => setDropdownVisible(false)}>
                    <Feather
                      name="x"
                      size={ms(20)}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                {branches.length === 0 ? (
                  <Text style={[s.noDataText, { color: colors.textSecondary }]}>
                    No branches available
                  </Text>
                ) : (
                  <FlatList
                    data={branches}
                    keyExtractor={(item, index) =>
                      item?.BranchID?.toString() ||
                      item?.branchID?.toString() ||
                      item?.BranchId?.toString() ||
                      item?.branchId?.toString() ||
                      item?.id?.toString() ||
                      index.toString()
                    }
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                      const isSelected =
                        (selectedBranch?.BranchID && item?.BranchID && selectedBranch.BranchID === item.BranchID) ||
                        (selectedBranch?.branchID && item?.branchID && selectedBranch.branchID === item.branchID) ||
                        (selectedBranch?.BranchId && item?.BranchId && selectedBranch.BranchId === item.BranchId) ||
                        (selectedBranch?.branchId && item?.branchId && selectedBranch.branchId === item.branchId) ||
                        (selectedBranch?.id && item?.id && selectedBranch.id === item.id) ||
                        selectedBranch === item;
                      
                      return (
                        <TouchableOpacity
                          style={[
                            s.branchItem,
                            isSelected && {
                              backgroundColor: colors.primaryLight,
                            },
                            { borderBottomColor: colors.border },
                          ]}
                          onPress={() => handleBranchSelect(item)}
                        >
                          <Text
                            style={[
                              s.branchItemText,
                              {
                                color: isSelected
                                  ? colors.primary
                                  : colors.textPrimary,
                              },
                              isSelected && { fontWeight: "700" },
                            ]}
                          >
                            {getBranchName(item)}
                          </Text>
                          {isSelected && (
                            <Feather
                              name="check"
                              size={ms(18)}
                              color={colors.primary}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    }}
                  />
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
      return 'Good Morning';
    } else if (currentHour >= 12 && currentHour < 17) {
      return 'Good Afternoon';
    } else if (currentHour >= 17 && currentHour < 22) {
      return 'Good Evening';
    } else {
      return 'Good Night';
    }
  };

  const getFirstName = () => {
    const userDetails = authData?.userDetails || {};
    // Check login API response for userName or name. If not available, fallback to username entered during login
    const mappedName = userDetails?.userName || userDetails?.name || userDetails?.loginUserName || "";
    
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
        Here your business overview today
      </Text>
    </View>
  );
}

// ─── KPI Cards (Creative) ───────────────────────────────────
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
  const { linePath, areaPath } = buildAreaPath(data, w, h);
  const gradId = `spark_${color.replace("#", "")}`;

  return (
    <Svg width={w} height={h}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.3" />
          <Stop offset="1" stopColor={color} stopOpacity="0.02" />
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill={`url(#${gradId})`} />
      <Path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

type KPIDataType = {
  title: string;
  value: string;
  change: string;
  up: boolean;
  icon: "trending-up" | "shopping-bag" | "credit-card" | "dollar-sign" | "arrow-up-right" | "arrow-down-right";
  colorKey: "green" | "blue" | "red" | "orange";
  bgKey: "greenBg" | "blueBg" | "redBg" | "orangeBg";
  sparkline: number[];
};

function AnimatedKPICard({
  item,
  colors,
}: {
  item: KPIDataType;
  colors: any;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

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
            <Text
              style={[s.kpiValue, { color: colors.textPrimary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {item.value}
            </Text>
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

function KPIGrid({ data }: { data: any }) {
  const { colors } = useTheme();

  if (!data) return null;

  const profit = (data.todaysPayments || 0) - (data.todayExpenses || 0);

  const mappedData = [
    {
      title: "Revenue",
      value: `₹${(data.todaysPayments || 0).toLocaleString()}`,
      change: "--",
      up: true,
      icon: "trending-up" as const,
      colorKey: "green" as const,
      bgKey: "greenBg" as const,
      sparkline: [10, 10, 10], // Flat sparkline when data lacks it
    },
    {
      title: "Bills",
      value: `${data.totalBills || 0}`,
      change: "--",
      up: true,
      icon: "shopping-bag" as const,
      colorKey: "blue" as const,
      bgKey: "blueBg" as const,
      sparkline: [10, 10, 10],
    },
    {
      title: "Expenses",
      value: `₹${(data.todayExpenses || 0).toLocaleString()}`,
      change: "--",
      up: false,
      icon: "credit-card" as const,
      colorKey: "red" as const,
      bgKey: "redBg" as const,
      sparkline: [10, 10, 10],
    },
    {
      title: "Profit",
      value: `₹${profit.toLocaleString()}`,
      change: "--",
      up: profit >= 0,
      icon: "dollar-sign" as const,
      colorKey: "orange" as const,
      bgKey: "orangeBg" as const,
      sparkline: [10, 10, 10],
    },
  ];

  return (
    <View style={s.kpiGrid}>
      {mappedData.map((item, i) => (
        <AnimatedKPICard key={i} item={item as any} colors={colors} />
      ))}
    </View>
  );
}

// ─── Payment Pie Chart (Modern) ────────────────────────────

function SalesChartSection({ salesData, hourlyData }: { salesData: any[], hourlyData: any[] }) {
  const { colors } = useTheme();
  const [period, setPeriod] = useState<"sales" | "hourly">("sales");
  const [areaWidth, setAreaWidth] = useState(0);

  const formatXLabel = (val: string, currentPeriod: "sales" | "hourly") => {
    if (!val) return "-";
    const str = val.toString();
    
    if (currentPeriod === "hourly") {
      // Backend typically returns hours like "14", "14:00", etc. Let's make it 12H am/pm format if possible
      const numMatch = str.match(/^(\d+)/);
      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        if (!isNaN(num) && num >= 0 && num <= 24) {
          const ampm = num >= 12 && num < 24 ? "PM" : "AM";
          const h = num % 12 || 12;
          return `${h} ${ampm}`;
        }
      }
      return str; 
    }
    
    // Replace API shorthand strings with their full descriptive names
    const orderTypesMap: Record<string, string> = {
      ret: "Retail", can: "Cancelled", com: "Complimentary", tot: "Total"
    };

    const lowerStr = str.toLowerCase().trim();
    if (orderTypesMap[lowerStr]) return orderTypesMap[lowerStr];

    // For 'sales' period, ensure we use standard abbreviations (Mon, Tue, Wed) cleanly
    const daysMap: Record<string, string> = {
      sunday: "Sun", monday: "Mon", tuesday: "Tue", wednesday: "Wed",
      thursday: "Thu", friday: "Fri", saturday: "Sat"
    };

    if (daysMap[lowerStr]) return daysMap[lowerStr];
    
    // Return full string so descriptive types like "Retail" don't get truncated
    return str;
  };

  const activeData = period === "sales" ? (salesData || []) : (hourlyData || []);
  const chartData = activeData.length > 0 
    ? activeData.map((d: any) => ({
        label: formatXLabel(d.hours, period),
        value: d.paidAmount || 0,
      }))
    : [{ label: "No Data", value: 1 }];

  let maxVal = Math.max(...chartData.map((d) => d.value));
  if (maxVal === 0) maxVal = 1;
  
  const total = chartData.reduce((sum, d) => sum + (d.value === 1 && d.label === "No Data" ? 0 : d.value), 0);
  const summary = { total: `₹${total.toLocaleString()}`, change: "--", up: true };

  const chartH = hp(180);
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
          style={{ flex: 1, overflow: "hidden" }}
          onLayout={(e) => setAreaWidth(e.nativeEvent.layout.width)}
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

              {/* Bars */}
              <Svg
                width={areaWidth}
                height={chartH}
                style={{ position: "absolute" }}
              >
                <Defs>
                  <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
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

                  return <Path key={i} d={barPath} fill="url(#barGrad)" />;
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

              {/* X labels */}
              <View style={s.xAxis}>
                {chartData.map((d, i) => (
                  <View
                    key={i}
                    style={{
                      width: barWidth + barGap,
                      alignItems: "center",
                      justifyContent: "flex-start",
                      paddingTop: hp(4),
                    }}
                  >
                    <Text 
                      style={[s.xLabel, { color: colors.textTertiary }]}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {d.label}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </View>
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
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>No payment data available</Text>
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
        <View style={{ padding: hp(20), alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>Taxes data unavailable</Text>
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
                    <Feather name={iconName as any} size={ms(18)} color={iconColor} />
                  </View>
                  <Text
                    style={{
                      color: isTotal ? colors.textPrimary : colors.textSecondary,
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
                  ₹{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
    { label: "Cancelled Bills", value: data.cancelBills || 0, icon: "close-circle-outline" },
    { label: "Compliment Bills", value: data.complimentBills || 0, icon: "gift-outline" },
    { label: "Reprint Bills", value: data.reprintBills || 0, icon: "printer-outline" },
    { label: "Modified Bills", value: data.modifedBills || 0, icon: "file-document-edit-outline" },
    { label: "Cancelled KOT", value: data.cancelledKOT || 0, icon: "alert-circle-outline" },
    { label: "Deleted KOT", value: data.deletedKOT || 0, icon: "trash-can-outline" },
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
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>No expense data available</Text>
        </View>
      </Card>
    );
  }

  const total = data.reduce((sum, e) => sum + (e.expenseAmount || 0), 0);
  const mappedData = data.map((e, i) => {
    const colorKeys = ["primary", "orange", "teal", "textTertiary", "red", "blue"] as const;
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

// ─── Top Selling Items (Premium) ────────────────────────────
const MEDAL_COLORS = ["#F59E0B", "#94A3B8", "#D97706"] as const;
const MEDAL_BG = ["#FEF3C7", "#F1F5F9", "#FEF3C7"] as const;

function TopSellingSection({ data }: { data: any[] }) {
  const { colors } = useTheme();
  
  if (!data || data.length === 0) return null;

  const totalSales = data.reduce((sum, d) => sum + (d.totalPrice || 0), 0);
  const topItems = data.slice(0, 5).map(d => ({
    name: d.productDescription || "Unknown",
    qty: d.count || 0,
    revenue: `₹${(d.totalPrice || 0).toLocaleString()}`,
    pct: totalSales > 0 ? (d.totalPrice || 0) / totalSales : 0,
  }));
  const bestSeller = topItems[0];

  return (
    <Card>
      <SectionHeader title="Top Selling Items" />

      {/* Best Seller Hero */}
      <View style={[s.tsHero, { backgroundColor: colors.primary + "0C" }]}>
        <View style={s.tsHeroLeft}>
          <View style={[s.tsHeroBadge, { backgroundColor: MEDAL_BG[0] }]}>
            <Feather name="award" size={ms(18)} color={MEDAL_COLORS[0]} />
          </View>
          <View style={s.tsHeroText}>
            <Text style={[s.tsHeroLabel, { color: colors.textTertiary }]}>
              Best Seller
            </Text>
            <Text style={[s.tsHeroName, { color: colors.textPrimary }]}>
              {bestSeller.name}
            </Text>
          </View>
        </View>
        <View style={s.tsHeroRight}>
          <Text style={[s.tsHeroRevenue, { color: colors.primary }]}>
            {bestSeller.revenue}
          </Text>
          <Text style={[s.tsHeroQty, { color: colors.textTertiary }]}>
            {bestSeller.qty} sold
          </Text>
        </View>
      </View>

      {/* Item List */}
      <View style={s.tsListWrap}>
        {topItems.map((item, i) => {
          const isTop3 = i < 3;
          const medalColor = isTop3 ? MEDAL_COLORS[i] : colors.textTertiary;
          const medalBg = isTop3 ? MEDAL_BG[i] : colors.cardAlt;

          return (
            <View
              key={i}
              style={[
                s.tsItemRow,
                i < topItems.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              {/* Rank badge */}
              <View style={[s.tsRankBadge, { backgroundColor: medalBg }]}>
                <Text style={[s.tsRankText, { color: medalColor }]}>
                  #{i + 1}
                </Text>
              </View>

              {/* Info */}
              <View style={s.tsItemInfo}>
                <View style={s.tsItemTopRow}>
                  <Text
                    style={[s.tsItemName, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[s.tsItemRevenue, { color: colors.textPrimary }]}
                  >
                    {item.revenue}
                  </Text>
                </View>

                {/* Progress bar + qty */}
                <View style={s.tsBarRow}>
                  <View style={[s.tsBarBg, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        s.tsBarFill,
                        {
                          width: `${item.pct * 100}%`,
                          backgroundColor: isTop3
                            ? colors.primary
                            : colors.primary + "60",
                        },
                      ]}
                    />
                  </View>
                  <Text style={[s.tsQtyLabel, { color: colors.textTertiary }]}>
                    {item.qty}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
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
  branchItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: hp(14),
    paddingHorizontal: wp(12),
    borderRadius: wp(8),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  branchItemText: {
    fontSize: ms(14),
    fontWeight: "500",
  },

  // Greeting
  greetingContainer: { marginTop: hp(8), marginBottom: hp(4) },
  greetingTitle: { fontSize: ms(24), fontWeight: "700", letterSpacing: -0.3 },
  greetingSubtitle: { fontSize: ms(14), marginTop: hp(4) },

  // (Date Filter styles are now inside CalendarPicker component)

  // KPI
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: wp(12),
  },
  kpiCardWidth: { width: "48%" },
  kpiTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(10),
  },
  animatedKpiCard: {
    padding: wp(14),
    borderRadius: wp(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)", // subtle border for modern feel
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
  chartContainer: { flexDirection: "row", marginTop: hp(24), marginBottom: hp(8) },
  yAxis: {
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginRight: wp(12),
    paddingBottom: hp(32), // reserve space for multiline x-axis labels
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
  xLabel: { fontSize: ms(10), fontWeight: "600", textAlign: "center", lineHeight: ms(14) },

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

  // Top Selling
  tsHero: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: hp(16),
    padding: wp(14),
    borderRadius: wp(16),
  },
  tsHeroLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  tsHeroBadge: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(12),
    justifyContent: "center",
    alignItems: "center",
  },
  tsHeroText: {
    marginLeft: wp(12),
    flex: 1,
  },
  tsHeroLabel: {
    fontSize: ms(10),
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  tsHeroName: {
    fontSize: ms(15),
    fontWeight: "800",
    marginTop: hp(2),
  },
  tsHeroRight: {
    alignItems: "flex-end",
    marginLeft: wp(8),
  },
  tsHeroRevenue: {
    fontSize: ms(18),
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  tsHeroQty: {
    fontSize: ms(11),
    fontWeight: "500",
    marginTop: hp(2),
  },
  tsListWrap: {
    marginTop: hp(12),
  },
  tsItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(12),
  },
  tsRankBadge: {
    width: wp(32),
    height: wp(32),
    borderRadius: wp(10),
    justifyContent: "center",
    alignItems: "center",
  },
  tsRankText: {
    fontSize: ms(12),
    fontWeight: "800",
  },
  tsItemInfo: {
    flex: 1,
    marginLeft: wp(12),
  },
  tsItemTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tsItemName: {
    fontSize: ms(13),
    fontWeight: "600",
    flex: 1,
    marginRight: wp(8),
  },
  tsItemRevenue: {
    fontSize: ms(13),
    fontWeight: "700",
  },
  tsBarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: hp(6),
    gap: wp(8),
  },
  tsBarBg: {
    flex: 1,
    height: hp(6),
    borderRadius: wp(3),
    overflow: "hidden",
  },
  tsBarFill: {
    height: hp(6),
    borderRadius: wp(3),
  },
  tsQtyLabel: {
    fontSize: ms(11),
    fontWeight: "600",
    minWidth: wp(28),
    textAlign: "right",
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
