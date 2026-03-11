import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Dimensions,
} from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Text as SvgText, Line, G } from 'react-native-svg';

import { getBranchMaster } from "../api/branchService";
import { getSalesDetails } from "../api/dashboardService";
import { 
  Card, 
  GradientHeader, 
  ScreenWrapper, 
  SectionHeader,
  DateRangePicker,
  type DateRangePickerRef
} from "../components";
import { useAuth } from "../context/AuthContext";
import { useDateFilter } from "../context/DateFilterContext";
import { RootStackParamList } from "../navigation/AppNavigator";
import { hp, ms, useTheme, wp } from "../theme";

type PurchaseOrdersScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Main"
>;

const { width: scrWidth } = Dimensions.get("window");

export default function PurchaseOrdersScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<PurchaseOrdersScreenNavigationProp>();
  const { authData } = useAuth();
  // Global date filter from dashboard calendar
  const { startDate: globalStartDate, endDate: globalEndDate, dateRange, activeFilter, setDateFilter: setGlobalDateFilter } = useDateFilter();
  
  const calendarRef = React.useRef<DateRangePickerRef>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Filter States — local chip further narrows within global date
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [dateFilter, setDateFilter] = useState('Global'); // 'Global' means use dashboard dates
  const [orderTypeFilter, setOrderTypeFilter] = useState('All');

  const loadData = useCallback(
    async (forcedBranchId?: number, overrideDateFilter?: string) => {
      if (!authData?.ClientID) return;

      try {
        setLoading(true);
        setErrorMsg(null);
        let branchIdNum = forcedBranchId || 0;

        if (!branchIdNum) {
          const savedStr = await AsyncStorage.getItem("selectedBranch");
          if (savedStr) {
            const savedBranch = JSON.parse(savedStr);
            branchIdNum =
              savedBranch?.BranchID ||
              savedBranch?.branchID ||
              savedBranch?.BranchId ||
              savedBranch?.branchId ||
              savedBranch?.id ||
              savedBranch?.ID ||
              0;
          }
        }

        if (!branchIdNum) {
          const clientIdNum = Number(authData.ClientID);
          const branchList = await getBranchMaster(clientIdNum);
          if (branchList && branchList.length > 0) {
            const selectedBranch = branchList[0];
            branchIdNum =
              selectedBranch?.BranchID ||
              selectedBranch?.branchID ||
              selectedBranch?.BranchId ||
              selectedBranch?.branchId ||
              selectedBranch?.id ||
              selectedBranch?.ID ||
              0;
          }
        }

        // Use global date from Dashboard, unless the local chip has overridden it
        let startDate: string;
        let endDate: string;
        const activeDateFilter = overrideDateFilter || dateFilter;

        if (activeDateFilter === 'Global' || activeDateFilter === 'This Month') {
          // Follow dashboard calendar exactly
          startDate = globalStartDate;
          endDate = globalEndDate;
        } else {
          const now = new Date();
          const fmt = (d: Date) =>
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (activeDateFilter === 'Today') {
            startDate = fmt(new Date());
            endDate = fmt(new Date());
          } else {
            // This Week
            const s = new Date(); s.setDate(now.getDate() - 7);
            startDate = fmt(s);
            endDate = fmt(new Date());
          }
        }

        let activeBranchObj: any = null;
        if (forcedBranchId) {
          const savedStr = await AsyncStorage.getItem("selectedBranch");
          if (savedStr) activeBranchObj = JSON.parse(savedStr);
        } else {
          const savedStr = await AsyncStorage.getItem("selectedBranch");
          if (savedStr) {
            activeBranchObj = JSON.parse(savedStr);
          } else {
            const clientIdNum = Number(authData.ClientID);
            const branchList = await getBranchMaster(clientIdNum);
            if (branchList && branchList.length > 0)
              activeBranchObj = branchList[0];
          }
        }

        const vendorIdNum =
          activeBranchObj?.VendorID ||
          activeBranchObj?.vendorID ||
          activeBranchObj?.VendorId ||
          activeBranchObj?.vendorId ||
          0;
        const isActive =
          activeBranchObj?.IsActive || activeBranchObj?.isActive ? true : false;
        const phaseValue =
          activeBranchObj?.Phase || activeBranchObj?.phase || null;

        const payload: any = {
          startDate,
          endDate,
          branchID: branchIdNum,
          clientID: Number(authData.ClientID),
        };

        if (phaseValue !== null && phaseValue !== "") payload.phase = phaseValue;
        if (isActive) payload.isActive = isActive;
        if (vendorIdNum) payload.vendorID = vendorIdNum;

        const dbData = await getSalesDetails(payload);
        setDashboardData(dbData);
      } catch (error) {
        console.error("Failed to fetch data from Sales API:", error);
        setErrorMsg(
          "Failed to load order data. Please check your network connection and try again."
        );
        setDashboardData(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authData?.ClientID, dateFilter, globalStartDate, globalEndDate]
  );

  useEffect(() => {
    loadData();

    const subscription = DeviceEventEmitter.addListener(
      "BRANCH_CHANGED",
      (branch) => {
        const branchIdNum =
          branch?.BranchID ||
          branch?.branchID ||
          branch?.BranchId ||
          branch?.branchId ||
          branch?.id ||
          branch?.ID ||
          0;
        if (branchIdNum) {
          loadData(branchIdNum);
        }
      }
    );

    return () => subscription.remove();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const applyFilters = () => {
    setFilterVisible(false);
    loadData(undefined, dateFilter);
  };

  const renderIcon = (name: string) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes("burger")) return <MaterialCommunityIcons name="hamburger" size={ms(20)} color={colors.primary} />;
    if (lower.includes("cake") || lower.includes("dessert") || lower.includes("pastry") || lower.includes("sweets")) return <MaterialCommunityIcons name="cake-variant" size={ms(20)} color={colors.primary} />;
    if (lower.includes("lunch") || lower.includes("meal") || lower.includes("dinner") || lower.includes("breakfast") || lower.includes("thali")) return <MaterialCommunityIcons name="food-fork-drink" size={ms(20)} color={colors.primary} />;
    if (lower.includes("pizza")) return <MaterialCommunityIcons name="pizza" size={ms(20)} color={colors.primary} />;
    if (lower.includes("drink") || lower.includes("juice") || lower.includes("milk") || lower.includes("water")) return <MaterialCommunityIcons name="cup-water" size={ms(20)} color={colors.primary} />;
    if (lower.includes("tea") || lower.includes("coffee")) return <MaterialCommunityIcons name="coffee" size={ms(20)} color={colors.primary} />;
    if (lower.includes("ice cream")) return <MaterialCommunityIcons name="ice-cream" size={ms(20)} color={colors.primary} />;
    if (lower.includes("chicken") || lower.includes("meat")) return <MaterialCommunityIcons name="food-drumstick" size={ms(20)} color={colors.primary} />;

    return <MaterialCommunityIcons name="food" size={ms(20)} color={colors.primary} />;
  };

  const renderHeader = () => (
    <>
      <GradientHeader
        title="Orders"
        onCalendarPress={() => calendarRef.current?.openModal()}
        rightElement={
          <TouchableOpacity
            onPress={() => setFilterVisible(true)}
            accessibilityLabel="Filter orders"
          >
            <View>
              <Feather name="filter" size={ms(22)} color="#FFF" />
              <View style={[s.filterBadge, { backgroundColor: colors.accent, borderColor: 'rgba(255,255,255,0.6)' }]} />
            </View>
          </TouchableOpacity>
        }
      />
      <DateRangePicker
        ref={calendarRef}
        hideChip={true}
        dateRange={dateRange}
        activeFilter={activeFilter}
        onDateRangeChange={setGlobalDateFilter}
      />
    </>
  );


  const renderFilterModal = () => (
    <Modal
      visible={isFilterVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setFilterVisible(false)}
    >
      <View style={s.modalOverlay}>
         <View style={[s.modalContent, { backgroundColor: colors.card }]}>
            <View style={s.modalHeader}>
               <Text style={[s.modalTitle, { color: colors.textPrimary }]}>Filters</Text>
               <TouchableOpacity style={[s.modalCloseIcon, { backgroundColor: colors.cardAlt }]} onPress={() => setFilterVisible(false)}>
                  <Feather name="x" size={ms(24)} color={colors.textPrimary} />
               </TouchableOpacity>
            </View>
            
            <View style={s.filterGroup}>
              <Text style={[s.filterSubtitle, { color: colors.textSecondary }]}>Date Range</Text>
              <View style={s.filterRow}>
                {["Dashboard Date", "Today", "This Week"].map((opt) => {
                  const mappedActive = dateFilter === 'Global' ? 'Dashboard Date' : dateFilter;
                  const isActive = mappedActive === opt;
                  return (
                    <TouchableOpacity 
                        key={opt}
                        style={[s.filterPill, isActive && s.filterPillActive, { borderColor: colors.primary, backgroundColor: isActive ? colors.primary : 'transparent' }]}
                        onPress={() => setDateFilter(opt === 'Dashboard Date' ? 'Global' : opt)}
                    >
                      <Text style={[s.filterPillText, { color: isActive ? '#FFF' : colors.primary }]}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={s.filterGroup}>
              <Text style={[s.filterSubtitle, { color: colors.textSecondary }]}>Order Type</Text>
              <View style={s.filterRow}>
                {["All", "Retail", "Cancelled", "Complimentary"].map((opt) => {
                  const isActive = orderTypeFilter === opt;
                  return (
                    <TouchableOpacity 
                        key={opt}
                        style={[s.filterPill, isActive && s.filterPillActive, { borderColor: colors.primary, backgroundColor: isActive ? colors.primary : 'transparent' }]}
                        onPress={() => setOrderTypeFilter(opt)}
                    >
                      <Text style={[s.filterPillText, { color: isActive ? '#FFF' : colors.primary }]}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity style={[s.applyButton, { backgroundColor: colors.primary }]} onPress={applyFilters}>
               <Text style={s.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
         </View>
      </View>
    </Modal>
  );

  const getFilteredBreakdown = (list: any[]) => {
    if (orderTypeFilter === "All") return list;
    const search = orderTypeFilter.toLowerCase();
    const prefix = search.substring(0, 3);
    return list.filter((item: any) => item.hours?.toLowerCase().includes(prefix));
  };

  const renderSummaryCards = () => {
    if (!dashboardData?.dashBoardCount) return null;
    const countData = dashboardData.dashBoardCount;

    return (
      <View style={s.summaryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.summaryScroll}>
          {(orderTypeFilter === "All" || orderTypeFilter === "Retail") && (
            <Card style={s.summaryCard}>
              <View style={[s.iconBox, { backgroundColor: colors.blueBg }]}>
                <Feather name="file-text" size={ms(18)} color={colors.blue} />
              </View>
               <View style={s.summaryTextWrap}>
                <Text style={[s.summaryValue, { color: colors.textPrimary }]}>{countData.totalBills || 0}</Text>
                <Text style={[s.summaryLabel, { color: colors.textSecondary }]}>Total Orders</Text>
              </View>
            </Card>
          )}
          
          {(orderTypeFilter === "All" || orderTypeFilter === "Cancelled") && (
            <Card style={s.summaryCard}>
              <View style={[s.iconBox, { backgroundColor: colors.redBg }]}>
                <Feather name="alert-triangle" size={ms(18)} color={colors.red} />
              </View>
              <View style={s.summaryTextWrap}>
                <Text style={[s.summaryValue, { color: colors.textPrimary }]}>{countData.cancelBills || 0}</Text>
                <Text style={[s.summaryLabel, { color: colors.textSecondary }]}>Cancelled</Text>
              </View>
            </Card>
          )}

          {(orderTypeFilter === "All" || orderTypeFilter === "Complimentary") && (
            <Card style={s.summaryCard}>
              <View style={[s.iconBox, { backgroundColor: colors.greenBg }]}>
                <Feather name="gift" size={ms(18)} color={colors.green} />
              </View>
              <View style={s.summaryTextWrap}>
                <Text style={[s.summaryValue, { color: colors.textPrimary }]}>{countData.complimentaryBills || countData.complimentBills || 0}</Text>
                <Text style={[s.summaryLabel, { color: colors.textSecondary }]}>Complimentary</Text>
              </View>
            </Card>
          )}
          
          {orderTypeFilter === "All" && (
            <Card style={s.summaryCard}>
              <View style={[s.iconBox, { backgroundColor: colors.orangeBg }]}>
                <Feather name="edit-2" size={ms(18)} color={colors.orange} />
              </View>
              <View style={s.summaryTextWrap}>
                <Text style={[s.summaryValue, { color: colors.textPrimary }]}>{countData.modifiedBills || 0}</Text>
                <Text style={[s.summaryLabel, { color: colors.textSecondary }]}>Modified Bills</Text>
              </View>
            </Card>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderOrdersInsights = () => {
    const hourlyList = dashboardData?.dashBoardHourlyList || [];
    if (hourlyList.length === 0) return null;

    // Format hourly labels as readable "12 PM", "3 AM" format
    const formatHourLabel = (val: string) => {
      const numMatch = val.match(/^(\d+)/);
      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        if (!isNaN(num) && num >= 0 && num <= 24) {
          const ampm = num >= 12 && num < 24 ? 'PM' : 'AM';
          const h = num % 12 || 12;
          return `${h} ${ampm}`;
        }
      }
      // For non-numeric: full readable labels
      const lower = val.toLowerCase().trim();
      const labelMap: Record<string, string> = {
        ret: 'Retail Orders', can: 'Cancelled Orders', com: 'Complimentary',
        tot: 'Total Orders', sunday: 'Sun', monday: 'Mon', tuesday: 'Tue',
        wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat',
      };
      return labelMap[lower] || val;
    };

    const points = hourlyList.map((item: any) => ({
      label: formatHourLabel(item.hours),
      value: item.bills || item.count || item.paidAmount || 0,
    }));

    const maxVal = Math.max(...points.map((p: any) => p.value), 1);

    // ── Chart dimensions with generous breathing space ──
    const chartHeight = ms(250);
    const chartWidth = scrWidth - wp(32) - ms(24) - wp(8);
    const paddingTop = ms(24);
    const paddingBottom = ms(36);
    const leftPad = ms(48);
    const rightPad = ms(16);

    const innerHeight = chartHeight - paddingTop - paddingBottom;
    const innerWidth = chartWidth - leftPad - rightPad;
    const stepX = points.length > 1 ? innerWidth / (points.length - 1) : 0;

    // Y-axis grid values (5 levels)
    const ySteps = 4;
    const yValues = Array.from({ length: ySteps + 1 }, (_, i) => Math.round(maxVal * (1 - i / ySteps)));

    const generateSmoothPath = () => {
      if (points.length === 0) return "";
      const coords = points.map((p: any, i: number) => ({
        x: leftPad + i * stepX,
        y: chartHeight - paddingBottom - (p.value / maxVal) * innerHeight,
      }));
      let d = `M ${coords[0].x} ${coords[0].y}`;
      for (let i = 1; i < coords.length; i++) {
        const prev = coords[i - 1];
        const curr = coords[i];
        const cpx1 = prev.x + stepX * 0.35;
        const cpx2 = curr.x - stepX * 0.35;
        d += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
      }
      return d;
    };

    const smoothPath = generateSmoothPath();
    const smoothArea = points.length > 1
      ? `${smoothPath} L ${leftPad + (points.length - 1) * stepX} ${chartHeight - paddingBottom} L ${leftPad} ${chartHeight - paddingBottom} Z`
      : "";

    return (
      <View style={s.section}>
        <SectionHeader title="Orders Insights" />
        <Card style={[s.insightsCard, { paddingTop: hp(20), paddingBottom: hp(16) }]}>
          <View style={s.insightsHeader}>
             <Feather name="trending-up" size={ms(18)} color={colors.primary} />
             <View>
               <Text style={[s.insightsTitle, { color: colors.textPrimary }]}>Orders Trend Over Time</Text>
               <Text style={{ color: colors.textTertiary, fontSize: ms(12), marginTop: hp(2) }}>Hourly order activity</Text>
             </View>
          </View>
          <View style={[s.chartContainer, { marginTop: hp(12) }]}>
            <Svg width={chartWidth} height={chartHeight}>
              <Defs>
                <LinearGradient id="ordersAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.teal} stopOpacity="0.3" />
                  <Stop offset="0.6" stopColor={colors.teal} stopOpacity="0.1" />
                  <Stop offset="1" stopColor={colors.teal} stopOpacity="0" />
                </LinearGradient>
                <LinearGradient id="ordersLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor={colors.teal} stopOpacity="1" />
                  <Stop offset="1" stopColor={colors.primary} stopOpacity="1" />
                </LinearGradient>
              </Defs>
              
              {/* Y-axis grid lines and labels */}
              {yValues.map((val, i) => {
                const y = paddingTop + (i / ySteps) * innerHeight;
                return (
                   <G key={`grid-${i}`}>
                     <Line 
                       x1={leftPad} 
                       y1={y} 
                       x2={chartWidth - rightPad} 
                       y2={y} 
                       stroke={colors.border} 
                       strokeWidth="1" 
                       strokeDasharray="4 4" 
                     />
                     <SvgText
                        x={leftPad - ms(6)}
                        y={y + 4}
                        fontSize={ms(11)}
                        fill={colors.textTertiary}
                        textAnchor="end"
                     >
                        {val >= 1000 ? `${(val / 1000).toFixed(1)}K` : val}
                     </SvgText>
                   </G>
                );
              })}

              {points.length > 1 && <Path d={smoothArea} fill="url(#ordersAreaGrad)" />}
              {points.length > 1 && <Path d={smoothPath} fill="none" stroke="url(#ordersLineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

              {points.map((p: any, i: number) => {
                const x = leftPad + i * stepX;
                const y = chartHeight - paddingBottom - (p.value / maxVal) * innerHeight;
                const showLabel = points.length < 8 || i % Math.ceil(points.length / 5) === 0 || i === points.length - 1;

                return (
                  <G key={`point-${i}`}>
                    <Circle cx={x} cy={y} r="5" fill={colors.card} stroke={colors.teal} strokeWidth="2.5" />
                    <Circle cx={x} cy={y} r="2" fill={colors.teal} />
                    {showLabel && (
                      <SvgText
                        x={x}
                        y={chartHeight - ms(6)}
                        fontSize={ms(11)}
                        fontWeight="600"
                        fill={colors.textSecondary}
                        textAnchor="middle"
                      >
                        {p.label}
                      </SvgText>
                    )}
                  </G>
                );
              })}
            </Svg>
          </View>
        </Card>
      </View>
    );
  };

  const renderOrderTypeBreakdown = () => {
    let list = dashboardData?.dashBoardSalesList || [];
    list = getFilteredBreakdown(list);

    if (list.length === 0) return null;

    const formatLabel = (val: string | null | undefined) => {
      const v = (val ?? '').toLowerCase().trim();
      const map: Record<string, string> = { ret: "Retail Orders", can: "Cancelled Orders", com: "Complimentary Orders", tot: "Total Orders" };
      return map[v] || val || '';
    };

    const maxValue = Math.max(...list.map((i: any) => i.paidAmount || 0), 1);

    return (
      <View style={s.section}>
        <SectionHeader title="Order Type Breakdown" />
        <Card style={s.breakdownCard}>
          {list.map((item: any, idx: number) => {
            const val = item.paidAmount || 0;
            const pct = (val / maxValue) * 100;
            const hoursStr = (item.hours ?? '').toLowerCase();
            const isCancel = hoursStr.includes('can');
            const isComp = hoursStr.includes('com');
            const barColor = isCancel ? colors.red : isComp ? colors.green : colors.primary;
            return (
              <View key={idx} style={s.breakdownRow}>
                <View style={s.breakdownHeader}>
                  <Text style={[s.breakdownLabel, { color: colors.textPrimary }]}>{formatLabel(item.hours)}</Text>
                  <Text style={[s.breakdownValue, { color: colors.textPrimary }]}>₹{val.toLocaleString()}</Text>
                </View>
                <View style={[s.breakdownTrack, { backgroundColor: colors.bg }]}>
                  <View style={[s.breakdownFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                </View>
              </View>
            );
          })}
        </Card>
      </View>
    );
  };

  const renderTopItems = () => {
    const items = dashboardData?.dashBoardItemWiseSalesList || [];
    if (items.length === 0) return null;
    
    const topItems = [...items].sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 5);

    return (
      <View style={s.section}>
        <SectionHeader title="Top Ordered Items" />
        {topItems.map((item: any, idx: number) => (
          <Card key={idx} style={s.itemCard}>
            <View style={[s.itemIconWrap, { backgroundColor: colors.primaryLight, borderColor: colors.border, borderWidth: 1 }]}>
              {renderIcon(item.productDescription || "")}
            </View>
            <View style={s.itemContent}>
              <Text style={[s.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.productDescription || "Unknown Item"}
              </Text>
              <Text style={[s.itemCategory, { color: colors.textSecondary }]}>{item.menuCategoryName || item.categoryName || `₹${(item.totalPrice || 0).toLocaleString()}`}</Text>
            </View>
            <View style={[s.itemStats, { backgroundColor: colors.cardAlt }]}>
              <Text style={[s.itemOrders, { color: colors.textPrimary }]}>{item.count || 0}</Text>
              <Text style={[s.itemOrdersLabel, { color: colors.textSecondary }]}>Orders</Text>
            </View>
          </Card>
        ))}
      </View>
    );
  };

  return (
    <ScreenWrapper edges={['bottom', 'left', 'right']}>
      {renderHeader()}
      {renderFilterModal()}
      
      {loading ? (
        <View style={s.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: hp(12), color: colors.textSecondary }}>Analysing orders...</Text>
        </View>
      ) : errorMsg ? (
        <View style={s.centerContainer}>
          <Feather name="alert-circle" size={ms(48)} color={colors.red} style={{ marginBottom: hp(16) }} />
          <Text style={{ textAlign: "center", color: colors.textPrimary, fontSize: ms(16), marginBottom: hp(24), paddingHorizontal: wp(24) }}>
            {errorMsg}
          </Text>
          <TouchableOpacity style={{ backgroundColor: colors.primary, paddingHorizontal: wp(24), paddingVertical: hp(12), borderRadius: ms(8) }} onPress={() => loadData()}>
            <Text style={{ color: "#FFF", fontWeight: "bold" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !dashboardData ? (
         <View style={s.centerContainer}>
            <Feather name="inbox" size={ms(48)} color={colors.textTertiary} />
            <Text style={{ marginTop: hp(12), color: colors.textSecondary }}>No order data available</Text>
         </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.contentPad}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {renderSummaryCards()}
          {renderOrdersInsights()}
          {renderOrderTypeBreakdown()}
          {renderTopItems()}
          <View style={{ height: hp(100) }} />
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  filterBadge: {
    position: 'absolute',
    top: ms(2),
    right: ms(2),
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    borderWidth: 1.5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentPad: {
    paddingHorizontal: wp(16),
    paddingTop: hp(12),
    paddingBottom: hp(60),
  },
  
  /* SUMMARY CARDS */
  summaryContainer: {
    marginBottom: hp(4),
    marginTop: hp(16),
    marginHorizontal: -wp(16),
  },
  summaryScroll: {
    paddingHorizontal: wp(16),
    gap: wp(12),
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: wp(160),
    padding: ms(16),
    marginRight: wp(12),
    borderRadius: ms(16),
  },
  iconBox: {
    width: ms(42),
    height: ms(42),
    borderRadius: ms(12),
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(12),
  },
  summaryTextWrap: {
    flex: 1,
  },
  summaryValue: {
    fontSize: ms(22),
    fontWeight: "bold",
    marginBottom: hp(2),
  },
  summaryLabel: {
    fontSize: ms(13),
    fontWeight: "500",
  },
  
  section: {
    marginBottom: hp(24),
  },
  
  /* ORDERS INSIGHTS CHART */
  insightsCard: {
    padding: ms(16),
    borderRadius: ms(16),
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(16),
    gap: wp(8),
  },
  insightsTitle: {
    fontSize: ms(15),
    fontWeight: "600",
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(8),
  },

  /* BREAKDOWN CHART */
  breakdownCard: {
    padding: ms(20),
    borderRadius: ms(16),
  },
  breakdownRow: {
    marginBottom: hp(18),
  },
  breakdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: hp(10),
  },
  breakdownLabel: {
    fontSize: ms(14),
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  breakdownValue: {
    fontSize: ms(14),
    fontWeight: "bold",
  },
  breakdownTrack: {
    height: hp(8),
    borderRadius: hp(4),
    width: "100%",
    overflow: "hidden",
  },
  breakdownFill: {
    height: "100%",
    borderRadius: hp(4),
  },

  /* TOP ITEMS */
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: ms(14),
    marginBottom: hp(12),
    borderRadius: ms(16),
  },
  itemIconWrap: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(14),
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(14),
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: ms(15),
    fontWeight: "600",
    marginBottom: hp(4),
  },
  itemCategory: {
    fontSize: ms(13),
  },
  itemStats: {
    alignItems: "center",
    paddingVertical: hp(6),
    paddingHorizontal: wp(12),
    borderRadius: ms(10),
  },
  itemOrders: {
    fontSize: ms(14),
    fontWeight: "bold",
    marginBottom: hp(2),
  },
  itemOrdersLabel: {
    fontSize: ms(11),
    fontWeight: "600",
  },

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: ms(24),
    borderTopRightRadius: ms(24),
    padding: ms(24),
    minHeight: hp(350),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(24),
  },
  modalTitle: {
    fontSize: ms(20),
    fontWeight: 'bold',
  },
  modalCloseIcon: {
    padding: ms(4),
    borderRadius: ms(14),
  },
  filterGroup: {
    marginBottom: hp(24),
  },
  filterSubtitle: {
    fontSize: ms(14),
    fontWeight: '600',
    marginBottom: hp(12),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(10),
  },
  filterPill: {
    paddingVertical: hp(10),
    paddingHorizontal: wp(16),
    borderRadius: ms(24),
    borderWidth: 1.5,
    marginBottom: hp(10),
  },
  filterPillActive: {
  },
  filterPillText: {
    fontSize: ms(14),
    fontWeight: '600',
  },
  applyButton: {
    marginTop: hp(10),
    paddingVertical: hp(16),
    borderRadius: ms(16),
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: ms(16),
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
