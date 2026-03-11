import { Feather } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
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
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { hp, ms, useTheme, wp } from "../theme";

// ─── Types (re-export compatible with CalendarPicker) ────────
export type DateRange = { start: Date; end: Date };
export type QuickFilter =
  | "today"
  | "yesterday"
  | "this_week"
  | "this_month"
  | "last_month"
  | "custom";

export interface DateRangePickerRef {
  openModal: () => void;
}

interface DateRangePickerProps {
  dateRange: DateRange;
  activeFilter: QuickFilter;
  onDateRangeChange: (range: DateRange, filter: QuickFilter) => void;
  hideChip?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────
const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const FULL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
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

function formatDateDisplay(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")} ${FULL_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
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
      return {
        start: yesterday,
        end: new Date(yesterday.getTime() + 86399999),
      };
    }
    case "this_week":
      return { start: getStartOfWeek(today), end: getEndOfWeek(today) };
    case "this_month":
      return {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(
          today.getFullYear(),
          today.getMonth(),
          getDaysInMonth(today.getFullYear(), today.getMonth()),
          23, 59, 59, 999,
        ),
      };
    case "last_month": {
      const m = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
      const y =
        today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
      return {
        start: new Date(y, m, 1),
        end: new Date(y, m, getDaysInMonth(y, m), 23, 59, 59, 999),
      };
    }
    default:
      return { start: today, end: today };
  }
}

const QUICK_FILTERS: { key: QuickFilter; label: string; icon: string }[] = [
  { key: "today", label: "Today", icon: "sun" },
  { key: "yesterday", label: "Yesterday", icon: "clock" },
  { key: "this_week", label: "This Week", icon: "calendar" },
  { key: "this_month", label: "This Month", icon: "grid" },
  { key: "last_month", label: "Last Month", icon: "rewind" },
];

// ─── Quick Filter Pill ──────────────────────────────────────
function QuickPill({
  label,
  icon,
  active,
  onPress,
  colors,
}: {
  label: string;
  icon: string;
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
        onPressIn={() => {
          scale.value = withSpring(0.94, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        onPress={onPress}
        style={[
          st.quickPill,
          {
            backgroundColor: active ? colors.primary : colors.cardAlt,
            borderWidth: active ? 0 : 1,
            borderColor: active ? "transparent" : colors.border,
          },
        ]}
      >
        <Feather
          name={icon as any}
          size={ms(13)}
          color={active ? "#FFF" : colors.textSecondary}
        />
        <Text
          style={[
            st.quickPillText,
            { color: active ? "#FFFFFF" : colors.textSecondary },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Individual Scroll Column ───────────────────────────────
function ScrollColumn({
  data,
  selected,
  onSelect,
  colors,
  width,
}: {
  data: { label: string; value: number }[];
  selected: number;
  onSelect: (value: number) => void;
  colors: any;
  width?: number;
}) {
  const scrollRef = React.useRef<ScrollView>(null);
  const itemH = hp(42);

  React.useEffect(() => {
    const idx = data.findIndex((d) => d.value === selected);
    if (idx >= 0 && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: idx * itemH, animated: false });
      }, 100);
    }
  }, [selected, data, itemH]);

  return (
    <View style={[st.scrollCol, width ? { width } : { flex: 1 }]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        style={{ maxHeight: itemH * 5 }}
        nestedScrollEnabled
      >
        {data.map((item) => {
          const isActive = item.value === selected;
          return (
            <TouchableOpacity
              key={item.value}
              style={[
                st.scrollItem,
                { height: itemH },
                isActive && {
                  backgroundColor: colors.primary + "15",
                  borderRadius: wp(10),
                },
              ]}
              onPress={() => onSelect(item.value)}
              activeOpacity={0.6}
            >
              <Text
                style={[
                  st.scrollItemText,
                  {
                    color: isActive ? colors.primary : colors.textSecondary,
                    fontWeight: isActive ? "700" : "500",
                  },
                ]}
              >
                {item.label}
              </Text>
              {isActive && (
                <Feather name="check" size={ms(16)} color={colors.primary} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Inline Date Picker (Day / Month / Year scroll columns) ─
function InlineDatePicker({
  date,
  onDateChange,
  colors,
  maxDate,
}: {
  date: Date;
  onDateChange: (d: Date) => void;
  colors: any;
  maxDate?: Date;
}) {
  const [day, setDay] = useState(date.getDate());
  const [month, setMonth] = useState(date.getMonth());
  const [year, setYear] = useState(date.getFullYear());

  React.useEffect(() => {
    setDay(date.getDate());
    setMonth(date.getMonth());
    setYear(date.getFullYear());
  }, [date]);

  const daysInM = getDaysInMonth(year, month);
  const dayData = Array.from({ length: daysInM }, (_, i) => ({
    label: String(i + 1).padStart(2, "0"),
    value: i + 1,
  }));
  const monthData = FULL_MONTHS.map((m, i) => ({ label: m.slice(0, 3), value: i }));

  const currentYear = new Date().getFullYear();
  const yearData = Array.from({ length: 6 }, (_, i) => ({
    label: String(currentYear - 5 + i),
    value: currentYear - 5 + i,
  }));

  const commitDate = (d: number, m: number, y: number) => {
    const maxD = getDaysInMonth(y, m);
    const safeDay = Math.min(d, maxD);
    const newDate = new Date(y, m, safeDay);
    // Don't allow future dates
    if (maxDate && newDate.getTime() > maxDate.getTime()) return;
    onDateChange(newDate);
  };

  return (
    <View style={st.inlinePicker}>
      <ScrollColumn
        data={dayData}
        selected={day}
        onSelect={(v) => {
          setDay(v);
          commitDate(v, month, year);
        }}
        colors={colors}
        width={wp(65)}
      />
      <View style={[st.pickerDivider, { backgroundColor: colors.border }]} />
      <ScrollColumn
        data={monthData}
        selected={month}
        onSelect={(v) => {
          setMonth(v);
          commitDate(day, v, year);
        }}
        colors={colors}
      />
      <View style={[st.pickerDivider, { backgroundColor: colors.border }]} />
      <ScrollColumn
        data={yearData}
        selected={year}
        onSelect={(v) => {
          setYear(v);
          commitDate(day, month, v);
        }}
        colors={colors}
        width={wp(75)}
      />
    </View>
  );
}

// ─── Main Date Range Picker ─────────────────────────────────
export const DateRangePicker = React.forwardRef<
  DateRangePickerRef,
  DateRangePickerProps
>(({ dateRange, activeFilter, onDateRangeChange, hideChip = false }, ref) => {
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  // Temporary state while the modal is open
  const [tempStart, setTempStart] = useState<Date>(dateRange.start);
  const [tempEnd, setTempEnd] = useState<Date>(dateRange.end);
  const [tempFilter, setTempFilter] = useState<QuickFilter>(activeFilter);
  const [editingField, setEditingField] = useState<"from" | "to" | null>(null);

  const displayText = formatDateRange(dateRange.start, dateRange.end);

  const openModal = useCallback(() => {
    setTempStart(dateRange.start);
    setTempEnd(dateRange.end);
    setTempFilter(activeFilter);
    setEditingField(null);
    setModalVisible(true);
  }, [dateRange, activeFilter]);

  React.useImperativeHandle(ref, () => ({
    openModal,
  }));

  const handleQuickFilter = useCallback((filter: QuickFilter) => {
    setTempFilter(filter);
    const range = getQuickRange(filter);
    setTempStart(range.start);
    setTempEnd(range.end);
    setEditingField(null);
  }, []);

  const handleApply = useCallback(() => {
    const start =
      tempStart.getTime() <= tempEnd.getTime() ? tempStart : tempEnd;
    const end = tempStart.getTime() <= tempEnd.getTime() ? tempEnd : tempStart;
    onDateRangeChange({ start, end }, tempFilter);
    setModalVisible(false);
  }, [tempStart, tempEnd, tempFilter, onDateRangeChange]);

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return (
    <>
      {/* ─── Trigger Chip ──────────────────────── */}
      {!hideChip && (
        <View style={st.filterRow}>
          <TouchableOpacity
            onPress={openModal}
            activeOpacity={0.7}
            style={[
              st.dateChip,
              {
                backgroundColor: colors.card,
                borderColor: "rgba(0,0,0,0.03)",
              },
            ]}
          >
            <View
              style={[st.chipIconWrap, { backgroundColor: colors.primaryLight }]}
            >
              <Feather name="calendar" size={ms(14)} color={colors.primary} />
            </View>
            <Text style={[st.dateChipText, { color: colors.textPrimary }]}>
              {displayText}
            </Text>
            <Feather
              name="chevron-down"
              size={ms(14)}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Modal ─────────────────────────────── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={st.overlay}>
          <Pressable
            style={st.overlayBg}
            onPress={() => setModalVisible(false)}
          />

          {/* Bottom sheet */}
          <View
            style={[st.modalContent, { backgroundColor: colors.card }]}
          >
            {/* Handle bar */}
            <View style={st.handleBar}>
              <View style={[st.handle, { backgroundColor: colors.border }]} />
            </View>

            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Title */}
              <View style={st.modalHeader}>
                <Text
                  style={[st.modalTitle, { color: colors.textPrimary }]}
                >
                  Select Date Range
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Feather
                    name="x"
                    size={ms(22)}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Quick Filters */}
              <View style={st.quickFilters}>
                {QUICK_FILTERS.map((f) => (
                  <QuickPill
                    key={f.key}
                    label={f.label}
                    icon={f.icon}
                    active={tempFilter === f.key}
                    onPress={() => handleQuickFilter(f.key)}
                    colors={colors}
                  />
                ))}
              </View>

              {/* From / To Date Fields */}
              <View style={st.dateFieldsRow}>
                {/* FROM */}
                <Pressable
                  style={[
                    st.dateField,
                    {
                      backgroundColor: isDark
                        ? colors.cardAlt
                        : "#F8FAFC",
                      borderColor:
                        editingField === "from"
                          ? colors.primary
                          : colors.border,
                      borderWidth: editingField === "from" ? 2 : 1,
                    },
                  ]}
                  onPress={() => {
                    setEditingField("from");
                    setTempFilter("custom");
                  }}
                >
                  <View style={st.dateFieldHeader}>
                    <Feather
                      name="arrow-right-circle"
                      size={ms(14)}
                      color={
                        editingField === "from"
                          ? colors.primary
                          : colors.textTertiary
                      }
                    />
                    <Text
                      style={[
                        st.dateFieldLabel,
                        {
                          color:
                            editingField === "from"
                              ? colors.primary
                              : colors.textTertiary,
                        },
                      ]}
                    >
                      From
                    </Text>
                  </View>
                  <Text
                    style={[st.dateFieldValue, { color: colors.textPrimary }]}
                  >
                    {formatDateDisplay(tempStart)}
                  </Text>
                </Pressable>

                {/* Arrow */}
                <View style={st.dateArrowWrap}>
                  <Feather
                    name="arrow-right"
                    size={ms(18)}
                    color={colors.textTertiary}
                  />
                </View>

                {/* TO */}
                <Pressable
                  style={[
                    st.dateField,
                    {
                      backgroundColor: isDark
                        ? colors.cardAlt
                        : "#F8FAFC",
                      borderColor:
                        editingField === "to"
                          ? colors.primary
                          : colors.border,
                      borderWidth: editingField === "to" ? 2 : 1,
                    },
                  ]}
                  onPress={() => {
                    setEditingField("to");
                    setTempFilter("custom");
                  }}
                >
                  <View style={st.dateFieldHeader}>
                    <Feather
                      name="arrow-left-circle"
                      size={ms(14)}
                      color={
                        editingField === "to"
                          ? colors.primary
                          : colors.textTertiary
                      }
                    />
                    <Text
                      style={[
                        st.dateFieldLabel,
                        {
                          color:
                            editingField === "to"
                              ? colors.primary
                              : colors.textTertiary,
                        },
                      ]}
                    >
                      To
                    </Text>
                  </View>
                  <Text
                    style={[st.dateFieldValue, { color: colors.textPrimary }]}
                  >
                    {formatDateDisplay(tempEnd)}
                  </Text>
                </Pressable>
              </View>

              {/* Inline Date Scroller — shown when a field is selected */}
              {editingField && (
                <View
                  style={[
                    st.pickerContainer,
                    {
                      backgroundColor: isDark ? colors.cardAlt : "#F8FAFC",
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      st.pickerTitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {editingField === "from"
                      ? "Select Start Date"
                      : "Select End Date"}
                  </Text>
                  <View style={st.pickerHeaders}>
                    <Text
                      style={[
                        st.pickerHeaderText,
                        { color: colors.textTertiary, width: wp(65) },
                      ]}
                    >
                      Day
                    </Text>
                    <Text
                      style={[
                        st.pickerHeaderText,
                        { color: colors.textTertiary, flex: 1 },
                      ]}
                    >
                      Month
                    </Text>
                    <Text
                      style={[
                        st.pickerHeaderText,
                        { color: colors.textTertiary, width: wp(75) },
                      ]}
                    >
                      Year
                    </Text>
                  </View>
                  <InlineDatePicker
                    date={editingField === "from" ? tempStart : tempEnd}
                    onDateChange={(d) => {
                      if (editingField === "from") {
                        setTempStart(d);
                      } else {
                        setTempEnd(d);
                      }
                    }}
                    colors={colors}
                    maxDate={today}
                  />
                </View>
              )}

              {/* Range Summary */}
              <View
                style={[st.summaryRow, { backgroundColor: colors.primaryLight || (colors.primary + "10") }]}
              >
                <Feather name="info" size={ms(14)} color={colors.primary} />
                <Text
                  style={[st.summaryText, { color: colors.textSecondary }]}
                >
                  {isSameDay(tempStart, tempEnd)
                    ? formatDateDisplay(tempStart)
                    : `${formatDateShort(tempStart)} ${tempStart.getFullYear()} → ${formatDateShort(tempEnd)} ${tempEnd.getFullYear()}`}
                </Text>
              </View>

              {/* Actions */}
              <View style={st.actions}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={[
                    st.actionBtn,
                    st.cancelBtn,
                    { borderColor: colors.border },
                  ]}
                >
                  <Text
                    style={[
                      st.actionBtnText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleApply}
                  style={[
                    st.actionBtn,
                    st.applyBtn,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Feather
                    name="check"
                    size={ms(16)}
                    color="#FFF"
                    style={{ marginRight: wp(6) }}
                  />
                  <Text style={[st.actionBtnText, { color: "#FFFFFF" }]}>
                    Apply Filter
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
});

export default DateRangePicker;

// ─── Styles ─────────────────────────────────────────────────
const st = StyleSheet.create({
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
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
    maxHeight: "92%",
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
    marginBottom: hp(20),
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
    marginBottom: hp(24),
  },
  quickPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(14),
    paddingVertical: hp(9),
    borderRadius: wp(12),
    gap: wp(6),
  },
  quickPillText: {
    fontSize: ms(12),
    fontWeight: "600",
  },

  // Date fields
  dateFieldsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(20),
    gap: wp(8),
  },
  dateField: {
    flex: 1,
    borderRadius: wp(16),
    padding: wp(14),
  },
  dateFieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(6),
    marginBottom: hp(6),
  },
  dateFieldLabel: {
    fontSize: ms(11),
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateFieldValue: {
    fontSize: ms(14),
    fontWeight: "700",
  },
  dateArrowWrap: {
    width: wp(28),
    alignItems: "center",
  },

  // Inline picker
  pickerContainer: {
    borderRadius: wp(16),
    padding: wp(14),
    marginBottom: hp(20),
    borderWidth: 1,
  },
  pickerTitle: {
    fontSize: ms(12),
    fontWeight: "600",
    marginBottom: hp(10),
    textAlign: "center",
  },
  pickerHeaders: {
    flexDirection: "row",
    marginBottom: hp(6),
    paddingHorizontal: wp(4),
  },
  pickerHeaderText: {
    fontSize: ms(10),
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  inlinePicker: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: wp(2),
  },
  scrollCol: {
    alignItems: "stretch",
  },
  scrollItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: wp(8),
    gap: wp(6),
  },
  scrollItemText: {
    fontSize: ms(14),
    textAlign: "center",
  },
  pickerDivider: {
    width: 1,
    alignSelf: "stretch",
    opacity: 0.3,
  },

  // Summary
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(8),
    paddingHorizontal: wp(14),
    paddingVertical: hp(12),
    borderRadius: wp(12),
    marginBottom: hp(20),
  },
  summaryText: {
    fontSize: ms(13),
    fontWeight: "500",
    flex: 1,
  },

  // Actions
  actions: {
    flexDirection: "row",
    gap: wp(12),
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: hp(14),
    borderRadius: wp(14),
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    borderWidth: 1.5,
  },
  applyBtn: {
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  actionBtnText: {
    fontSize: ms(15),
    fontWeight: "700",
  },
});
