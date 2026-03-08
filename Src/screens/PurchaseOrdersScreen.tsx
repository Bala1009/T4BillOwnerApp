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
} from "react-native";
import { getBranchMaster } from "../api/branchService";
import { getSalesDetails } from "../api/dashboardService";
import { Card, ScreenWrapper, SectionHeader } from "../components";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../navigation/AppNavigator";
import { hp, ms, useTheme, wp } from "../theme";

type PurchaseOrdersScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Main"
>;

export default function PurchaseOrdersScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<PurchaseOrdersScreenNavigationProp>();
  const { authData } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const loadData = useCallback(
    async (forcedBranchId?: number) => {
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
          // Fetch fallback
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

        const now = new Date();
        const formatAsYMD = (date: Date) => {
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, "0");
          const d = String(date.getDate()).padStart(2, "0");
          return `${y}-${m}-${d}`;
        };

        const startDate = formatAsYMD(
          new Date(now.getFullYear(), now.getMonth(), 1),
        );
        const endDate = formatAsYMD(
          new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        );

        let activeBranchObj: any = null;
        if (forcedBranchId) {
          const savedStr = await AsyncStorage.getItem("selectedBranch");
          if (savedStr) {
            activeBranchObj = JSON.parse(savedStr);
          }
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

        if (phaseValue !== null && phaseValue !== "")
          payload.phase = phaseValue;
        if (isActive) payload.isActive = isActive;
        if (vendorIdNum) payload.vendorID = vendorIdNum;

        const dbData = await getSalesDetails(payload);
        setDashboardData(dbData);
      } catch (error) {
        console.error("Failed to fetch data from Sales API:", error);
        setErrorMsg(
          "Failed to load order data. Please check your network connection and try again.",
        );
        setDashboardData(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authData?.ClientID],
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
      },
    );

    return () => subscription.remove();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("burger"))
      return (
        <MaterialCommunityIcons
          name="hamburger"
          size={ms(20)}
          color={colors.primary}
        />
      );
    if (
      lower.includes("cake") ||
      lower.includes("dessert") ||
      lower.includes("pastry") ||
      lower.includes("sweets")
    )
      return (
        <MaterialCommunityIcons
          name="cake-variant"
          size={ms(20)}
          color={colors.primary}
        />
      );
    if (
      lower.includes("lunch") ||
      lower.includes("meal") ||
      lower.includes("dinner") ||
      lower.includes("breakfast") ||
      lower.includes("thali")
    )
      return (
        <MaterialCommunityIcons
          name="food-fork-drink"
          size={ms(20)}
          color={colors.primary}
        />
      );
    if (lower.includes("pizza"))
      return (
        <MaterialCommunityIcons
          name="pizza"
          size={ms(20)}
          color={colors.primary}
        />
      );
    if (
      lower.includes("drink") ||
      lower.includes("juice") ||
      lower.includes("milk") ||
      lower.includes("water")
    )
      return (
        <MaterialCommunityIcons
          name="cup-water"
          size={ms(20)}
          color={colors.primary}
        />
      );
    if (lower.includes("tea") || lower.includes("coffee"))
      return (
        <MaterialCommunityIcons
          name="coffee"
          size={ms(20)}
          color={colors.primary}
        />
      );
    if (lower.includes("ice cream"))
      return (
        <MaterialCommunityIcons
          name="ice-cream"
          size={ms(20)}
          color={colors.primary}
        />
      );
    if (lower.includes("chicken") || lower.includes("meat"))
      return (
        <MaterialCommunityIcons
          name="food-drumstick"
          size={ms(20)}
          color={colors.primary}
        />
      );

    return <MaterialCommunityIcons name="food" size={ms(20)} color={colors.primary} />;
  };

  const renderHeader = () => (
    <View style={s.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={s.backButton}
      >
        <Feather name="arrow-left" size={ms(24)} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={[s.headerTitle, { color: colors.textPrimary }]}>
        Orders
      </Text>
      <TouchableOpacity style={s.backButton}>
        <Feather name="filter" size={ms(20)} color={colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );

  const renderSummaryCards = () => {
    if (!dashboardData?.dashBoardCount) return null;
    const countData = dashboardData.dashBoardCount;

    return (
      <View style={s.summaryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.summaryScroll}>
          <Card style={s.summaryCard}>
            <View style={[s.iconBox, { backgroundColor: colors.blue + "15" }]}>
              <Feather name="file-text" size={ms(18)} color={colors.blue} />
            </View>
            <Text style={[s.summaryValue, { color: colors.textPrimary }]}>
              {countData.totalBills || 0}
            </Text>
            <Text style={[s.summaryLabel, { color: colors.textSecondary }]}>
              Total Orders
            </Text>
          </Card>
          
          <Card style={s.summaryCard}>
            <View style={[s.iconBox, { backgroundColor: colors.red + "15" }]}>
              <Feather name="alert-triangle" size={ms(18)} color={colors.red} />
            </View>
            <Text style={[s.summaryValue, { color: colors.textPrimary }]}>
              {countData.cancelBills || 0}
            </Text>
            <Text style={[s.summaryLabel, { color: colors.textSecondary }]}>
              Cancelled
            </Text>
          </Card>

          <Card style={s.summaryCard}>
            <View style={[s.iconBox, { backgroundColor: colors.green + "15" }]}>
              <Feather name="gift" size={ms(18)} color={colors.green} />
            </View>
            <Text style={[s.summaryValue, { color: colors.textPrimary }]}>
              {countData.complimentaryBills || 0}
            </Text>
            <Text style={[s.summaryLabel, { color: colors.textSecondary }]}>
              Complimentary
            </Text>
          </Card>
          
          <Card style={s.summaryCard}>
            <View style={[s.iconBox, { backgroundColor: colors.orange + "15" }]}>
              <Feather name="edit-2" size={ms(18)} color={colors.orange} />
            </View>
            <Text style={[s.summaryValue, { color: colors.textPrimary }]}>
              {countData.modifiedBills || 0}
            </Text>
            <Text style={[s.summaryLabel, { color: colors.textSecondary }]}>
              Modified Bills
            </Text>
          </Card>
        </ScrollView>
      </View>
    );
  };

  const renderOrderTypeBreakdown = () => {
    const list = dashboardData?.dashBoardSalesList || [];
    if (list.length === 0) return null;

    const formatLabel = (val: string) => {
      const v = val.toLowerCase().trim();
      const map: Record<string, string> = { ret: "Retail Sales", can: "Cancel Bills", com: "Compliment Bills", tot: "Total" };
      return map[v] || val;
    };

    const maxValue = Math.max(...list.map((i: any) => i.paidAmount || 0), 1);

    return (
      <View style={s.section}>
        <SectionHeader title="Order Type Breakdown" />
        <Card style={s.breakdownCard}>
          {list.map((item: any, idx: number) => {
            const val = item.paidAmount || 0;
            const pct = (val / maxValue) * 100;
            const isCancel = item.hours.toLowerCase().includes('can');
            const color = isCancel ? colors.red : colors.primary;
            return (
              <View key={idx} style={s.breakdownRow}>
                <View style={s.breakdownHeader}>
                  <Text style={[s.breakdownLabel, { color: colors.textPrimary }]}>
                    {formatLabel(item.hours)}
                  </Text>
                  <Text style={[s.breakdownValue, { color: colors.textPrimary }]}>
                    ₹{val.toLocaleString()}
                  </Text>
                </View>
                <View style={[s.breakdownTrack, { backgroundColor: colors.border }]}>
                  <View style={[s.breakdownFill, { width: `${pct}%`, backgroundColor: color }]} />
                </View>
              </View>
            );
          })}
        </Card>
      </View>
    );
  };

  const renderHourlyGraph = () => {
    const hourlyList = dashboardData?.dashBoardHourlyList || [];
    if (hourlyList.length === 0) return null;

    const formatHourLabel = (val: string) => {
      const numMatch = val.match(/^(\d+)/);
      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        if (!isNaN(num) && num >= 0 && num <= 24) {
          const ampm = num >= 12 && num < 24 ? "PM" : "AM";
          const h = num % 12 || 12;
          return `${h}${ampm}`;
        }
      }
      return val;
    };

    const maxCount = Math.max(...hourlyList.map((i: any) => i.bills || i.count || i.paidAmount || 0), 1);

    return (
      <View style={s.section}>
        <SectionHeader title="Hourly Orders" />
        <Card style={s.breakdownCard}>
          {hourlyList.map((item: any, idx: number) => {
            const count = item.bills || item.count || item.paidAmount || 0;
            const pct = (count / maxCount) * 100;
            return (
              <View key={idx} style={s.breakdownRow}>
                <View style={s.breakdownHeader}>
                  <Text style={[s.breakdownLabel, { color: colors.textSecondary }]}>
                    {formatHourLabel(item.hours)}
                  </Text>
                  <Text style={[s.breakdownValue, { color: colors.textPrimary }]}>
                    {count} {item.bills || item.count ? "orders" : ""}
                  </Text>
                </View>
                <View style={[s.breakdownTrack, { backgroundColor: colors.border }]}>
                  <View style={[s.breakdownFill, { width: `${pct}%`, backgroundColor: colors.blue }]} />
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
    
    // Take top 10 items
    const topItems = [...items].sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 10);

    return (
      <View style={s.section}>
        <SectionHeader title="Top Ordered Items" />
        {topItems.map((item: any, idx: number) => (
          <Card key={idx} style={s.itemCard}>
            <View style={[s.itemIconWrap, { backgroundColor: colors.primary + "15" }]}>
              {renderIcon(item.productDescription || "")}
            </View>
            <View style={s.itemContent}>
              <Text style={[s.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.productDescription || "Unknown Item"}
              </Text>
              <Text style={[s.itemCategory, { color: colors.textSecondary }]}>
                Category: Retail
              </Text>
            </View>
            <View style={s.itemStats}>
              <Text style={[s.itemOrders, { color: colors.textPrimary }]}>
                {item.count || 0} orders
              </Text>
              <Text style={[s.itemRevenue, { color: colors.textPrimary }]}>
                ₹{(item.totalPrice || 0).toLocaleString()}
              </Text>
            </View>
          </Card>
        ))}
      </View>
    );
  };

  const renderPaymentMethods = () => {
    const pmt = dashboardData?.paymentSplitupList || [];
    if (pmt.length === 0) return null;

    const maxAmt = Math.max(...pmt.map((i: any) => i.paidAmount || 0), 1);

    return (
      <View style={s.section}>
        <SectionHeader title="Payment Methods" />
        <Card style={s.breakdownCard}>
          {pmt.map((item: any, idx: number) => {
            const val = item.paidAmount || 0;
            const pct = (val / maxAmt) * 100;
            return (
              <View key={idx} style={s.breakdownRow}>
                <View style={s.breakdownHeader}>
                  <Text style={[s.breakdownLabel, { color: colors.textPrimary }]}>
                    {item.paymentMethod || "Unknown"}
                  </Text>
                  <Text style={[s.breakdownValue, { color: colors.textPrimary }]}>
                    ₹{val.toLocaleString()}
                  </Text>
                </View>
                <View style={[s.breakdownTrack, { backgroundColor: colors.border }]}>
                  <View style={[s.breakdownFill, { width: `${pct}%`, backgroundColor: colors.green }]} />
                </View>
              </View>
            );
          })}
        </Card>
      </View>
    );
  };

  const renderExpensesSection = () => {
    const expenses = dashboardData?.expensessDashBoardList || [];
    if (expenses.length === 0) return null;

    return (
      <View style={s.section}>
        <SectionHeader title="Order Statistics (Expenses)" />
        <Card style={s.breakdownCard}>
          {expenses.map((item: any, idx: number) => (
             <View key={idx} style={[s.breakdownRow, { marginBottom: idx === expenses.length - 1 ? 0 : hp(12) }]}>
               <View style={s.breakdownHeader}>
                 <Text style={[s.breakdownLabel, { color: colors.textPrimary, textTransform: 'capitalize' }]}>
                   {item.hours} Expenses
                 </Text>
                 <Text style={[s.breakdownValue, { color: colors.textPrimary }]}>
                   ₹{(item.paidAmount || 0).toLocaleString()}
                 </Text>
               </View>
             </View>
          ))}
        </Card>
      </View>
    );
  };


  return (
    <ScreenWrapper>
      {renderHeader()}
      {loading ? (
        <View style={s.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: hp(12), color: colors.textSecondary }}>
            Loading orders...
          </Text>
        </View>
      ) : errorMsg ? (
        <View style={s.centerContainer}>
          <Feather name="alert-circle" size={ms(48)} color={colors.red} style={{ marginBottom: hp(16) }} />
          <Text style={{ textAlign: "center", color: colors.textPrimary, fontSize: ms(16), marginBottom: hp(24), paddingHorizontal: wp(24) }}>
            {errorMsg}
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: colors.primary, paddingHorizontal: wp(24), paddingVertical: hp(12), borderRadius: ms(8) }}
            onPress={() => loadData()}
          >
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
          {renderOrderTypeBreakdown()}
          {renderHourlyGraph()}
          {renderTopItems()}
          {renderPaymentMethods()}
          {renderExpensesSection()}
          <View style={{ height: hp(100) }} />
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: hp(12),
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: ms(4),
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: ms(18),
    fontWeight: "bold",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentPad: {
    paddingBottom: hp(40),
  },
  summaryContainer: {
    marginBottom: hp(24),
  },
  summaryScroll: {
    paddingHorizontal: wp(16),
    gap: wp(12),
  },
  summaryCard: {
    width: wp(130),
    padding: ms(16),
    marginRight: wp(12),
    marginVertical: ms(8),
  },
  iconBox: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(8),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: hp(12),
  },
  summaryValue: {
    fontSize: ms(20),
    fontWeight: "bold",
    marginBottom: hp(4),
  },
  summaryLabel: {
    fontSize: ms(12),
  },
  section: {
    paddingHorizontal: wp(16),
    marginBottom: hp(24),
  },
  breakdownCard: {
    padding: ms(16),
  },
  breakdownRow: {
    marginBottom: hp(16),
  },
  breakdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: hp(6),
  },
  breakdownLabel: {
    fontSize: ms(14),
    fontWeight: "500",
  },
  breakdownValue: {
    fontSize: ms(14),
    fontWeight: "bold",
  },
  breakdownTrack: {
    height: hp(6),
    borderRadius: hp(3),
    width: "100%",
    overflow: "hidden",
  },
  breakdownFill: {
    height: "100%",
    borderRadius: hp(3),
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: ms(12),
    marginBottom: hp(12),
  },
  itemIconWrap: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(12),
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(12),
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: ms(15),
    fontWeight: "600",
    marginBottom: hp(2),
  },
  itemCategory: {
    fontSize: ms(12),
  },
  itemStats: {
    alignItems: "flex-end",
  },
  itemOrders: {
    fontSize: ms(13),
    fontWeight: "500",
    marginBottom: hp(2),
  },
  itemRevenue: {
    fontSize: ms(13),
    fontWeight: "bold",
  },
});
