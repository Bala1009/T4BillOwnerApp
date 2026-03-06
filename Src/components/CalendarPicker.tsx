import { Feather } from "@expo/vector-icons";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    SlideInDown,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { hp, ms, useTheme, wp } from "../theme";

// ─── Types ──────────────────────────────────────────────────
export type DateRange = { start: Date; end: Date };
export type QuickFilter = "today" | "yesterday" | "this_week" | "this_month" | "last_month" | "custom";

interface CalendarPickerProps {
    dateRange: DateRange;
    activeFilter: QuickFilter;
    onDateRangeChange: (range: DateRange, filter: QuickFilter) => void;
}

// ─── Helpers ────────────────────────────────────────────────
const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const SHORT_MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DAY_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

function isInRange(day: Date, start: Date, end: Date): boolean {
    const d = day.getTime();
    const s = Math.min(start.getTime(), end.getTime());
    const e = Math.max(start.getTime(), end.getTime());
    return d >= s && d <= e;
}

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
}

function getEndOfWeek(date: Date): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + (6 - d.getDay()));
    d.setHours(23, 59, 59, 999);
    return d;
}

function formatDateShort(date: Date): string {
    return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]}`;
}

function formatDateRange(start: Date, end: Date): string {
    if (isSameDay(start, end)) {
        return `${start.getDate()} ${SHORT_MONTHS[start.getMonth()]} ${start.getFullYear()}`;
    }
    if (start.getFullYear() === end.getFullYear()) {
        if (start.getMonth() === end.getMonth()) {
            return `${start.getDate()} – ${end.getDate()} ${SHORT_MONTHS[start.getMonth()]} ${start.getFullYear()}`;
        }
        return `${formatDateShort(start)} – ${formatDateShort(end)} ${start.getFullYear()}`;
    }
    return `${formatDateShort(start)} ${start.getFullYear()} – ${formatDateShort(end)} ${end.getFullYear()}`;
}

function getQuickRange(filter: QuickFilter): DateRange {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
        case "today":
            return { start: today, end: new Date(today.getTime() + 86399999) };
        case "yesterday": {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return { start: yesterday, end: new Date(yesterday.getTime() + 86399999) };
        }
        case "this_week":
            return { start: getStartOfWeek(today), end: getEndOfWeek(today) };
        case "this_month":
            return {
                start: new Date(today.getFullYear(), today.getMonth(), 1),
                end: new Date(today.getFullYear(), today.getMonth(),
                    getDaysInMonth(today.getFullYear(), today.getMonth()), 23, 59, 59, 999),
            };
        case "last_month": {
            const m = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
            const y = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
            return {
                start: new Date(y, m, 1),
                end: new Date(y, m, getDaysInMonth(y, m), 23, 59, 59, 999),
            };
        }
        default:
            return { start: today, end: today };
    }
}

const QUICK_FILTERS: { key: QuickFilter; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "this_week", label: "This Week" },
    { key: "this_month", label: "This Month" },
    { key: "last_month", label: "Last Month" },
    { key: "custom", label: "Custom" },
];

// ─── Quick Filter Pill ──────────────────────────────────────
function QuickPill({
    label,
    active,
    onPress,
    colors,
}: {
    label: string;
    active: boolean;
    onPress: () => void;
    colors: any;
}) {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={animatedStyle}>
            <Pressable
                onPressIn={() => { scale.value = withSpring(0.94, { damping: 15, stiffness: 300 }); }}
                onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
                onPress={onPress}
                style={[
                    styles.quickPill,
                    {
                        backgroundColor: active ? colors.primary : colors.cardAlt,
                    },
                ]}
            >
                <Text style={[
                    styles.quickPillText,
                    { color: active ? "#FFFFFF" : colors.textSecondary },
                ]}>
                    {label}
                </Text>
            </Pressable>
        </Animated.View>
    );
}

// ─── Calendar Day Cell ──────────────────────────────────────
function DayCell({
    day,
    isCurrentMonth,
    isSelected,
    isStart,
    isEnd,
    isRange,
    isToday,
    disabled,
    onPress,
    colors,
}: {
    day: Date;
    isCurrentMonth: boolean;
    isSelected: boolean;
    isStart: boolean;
    isEnd: boolean;
    isRange: boolean;
    isToday: boolean;
    disabled: boolean;
    onPress: (date: Date) => void;
    colors: any;
}) {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const bgColor = disabled
        ? "transparent"
        : isStart || isEnd
            ? colors.primary
            : isRange
                ? colors.primaryLight
                : "transparent";

    const textColor = disabled
        ? colors.textTertiary + "40"
        : isStart || isEnd
            ? "#FFFFFF"
            : !isCurrentMonth
                ? colors.textTertiary + "50"
                : isToday
                    ? colors.primary
                    : colors.textPrimary;

    return (
        <View style={[
            styles.dayCellOuter,
            !disabled && isRange && !isStart && !isEnd && { backgroundColor: colors.primaryLight },
            isStart && isRange && { backgroundColor: "transparent" },
            isEnd && isRange && { backgroundColor: "transparent" },
        ]}>
            {/* Range fill behind pill */}
            {!disabled && isRange && isStart && (
                <View style={[
                    styles.rangeTrailRight,
                    { backgroundColor: colors.primaryLight },
                ]} />
            )}
            {!disabled && isRange && isEnd && (
                <View style={[
                    styles.rangeTrailLeft,
                    { backgroundColor: colors.primaryLight },
                ]} />
            )}
            <Animated.View style={[animatedStyle, disabled && { opacity: 0.4 }]}>
                <Pressable
                    disabled={disabled}
                    onPressIn={() => { if (!disabled) scale.value = withSpring(0.85, { damping: 14, stiffness: 300 }); }}
                    onPressOut={() => { if (!disabled) scale.value = withSpring(1, { damping: 14, stiffness: 300 }); }}
                    onPress={() => { if (!disabled) onPress(day); }}
                    style={[
                        styles.dayCell,
                        { backgroundColor: bgColor },
                        !disabled && (isStart || isEnd) && styles.dayCellSelected,
                    ]}
                >
                    <Text style={[
                        styles.dayText,
                        { color: textColor },
                        !disabled && (isStart || isEnd) && styles.dayTextSelected,
                        !disabled && isToday && !isStart && !isEnd && { fontWeight: "800" },
                    ]}>
                        {day.getDate()}
                    </Text>
                </Pressable>
            </Animated.View>
            {isToday && !isStart && !isEnd && !disabled && (
                <View style={[styles.todayDot, { backgroundColor: colors.primary }]} />
            )}
        </View>
    );
}

// ─── Main Calendar Picker ───────────────────────────────────
export default function CalendarPicker({
    dateRange,
    activeFilter,
    onDateRangeChange,
}: CalendarPickerProps) {
    const { colors } = useTheme();
    const [modalVisible, setModalVisible] = useState(false);

    // Calendar state
    const [viewMonth, setViewMonth] = useState(dateRange.start.getMonth());
    const [viewYear, setViewYear] = useState(dateRange.start.getFullYear());
    const [tempStart, setTempStart] = useState<Date | null>(dateRange.start);
    const [tempEnd, setTempEnd] = useState<Date | null>(dateRange.end);
    const [tempFilter, setTempFilter] = useState<QuickFilter>(activeFilter);
    // Use a ref for selection phase to avoid stale closure issues
    const selectingEndRef = useRef(false);

    const displayText = formatDateRange(dateRange.start, dateRange.end);

    const openModal = useCallback(() => {
        setViewMonth(dateRange.start.getMonth());
        setViewYear(dateRange.start.getFullYear());
        setTempStart(dateRange.start);
        setTempEnd(dateRange.end);
        setTempFilter(activeFilter);
        selectingEndRef.current = false;
        setModalVisible(true);
    }, [dateRange, activeFilter]);

    // Generate calendar grid
    const calendarDays = useMemo(() => {
        const firstDay = new Date(viewYear, viewMonth, 1).getDay();
        const daysInMonth = getDaysInMonth(viewYear, viewMonth);
        const daysInPrevMonth = getDaysInMonth(
            viewMonth === 0 ? viewYear - 1 : viewYear,
            viewMonth === 0 ? 11 : viewMonth - 1,
        );

        const days: { date: Date; isCurrentMonth: boolean }[] = [];

        // Previous month fill
        for (let i = firstDay - 1; i >= 0; i--) {
            const pMonth = viewMonth === 0 ? 11 : viewMonth - 1;
            const pYear = viewMonth === 0 ? viewYear - 1 : viewYear;
            days.push({
                date: new Date(pYear, pMonth, daysInPrevMonth - i),
                isCurrentMonth: false,
            });
        }

        // Current month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                date: new Date(viewYear, viewMonth, i),
                isCurrentMonth: true,
            });
        }

        // Next month fill (to 42 = 6 rows)
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            const nMonth = viewMonth === 11 ? 0 : viewMonth + 1;
            const nYear = viewMonth === 11 ? viewYear + 1 : viewYear;
            days.push({
                date: new Date(nYear, nMonth, i),
                isCurrentMonth: false,
            });
        }

        return days;
    }, [viewMonth, viewYear]);

    const handleDayPress = useCallback((date: Date) => {
        setTempFilter("custom");
        setTempStart((prevStart) => {
            if (!selectingEndRef.current || !prevStart) {
                // First tap — set start, clear end
                setTempEnd(null);
                selectingEndRef.current = true;
                return date;
            } else {
                // Second tap — set end
                if (date.getTime() < prevStart.getTime()) {
                    setTempEnd(prevStart);
                    selectingEndRef.current = false;
                    return date;
                } else {
                    setTempEnd(date);
                    selectingEndRef.current = false;
                    return prevStart;
                }
            }
        });
    }, []);

    const handleQuickFilter = useCallback((filter: QuickFilter) => {
        setTempFilter(filter);
        if (filter !== "custom") {
            const range = getQuickRange(filter);
            setTempStart(range.start);
            setTempEnd(range.end);
            setViewMonth(range.start.getMonth());
            setViewYear(range.start.getFullYear());
        }
    }, []);

    const handleApply = useCallback(() => {
        if (tempStart) {
            const end = tempEnd || tempStart;
            onDateRangeChange(
                {
                    start: tempStart,
                    end: end.getTime() < tempStart.getTime() ? tempStart : end,
                },
                tempFilter,
            );
        }
        setModalVisible(false);
    }, [tempStart, tempEnd, tempFilter, onDateRangeChange]);

    const goToPrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(viewYear - 1);
        } else {
            setViewMonth(viewMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(viewYear + 1);
        } else {
            setViewMonth(viewMonth + 1);
        }
    };

    const today = new Date();

    return (
        <>
            {/* ─── Trigger Chip ──────────────────────── */}
            <View style={styles.filterRow}>
                <TouchableOpacity
                    onPress={openModal}
                    activeOpacity={0.7}
                    style={[styles.dateChip, { backgroundColor: colors.card, borderColor: "rgba(0,0,0,0.03)" }]}
                >
                    <View style={[styles.chipIconWrap, { backgroundColor: colors.primaryLight }]}>
                        <Feather name="calendar" size={ms(14)} color={colors.primary} />
                    </View>
                    <Text style={[styles.dateChipText, { color: colors.textPrimary }]}>{displayText}</Text>
                    <Feather name="chevron-down" size={ms(14)} color={colors.textTertiary} />
                </TouchableOpacity>
            </View>

            {/* ─── Modal ─────────────────────────────── */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.overlay}>
                    {/* Scrim — uniform dark tint */}
                    <Pressable style={styles.overlayBg} onPress={() => setModalVisible(false)} />

                    {/* Bottom sheet */}
                    <Animated.View
                        entering={SlideInDown.springify().damping(18).stiffness(120)}
                        style={[styles.modalContent, { backgroundColor: colors.card }]}
                    >
                        {/* Handle bar */}
                        <View style={styles.handleBar}>
                            <View style={[styles.handle, { backgroundColor: colors.border }]} />
                        </View>

                        <ScrollView
                            bounces={false}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Title */}
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Date Range</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Feather name="x" size={ms(22)} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {/* Quick Filters */}
                            <View style={styles.quickFilters}>
                                {QUICK_FILTERS.map((f) => (
                                    <QuickPill
                                        key={f.key}
                                        label={f.label}
                                        active={tempFilter === f.key}
                                        onPress={() => handleQuickFilter(f.key)}
                                        colors={colors}
                                    />
                                ))}
                            </View>

                            {/* Month Navigation */}
                            <View style={styles.monthNav}>
                                <TouchableOpacity onPress={goToPrevMonth} style={[styles.navBtn, { backgroundColor: colors.cardAlt }]}>
                                    <Feather name="chevron-left" size={ms(18)} color={colors.textPrimary} />
                                </TouchableOpacity>
                                <Text style={[styles.monthLabel, { color: colors.textPrimary }]}>
                                    {MONTH_NAMES[viewMonth]} {viewYear}
                                </Text>
                                <TouchableOpacity onPress={goToNextMonth} style={[styles.navBtn, { backgroundColor: colors.cardAlt }]}>
                                    <Feather name="chevron-right" size={ms(18)} color={colors.textPrimary} />
                                </TouchableOpacity>
                            </View>

                            {/* Day Headers */}
                            <View style={styles.dayHeaders}>
                                {DAY_HEADERS.map((d) => (
                                    <Text key={d} style={[styles.dayHeaderText, { color: colors.textTertiary }]}>
                                        {d}
                                    </Text>
                                ))}
                            </View>

                            {/* Calendar Grid */}
                            <View style={styles.calendarGrid}>
                                {calendarDays.map((item, idx) => {
                                    const start = tempStart || dateRange.start;
                                    const end = tempEnd || tempStart || dateRange.end;
                                    const effectiveStart = start.getTime() <= end.getTime() ? start : end;
                                    const effectiveEnd = start.getTime() <= end.getTime() ? end : start;

                                    const isStart = isSameDay(item.date, effectiveStart);
                                    const isEnd = isSameDay(item.date, effectiveEnd);
                                    const inRange = tempEnd
                                        ? isInRange(item.date, effectiveStart, effectiveEnd)
                                        : false;
                                    const isToday = isSameDay(item.date, today);
                                    // Disable future dates (anything after today)
                                    const isFuture = item.date.getTime() > new Date(
                                        today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999,
                                    ).getTime();

                                    return (
                                        <DayCell
                                            key={idx}
                                            day={item.date}
                                            isCurrentMonth={item.isCurrentMonth}
                                            isSelected={isStart || isEnd}
                                            isStart={isStart}
                                            isEnd={isEnd}
                                            isRange={inRange}
                                            isToday={isToday}
                                            disabled={isFuture}
                                            onPress={handleDayPress}
                                            colors={colors}
                                        />
                                    );
                                })}
                            </View>

                            {/* Selection Info */}
                            <View style={[styles.selectionInfo, { backgroundColor: colors.cardAlt }]}>
                                <Feather name="info" size={ms(14)} color={colors.primary} />
                                <Text style={[styles.selectionInfoText, { color: colors.textSecondary }]}>
                                    {tempStart && tempEnd
                                        ? formatDateRange(
                                            tempStart.getTime() <= tempEnd.getTime() ? tempStart : tempEnd,
                                            tempStart.getTime() <= tempEnd.getTime() ? tempEnd : tempStart,
                                        )
                                        : tempStart
                                            ? `${formatDateShort(tempStart)} — tap another day`
                                            : "Tap a day to start selecting"}
                                </Text>
                            </View>

                            {/* Actions */}
                            <View style={styles.actions}>
                                <TouchableOpacity
                                    onPress={() => setModalVisible(false)}
                                    style={[styles.actionBtn, styles.cancelBtn, { borderColor: colors.border }]}
                                >
                                    <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleApply}
                                    style={[styles.actionBtn, styles.applyBtn, { backgroundColor: colors.primary }]}
                                >
                                    <Text style={[styles.actionBtnText, { color: "#FFFFFF" }]}>Apply</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </Animated.View>
                </View>
            </Modal>
        </>
    );
}

// ─── Styles ─────────────────────────────────────────────────
const CELL_SIZE = (100 / 7);

const styles = StyleSheet.create({
    filterRow: {
        marginTop: hp(16),
        marginBottom: hp(16),
    },
    dateChip: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        paddingRight: wp(14),
        paddingLeft: wp(6),
        paddingVertical: hp(8),
        borderRadius: wp(14),
        gap: wp(8),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
    },
    chipIconWrap: {
        width: wp(30),
        height: wp(30),
        borderRadius: wp(10),
        justifyContent: "center",
        alignItems: "center",
    },
    dateChipText: { fontSize: ms(13), fontWeight: "600" },

    // Modal
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
    },
    overlayBg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.45)",
    },
    modalContent: {
        borderTopLeftRadius: wp(28),
        borderTopRightRadius: wp(28),
        paddingHorizontal: wp(20),
        paddingBottom: hp(32),
        maxHeight: "90%",
    },
    handleBar: {
        alignItems: "center",
        paddingTop: hp(12),
        paddingBottom: hp(8),
    },
    handle: {
        width: wp(36),
        height: hp(4),
        borderRadius: wp(2),
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: hp(16),
    },
    modalTitle: {
        fontSize: ms(20),
        fontWeight: "700",
        letterSpacing: -0.3,
    },

    // Quick filters
    quickFilters: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: wp(8),
        marginBottom: hp(20),
    },
    quickPill: {
        paddingHorizontal: wp(14),
        paddingVertical: hp(8),
        borderRadius: wp(10),
    },
    quickPillText: {
        fontSize: ms(12),
        fontWeight: "600",
    },

    // Month nav
    monthNav: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: hp(16),
    },
    navBtn: {
        width: wp(36),
        height: wp(36),
        borderRadius: wp(12),
        justifyContent: "center",
        alignItems: "center",
    },
    monthLabel: {
        fontSize: ms(16),
        fontWeight: "700",
    },

    // Day headers
    dayHeaders: {
        flexDirection: "row",
        marginBottom: hp(8),
    },
    dayHeaderText: {
        width: `${CELL_SIZE}%` as any,
        textAlign: "center",
        fontSize: ms(12),
        fontWeight: "600",
    },

    // Calendar grid
    calendarGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    dayCellOuter: {
        width: `${CELL_SIZE}%` as any,
        aspectRatio: 1,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    rangeTrailRight: {
        position: "absolute",
        top: 0,
        bottom: 0,
        right: 0,
        width: "50%",
    },
    rangeTrailLeft: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        width: "50%",
    },
    dayCell: {
        width: wp(36),
        height: wp(36),
        borderRadius: wp(12),
        justifyContent: "center",
        alignItems: "center",
    },
    dayCellSelected: {
        shadowColor: "#1A237E",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    dayText: {
        fontSize: ms(14),
        fontWeight: "500",
    },
    dayTextSelected: {
        fontWeight: "700",
        color: "#FFFFFF",
    },
    todayDot: {
        width: wp(4),
        height: wp(4),
        borderRadius: wp(2),
        marginTop: hp(2),
        position: "absolute",
        bottom: hp(4),
    },

    // Selection info
    selectionInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: wp(8),
        marginTop: hp(16),
        paddingHorizontal: wp(14),
        paddingVertical: hp(10),
        borderRadius: wp(12),
    },
    selectionInfoText: {
        fontSize: ms(13),
        fontWeight: "500",
        flex: 1,
    },

    // Actions
    actions: {
        flexDirection: "row",
        gap: wp(12),
        marginTop: hp(16),
    },
    actionBtn: {
        flex: 1,
        paddingVertical: hp(14),
        borderRadius: wp(14),
        alignItems: "center",
        justifyContent: "center",
    },
    cancelBtn: {
        borderWidth: 1.5,
    },
    applyBtn: {
        shadowColor: "#1A237E",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
    },
    actionBtnText: {
        fontSize: ms(15),
        fontWeight: "700",
    },
});
