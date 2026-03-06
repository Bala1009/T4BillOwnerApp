import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { CalendarPicker, Card, ScreenWrapper, SectionHeader } from "../components";
import type { DateRange, QuickFilter } from "../components";
import type { ThemeColors } from "../theme";
import { hp, ms, useTheme, wp } from "../theme";

// ─── Dummy Data ─────────────────────────────────────────────
const KPI_DATA = [
    {
        title: "Revenue",
        value: "₹43,738",
        change: "+12%",
        up: true,
        icon: "trending-up" as const,
        colorKey: "green" as const,
        bgKey: "greenBg" as const,
        sparkline: [30, 45, 28, 60, 52, 75, 68],
    },
    {
        title: "Orders",
        value: "150",
        change: "+8%",
        up: true,
        icon: "shopping-bag" as const,
        colorKey: "blue" as const,
        bgKey: "blueBg" as const,
        sparkline: [20, 35, 45, 40, 55, 50, 62],
    },
    {
        title: "Expenses",
        value: "₹12,450",
        change: "+3%",
        up: false,
        icon: "credit-card" as const,
        colorKey: "red" as const,
        bgKey: "redBg" as const,
        sparkline: [40, 38, 42, 45, 43, 48, 46],
    },
    {
        title: "Profit",
        value: "₹31,288",
        change: "+18%",
        up: true,
        icon: "dollar-sign" as const,
        colorKey: "orange" as const,
        bgKey: "orangeBg" as const,
        sparkline: [25, 40, 35, 55, 48, 70, 65],
    },
];

const WEEKLY_CHART_DATA = [
    { label: "Mon", value: 4200 },
    { label: "Tue", value: 3100 },
    { label: "Wed", value: 5800 },
    { label: "Thu", value: 3900 },
    { label: "Fri", value: 6500 },
    { label: "Sat", value: 7200 },
    { label: "Sun", value: 5000 },
];

const MONTHLY_CHART_DATA = [
    { label: "Wk 1", value: 28500 },
    { label: "Wk 2", value: 32100 },
    { label: "Wk 3", value: 26800 },
    { label: "Wk 4", value: 35800 },
];

const CHART_SUMMARY = {
    week: { total: "₹35,800", change: "+14.5%", up: true },
    month: { total: "₹1,23,200", change: "+9.2%", up: true },
} as const;

const PAYMENT_DATA = [
    { label: "Cash", amount: "₹18,230", pct: 0.42, colorKey: "green" as const },
    { label: "Card", amount: "₹14,120", pct: 0.32, colorKey: "blue" as const },
    { label: "Wallet", amount: "₹8,388", pct: 0.19, colorKey: "purple" as const },
    { label: "Due", amount: "₹3,000", pct: 0.07, colorKey: "red" as const },
];

const ORDER_TYPES = [
    { label: "Dine In", orders: 78, sales: "₹22,400", pct: 52, icon: "restaurant-outline" as const, colorKey: "primary" as const },
    { label: "Takeaway", orders: 45, sales: "₹13,100", pct: 30, icon: "bag-handle-outline" as const, colorKey: "orange" as const },
    { label: "Delivery", orders: 27, sales: "₹8,238", pct: 18, icon: "bicycle-outline" as const, colorKey: "teal" as const },
];

const LEAKAGE_DATA = [
    { label: "Bills Modified", value: "5", icon: "file-document-edit-outline" },
    { label: "Bills Reprinted", value: "3", icon: "printer-outline" },
    { label: "Waived Off", value: "₹820", icon: "cash-remove" },
    { label: "Cancelled KOTs", value: "7", icon: "close-circle-outline" },
    { label: "Modified KOTs", value: "4", icon: "pencil-circle-outline" },
    { label: "KOTs Unused", value: "2", icon: "alert-circle-outline" },
];

const EXPENSE_DATA = [
    { label: "Staff Salary", amount: "₹6,500", pct: 0.52, colorKey: "primary" as const },
    { label: "Diesel", amount: "₹2,200", pct: 0.18, colorKey: "orange" as const },
    { label: "Maintenance", amount: "₹1,800", pct: 0.14, colorKey: "teal" as const },
    { label: "Other", amount: "₹1,950", pct: 0.16, colorKey: "textTertiary" as const },
];

const TOP_ITEMS = [
    { name: "Chicken Biryani", qty: 120, revenue: "₹8,400", pct: 0.85 },
    { name: "Paneer Butter Masala", qty: 95, revenue: "₹6,120", pct: 0.72 },
    { name: "Masala Dosa", qty: 80, revenue: "₹5,200", pct: 0.65 },
    { name: "Veg Fried Rice", qty: 60, revenue: "₹3,800", pct: 0.48 },
    { name: "Gulab Jamun", qty: 40, revenue: "₹2,100", pct: 0.30 },
];

const TOP_BY_SALES = [
    { name: "Chicken Biryani", primary: "₹8,400", secondary: "120 qty", pct: 1.0 },
    { name: "Paneer Butter Masala", primary: "₹6,120", secondary: "95 qty", pct: 0.73 },
    { name: "Masala Dosa", primary: "₹5,200", secondary: "80 qty", pct: 0.62 },
    { name: "Butter Chicken", primary: "₹4,800", secondary: "64 qty", pct: 0.57 },
    { name: "Veg Fried Rice", primary: "₹3,800", secondary: "60 qty", pct: 0.45 },
];

const TOP_BY_QTY = [
    { name: "Chicken Biryani", primary: "120", secondary: "₹8,400", pct: 1.0 },
    { name: "Paneer Butter Masala", primary: "95", secondary: "₹6,120", pct: 0.79 },
    { name: "Masala Dosa", primary: "80", secondary: "₹5,200", pct: 0.67 },
    { name: "Butter Chicken", primary: "64", secondary: "₹4,800", pct: 0.53 },
    { name: "Veg Fried Rice", primary: "60", secondary: "₹3,800", pct: 0.50 },
];

const LOW_BY_SALES = [
    { name: "Ice Cream Sundae", primary: "₹420", secondary: "6 qty", pct: 0.12 },
    { name: "Mineral Water", primary: "₹580", secondary: "29 qty", pct: 0.16 },
    { name: "Bread Butter", primary: "₹640", secondary: "16 qty", pct: 0.18 },
    { name: "Plain Rice", primary: "₹720", secondary: "24 qty", pct: 0.20 },
    { name: "Raita", primary: "₹850", secondary: "34 qty", pct: 0.24 },
];

const LOW_BY_QTY = [
    { name: "Prawn Curry", primary: "3", secondary: "₹540", pct: 0.06 },
    { name: "Ice Cream Sundae", primary: "6", secondary: "₹420", pct: 0.12 },
    { name: "Fish Fry", primary: "8", secondary: "₹960", pct: 0.16 },
    { name: "Mushroom Soup", primary: "10", secondary: "₹650", pct: 0.20 },
    { name: "Bread Butter", primary: "16", secondary: "₹640", pct: 0.32 },
];

// ─── SVG Helpers ────────────────────────────────────────────

/** Build a smooth SVG path from data points */
function buildAreaPath(
    data: number[],
    width: number,
    height: number,
    padding: number = 4
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
    const now = new Date();
    const [dateRange, setDateRange] = useState<DateRange>({
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    });
    const [activeFilter, setActiveFilter] = useState<QuickFilter>("this_month");

    const handleDateRangeChange = useCallback(
        (range: DateRange, filter: QuickFilter) => {
            setDateRange(range);
            setActiveFilter(filter);
            // TODO: Fetch data for the new range
        },
        [],
    );

    return (
        <ScreenWrapper scrollable>
            <Header />
            <Greeting />
            <CalendarPicker
                dateRange={dateRange}
                activeFilter={activeFilter}
                onDateRangeChange={handleDateRangeChange}
            />
            <KPIGrid />
            <SalesChartSection />
            <PaymentDonutSection />
            <OrderTypeSection />
            <RevenueLeakage />
            <ExpensesSection />
            <TopSellingSection />
            <ItemRankingSection
                title="Top Items by Sales"
                icon="trending-up"
                accentColor="green"
                data={TOP_BY_SALES}
                primaryLabel="Revenue"
                secondaryLabel="Qty"
            />
            <ItemRankingSection
                title="Top Items by Quantity"
                icon="bar-chart-2"
                accentColor="blue"
                data={TOP_BY_QTY}
                primaryLabel="Qty Sold"
                secondaryLabel="Revenue"
            />
            <ItemRankingSection
                title="Low Sales by Amount"
                icon="trending-down"
                accentColor="red"
                data={LOW_BY_SALES}
                primaryLabel="Revenue"
                secondaryLabel="Qty"
            />
            <ItemRankingSection
                title="Low Sales by Quantity"
                icon="alert-triangle"
                accentColor="orange"
                data={LOW_BY_QTY}
                primaryLabel="Qty Sold"
                secondaryLabel="Revenue"
            />
            <View style={{ height: hp(32) }} />
        </ScreenWrapper>
    );
}

// ─── Header ─────────────────────────────────────────────────
function Header() {
    const { colors } = useTheme();
    return (
        <View style={s.header}>
            <TouchableOpacity style={[s.headerIcon, { backgroundColor: colors.card }]}>
                <Feather name="menu" size={ms(22)} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={[s.branchSelector, { backgroundColor: colors.card }]}>
                <Text style={[s.branchText, { color: colors.textPrimary }]}>Branch A</Text>
                <Feather name="chevron-down" size={ms(16)} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={[s.headerIcon, { backgroundColor: colors.card }]}>
                <View>
                    <Feather name="bell" size={ms(22)} color={colors.textPrimary} />
                    <View style={[s.notifDot, { backgroundColor: colors.accent }]} />
                </View>
            </TouchableOpacity>
        </View>
    );
}

// ─── Greeting ───────────────────────────────────────────────
function Greeting() {
    const { colors } = useTheme();
    return (
        <View style={s.greetingContainer}>
            <Text style={[s.greetingTitle, { color: colors.textPrimary }]}>
                Good Morning, Bala
            </Text>
            <Text style={[s.greetingSubtitle, { color: colors.textSecondary }]}>
                Here's your business overview today
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
            <Path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
    );
}

function AnimatedKPICard({ item, colors }: { item: typeof KPI_DATA[0], colors: any }) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    return (
        <Animated.View style={[s.kpiCardWidth, animatedStyle]}>
            <Pressable
                onPressIn={() => { scale.value = withSpring(0.96, { damping: 15, stiffness: 300 }); }}
                onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
                style={[
                    s.animatedKpiCard,
                    { backgroundColor: colors.card }
                ]}
            >
                {/* Top icon row */}
                <View style={s.kpiTopRow}>
                    <View style={[s.kpiIconWrap, { backgroundColor: colors[item.bgKey] }]}>
                        <Feather name={item.icon} size={ms(18)} color={colors[item.colorKey]} />
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
                        <Text style={[s.kpiTitle, { color: colors.textTertiary }]}>{item.title}</Text>
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
                        <SparklineMini data={item.sparkline} color={colors[item.colorKey]} width={60} height={32} />
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
}

function KPIGrid() {
    const { colors } = useTheme();

    return (
        <View style={s.kpiGrid}>
            {KPI_DATA.map((item, i) => (
                <AnimatedKPICard key={i} item={item as any} colors={colors} />
            ))}
        </View>
    );
}

// ─── Sales Chart (Premium Bar Chart) ────────────────────────
type ChartPeriod = "week" | "month";

function SalesChartSection() {
    const { colors } = useTheme();
    const [period, setPeriod] = useState<ChartPeriod>("week");
    const [areaWidth, setAreaWidth] = useState(0);

    const chartData = period === "week" ? WEEKLY_CHART_DATA : MONTHLY_CHART_DATA;
    const summary = CHART_SUMMARY[period];
    const maxVal = Math.max(...chartData.map((d) => d.value));
    const chartH = hp(180);
    const ySteps = 4;
    const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => (maxVal / ySteps) * (ySteps - i));

    // Derive bar sizes from measured width
    const barGap = areaWidth > 0 ? areaWidth * 0.03 : wp(6);
    const barWidth = areaWidth > 0
        ? (areaWidth - barGap * (chartData.length + 1)) / chartData.length
        : 0;

    return (
        <Card>
            <SectionHeader
                title="Sales Overview"
                rightElement={
                    <View style={[s.chartPillsContainer, { backgroundColor: colors.cardAlt }]}>
                        {(["week", "month"] as const).map((p) => (
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
                                <Text style={[
                                    s.chartPillText,
                                    { color: period === p ? "#FFFFFF" : colors.textTertiary },
                                ]}>
                                    {p === "week" ? "Week" : "Month"}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                }
            />

            {/* Total */}
            <View style={s.chartTotalRow}>
                <Text style={[s.chartTotalValue, { color: colors.textPrimary }]}>{summary.total}</Text>
                <View style={[s.chartTotalBadge, { backgroundColor: summary.up ? colors.greenBg : colors.redBg }]}>
                    <Feather
                        name={summary.up ? "trending-up" : "trending-down"}
                        size={ms(12)}
                        color={summary.up ? colors.green : colors.red}
                    />
                    <Text style={[s.chartTotalBadgeText, { color: summary.up ? colors.green : colors.red }]}>
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
                            {v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : Math.round(v)}
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
                                    <View key={i} style={[s.gridLine, { backgroundColor: colors.border }]} />
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
                                        <Stop offset="0" stopColor={colors.primary} stopOpacity="1" />
                                        <Stop offset="1" stopColor={colors.primary} stopOpacity="0.4" />
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
                                        <Path
                                            key={i}
                                            d={barPath}
                                            fill="url(#barGrad)"
                                        />
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
                                            <Text style={[s.barValueText, { color: colors.textSecondary }]}>
                                                {d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : d.value}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>

                            {/* X labels */}
                            <View style={s.xAxis}>
                                {chartData.map((d, i) => (
                                    <View key={i} style={{ width: barWidth + barGap, alignItems: "center" }}>
                                        <Text style={[s.xLabel, { color: colors.textTertiary }]}>
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
    cx: number, cy: number, r: number, startAngle: number, endAngle: number,
): string {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return [
        `M ${start.x} ${start.y}`,
        `A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    ].join(" ");
}

function PaymentDonutSection() {
    const { colors } = useTheme();
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

    const size = wp(PIE_DONUT_SIZE);
    const cx = size / 2;
    const cy = size / 2;
    const r = (size - wp(PIE_STROKE_W)) / 2;
    const strokeW = wp(PIE_STROKE_W);

    // Build arcs
    let currentAngle = 0;
    const arcs = PAYMENT_DATA.map((p, _i) => {
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

    const selectedItem = selectedIdx !== null ? PAYMENT_DATA[selectedIdx] : null;

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
                                <Text style={[s.pieCenterValue, { color: colors[selectedItem.colorKey] }]}>
                                    {selectedItem.amount}
                                </Text>
                                <Text style={[s.pieCenterSub, { color: colors.textTertiary }]}>
                                    {selectedItem.label}
                                </Text>
                            </>
                        ) : (
                            <>
                                <Text style={[s.pieCenterValue, { color: colors.textPrimary }]}>
                                    ₹43.7K
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
                    {PAYMENT_DATA.map((p, i) => (
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
                            <View style={[s.payIconBubble, { backgroundColor: colors[p.colorKey] + "18" }]}>
                                <Ionicons
                                    name={PAYMENT_ICONS[p.label] as any}
                                    size={ms(16)}
                                    color={colors[p.colorKey]}
                                />
                            </View>
                            <View style={s.payLegendText}>
                                <Text style={[s.payLegendLabel, { color: colors.textSecondary }]}>
                                    {p.label}
                                </Text>
                                <Text style={[s.payLegendAmount, { color: colors.textPrimary }]}>
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

// ─── Order Types (Premium Cards) ────────────────────────────
function OrderTypeSection() {
    const { colors } = useTheme();
    const totalOrders = ORDER_TYPES.reduce((sum, o) => sum + o.orders, 0);

    return (
        <Card>
            <SectionHeader title="Order Type Distribution" />

            {/* Stacked horizontal bar */}
            <View style={[s.otStackedBar, { backgroundColor: colors.border }]}>
                {ORDER_TYPES.map((o, i) => (
                    <View
                        key={i}
                        style={[
                            s.otStackedSeg,
                            {
                                flex: o.pct,
                                backgroundColor: colors[o.colorKey],
                            },
                            i === 0 && { borderTopLeftRadius: wp(6), borderBottomLeftRadius: wp(6) },
                            i === ORDER_TYPES.length - 1 && { borderTopRightRadius: wp(6), borderBottomRightRadius: wp(6) },
                        ]}
                    />
                ))}
            </View>

            {/* Order type cards */}
            <View style={s.otCardsRow}>
                {ORDER_TYPES.map((o, i) => (
                    <View
                        key={i}
                        style={[
                            s.otCard,
                            { backgroundColor: colors[o.colorKey] + "0A" },
                        ]}
                    >
                        {/* Icon */}
                        <View style={[s.otCardIcon, { backgroundColor: colors[o.colorKey] + "18" }]}>
                            <Ionicons name={o.icon} size={ms(20)} color={colors[o.colorKey]} />
                        </View>

                        {/* Label */}
                        <Text style={[s.otCardLabel, { color: colors.textPrimary }]}>
                            {o.label}
                        </Text>

                        {/* Orders count */}
                        <Text style={[s.otCardOrders, { color: colors.textTertiary }]}>
                            {o.orders} orders
                        </Text>

                        {/* Sales */}
                        <Text style={[s.otCardSales, { color: colors.textPrimary }]}>
                            {o.sales}
                        </Text>

                        {/* Percentage badge */}
                        <View style={[s.otPctBadge, { backgroundColor: colors[o.colorKey] + "18" }]}>
                            <Text style={[s.otPctText, { color: colors[o.colorKey] }]}>
                                {o.pct}%
                            </Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Total */}
            <View style={[s.otTotalRow, { borderTopColor: colors.border }]}>
                <Text style={[s.otTotalLabel, { color: colors.textTertiary }]}>Total Orders</Text>
                <Text style={[s.otTotalValue, { color: colors.textPrimary }]}>{totalOrders}</Text>
            </View>
        </Card>
    );
}

// ─── Revenue Leakage ────────────────────────────────────────
function RevenueLeakage() {
    const { colors } = useTheme();
    return (
        <Card>
            <SectionHeader
                title="Revenue Leakage"
                rightElement={
                    <View style={[s.leakageBadge, { backgroundColor: colors.redBg }]}>
                        <Feather name="alert-triangle" size={ms(12)} color={colors.red} />
                        <Text style={[s.leakageBadgeText, { color: colors.red }]}>Attention</Text>
                    </View>
                }
            />
            <View style={s.leakageGrid}>
                {LEAKAGE_DATA.map((l, i) => (
                    <View key={i} style={[s.leakageCard, { backgroundColor: colors.bg }]}>
                        <View style={[s.leakageIconWrap, { backgroundColor: colors.redBg }]}>
                            <MaterialCommunityIcons name={l.icon as any} size={ms(20)} color={colors.accent} />
                        </View>
                        <Text style={[s.leakageValue, { color: colors.textPrimary }]}>{l.value}</Text>
                        <Text style={[s.leakageLabel, { color: colors.textSecondary }]}>{l.label}</Text>
                    </View>
                ))}
            </View>
        </Card>
    );
}

// ─── Expenses (Horizontal Stacked Bar) ──────────────────────
function ExpensesSection() {
    const { colors } = useTheme();
    return (
        <Card>
            <SectionHeader
                title="Expenses"
                rightElement={
                    <Text style={[s.expenseTotal, { color: colors.accent }]}>₹12,450</Text>
                }
            />
            {/* Stacked bar */}
            <View style={[s.stackedBar, { backgroundColor: colors.border }]}>
                {EXPENSE_DATA.map((e, i) => (
                    <View
                        key={i}
                        style={[
                            s.stackedSegment,
                            {
                                width: `${e.pct * 100}%`,
                                backgroundColor: colors[e.colorKey],
                            },
                            i === 0 && { borderTopLeftRadius: wp(6), borderBottomLeftRadius: wp(6) },
                            i === EXPENSE_DATA.length - 1 && { borderTopRightRadius: wp(6), borderBottomRightRadius: wp(6) },
                        ]}
                    />
                ))}
            </View>
            {/* Legend */}
            <View style={s.expenseLegendGrid}>
                {EXPENSE_DATA.map((e, i) => (
                    <View key={i} style={s.expenseLegendItem}>
                        <View style={s.expenseLegendRow}>
                            <View style={[s.legendDot, { backgroundColor: colors[e.colorKey] }]} />
                            <Text style={[s.expenseLegendLabel, { color: colors.textSecondary }]}>
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

function TopSellingSection() {
    const { colors } = useTheme();
    const bestSeller = TOP_ITEMS[0];

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
                        <Text style={[s.tsHeroLabel, { color: colors.textTertiary }]}>Best Seller</Text>
                        <Text style={[s.tsHeroName, { color: colors.textPrimary }]}>{bestSeller.name}</Text>
                    </View>
                </View>
                <View style={s.tsHeroRight}>
                    <Text style={[s.tsHeroRevenue, { color: colors.primary }]}>{bestSeller.revenue}</Text>
                    <Text style={[s.tsHeroQty, { color: colors.textTertiary }]}>{bestSeller.qty} sold</Text>
                </View>
            </View>

            {/* Item List */}
            <View style={s.tsListWrap}>
                {TOP_ITEMS.map((item, i) => {
                    const isTop3 = i < 3;
                    const medalColor = isTop3 ? MEDAL_COLORS[i] : colors.textTertiary;
                    const medalBg = isTop3 ? MEDAL_BG[i] : colors.cardAlt;

                    return (
                        <View
                            key={i}
                            style={[
                                s.tsItemRow,
                                i < TOP_ITEMS.length - 1 && {
                                    borderBottomWidth: StyleSheet.hairlineWidth,
                                    borderBottomColor: colors.border,
                                },
                            ]}
                        >
                            {/* Rank badge */}
                            <View style={[s.tsRankBadge, { backgroundColor: medalBg }]}>
                                <Text style={[s.tsRankText, { color: medalColor }]}>#{i + 1}</Text>
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
                                    <Text style={[s.tsItemRevenue, { color: colors.textPrimary }]}>
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
                                                    backgroundColor: isTop3 ? colors.primary : colors.primary + "60",
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
type RankItem = { name: string; primary: string; secondary: string; pct: number };
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
                    <Text style={[s.irTitle, { color: colors.textPrimary }]}>{title}</Text>
                    <Text style={[s.irSubtitle, { color: colors.textTertiary }]}>
                        {data.length} items
                    </Text>
                </View>
                <Animated.View style={chevronStyle}>
                    <Feather name="chevron-down" size={ms(20)} color={colors.textTertiary} />
                </Animated.View>
            </Pressable>

            {/* Collapsible Content */}
            {expanded && (
                <>
                    {/* Column header */}
                    <View style={[s.irColHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[s.irColLabel, { color: colors.textTertiary, flex: 1 }]}>Item</Text>
                        <Text style={[s.irColLabel, { color: colors.textTertiary, width: wp(70), textAlign: "right" }]}>
                            {primaryLabel}
                        </Text>
                        <Text style={[s.irColLabel, { color: colors.textTertiary, width: wp(60), textAlign: "right" }]}>
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
                                <View style={[
                                    s.irRank,
                                    {
                                        backgroundColor: isTop3 ? accentBg : colors.cardAlt,
                                    },
                                ]}>
                                    <Text style={[
                                        s.irRankText,
                                        { color: isTop3 ? accent : colors.textTertiary },
                                    ]}>
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
                                <Text style={[s.irSecondaryVal, { color: colors.textTertiary }]}>
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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    branchSelector: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: wp(16),
        paddingVertical: hp(10),
        borderRadius: wp(12),
        gap: wp(6),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    branchText: { fontSize: ms(15), fontWeight: "600" },
    notifDot: {
        position: "absolute",
        top: -2,
        right: -2,
        width: wp(8),
        height: wp(8),
        borderRadius: wp(4),
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
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 4,
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
    chartContainer: { flexDirection: "row", marginTop: hp(20) },
    yAxis: {
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginRight: wp(10),
        paddingBottom: hp(28), // reserve space for x-axis labels
    },
    yLabel: { fontSize: ms(10), fontWeight: "500" },
    chartGridArea: {
        justifyContent: "space-between",
    },
    gridLine: { height: StyleSheet.hairlineWidth, opacity: 0.7 },
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
    xLabel: { fontSize: ms(11), fontWeight: "600", textAlign: "center" },

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
    leakageLabel: { fontSize: ms(10), textAlign: "center", marginTop: hp(4), fontWeight: "500" },

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
    expenseLegendLabel: { fontSize: ms(12), fontWeight: "500", marginLeft: wp(4) },
    expenseLegendAmt: { fontSize: ms(14), fontWeight: "700", marginTop: hp(2), marginLeft: wp(18) },

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
