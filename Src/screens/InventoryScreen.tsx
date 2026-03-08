import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    DeviceEventEmitter,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { getBranchMaster } from "../api/branchService";
import { getSalesDetails } from "../api/dashboardService";
import { Card, ScreenWrapper, SectionHeader } from "../components";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../navigation/AppNavigator";
import { hp, ms, useTheme, wp } from "../theme";

type InventoryScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Main"
>;

export interface InventorySalesItem {
  id: string;
  name: string;
  salesCount: number;
  revenue: number;
  categoryName: string;
}

function getCategoryFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("burger")) return "Burger";
  if (lower.includes("cake") || lower.includes("dessert") || lower.includes("pastry") || lower.includes("sweets")) return "Cakes";
  if (lower.includes("lunch") || lower.includes("meal") || lower.includes("dinner") || lower.includes("breakfast") || lower.includes("thali") || lower.includes("rice")) return "Lunch";
  if (lower.includes("pizza")) return "Pizza";
  if (lower.includes("grocery") || lower.includes("pista") || lower.includes("box") || lower.includes("kg") || lower.includes("pcs") || lower.includes("veg")) return "Grocery";
  if (lower.includes("drink") || lower.includes("juice") || lower.includes("milk") || lower.includes("water") || lower.includes("tea") || lower.includes("coffee")) return "Beverages";
  if (lower.includes("chicken") || lower.includes("meat")) return "Non-Veg";
  return "Other";
}

export default function InventoryScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<InventoryScreenNavigationProp>();
  const { authData } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [products, setProducts] = useState<InventorySalesItem[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<
    InventorySalesItem[]
  >([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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

        console.log(
          "[InventoryScreen] Request Payload:",
          JSON.stringify(payload, null, 2),
        );

        const dbData = await getSalesDetails(payload);
        const itemWise = dbData?.dashBoardItemWiseSalesList || [];

        const rawProducts: InventorySalesItem[] = itemWise.map(
          (it: any, index: number) => ({
            id: `prod_${index}`,
            name: it.productDescription || "Unknown",
            salesCount: it.count || 0,
            revenue: it.totalPrice || 0,
            categoryName: it.menuCategoryName || it.categoryName || getCategoryFromName(it.productDescription || "Unknown"),
          }),
        );

        // Sort by sales quantity initially
        rawProducts.sort((a, b) => b.salesCount - a.salesCount);

        setProducts(rawProducts);
        setFilteredProducts(rawProducts);
      } catch (error) {
        console.error("Failed to fetch inventory data from Sales API:", error);
        setErrorMsg(
          "Failed to load inventory data. Please check your network connection and try again.",
        );
        setProducts([]);
        setFilteredProducts([]);
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

  // Filter logic
  useEffect(() => {
    let result = products;

    if (searchQuery.trim() !== "") {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    setFilteredProducts(result);
  }, [searchQuery, products]);

  const renderIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("burger"))
      return (
        <MaterialCommunityIcons
          name="hamburger"
          size={ms(24)}
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
          size={ms(24)}
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
          size={ms(24)}
          color={colors.primary}
        />
      );
    if (lower.includes("pizza"))
      return (
        <MaterialCommunityIcons
          name="pizza"
          size={ms(24)}
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
          size={ms(24)}
          color={colors.primary}
        />
      );
    if (lower.includes("tea") || lower.includes("coffee"))
      return (
        <MaterialCommunityIcons
          name="coffee"
          size={ms(24)}
          color={colors.primary}
        />
      );
    if (lower.includes("ice cream"))
      return (
        <MaterialCommunityIcons
          name="ice-cream"
          size={ms(24)}
          color={colors.primary}
        />
      );
    if (lower.includes("chicken") || lower.includes("meat"))
      return (
        <MaterialCommunityIcons
          name="food-drumstick"
          size={ms(24)}
          color={colors.primary}
        />
      );

    return <Feather name="box" size={ms(24)} color={colors.primary} />;
  };

  const renderSummaryCards = () => {
    return (
      <View>
        <SectionHeader title="Inventory Based On Sales" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hScrollContent}
        >
          <Card style={styles.summaryCard}>
            <View
              style={[styles.iconBox, { backgroundColor: colors.blue + "20" }]}
            >
              <Feather name="box" size={ms(18)} color={colors.blue} />
            </View>
            <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
              {products.length}
            </Text>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Items Sold
            </Text>
          </Card>
          <Card style={styles.summaryCard}>
            <View
              style={[styles.iconBox, { backgroundColor: colors.green + "20" }]}
            >
              <Feather
                name="shopping-cart"
                size={ms(18)}
                color={colors.green}
              />
            </View>
            <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
              {products.reduce((acc, curr) => acc + curr.salesCount, 0)}
            </Text>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Total Qty Sold
            </Text>
          </Card>
        </ScrollView>
      </View>
    );
  };

  const renderInsights = () => {
    if (products.length === 0) return null;

    // Aggregate by category
    const categoryDataMap = products.reduce((acc, curr) => {
      const cat = curr.categoryName || "Other";
      if (!acc[cat]) {
        acc[cat] = { category: cat, count: 0, revenue: 0 };
      }
      acc[cat].count += curr.salesCount;
      acc[cat].revenue += curr.revenue;
      return acc;
    }, {} as Record<string, { category: string; count: number; revenue: number; }>);

    let chartData = Object.values(categoryDataMap)
      .sort((a, b) => b.count - a.count);

    // Limit to top 4 categories and group the rest into "Other"
    if (chartData.length > 5) {
      const top4 = chartData.slice(0, 4);
      const others = chartData.slice(4).reduce((acc, curr) => {
        acc.count += curr.count;
        acc.revenue += curr.revenue;
        return acc;
      }, { category: "Other", count: 0, revenue: 0 });
      chartData = [...top4, others].sort((a, b) => b.count - a.count);
    }

    const totalItems = chartData.reduce((sum, item) => sum + item.count, 0);

    const pieColors = ["#3B82F6", "#F59E0B", "#10B981", "#8B5CF6", "#EC4899", "#94A3B8"];

    const size = wp(130);
    const strokeWidth = wp(20);
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    let startAngle = -Math.PI / 2;

    const renderIconForCategory = (catName: string, color: string) => {
      const lower = catName.toLowerCase();
      if (lower.includes("burger")) return <MaterialCommunityIcons name="hamburger" size={ms(16)} color={color} />;
      if (lower.includes("cake")) return <MaterialCommunityIcons name="cake-variant" size={ms(16)} color={color} />;
      if (lower.includes("lunch")) return <MaterialCommunityIcons name="food-fork-drink" size={ms(16)} color={color} />;
      if (lower.includes("grocery")) return <MaterialCommunityIcons name="basket" size={ms(16)} color={color} />;
      if (lower.includes("beverage") || lower.includes("drink")) return <MaterialCommunityIcons name="cup-water" size={ms(16)} color={color} />;
      if (lower.includes("pizza")) return <MaterialCommunityIcons name="pizza" size={ms(16)} color={color} />;
      if (lower.includes("veg")) return <MaterialCommunityIcons name="food-drumstick" size={ms(16)} color={color} />;
      return <Feather name="grid" size={ms(16)} color={color} />;
    };

    return (
      <View>
        <SectionHeader 
          title="Inventory Insights"
          rightElement={<Text style={{ fontSize: ms(12), color: colors.textTertiary }}>Quick view</Text>}
        />
        <View style={styles.insightsContainer}>
          <Card style={styles.donutCard}>
            <View style={styles.donutHeader}>
              <View style={[styles.donutIconWrap, { backgroundColor: colors.primary + "1A" }]}>
                <Feather name="pie-chart" size={ms(20)} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.donutTitle, { color: colors.textPrimary }]}>
                  Inventory Distribution
                </Text>
                <Text style={[styles.donutSub, { color: colors.textTertiary }]}>
                  By product category
                </Text>
              </View>
            </View>

            <View style={styles.donutBody}>
              {/* Donut Chart SVG */}
              <View style={[styles.chartWrapper, { width: size, height: size }]}>
                <Svg width={size} height={size}>
                  {totalItems === 0 ? (
                    <Circle cx={center} cy={center} r={radius} stroke={colors.border} strokeWidth={strokeWidth} fill="none" />
                  ) : (
                    chartData.map((d, i) => {
                      if (d.count === 0) return null;
                      
                      const sliceAngle = (d.count / totalItems) * 2 * Math.PI;
                      const endAngle = startAngle + sliceAngle;
                      const gap = sliceAngle < 0.1 || chartData.length === 1 ? 0 : 0.05;
                      const color = pieColors[i % pieColors.length];
                      
                      const pathData = (() => {
                        const start = startAngle + gap / 2;
                        const end = endAngle - gap / 2;
                        const x1 = center + radius * Math.cos(start);
                        const y1 = center + radius * Math.sin(start);
                        const x2 = center + radius * Math.cos(end);
                        const y2 = center + radius * Math.sin(end);
                        
                        // Handle full circle 
                        if (end - start >= 2 * Math.PI - 0.01) {
                            return "";
                        }
                        const largeArcFlag = end - start <= Math.PI ? "0" : "1";
                        return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
                      })();
                      
                      const elm = sliceAngle >= 2 * Math.PI - 0.01 ? (
                        <Circle key={`arc_${i}`} cx={center} cy={center} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" />
                      ) : (
                        <Path key={`arc_${i}`} d={pathData} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
                      );
        
                      startAngle = endAngle;
                      return elm;
                    })
                  )}
                </Svg>
                <View style={[styles.chartCenterOverlay, { zIndex: -1 }]}>
                  <Text style={[styles.chartTotalText, { color: colors.textPrimary }]} numberOfLines={1}>
                    {totalItems}
                  </Text>
                  <Text style={[styles.chartTotalLabel, { color: colors.textSecondary }]}>
                    Qty
                  </Text>
                </View>
              </View>

              {/* Legend */}
              <View style={styles.legendContainer}>
                {chartData.map((d, i) => {
                  const color = pieColors[i % pieColors.length];
                  const percentage = totalItems > 0 ? ((d.count / totalItems) * 100).toFixed(0) : "0";
                  
                  return (
                    <View key={`leg_${i}`} style={styles.legendRow}>
                      <View style={[styles.legendIconBox, { backgroundColor: color + "1A" }]}>
                        {renderIconForCategory(d.category, color)}
                      </View>
                      <View style={styles.legendTextContent}>
                        <Text style={[styles.legendCategory, { color: colors.textPrimary }]} numberOfLines={1}>
                          {d.category}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                          <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
                            {d.count} qty
                          </Text>
                          <Text style={{ fontSize: ms(10), color: colors.textTertiary, fontWeight: "600" }}>{percentage}%</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </Card>
        </View>
      </View>
    );
  };

  const renderFilters = () => {
    const suggestions = searchQuery.trim() !== ""
      ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
      : [];
    const showSuggestions = isSearchFocused && searchQuery.length > 0 && suggestions.length > 0;

    return (
      <View style={[styles.filtersContainer, { zIndex: 10 }]}>
        <View style={{ position: 'relative', zIndex: 11 }}>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
              },
            ]}
          >
            <Feather
              name="search"
              size={ms(18)}
              color={colors.placeholder}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search items..."
              placeholderTextColor={colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                setTimeout(() => setIsSearchFocused(false), 200);
              }}
            />
            {searchQuery !== "" && (
              <TouchableOpacity onPress={() => {
                setSearchQuery("");
                setIsSearchFocused(false);
                Keyboard.dismiss();
              }}>
                <Feather name="x" size={ms(18)} color={colors.placeholder} />
              </TouchableOpacity>
            )}
          </View>

          {showSuggestions && (
            <View style={[styles.suggestionsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: hp(200) }}>
                {suggestions.map((item, index) => (
                  <TouchableOpacity
                    key={`sug_${item.id}`}
                    style={[
                      styles.suggestionItem,
                      index !== suggestions.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }
                    ]}
                    onPress={() => {
                      setSearchQuery(item.name);
                      setIsSearchFocused(false);
                      Keyboard.dismiss();
                    }}
                  >
                    <View style={[styles.suggestionIconWrap, { backgroundColor: colors.primary + "1A" }]}>
                      <Feather name="search" size={ms(14)} color={colors.primary} />
                    </View>
                    <Text style={[styles.suggestionText, { color: colors.textPrimary }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: ms(12), color: colors.textTertiary }}>
                      {item.salesCount} sold
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderProductItem = ({ item }: { item: InventorySalesItem }) => {
    // We only pass the limited properties we have to ProductDetail via a mapped object compatible with old type
    const mockProduct = {
      id: item.id,
      name: item.name,
      price: item.revenue / Math.max(item.salesCount, 1),
      value: item.revenue,
      salesCount: item.salesCount,
    };

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate("ProductDetail", { product: mockProduct })
        }
      >
        <Card style={styles.productCard}>
          <View style={styles.productHeader}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              {renderIcon(item.name)}
            </View>
            <View style={styles.productInfo}>
              <Text
                style={[styles.productName, { color: colors.textPrimary }]}
                numberOfLines={2}
              >
                {item.name}
              </Text>
            </View>
            <View
              style={[styles.statusBadge, { backgroundColor: colors.blueBg }]}
            >
              <Text style={[styles.statusText, { color: colors.blue }]}>
                Sold: {item.salesCount}
              </Text>
            </View>
          </View>

          <View style={styles.productDataRow}>
            <View style={styles.dataColWrapper}>
              <View style={styles.dataCol}>
                <Text
                  style={[styles.dataLabel, { color: colors.textSecondary }]}
                >
                  Estimated Price
                </Text>
                <Text style={[styles.dataValue, { color: colors.textPrimary }]}>
                  ₹{(item.revenue / Math.max(item.salesCount, 1)).toFixed(2)}
                </Text>
              </View>
              <View style={styles.dataColRight}>
                <Text
                  style={[styles.dataLabel, { color: colors.textSecondary }]}
                >
                  Total Revenue
                </Text>
                <Text style={[styles.dataValue, { color: colors.textPrimary }]}>
                  ₹{item.revenue.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: hp(12), color: colors.textSecondary }}>
            Fetching inventory data...
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (errorMsg) {
    return (
      <ScreenWrapper>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Feather
              name="arrow-left"
              size={ms(24)}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Inventory
          </Text>
          <View style={{ width: ms(24) }} />
        </View>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: hp(40),
          }}
        >
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
            onPress={() => loadData()}
          >
            <Text style={{ color: "#FFF", fontWeight: "bold" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={ms(24)} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Inventory
          </Text>
          <View style={{ width: ms(24) }} />
        </View>

        <FlatList
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={{ zIndex: 10 }}>
              <View style={{ zIndex: 1 }}>{renderSummaryCards()}</View>
              <View style={{ zIndex: 3 }}>{renderFilters()}</View>
              <View style={{ zIndex: 2 }}>{renderInsights()}</View>
            </View>
          }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="box" size={ms(48)} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No items found.
            </Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: hp(100) }} />} // padding for bottom tabs
      />
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: hp(12),
    marginBottom: hp(8),
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: hp(24),
  },
  hScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: hp(16),
    gap: wp(12),
  },
  summaryCard: {
    width: wp(140),
    padding: ms(16),
    marginRight: wp(12),
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
    fontSize: ms(22),
    fontWeight: "bold",
    marginBottom: hp(4),
  },
  summaryLabel: {
    fontSize: ms(12),
  },
  insightsContainer: {
    paddingHorizontal: 16,
    paddingBottom: hp(16),
  },
  donutCard: {
    padding: ms(20),
    margin: 0,
    width: "100%",
    borderRadius: ms(16),
  },
  donutHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(24),
  },
  donutIconWrap: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(12),
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(12),
  },
  donutTitle: {
    fontSize: ms(16),
    fontWeight: "bold",
  },
  donutSub: {
    fontSize: ms(12),
    marginTop: hp(2),
  },
  donutBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  chartCenterOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: -1,
  },
  chartTotalText: {
    fontSize: ms(22),
    fontWeight: "bold",
  },
  chartTotalLabel: {
    fontSize: ms(12),
  },
  legendContainer: {
    flex: 1,
    marginLeft: wp(24),
    gap: hp(12),
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendIconBox: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(8),
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(10),
  },
  legendTextContent: {
    flex: 1,
  },
  legendCategory: {
    fontSize: ms(12),
    fontWeight: "600",
    marginBottom: hp(2),
  },
  legendValue: {
    fontSize: ms(12),
    fontWeight: "500",
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: hp(16),
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: wp(12),
    height: hp(45),
  },
  searchIcon: {
    marginRight: wp(8),
  },
  searchInput: {
    flex: 1,
    fontSize: ms(14),
  },
  suggestionsContainer: {
    position: 'absolute',
    top: hp(50),
    left: 0,
    right: 0,
    borderRadius: ms(12),
    borderWidth: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
    zIndex: 100,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ms(12),
  },
  suggestionIconWrap: {
    width: ms(28),
    height: ms(28),
    borderRadius: ms(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(10),
  },
  suggestionText: {
    flex: 1,
    fontSize: ms(14),
    fontWeight: '500',
    marginRight: wp(8),
  },
  productCard: {
    marginHorizontal: 16,
    marginBottom: hp(12),
    padding: ms(16),
  },
  productHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(16),
  },
  iconWrap: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(12),
  },
  productInfo: {
    flex: 1,
    paddingRight: wp(8),
    justifyContent: "center",
  },
  productName: {
    fontSize: ms(16),
    fontWeight: "bold",
  },
  statusBadge: {
    paddingHorizontal: wp(8),
    paddingVertical: hp(4),
    borderRadius: ms(8),
  },
  statusText: {
    fontSize: ms(10),
    fontWeight: "bold",
  },
  productDataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: hp(8),
  },
  dataCol: {
    flex: 1,
  },
  dataColRight: {
    alignItems: "flex-end",
    flex: 1,
  },
  dataColWrapper: {
    flex: 1,
    flexDirection: "row",
  },
  dataLabel: {
    fontSize: ms(12),
    marginBottom: hp(4),
  },
  dataValue: {
    fontSize: ms(14),
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(60),
  },
  emptyText: {
    marginTop: hp(16),
    fontSize: ms(14),
    textAlign: "center",
  },
});
