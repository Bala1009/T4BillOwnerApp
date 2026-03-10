import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { ms, useTheme, wp, hp } from '../theme';
import { useDateFilter } from '../context/DateFilterContext';

// ─── Helpers ────────────────────────────────────────────────
const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Build a human-readable date range string like "10 Mar 2026" or "1 – 10 Mar 2026" */
function formatDateRange(start: Date, end: Date): string {
  if (isSameDay(start, end)) {
    return `${start.getDate()} ${SHORT_MONTHS[start.getMonth()]} ${start.getFullYear()}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} – ${end.getDate()} ${SHORT_MONTHS[start.getMonth()]} ${start.getFullYear()}`;
    }
    return `${start.getDate()} ${SHORT_MONTHS[start.getMonth()]} – ${end.getDate()} ${SHORT_MONTHS[end.getMonth()]} ${start.getFullYear()}`;
  }
  return `${start.getDate()} ${SHORT_MONTHS[start.getMonth()]} ${start.getFullYear()} – ${end.getDate()} ${SHORT_MONTHS[end.getMonth()]} ${end.getFullYear()}`;
}

// ─── Types ──────────────────────────────────────────────────
interface GradientHeaderProps {
  title: string;
  /**
   * If provided, overrides the auto-generated subtitle.
   * If omitted, the selected date range is shown automatically.
   */
  subtitle?: string;
  /** Show a white back-arrow on the left */
  onBack?: () => void;
  /** Show a white hamburger menu on the left */
  onMenuPress?: () => void;
  showMenu?: boolean;
  /** Right-side extra element (e.g. a filter button) */
  rightElement?: React.ReactNode;
}

/**
 * Shared gradient header used across ALL screens.
 *
 * Layout:
 *   [left icon]  [title + subtitle – left aligned]  …flex…  [right icon/element]
 *
 * The subtitle automatically shows the selected date range from DateFilterContext
 * unless a custom subtitle is explicitly provided.
 */
export default function GradientHeader({
  title,
  subtitle,
  onBack,
  onMenuPress,
  showMenu = false,
  rightElement,
}: GradientHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { dateRange } = useDateFilter();

  // On Android use StatusBar.currentHeight; on iOS use the safe-area top inset.
  const statusBarHeight =
    Platform.OS === 'android'
      ? (StatusBar.currentHeight ?? 24)
      : insets.top;
  const paddingTop = statusBarHeight + 12;

  // Auto-generated subtitle: formatted date range from global filter
  const autoSubtitle = `Data for ${formatDateRange(dateRange.start, dateRange.end)}`;
  const displaySubtitle = subtitle ?? autoSubtitle;

  const handleNotificationPress = () => {
    navigation.navigate('Notifications');
  };

  const renderLeft = () => {
    if (onBack) {
      return (
        <TouchableOpacity onPress={onBack} style={s.iconBtn} accessibilityLabel="Go back">
          <Feather name="arrow-left" size={ms(22)} color="#FFF" />
        </TouchableOpacity>
      );
    }
    if (showMenu) {
      return (
        <TouchableOpacity onPress={onMenuPress} style={s.iconBtn} accessibilityLabel="Open menu">
          <Feather name="menu" size={ms(22)} color="#FFF" />
        </TouchableOpacity>
      );
    }
    // Placeholder to keep spacing consistent
    return <View style={s.iconBtn} />;
  };

  const renderRight = () => {
    if (rightElement) {
      return <View style={s.iconBtn}>{rightElement}</View>;
    }
    return (
      <TouchableOpacity
        style={s.iconBtn}
        onPress={handleNotificationPress}
        accessibilityLabel="Notifications"
      >
        <View>
          <Feather name="bell" size={ms(22)} color="#FFF" />
          <View style={s.notifDot} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[s.header, { backgroundColor: colors.purple, paddingTop }]}>
      {/* Left: back arrow or hamburger */}
      {renderLeft()}

      {/* Center-left: title block (left-aligned like Performance screen) */}
      <View style={s.titleBlock}>
        <Text style={s.title} numberOfLines={1}>{title}</Text>
        {displaySubtitle ? (
          <Text style={s.subtitle} numberOfLines={1}>{displaySubtitle}</Text>
        ) : null}
      </View>

      {/* Right: notification bell or custom element */}
      {renderRight()}
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: hp(24),
    paddingHorizontal: wp(16),
    borderBottomLeftRadius: ms(24),
    borderBottomRightRadius: ms(24),
  },
  iconBtn: {
    width: ms(40),
    height: ms(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    paddingHorizontal: wp(8),
  },
  title: {
    fontSize: ms(22),
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: ms(13),
    color: 'rgba(255,255,255,0.8)',
    marginTop: hp(3),
  },
  notifDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    backgroundColor: '#FF4757',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
});
