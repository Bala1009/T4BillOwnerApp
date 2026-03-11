import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator, DeviceEventEmitter, RefreshControl,
  Animated, Easing,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, Path, G, Line, Text as SvgText } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { GradientHeader, DateRangePicker, type DateRangePickerRef, ScreenWrapper } from '../components';
import { useAuth } from '../context/AuthContext';
import { useDateFilter } from '../context/DateFilterContext';
import { getBranchMaster } from '../api/branchService';
import { getSalesDetails } from '../api/dashboardService';
import { hp, ms, useTheme, wp } from '../theme';

const { width: scrWidth } = Dimensions.get('window');

// ─── Chip definitions ────────────────────────────────────────────────────────
type ChipKey = 'Overall' | 'Sales' | 'Service' | 'Quality';
const CHIPS: ChipKey[] = ['Overall', 'Sales', 'Service', 'Quality'];

const CHIP_ICONS: Record<ChipKey, string> = {
  Overall: 'activity',
  Sales: 'trending-up',
  Service: 'star',
  Quality: 'award',
};

// ─── Shimmer skeleton ────────────────────────────────────────────────────────
function ShimmerBox({ width, height, style }: { width?: number | string; height: number; style?: any }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.ease }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true, easing: Easing.ease }),
      ])
    ).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return (
    <Animated.View
      style={[
        { backgroundColor: '#9CA3AF', borderRadius: ms(8), opacity },
        typeof width === 'number' ? { width, height } : { height, alignSelf: 'stretch' },
        style,
      ]}
    />
  );
}

// ─── Animated progress bar ────────────────────────────────────────────────────
function AnimatedBar({ percent, color, bg }: { percent: number; color: string; bg: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: percent, duration: 700, useNativeDriver: false, easing: Easing.out(Easing.cubic) }).start();
  }, [percent]);
  const widthInterp = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return (
    <View style={[s.kpiProgressBar, { backgroundColor: bg }]}>
      <Animated.View style={[s.kpiProgressFill, { width: widthInterp as any, backgroundColor: color }]} />
    </View>
  );
}

// ─── Animated score ring ──────────────────────────────────────────────────────
function AnimatedRing({ score, colors }: { score: number; colors: any }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, { toValue: score, duration: 900, useNativeDriver: false, easing: Easing.out(Easing.cubic) }).start();
    const listener = anim.addListener(({ value }) => setDisplayScore(Math.round(value)));
    return () => anim.removeListener(listener);
  }, [score]);

  const size = ms(200);
  const strokeW = ms(16);
  const center = size / 2;
  const radius = center - strokeW;
  const circum = 2 * Math.PI * radius;
  const strokeDashoffset = circum - (displayScore / 100) * circum;

  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.purple} />
          <Stop offset="1" stopColor={colors.red} />
        </LinearGradient>
      </Defs>
      <Circle cx={center} cy={center} r={radius} stroke={colors.bg} strokeWidth={strokeW} fill="none" />
      <Circle
        cx={center} cy={center} r={radius}
        stroke="url(#scoreGrad)"
        strokeWidth={strokeW}
        fill="none"
        strokeDasharray={circum}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${center}, ${center}`}
      />
    </Svg>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function PerformanceScreen() {
  const { colors } = useTheme();
  const { authData } = useAuth();
  const navigation = useNavigation<any>();
  // Global date from Dashboard calendar
  const { startDate, endDate, dateRange, activeFilter, setDateFilter } = useDateFilter();

  const calendarRef = useRef<DateRangePickerRef>(null);

  const [activeChip, setActiveChip] = useState<ChipKey>('Overall');
  const [trendPeriod, setTrendPeriod] = useState('This Month');
  const [loading, setLoading] = useState(true);
  const [chipTransitioning, setChipTransitioning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [salesData, setSalesData] = useState<any>(null);
  const [trendSalesData, setTrendSalesData] = useState<any>(null);
  const [trendLoading, setTrendLoading] = useState(false);
  const [showTrendDropdown, setShowTrendDropdown] = useState(false);

  // Fade animation for content section swap
  const contentOpacity = useRef(new Animated.Value(1)).current;
  // Scale for pressed chip
  const chipScales = useRef(
    Object.fromEntries(CHIPS.map(c => [c, new Animated.Value(1)])) as Record<ChipKey, Animated.Value>
  ).current;

  /* ── Data loading ────────────────────────────────────────── */
  const loadData = useCallback(async (forcedBranchId?: number) => {
    if (!authData?.ClientID) return;
    try {
      setLoading(true);
      let branchIdNum = forcedBranchId || 0;

      // Load saved branch once — reused for both branchId and metadata
      const savedStr = await AsyncStorage.getItem('selectedBranch');

      if (!branchIdNum) {
        if (savedStr) {
          const sb = JSON.parse(savedStr);
          branchIdNum = sb?.BranchID || sb?.branchID || sb?.BranchId || sb?.branchId || sb?.id || sb?.ID || 0;
        }
      }
      if (!branchIdNum) {
        const list = await getBranchMaster(Number(authData.ClientID));
        if (list?.length > 0) {
          const sb = list[0];
          branchIdNum = sb?.BranchID || sb?.branchID || sb?.BranchId || sb?.branchId || sb?.id || sb?.ID || 0;
        }
      }

      // Use the global date range from the Dashboard calendar
      const activeBranch = savedStr ? JSON.parse(savedStr) : null;
      const payload: any = {
        startDate, endDate,
        branchID: branchIdNum, clientID: Number(authData.ClientID),
      };
      const phase = activeBranch?.Phase || activeBranch?.phase || null;
      if (phase) payload.phase = phase;
      if (activeBranch?.IsActive || activeBranch?.isActive) payload.isActive = true;
      const vendorId = activeBranch?.VendorID || activeBranch?.vendorID || 0;
      if (vendorId) payload.vendorID = vendorId;

      const data = await getSalesDetails(payload);
      setSalesData(data);
    } catch (e) {
      console.error('[PerformanceScreen] fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authData?.ClientID, startDate, endDate]);

  useEffect(() => {
    loadData();
    const sub = DeviceEventEmitter.addListener('BRANCH_CHANGED', (branch) => {
      const id = branch?.BranchID || branch?.branchID || branch?.BranchId || branch?.branchId || branch?.id || 0;
      if (id) loadData(id);
    });
    return () => sub.remove();
  }, [loadData]);

  /* ── Trend-specific data loading ─────────────────────────── */
  const loadTrendData = useCallback(async (period: string) => {
    if (!authData?.ClientID) return;
    try {
      setTrendLoading(true);
      const now = new Date();
      let tStart: string;
      const tEnd = now.toISOString().split('T')[0];
      if (period === 'Today') {
        tStart = tEnd;
      } else if (period === 'Last 7 Days') {
        const d = new Date(now);
        d.setDate(d.getDate() - 6);
        tStart = d.toISOString().split('T')[0];
      } else {
        const d = new Date(now);
        d.setDate(d.getDate() - 29);
        tStart = d.toISOString().split('T')[0];
      }
      let branchIdNum = 0;
      const savedStr = await AsyncStorage.getItem('selectedBranch');
      if (savedStr) {
        const sb = JSON.parse(savedStr);
        branchIdNum = sb?.BranchID || sb?.branchID || sb?.BranchId || sb?.branchId || sb?.id || sb?.ID || 0;
      }
      if (!branchIdNum) {
        const list = await getBranchMaster(Number(authData.ClientID));
        if (list?.length > 0) {
          branchIdNum = list[0]?.BranchID || list[0]?.branchID || 0;
        }
      }
      const activeBranch = savedStr ? JSON.parse(savedStr) : null;
      const payload: any = {
        startDate: tStart, endDate: tEnd,
        branchID: branchIdNum, clientID: Number(authData.ClientID),
      };
      const phase = activeBranch?.Phase || activeBranch?.phase || null;
      if (phase) payload.phase = phase;
      if (activeBranch?.IsActive || activeBranch?.isActive) payload.isActive = true;
      const vendorId = activeBranch?.VendorID || activeBranch?.vendorID || 0;
      if (vendorId) payload.vendorID = vendorId;
      const data = await getSalesDetails(payload);
      setTrendSalesData(data);
    } catch (e) {
      console.error('[PerformanceScreen] trend fetch error:', e);
    } finally {
      setTrendLoading(false);
    }
  }, [authData?.ClientID]);

  /* ── Chip press with fade animation ─────────────────────── */
  const handleChipPress = (chip: ChipKey) => {
    if (chip === activeChip) return;

    // Scale-bounce the pressed chip
    Animated.sequence([
      Animated.timing(chipScales[chip], { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(chipScales[chip], { toValue: 1, useNativeDriver: true }),
    ]).start();

    // Fade out → switch → fade in
    setChipTransitioning(true);
    Animated.timing(contentOpacity, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      setActiveChip(chip);
      setChipTransitioning(false);
      Animated.timing(contentOpacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
    });
  };

  /* ── Raw API values ──────────────────────────────────────── */
  const items: any[] = salesData?.dashBoardItemWiseSalesList || [];
  const countData = salesData?.dashBoardCount || {};
  const salesList: any[] = salesData?.dashBoardSalesList || [];

  const totalBills = countData.totalBills || 0;
  const todayPayments = countData.todaysPayments || 0;
  const todayExpenses = countData.todayExpenses || 0;
  const cancelBills = countData.cancelBills || 0;
  const compBills = countData.complimentaryBills || countData.complimentBills || 0;
  const modifiedBills = countData.modifiedBills || 0;
  const profit = todayPayments - todayExpenses;

  const sortedByCount = [...items].sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 5);
  const sortedByRevenue = [...items].sort((a, b) => (b.totalPrice || 0) - (a.totalPrice || 0)).slice(0, 5);
  const maxCount = sortedByCount.length > 0 ? (sortedByCount[0].count || 1) : 1;
  const maxRevenue = sortedByRevenue.length > 0 ? (sortedByRevenue[0].totalPrice || 1) : 1;

  const totalRevenue = items.reduce((s, i) => s + (i.totalPrice || 0), 0);
  const totalQty = items.reduce((s, i) => s + (i.count || 0), 0);
  const avgOrderValue = totalBills > 0 ? Math.round(todayPayments / totalBills) : 0;
  const uniqueItems = items.length;

  const trendData = salesList.map((d: any) => d.paidAmount || 0);
  const trendLabels = salesList.map((d: any) => {
    if (!d.hours) return '';
    const s = (d.hours || '').toString().toLowerCase();
    const map: Record<string, string> = { sunday: 'Sun', monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', ret: 'Retail', can: 'Canc', com: 'Comp' };
    return map[s] || s.substring(0, 3);
  });

  /* ── Per-chip derived data ───────────────────────────────── */
  type ChipData = {
    score: number;
    scoreLabel: string;
    scoreColor: string;
    metrics: { id: string; title: string; icon: any; value: string; progress: number; color: string; bg: string }[];
    performersList: any[];
    maxPerformerVal: number;
    getPerformerPct: (item: any) => number;
    getPerformerStats: (item: any) => string;
    areaTitle: string;
    areas: { id: string; label: string; color: string; current: string; target: string; progress: number }[];
  };

  const cancelledAmt = salesList.find((d: any) => (d.hours || '').toLowerCase().includes('can'))?.paidAmount || 0;
  const retailAmt = salesList.find((d: any) => (d.hours || '').toLowerCase().includes('ret'))?.paidAmount || 0;
  const compAmt = salesList.find((d: any) => (d.hours || '').toLowerCase().includes('com'))?.paidAmount || 0;
  const totalBreakdown = retailAmt + cancelledAmt + compAmt || 1;

  // Score: profit as a percentage of revenue, clamped [0,100]. 0 when no data.
  const profitMargin = (totalRevenue > 0 && todayPayments > 0)
    ? Math.min(100, Math.max(0, Math.round((profit / totalRevenue) * 100 + 50)))
    : (totalBills > 0 ? Math.min(100, Math.round((totalBills / Math.max(totalBills, 1)) * 80)) : 0);

  const chipDataMap: Record<ChipKey, ChipData> = {
    Overall: {
      score: profitMargin,
      scoreLabel: totalBills > 0 ? `${totalBills} total bills` : 'No data',
      scoreColor: colors.green,
      metrics: [
        { id: '1', title: 'Revenue', icon: 'trending-up', value: `₹${(todayPayments / 1000).toFixed(1)}K`, progress: Math.min(100, todayPayments > 0 && totalRevenue > 0 ? Math.round((todayPayments / (todayPayments + todayExpenses || 1)) * 100) : 0), color: colors.orange, bg: colors.orangeBg },
        { id: '2', title: 'Unique Items', icon: 'grid', value: `${uniqueItems}`, progress: Math.min(100, uniqueItems > 0 ? Math.round((uniqueItems / Math.max(uniqueItems, 20)) * 100) : 0), color: colors.green, bg: colors.greenBg },
        { id: '3', title: 'Avg Order Val', icon: 'dollar-sign', value: `₹${avgOrderValue}`, progress: Math.min(100, avgOrderValue > 0 && todayPayments > 0 ? Math.round((avgOrderValue / (todayPayments / Math.max(totalBills, 1))) * 50) : 0), color: colors.blue, bg: colors.blueBg },
        { id: '4', title: 'Total Bills', icon: 'file-text', value: `${totalBills}`, progress: Math.min(100, totalBills > 0 ? Math.round(((totalBills - cancelBills) / Math.max(totalBills, 1)) * 100) : 0), color: colors.purple, bg: colors.purpleBg },
      ],
      performersList: sortedByCount,
      maxPerformerVal: maxCount,
      getPerformerPct: (item) => maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0,
      getPerformerStats: (item) => `${item.count} orders • ₹${(item.totalPrice || 0).toLocaleString()}`,
      areaTitle: 'Revenue Breakdown',
      areas: [
        { id: '1', label: 'Retail Orders', color: colors.green, current: `₹${retailAmt.toLocaleString()}`, target: `${totalBreakdown > 1 ? Math.round((retailAmt / totalBreakdown) * 100) : 0}%`, progress: Math.min(100, Math.round((retailAmt / totalBreakdown) * 100)) },
        { id: '2', label: 'Cancellations', color: colors.red, current: `₹${cancelledAmt.toLocaleString()}`, target: `${totalBreakdown > 1 ? Math.round((cancelledAmt / totalBreakdown) * 100) : 0}%`, progress: Math.min(100, Math.round((cancelledAmt / totalBreakdown) * 100)) },
        { id: '3', label: 'Complimentary', color: colors.orange, current: `₹${compAmt.toLocaleString()}`, target: `${totalBreakdown > 1 ? Math.round((compAmt / totalBreakdown) * 100) : 0}%`, progress: Math.min(100, Math.round((compAmt / totalBreakdown) * 100)) },
        { id: '4', label: 'Expenses', color: colors.purple, current: `₹${todayExpenses.toLocaleString()}`, target: todayPayments > 0 ? `${Math.round((todayExpenses / todayPayments) * 100)}%` : '0%', progress: Math.min(100, todayPayments > 0 ? Math.round((todayExpenses / todayPayments) * 100) : 0) },
      ],
    },

    Sales: {
      score: Math.min(100, todayPayments > 0 ? Math.round((retailAmt / Math.max(todayPayments, 1)) * 100) : 0),
      scoreLabel: `₹${todayPayments.toLocaleString()} revenue`,
      scoreColor: colors.orange,
      metrics: [
        { id: '1', title: 'Gross Revenue', icon: 'trending-up', value: `₹${(todayPayments / 1000).toFixed(1)}K`, progress: Math.min(100, todayPayments > 0 ? Math.round((retailAmt / Math.max(todayPayments, 1)) * 100) : 0), color: colors.orange, bg: colors.orangeBg },
        { id: '2', title: 'Retail Amount', icon: 'shopping-bag', value: `₹${(retailAmt / 1000).toFixed(1)}K`, progress: Math.min(100, Math.round((retailAmt / Math.max(todayPayments, 1)) * 100)), color: colors.green, bg: colors.greenBg },
        { id: '3', title: 'Profit', icon: 'dollar-sign', value: `₹${(profit / 1000).toFixed(1)}K`, progress: Math.min(100, profit > 0 ? Math.round((profit / Math.max(todayPayments, 1)) * 100) : 0), color: colors.blue, bg: colors.blueBg },
        { id: '4', title: 'Cancelled Amt', icon: 'x-circle', value: `₹${(cancelledAmt / 1000).toFixed(1)}K`, progress: Math.min(100, Math.round((cancelledAmt / Math.max(todayPayments, 1)) * 100)), color: colors.red, bg: colors.redBg },
      ],
      performersList: sortedByRevenue,
      maxPerformerVal: maxRevenue,
      getPerformerPct: (item) => maxRevenue > 0 ? Math.round((item.totalPrice / maxRevenue) * 100) : 0,
      getPerformerStats: (item) => `₹${(item.totalPrice || 0).toLocaleString()} revenue • ${item.count} qty`,
      areaTitle: 'Sales Distribution',
      areas: [
        { id: '1', label: 'Retail Sales', color: colors.green, current: `₹${retailAmt.toLocaleString()}`, target: `${Math.round((retailAmt / totalBreakdown) * 100)}%`, progress: Math.min(100, Math.round((retailAmt / totalBreakdown) * 100)) },
        { id: '2', label: 'Cancelled Bills', color: colors.red, current: `₹${cancelledAmt.toLocaleString()}`, target: 'Reduce', progress: Math.min(100, Math.round((cancelledAmt / totalBreakdown) * 100)) },
        { id: '3', label: 'Complimentary', color: colors.purple, current: `₹${compAmt.toLocaleString()}`, target: `${Math.round((compAmt / totalBreakdown) * 100)}%`, progress: Math.min(100, Math.round((compAmt / totalBreakdown) * 100)) },
      ],
    },

    Service: {
      score: Math.min(100, totalBills > 0 ? Math.round(((totalBills - cancelBills) / Math.max(totalBills, 1)) * 100) : 0),
      scoreLabel: `${totalBills - cancelBills} fulfilled`,
      scoreColor: colors.blue,
      metrics: [
        { id: '1', title: 'Total Orders', icon: 'file-text', value: `${totalBills}`, progress: Math.min(100, totalBills > 0 ? Math.round(((totalBills - cancelBills) / Math.max(totalBills, 1)) * 100) : 0), color: colors.blue, bg: colors.blueBg },
        { id: '2', title: 'Fulfilled', icon: 'check-circle', value: `${Math.max(0, totalBills - cancelBills)}`, progress: Math.min(100, totalBills > 0 ? Math.round(((totalBills - cancelBills) / totalBills) * 100) : 0), color: colors.green, bg: colors.greenBg },
        { id: '3', title: 'Cancelled', icon: 'x-circle', value: `${cancelBills}`, progress: Math.min(100, totalBills > 0 ? Math.round((cancelBills / totalBills) * 100) : 0), color: colors.red, bg: colors.redBg },
        { id: '4', title: 'Modified Bills', icon: 'edit-2', value: `${modifiedBills}`, progress: Math.min(100, totalBills > 0 ? Math.round((modifiedBills / totalBills) * 100) : 0), color: colors.orange, bg: colors.orangeBg },
      ],
      performersList: sortedByCount,
      maxPerformerVal: maxCount,
      getPerformerPct: (item) => maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0,
      getPerformerStats: (item) => `${item.count} orders served`,
      areaTitle: 'Service Quality',
      areas: [
        { id: '1', label: 'Fulfillment Rate', color: colors.green, current: `${totalBills > 0 ? Math.round(((totalBills - cancelBills) / totalBills) * 100) : 0}%`, target: '100%', progress: Math.min(100, totalBills > 0 ? Math.round(((totalBills - cancelBills) / totalBills) * 100) : 0) },
        { id: '2', label: 'Cancellation Rate', color: colors.red, current: `${totalBills > 0 ? Math.round((cancelBills / totalBills) * 100) : 0}%`, target: '0%', progress: Math.min(100, totalBills > 0 ? Math.round((cancelBills / totalBills) * 100) : 0) },
        { id: '3', label: 'Complimentary', color: colors.orange, current: `${compBills} bills`, target: 'Manage', progress: Math.min(100, totalBills > 0 ? Math.round((compBills / totalBills) * 100) : 0) },
      ],
    },

    Quality: {
      score: Math.min(100, totalQty > 0 && uniqueItems > 0 ? Math.max(30, Math.round((uniqueItems / Math.max(uniqueItems, 20)) * 100)) : 0),
      scoreLabel: `${uniqueItems} item types`,
      scoreColor: colors.purple,
      metrics: [
        { id: '1', title: 'Unique Items', icon: 'grid', value: `${uniqueItems}`, progress: Math.min(100, uniqueItems > 0 ? Math.round((uniqueItems / Math.max(uniqueItems, 20)) * 100) : 0), color: colors.purple, bg: colors.purpleBg },
        { id: '2', title: 'Total Qty Sold', icon: 'package', value: `${totalQty}`, progress: Math.min(100, totalQty > 0 && sortedByCount[0]?.count > 0 ? Math.round((totalQty / (sortedByCount[0].count * uniqueItems || 1)) * 100) : 0), color: colors.blue, bg: colors.blueBg },
        { id: '3', title: 'Avg Qty/Item', icon: 'bar-chart-2', value: `${uniqueItems > 0 ? Math.round(totalQty / uniqueItems) : 0}`, progress: Math.min(100, uniqueItems > 0 && sortedByCount[0]?.count > 0 ? Math.round(((totalQty / uniqueItems) / sortedByCount[0].count) * 100) : 0), color: colors.green, bg: colors.greenBg },
        { id: '4', title: 'Avg Revenue/Item', icon: 'trending-up', value: `₹${uniqueItems > 0 ? Math.round(totalRevenue / uniqueItems) : 0}`, progress: Math.min(100, uniqueItems > 0 && sortedByRevenue[0]?.totalPrice > 0 ? Math.round(((totalRevenue / uniqueItems) / sortedByRevenue[0].totalPrice) * 100) : 0), color: colors.orange, bg: colors.orangeBg },
      ],
      performersList: sortedByRevenue,
      maxPerformerVal: maxRevenue,
      getPerformerPct: (item) => maxRevenue > 0 ? Math.round((item.totalPrice / maxRevenue) * 100) : 0,
      getPerformerStats: (item) => `${item.count} qty • ₹${Math.round((item.totalPrice || 0) / Math.max(item.count, 1))} avg`,
      areaTitle: 'Product Quality',
      areas: [
        { id: '1', label: 'Top Item Revenue', color: colors.green, current: `₹${(sortedByRevenue[0]?.totalPrice || 0).toLocaleString()}`, target: 'Best', progress: Math.min(100, totalRevenue > 0 ? Math.round(((sortedByRevenue[0]?.totalPrice || 0) / totalRevenue) * 100) : 0) },
        { id: '2', label: 'Avg Item Value', color: colors.blue, current: `₹${uniqueItems > 0 ? Math.round(totalRevenue / uniqueItems) : 0}`, target: 'Improve', progress: Math.min(100, uniqueItems > 0 && sortedByRevenue[0]?.totalPrice > 0 ? Math.round(((totalRevenue / uniqueItems) / sortedByRevenue[0].totalPrice) * 100) : 0) },
        { id: '3', label: 'Menu Coverage', color: colors.purple, current: `${uniqueItems} active`, target: 'Expand', progress: Math.min(100, Math.round((uniqueItems / Math.max(uniqueItems, 30)) * 100)) },
      ],
    },
  };

  const chipData = chipDataMap[activeChip];

  /* ── Renders ─────────────────────────────────────────────── */
  const renderChips = () => (
    <View style={s.chipsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsScroll}>
        {CHIPS.map(chip => {
          const isActive = activeChip === chip;
          return (
            <Animated.View key={chip} style={{ transform: [{ scale: chipScales[chip] }] }}>
              <TouchableOpacity
                onPress={() => handleChipPress(chip)}
                activeOpacity={0.85}
                style={[
                  s.chipItem,
                  {
                    backgroundColor: isActive ? colors.primary : colors.cardAlt,
                    borderColor: isActive ? colors.primary : 'transparent',
                    shadowColor: isActive ? colors.primary : 'transparent',
                    shadowOpacity: isActive ? 0.4 : 0,
                    shadowRadius: 8,
                    elevation: isActive ? 6 : 0,
                  },
                ]}
              >
                <Feather
                  name={CHIP_ICONS[chip] as any}
                  size={ms(14)}
                  color={isActive ? '#FFF' : colors.textSecondary}
                  style={{ marginRight: wp(6) }}
                />
                <Text style={[s.chipText, { color: isActive ? '#FFF' : colors.textSecondary, fontWeight: isActive ? '700' : '500' }]}>
                  {chip}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderShimmer = () => (
    <View style={{ paddingHorizontal: wp(16), gap: hp(16) }}>
      <ShimmerBox height={ms(240)} style={{ borderRadius: ms(20), marginBottom: hp(8) }} />
      <View style={{ flexDirection: 'row', gap: wp(12) }}>
        <ShimmerBox width={(scrWidth - wp(44)) / 2} height={ms(100)} style={{ borderRadius: ms(16) }} />
        <ShimmerBox width={(scrWidth - wp(44)) / 2} height={ms(100)} style={{ borderRadius: ms(16) }} />
      </View>
      <View style={{ flexDirection: 'row', gap: wp(12) }}>
        <ShimmerBox width={(scrWidth - wp(44)) / 2} height={ms(100)} style={{ borderRadius: ms(16) }} />
        <ShimmerBox width={(scrWidth - wp(44)) / 2} height={ms(100)} style={{ borderRadius: ms(16) }} />
      </View>
      <ShimmerBox height={ms(200)} style={{ borderRadius: ms(16) }} />
    </View>
  );

  const renderScore = () => {
    const score = loading ? 0 : chipData.score;
    const size = ms(200);
    return (
      <View style={s.section}>
        <View style={[s.scoreCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{activeChip} Performance</Text>
          <View style={s.scoreCircleWrapper}>
            <AnimatedRing score={score} colors={colors} />
            <View style={s.scoreInner}>
              <Text style={[s.scoreValue, { color: colors.textPrimary }]}>
                {score}<Text style={s.scoreScale}>/100</Text>
              </Text>
              <Text style={[s.scoreLabel, { color: chipData.scoreColor }]}>{chipData.scoreLabel}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderMetricsGrid = () => (
    <View style={[s.section, s.grid]}>
      {chipData.metrics.map(m => (
        <View key={m.id} style={[s.kpiCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <View style={s.kpiTop}>
            <View style={[s.kpiIconWrap, { backgroundColor: m.bg }]}>
              <Feather name={m.icon} size={ms(18)} color={m.color} />
            </View>
          </View>
          <Text style={[s.kpiValue, { color: colors.textPrimary }]}>{m.value}</Text>
          <Text style={[s.kpiTitle, { color: colors.textSecondary }]}>{m.title}</Text>
          <AnimatedBar percent={m.progress} color={m.color} bg={colors.bg} />
        </View>
      ))}
    </View>
  );

  const renderTrend = () => {
    const trendSource = trendSalesData || salesData;
    const rawList: any[] = trendSource?.dashBoardSalesList || [];
    const data = rawList.length > 1 ? rawList.map((d: any) => d.paidAmount || 0) : [0, 0, 0, 0, 0, 0, 0];

    // Build human-readable X-axis labels
    const labels = rawList.length > 1
      ? rawList.map((d: any, idx: number) => {
          if (!d.hours) return `Day ${idx + 1}`;
          const raw = (d.hours || '').toString().trim();
          const lower = raw.toLowerCase();

          // Day names → full short names
          const dayMap: Record<string, string> = {
            sunday: 'Sun', monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
            thursday: 'Thu', friday: 'Fri', saturday: 'Sat',
          };
          if (dayMap[lower]) return dayMap[lower];

          // Order type codes → readable names
          const typeMap: Record<string, string> = {
            ret: 'Retail', can: 'Cancelled', com: 'Complimentary', tot: 'Total',
          };
          if (typeMap[lower]) return typeMap[lower];

          // Numeric hour → 12h format (e.g. "14" → "2 PM")
          const numMatch = raw.match(/^(\d+)/);
          if (numMatch) {
            const h = parseInt(numMatch[1], 10);
            if (!isNaN(h) && h >= 0 && h <= 24) {
              const ampm = h >= 12 && h < 24 ? 'PM' : 'AM';
              return `${h % 12 || 12} ${ampm}`;
            }
          }

          // Fallback for any other string — capitalize first 3 chars
          return raw.length > 6 ? raw.substring(0, 6) : raw;
        })
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // ── Chart dimensions with generous breathing space ──
    const leftPad = ms(48);
    const rightPad = ms(16);
    const topPad = ms(20);
    const bottomPad = ms(32);
    const chartHeight = ms(240);
    const chartWidth = scrWidth - wp(64);
    const maxVal = Math.max(...data, 1);
    const range = maxVal || 1;
    const innerW = chartWidth - leftPad - rightPad;
    const innerH = chartHeight - topPad - bottomPad;
    const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;

    const ySteps = 4;
    const yValues = Array.from({ length: ySteps + 1 }, (_, i) => Math.round(maxVal * (1 - i / ySteps)));

    let pathD = '';
    data.forEach((val, i) => {
      const x = leftPad + i * stepX;
      const y = topPad + (1 - val / range) * innerH;
      if (i === 0) { pathD += `M ${x} ${y}`; return; }
      const prevX = leftPad + (i - 1) * stepX;
      const prevY = topPad + (1 - data[i - 1] / range) * innerH;
      pathD += ` C ${prevX + stepX * 0.4} ${prevY}, ${x - stepX * 0.4} ${y}, ${x} ${y}`;
    });
    const lastX = leftPad + (data.length - 1) * stepX;
    const areaD = `${pathD} L ${lastX} ${topPad + innerH} L ${leftPad} ${topPad + innerH} Z`;

    const TREND_PERIODS = ['Today', 'Last 7 Days', 'Last 30 Days'];

    return (
      <View style={s.section}>
        <View style={s.sectionHeaderRow}>
          <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Performance Trend</Text>
          <View style={{ position: 'relative', zIndex: 10 }}>
            <TouchableOpacity
              style={[s.trendDropdown, { backgroundColor: colors.cardAlt }]}
              onPress={() => setShowTrendDropdown(!showTrendDropdown)}
            >
              <Text style={[s.trendDropdownText, { color: colors.textPrimary }]}>{trendPeriod}</Text>
              <Feather name="chevron-down" size={ms(14)} color={colors.textSecondary} />
            </TouchableOpacity>
            {showTrendDropdown && (
              <View style={[s.dropdownList, { backgroundColor: colors.card, shadowColor: colors.shadow, borderColor: colors.border }]}>
                {TREND_PERIODS.map((period, idx) => (
                  <TouchableOpacity
                    key={period}
                    style={[
                      s.dropdownItem,
                      trendPeriod === period && { backgroundColor: colors.primaryLight },
                      idx < TREND_PERIODS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                    ]}
                    onPress={() => {
                      setTrendPeriod(period);
                      setShowTrendDropdown(false);
                      loadTrendData(period);
                    }}
                  >
                    <Text style={[s.dropdownItemText, { color: trendPeriod === period ? colors.primary : colors.textPrimary }]}>
                      {period}
                    </Text>
                    {trendPeriod === period && <Feather name="check" size={ms(14)} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
        <View style={[s.card, { backgroundColor: colors.card, shadowColor: colors.shadow, marginTop: hp(4), paddingTop: hp(16), paddingBottom: hp(12) }]}>
          {trendLoading ? (
            <View style={{ height: chartHeight, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{ marginTop: hp(8), color: colors.textSecondary, fontSize: ms(12) }}>Loading trend…</Text>
            </View>
          ) : (
            <Svg width={chartWidth} height={chartHeight}>
              <Defs>
                <LinearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.orange} stopOpacity="0.2" />
                  <Stop offset="0.6" stopColor={colors.orange} stopOpacity="0.06" />
                  <Stop offset="1" stopColor={colors.orange} stopOpacity="0" />
                </LinearGradient>
                <LinearGradient id="trendStroke" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor={colors.orange} stopOpacity="1" />
                  <Stop offset="1" stopColor={colors.purple} stopOpacity="1" />
                </LinearGradient>
              </Defs>
              {/* Y-axis grid lines and labels */}
              {yValues.map((val, i) => {
                const y = topPad + (i / ySteps) * innerH;
                return (
                  <G key={`yg-${i}`}>
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
                      y={y + ms(4)}
                      fontSize={ms(10)}
                      fill={colors.textTertiary}
                      textAnchor="end"
                    >
                      {val >= 1000 ? `\u20B9${(val / 1000).toFixed(1)}K` : `\u20B9${val}`}
                    </SvgText>
                  </G>
                );
              })}
              {/* Area fill */}
              <Path d={areaD} fill="url(#trendFill)" />
              {/* Line */}
              <Path d={pathD} fill="none" stroke="url(#trendStroke)" strokeWidth="3" strokeLinecap="round" />
              {/* Data points and X labels */}
              {data.map((val, i) => {
                const x = leftPad + i * stepX;
                const y = topPad + (1 - val / range) * innerH;
                const showLabel = data.length <= 8 || i % Math.ceil(data.length / 6) === 0 || i === data.length - 1;
                return (
                  <G key={`pt-${i}`}>
                    <Circle cx={x} cy={y} r="5" fill={colors.card} stroke={colors.orange} strokeWidth="2" />
                    <Circle cx={x} cy={y} r="2" fill={colors.orange} />
                    {showLabel && (
                      <SvgText x={x} y={chartHeight - ms(6)} fontSize={ms(10)} fontWeight="600" fill={colors.textSecondary} textAnchor="middle">
                        {labels[i]}
                      </SvgText>
                    )}
                  </G>
                );
              })}
            </Svg>
          )}
        </View>
      </View>
    );
  };

  const renderTopPerformers = () => {
    const list = chipData.performersList;
    if (list.length === 0) return null;
    const rankColors = [colors.orange, colors.blue, colors.green, colors.purple, colors.teal];
    const rankBgs = [colors.orangeBg, colors.blueBg, colors.greenBg, colors.purpleBg, colors.tealBg];

    return (
      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Top Performers</Text>
        <View style={[s.card, s.noPadding, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          {list.map((item: any, idx: number) => {
            const pct = chipData.getPerformerPct(item);
            return (
              <View
                key={`perf-${idx}`}
                style={[s.performerRow, idx < list.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              >
                <View style={[s.rankBadge, { backgroundColor: rankBgs[idx % rankBgs.length] }]}>
                  <Text style={[s.rankText, { color: rankColors[idx % rankColors.length] }]}>{idx + 1}</Text>
                </View>
                <View style={s.performerInfo}>
                  <Text style={[s.performerName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.productDescription || 'Unknown'}
                  </Text>
                  <Text style={[s.performerStats, { color: colors.textSecondary }]}>
                    {chipData.getPerformerStats(item)}
                  </Text>
                </View>
                <View style={s.performerScore}>
                  <View style={[s.scoreBadge, { borderColor: rankColors[idx % rankColors.length] }]}>
                    <Text style={[s.scoreBadgeText, { color: rankColors[idx % rankColors.length] }]}>{pct}</Text>
                  </View>
                  <Text style={[s.scoreLabelText, { color: colors.textSecondary }]}>Score</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderAreas = () => {
    const { areas, areaTitle } = chipData;
    const hasAreaData = areas.some(a => a.progress > 0 || a.current !== '₹0');

    if (!hasAreaData) {
      return (
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{areaTitle}</Text>
          <View style={[s.card, { backgroundColor: colors.card, shadowColor: colors.shadow, alignItems: 'center', paddingVertical: hp(32) }]}>
            <Feather name="pie-chart" size={ms(36)} color={colors.textTertiary} style={{ marginBottom: hp(12), opacity: 0.4 }} />
            <Text style={{ color: colors.textSecondary, fontSize: ms(14), fontWeight: '500' }}>No revenue data available</Text>
            <Text style={{ color: colors.textTertiary, fontSize: ms(12), marginTop: hp(4) }}>Data will appear when orders are placed</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{areaTitle}</Text>
        <View style={[s.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          {areas.map(item => (
            <View key={item.id} style={s.areaRow}>
              <View style={s.areaHeaderRow}>
                <Text style={[s.areaLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: wp(4) }}>
                  <Text style={[s.areaValues, { color: item.color }]}>{item.current}</Text>
                  <Text style={[s.areaValues, { color: colors.textSecondary }]}>• {item.target}</Text>
                </View>
              </View>
              <View style={[s.areaTrack, { backgroundColor: colors.bg }]}>
                <AnimatedBar percent={item.progress} color={item.color} bg={colors.bg} />
              </View>
              <Text style={[s.areaPercent, { color: colors.textTertiary }]}>{item.progress}% of total</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  /* ── Main render ─────────────────────────────────────────── */
  return (
    <ScreenWrapper edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
      <GradientHeader
        title="Performance"
        onCalendarPress={() => calendarRef.current?.openModal()}
      />
      <DateRangePicker
        ref={calendarRef}
        hideChip={true}
        dateRange={dateRange}
        activeFilter={activeFilter}
        onDateRangeChange={setDateFilter}
      />
      {loading && !refreshing ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.loadingText, { color: colors.textSecondary }]}>Loading performance data…</Text>
        </View>
      ) : (
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.contentPad}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadData(); }}
              tintColor={colors.primary}
            />
          }
        >
          {/* Chips always visible above animated content */}
          {renderChips()}

          {/* Fade animated content area */}
          <Animated.View style={{ opacity: contentOpacity }}>
            {chipTransitioning ? renderShimmer() : (
              <>
                {renderScore()}
                {renderMetricsGrid()}
                {renderTrend()}
                {renderTopPerformers()}
                {renderAreas()}
              </>
            )}
          </Animated.View>

          <View style={{ height: hp(100) }} />
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}

/* ── Styles ─────────────────────────────────────────────────── */
const s = StyleSheet.create({
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: ms(14) },
  contentPad: { paddingTop: hp(12), paddingBottom: hp(60) },

  /* Chips */
  chipsContainer: { marginBottom: hp(4) },
  chipsScroll: { paddingHorizontal: wp(16), gap: wp(10), paddingVertical: hp(8) },
  chipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(9),
    paddingHorizontal: wp(16),
    borderRadius: ms(24),
    borderWidth: 1.5,
  },
  chipText: { fontSize: ms(14) },

  /* Section */
  section: { paddingHorizontal: wp(16), marginBottom: hp(28) },
  sectionTitle: { fontSize: ms(18), fontWeight: 'bold', marginBottom: hp(18) },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(18) },

  card: {
    padding: ms(16), borderRadius: ms(16),
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  noPadding: { padding: 0 },

  /* Score */
  scoreCard: {
    alignItems: 'center', padding: ms(24), borderRadius: ms(20),
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  scoreCircleWrapper: { position: 'relative', width: ms(200), height: ms(200), alignItems: 'center', justifyContent: 'center' },
  scoreInner: { position: 'absolute', alignItems: 'center' },
  scoreValue: { fontSize: ms(48), fontWeight: 'bold' },
  scoreScale: { fontSize: ms(20), fontWeight: '500', opacity: 0.5 },
  scoreLabel: { fontSize: ms(13), fontWeight: '600', marginTop: hp(4) },

  /* KPI grid */
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: wp(12), justifyContent: 'space-between' },
  kpiCard: {
    width: (scrWidth - wp(44)) / 2, padding: ms(16), borderRadius: ms(16),
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  kpiTop: { marginBottom: hp(10) },
  kpiIconWrap: { width: ms(36), height: ms(36), borderRadius: ms(10), alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontSize: ms(22), fontWeight: 'bold', marginBottom: hp(2) },
  kpiTitle: { fontSize: ms(12), fontWeight: '500', marginBottom: hp(10) },
  kpiProgressBar: { height: hp(4), borderRadius: ms(2), width: '100%', overflow: 'hidden' },
  kpiProgressFill: { height: '100%', borderRadius: ms(2) },

  /* Trend */
  trendDropdown: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: wp(10), paddingVertical: hp(6), borderRadius: ms(12), gap: wp(4) },
  trendDropdownText: { fontSize: ms(12), fontWeight: '500' },
  dropdownList: {
    position: 'absolute',
    top: ms(38),
    right: 0,
    width: wp(150),
    borderRadius: ms(12),
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(11),
    paddingHorizontal: wp(14),
  },
  dropdownItemText: { fontSize: ms(13), fontWeight: '500' },

  /* Performers */
  performerRow: { flexDirection: 'row', alignItems: 'center', padding: ms(16) },
  rankBadge: { width: ms(32), height: ms(32), borderRadius: ms(16), alignItems: 'center', justifyContent: 'center', marginRight: wp(12) },
  rankText: { fontSize: ms(14), fontWeight: 'bold' },
  performerInfo: { flex: 1 },
  performerName: { fontSize: ms(14), fontWeight: '600', marginBottom: hp(2) },
  performerStats: { fontSize: ms(12) },
  performerScore: { alignItems: 'center' },
  scoreBadge: { width: ms(36), height: ms(36), borderRadius: ms(18), borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: hp(2) },
  scoreBadgeText: { fontSize: ms(13), fontWeight: 'bold' },
  scoreLabelText: { fontSize: ms(10), fontWeight: '500' },

  /* Areas */
  areaRow: { marginBottom: hp(16) },
  areaHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(6) },
  areaLabel: { fontSize: ms(14), fontWeight: '600' },
  areaValues: { fontSize: ms(12), fontWeight: '500' },
  areaTrack: { borderRadius: ms(4), width: '100%', overflow: 'hidden', marginBottom: hp(4) },
  areaFill: { height: '100%', borderRadius: ms(4) },
  areaPercent: { fontSize: ms(11) },
});
