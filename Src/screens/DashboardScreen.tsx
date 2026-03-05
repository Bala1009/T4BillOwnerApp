import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { Card, ScreenWrapper, SectionHeader } from "../components";
import type { ThemeColors } from "../theme";
import { hp, ms, SCREEN_WIDTH, useTheme, wp } from "../theme";

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

const CHART_DATA = [
    { day: "Mon", value: 4200 },
    { day: "Tue", value: 3100 },
    { day: "Wed", value: 5800 },
    { day: "Thu", value: 3900 },
    { day: "Fri", value: 6500 },
    { day: "Sat", value: 7200 },
    { day: "Sun", value: 5000 },
];

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
    return (
        <ScreenWrapper scrollable>
            <Header />
            <Greeting />
            <DateFilter />
            <KPIGrid />
            <SalesChartSection />
            <PaymentDonutSection />
            <OrderTypeSection />
            <RevenueLeakage />
            <ExpensesSection />
            <TopSellingSection />
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

// ─── Date Filter ────────────────────────────────────────────
function DateFilter() {
    const { colors } = useTheme();
    return (
        <View style={s.dateFilterRow}>
            <TouchableOpacity style={[s.dateChip, { backgroundColor: colors.card }]}>
                <Feather name="calendar" size={ms(14)} color={colors.primary} />
                <Text style={[s.dateChipText, { color: colors.textPrimary }]}>1 Nov – 30 Nov</Text>
                <Feather name="chevron-down" size={ms(14)} color={colors.textSecondary} />
            </TouchableOpacity>
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

function KPIGrid() {
    const { colors } = useTheme();

    return (
        <View style={s.kpiGrid}>
            {KPI_DATA.map((item, i) => (
                <Card key={i} noMargin padding={16} style={s.kpiCardWidth}>
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

                    {/* Value */}
                    <Text style={[s.kpiValue, { color: colors.textPrimary }]}>{item.value}</Text>
                    <Text style={[s.kpiTitle, { color: colors.textTertiary }]}>{item.title}</Text>

                    {/* Sparkline */}
                    <View style={s.sparklineWrap}>
                        <SparklineMini data={item.sparkline} color={colors[item.colorKey]} />
                    </View>
                </Card>
            ))}
        </View>
    );
}

// ─── Sales Chart (Area Chart) ───────────────────────────────
function SalesChartSection() {
    const { colors } = useTheme();
    const chartW = SCREEN_WIDTH - wp(72);
    const chartH = hp(160);
    const maxVal = Math.max(...CHART_DATA.map((d) => d.value));
    const values = CHART_DATA.map((d) => d.value);
    const { linePath, areaPath } = buildAreaPath(values, chartW, chartH, 8);

    const yLabels = [0, maxVal * 0.33, maxVal * 0.66, maxVal].reverse();

    return (
        <Card>
            <SectionHeader
                title="Sales Overview"
                rightElement={
                    <View style={s.chartPills}>
                        <TouchableOpacity style={[s.chartPill, { backgroundColor: colors.primary }]}>
                            <Text style={[s.chartPillText, { color: "#fff" }]}>Week</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.chartPill, { backgroundColor: colors.cardAlt }]}>
                            <Text style={[s.chartPillText, { color: colors.textTertiary }]}>Month</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
            {/* Total */}
            <View style={s.chartTotalRow}>
                <Text style={[s.chartTotalValue, { color: colors.textPrimary }]}>₹35,800</Text>
                <View style={[s.chartTotalBadge, { backgroundColor: colors.greenBg }]}>
                    <Feather name="trending-up" size={ms(12)} color={colors.green} />
                    <Text style={[s.chartTotalBadgeText, { color: colors.green }]}>+14.5%</Text>
                </View>
            </View>

            {/* Chart */}
            <View style={s.chartContainer}>
                {/* Y axis labels */}
                <View style={s.yAxis}>
                    {yLabels.map((v, i) => (
                        <Text key={i} style={[s.yLabel, { color: colors.textTertiary }]}>
                            {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v)}
                        </Text>
                    ))}
                </View>

                {/* Chart area */}
                <View>
                    {/* Grid lines */}
                    <View style={[s.chartGridArea, { height: chartH }]}>
                        {yLabels.map((_, i) => (
                            <View key={i} style={[s.gridLine, { backgroundColor: colors.border }]} />
                        ))}
                    </View>
                    <Svg width={chartW} height={chartH} style={{ position: "absolute" }}>
                        <Defs>
                            <LinearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor={colors.primary} stopOpacity="0.25" />
                                <Stop offset="1" stopColor={colors.primary} stopOpacity="0.01" />
                            </LinearGradient>
                        </Defs>
                        <Path d={areaPath} fill="url(#salesGrad)" />
                        <Path
                            d={linePath}
                            fill="none"
                            stroke={colors.primary}
                            strokeWidth={2.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </Svg>
                    {/* X labels */}
                    <View style={s.xAxis}>
                        {CHART_DATA.map((d, i) => (
                            <Text key={i} style={[s.xLabel, { color: colors.textTertiary }]}>
                                {d.day}
                            </Text>
                        ))}
                    </View>
                </View>
            </View>
        </Card>
    );
}

// ─── Payment Donut ──────────────────────────────────────────
function DonutChart({
    segments,
    colors: themeColors,
    size = 140,
}: {
    segments: { pct: number; colorKey: keyof ThemeColors }[];
    colors: ThemeColors;
    size?: number;
}) {
    const r = wp(size) / 2;
    const strokeW = wp(18);
    const innerR = r - strokeW / 2;
    const circumference = 2 * Math.PI * innerR;

    let offset = circumference * 0.25; // start top

    return (
        <Svg width={r * 2} height={r * 2}>
            {/* Background track */}
            <Circle
                cx={r}
                cy={r}
                r={innerR}
                fill="none"
                stroke={themeColors.border}
                strokeWidth={strokeW}
            />
            {segments.map((seg, i) => {
                const dashLen = circumference * seg.pct;
                const gap = circumference - dashLen;
                const el = (
                    <Circle
                        key={i}
                        cx={r}
                        cy={r}
                        r={innerR}
                        fill="none"
                        stroke={themeColors[seg.colorKey] as string}
                        strokeWidth={strokeW}
                        strokeDasharray={`${dashLen} ${gap}`}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                    />
                );
                offset -= dashLen;
                return el;
            })}
        </Svg>
    );
}

function PaymentDonutSection() {
    const { colors } = useTheme();
    const donutSize = 140;

    return (
        <Card>
            <SectionHeader title="Payment Breakdown" />

            <View style={s.donutLayout}>
                {/* Donut */}
                <View style={s.donutWrap}>
                    <DonutChart
                        segments={PAYMENT_DATA.map((p) => ({ pct: p.pct, colorKey: p.colorKey }))}
                        colors={colors}
                        size={donutSize}
                    />
                    {/* Center label */}
                    <View style={[s.donutCenter, { width: wp(donutSize), height: wp(donutSize) }]}>
                        <Text style={[s.donutTotal, { color: colors.textPrimary }]}>₹43.7K</Text>
                        <Text style={[s.donutTotalLabel, { color: colors.textTertiary }]}>Total</Text>
                    </View>
                </View>

                {/* Legend */}
                <View style={s.donutLegend}>
                    {PAYMENT_DATA.map((p, i) => (
                        <View key={i} style={s.legendItem}>
                            <View style={[s.legendDot, { backgroundColor: colors[p.colorKey] }]} />
                            <View style={s.legendTextWrap}>
                                <Text style={[s.legendLabel, { color: colors.textSecondary }]}>
                                    {p.label}
                                </Text>
                                <Text style={[s.legendAmount, { color: colors.textPrimary }]}>
                                    {p.amount}
                                </Text>
                            </View>
                            <Text style={[s.legendPct, { color: colors.textTertiary }]}>
                                {Math.round(p.pct * 100)}%
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        </Card>
    );
}

// ─── Order Types (Visual Bars) ──────────────────────────────
function OrderTypeSection() {
    const { colors } = useTheme();
    return (
        <Card>
            <SectionHeader title="Order Type Distribution" />
            <View style={{ marginTop: hp(16) }}>
                {ORDER_TYPES.map((o, i) => (
                    <View key={i} style={[s.orderRow, { borderBottomColor: colors.border }]}>
                        <View style={[s.orderIconWrap, { backgroundColor: `${colors[o.colorKey]}15` }]}>
                            <Ionicons name={o.icon} size={ms(22)} color={colors[o.colorKey]} />
                        </View>
                        <View style={s.orderInfo}>
                            <View style={s.orderTopRow}>
                                <Text style={[s.orderLabel, { color: colors.textPrimary }]}>{o.label}</Text>
                                <Text style={[s.orderSales, { color: colors.textPrimary }]}>{o.sales}</Text>
                            </View>
                            <View style={[s.orderBarBg, { backgroundColor: colors.border }]}>
                                <View
                                    style={[
                                        s.orderBarFill,
                                        {
                                            width: `${o.pct}%`,
                                            backgroundColor: colors[o.colorKey],
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={[s.orderSub, { color: colors.textTertiary }]}>
                                {o.orders} orders · {o.pct}%
                            </Text>
                        </View>
                    </View>
                ))}
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

// ─── Top Selling Items ──────────────────────────────────────
function TopSellingSection() {
    const { colors } = useTheme();
    return (
        <Card>
            <SectionHeader title="Top Selling Items" />
            <View style={{ marginTop: hp(16) }}>
                {TOP_ITEMS.map((item, i) => (
                    <View key={i} style={[s.topRow, { borderBottomColor: colors.border }]}>
                        <View style={[s.topRank, { backgroundColor: i < 3 ? colors.primaryLight : colors.cardAlt }]}>
                            <Text style={[s.topRankText, { color: i < 3 ? colors.primary : colors.textTertiary }]}>
                                {i + 1}
                            </Text>
                        </View>
                        <View style={s.topInfo}>
                            <Text style={[s.topName, { color: colors.textPrimary }]}>{item.name}</Text>
                            <View style={s.topBarWrap}>
                                <View style={[s.topBarBg, { backgroundColor: colors.border }]}>
                                    <View
                                        style={[
                                            s.topBarFill,
                                            { width: `${item.pct * 100}%`, backgroundColor: colors.primary },
                                        ]}
                                    />
                                </View>
                                <Text style={[s.topQty, { color: colors.textTertiary }]}>
                                    {item.qty} sold
                                </Text>
                            </View>
                        </View>
                        <Text style={[s.topRevenue, { color: colors.textPrimary }]}>{item.revenue}</Text>
                    </View>
                ))}
            </View>
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

    // Date Filter
    dateFilterRow: { marginTop: hp(16), marginBottom: hp(16) },
    dateChip: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        paddingHorizontal: wp(14),
        paddingVertical: hp(10),
        borderRadius: wp(12),
        gap: wp(8),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    dateChipText: { fontSize: ms(13), fontWeight: "600" },

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
    kpiIconWrap: {
        width: wp(36),
        height: wp(36),
        borderRadius: wp(10),
        justifyContent: "center",
        alignItems: "center",
    },
    kpiBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: wp(6),
        paddingVertical: hp(3),
        borderRadius: wp(6),
        gap: wp(2),
    },
    kpiBadgeText: { fontSize: ms(10), fontWeight: "700" },
    kpiValue: { fontSize: ms(22), fontWeight: "800", letterSpacing: -0.5 },
    kpiTitle: { fontSize: ms(12), fontWeight: "500", marginTop: hp(2) },
    sparklineWrap: { marginTop: hp(8), alignItems: "flex-start" },

    // Sales Chart
    chartPills: { flexDirection: "row", gap: wp(6) },
    chartPill: {
        paddingHorizontal: wp(12),
        paddingVertical: hp(5),
        borderRadius: wp(8),
    },
    chartPillText: { fontSize: ms(11), fontWeight: "600" },
    chartTotalRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: hp(12),
        gap: wp(10),
    },
    chartTotalValue: { fontSize: ms(26), fontWeight: "800", letterSpacing: -0.5 },
    chartTotalBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: wp(8),
        paddingVertical: hp(4),
        borderRadius: wp(8),
        gap: wp(4),
    },
    chartTotalBadgeText: { fontSize: ms(12), fontWeight: "700" },
    chartContainer: { flexDirection: "row", marginTop: hp(16) },
    yAxis: {
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginRight: wp(8),
    },
    yLabel: { fontSize: ms(10), fontWeight: "500" },
    chartGridArea: {
        justifyContent: "space-between",
    },
    gridLine: { height: 1 },
    xAxis: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: hp(8),
    },
    xLabel: { fontSize: ms(10), fontWeight: "500", textAlign: "center", flex: 1 },

    // Donut
    donutLayout: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: hp(20),
    },
    donutWrap: {
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
    },
    donutCenter: {
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
    },
    donutTotal: { fontSize: ms(20), fontWeight: "800", letterSpacing: -0.5 },
    donutTotalLabel: { fontSize: ms(11), fontWeight: "500" },
    donutLegend: {
        flex: 1,
        marginLeft: wp(16),
        gap: hp(10),
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    legendDot: {
        width: wp(10),
        height: wp(10),
        borderRadius: wp(5),
        marginRight: wp(8),
    },
    legendTextWrap: { flex: 1 },
    legendLabel: { fontSize: ms(12), fontWeight: "500" },
    legendAmount: { fontSize: ms(13), fontWeight: "700", marginTop: hp(1) },
    legendPct: { fontSize: ms(12), fontWeight: "600" },

    // Order Types
    orderRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: hp(14),
        borderBottomWidth: 1,
    },
    orderIconWrap: {
        width: wp(44),
        height: wp(44),
        borderRadius: wp(12),
        justifyContent: "center",
        alignItems: "center",
    },
    orderInfo: { flex: 1, marginLeft: wp(12) },
    orderTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    orderLabel: { fontSize: ms(14), fontWeight: "600" },
    orderSales: { fontSize: ms(14), fontWeight: "700" },
    orderBarBg: { height: hp(5), borderRadius: wp(3), marginTop: hp(8), overflow: "hidden" },
    orderBarFill: { height: hp(5), borderRadius: wp(3) },
    orderSub: { fontSize: ms(11), marginTop: hp(4) },

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
    expenseLegendLabel: { fontSize: ms(12), fontWeight: "500", marginLeft: wp(4) },
    expenseLegendAmt: { fontSize: ms(14), fontWeight: "700", marginTop: hp(2), marginLeft: wp(18) },

    // Top Selling
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: hp(12),
        borderBottomWidth: 1,
    },
    topRank: {
        width: wp(30),
        height: wp(30),
        borderRadius: wp(10),
        justifyContent: "center",
        alignItems: "center",
    },
    topRankText: { fontSize: ms(13), fontWeight: "700" },
    topInfo: { flex: 1, marginLeft: wp(12) },
    topName: { fontSize: ms(13), fontWeight: "600" },
    topBarWrap: { flexDirection: "row", alignItems: "center", marginTop: hp(6), gap: wp(8) },
    topBarBg: { flex: 1, height: hp(5), borderRadius: wp(3), overflow: "hidden" },
    topBarFill: { height: hp(5), borderRadius: wp(3) },
    topQty: { fontSize: ms(10), fontWeight: "500" },
    topRevenue: { fontSize: ms(13), fontWeight: "700", marginLeft: wp(12) },
});
