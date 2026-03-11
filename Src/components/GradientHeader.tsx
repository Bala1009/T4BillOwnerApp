import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Animated as RNAnimated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
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
  /** Right-side extra element (e.g. a filter button) */
  rightElement?: React.ReactNode;
  /** Optional callback when the calendar icon is pressed (handled externally) */
  onCalendarPress?: () => void;
}

// ─── Animated Theme Toggle Button ───────────────────────────
function ThemeToggleButton() {
  const { isDark, toggleTheme, colors } = useTheme();

  // Shared Animated.Value to drive icon rotation + scale bounce
  const rotation = useRef(new RNAnimated.Value(isDark ? 1 : 0)).current;
  const scale = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    // Scale bounce + rotation on every theme change
    RNAnimated.parallel([
      RNAnimated.sequence([
        RNAnimated.timing(scale, {
          toValue: 0.7,
          duration: 120,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        RNAnimated.spring(scale, {
          toValue: 1,
          friction: 4,
          tension: 200,
          useNativeDriver: true,
        }),
      ]),
      RNAnimated.timing(rotation, {
        toValue: isDark ? 1 : 0,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, [isDark]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      activeOpacity={0.7}
      style={s.themeBtn}
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      accessibilityRole="switch"
    >
      <RNAnimated.View
        style={[
          s.themeBtnInner,
          {
            backgroundColor: isDark
              ? 'rgba(255,255,255,0.15)'
              : 'rgba(0,0,0,0.12)',
            transform: [{ rotate }, { scale }],
          },
        ]}
      >
        <Feather
          name={isDark ? 'sun' : 'moon'}
          size={ms(16)}
          color="#FFF"
        />
      </RNAnimated.View>
    </TouchableOpacity>
  );
}

/**
 * Shared gradient header used across ALL screens.
 *
 * Layout:
 *   [menu icon]  [title + subtitle]  …flex…  [calendar icon] [theme toggle] [notification/right icon]
 *
 * The left icon is ALWAYS a hamburger menu that opens the drawer.
 * The subtitle automatically shows the selected date range from DateFilterContext
 * unless a custom subtitle is explicitly provided.
 */
export default function GradientHeader({
  title,
  subtitle,
  rightElement,
  onCalendarPress,
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

  const handleMenuPress = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const handleNotificationPress = () => {
    navigation.navigate('Notifications');
  };

  return (
    <View style={[s.header, { backgroundColor: colors.purple, paddingTop }]}>
      {/* Left: hamburger menu */}
      <TouchableOpacity onPress={handleMenuPress} style={s.iconBtn} accessibilityLabel="Open menu">
        <Feather name="menu" size={ms(22)} color="#FFF" />
      </TouchableOpacity>

      {/* Center-left: title block */}
      <View style={s.titleBlock}>
        <Text style={s.title} numberOfLines={1}>{title}</Text>
        {displaySubtitle ? (
          <Text style={s.subtitle} numberOfLines={1}>{displaySubtitle}</Text>
        ) : null}
      </View>

      {/* Calendar icon — triggers date picker */}
      {onCalendarPress && (
        <TouchableOpacity
          style={s.iconBtn}
          onPress={onCalendarPress}
          accessibilityLabel="Select date"
        >
          <Feather name="calendar" size={ms(22)} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* Theme toggle — sun/moon with rotation animation */}
      <ThemeToggleButton />

      {/* Right: notification bell or custom element */}
      {rightElement ? (
        <View style={s.iconBtn}>{rightElement}</View>
      ) : (
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
      )}
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
  // Theme toggle button
  themeBtn: {
    width: ms(40),
    height: ms(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeBtnInner: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    alignItems: 'center',
    justifyContent: 'center',
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
