import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hp, ms, useTheme, wp } from '../theme';

export default function NotificationScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.root, { backgroundColor: colors.bg }]}>
      {/* ── Header ── */}
      <View style={[s.header, { backgroundColor: colors.purple, paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn} accessibilityLabel="Go back">
          <Feather name="arrow-left" size={ms(22)} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notifications</Text>
        <View style={s.headerBtn} />
      </View>

      {/* ── Empty State ── */}
      <View style={s.emptyWrap}>
        {/* Decorative rings behind the bell */}
        <View style={[s.ring, s.ringOuter, { borderColor: colors.primary + '10' }]} />
        <View style={[s.ring, s.ringMiddle, { borderColor: colors.primary + '18' }]} />
        <View style={[s.ring, s.ringInner, { borderColor: colors.primary + '25' }]} />

        {/* Icon bubble */}
        <View style={[s.iconBubble, { backgroundColor: colors.primaryLight }]}>
          <Feather name="bell-off" size={ms(40)} color={colors.primary} />
        </View>

        <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>
          No Notifications Yet
        </Text>
        <Text style={[s.emptyDesc, { color: colors.textSecondary }]}>
          When you receive notifications about your{'\n'}orders, inventory, or performance — they{'\n'}will appear here.
        </Text>

        <View style={[s.divider, { backgroundColor: colors.border }]} />

        {/* Feature hints */}
        <View style={s.hintsWrap}>
          {[
            { icon: 'shopping-bag', label: 'Order updates' },
            { icon: 'package',      label: 'Inventory alerts' },
            { icon: 'trending-up',  label: 'Performance insights' },
          ].map((hint, i) => (
            <View key={i} style={s.hintRow}>
              <View style={[s.hintIcon, { backgroundColor: colors.cardAlt }]}>
                <Feather name={hint.icon as any} size={ms(16)} color={colors.primary} />
              </View>
              <Text style={[s.hintLabel, { color: colors.textSecondary }]}>{hint.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: hp(20),
    paddingHorizontal: wp(16),
    borderBottomLeftRadius: ms(24),
    borderBottomRightRadius: ms(24),
  },
  headerBtn: {
    width: ms(40),
    height: ms(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: ms(20),
    fontWeight: '700',
    color: '#FFF',
  },

  /* Empty state */
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(32),
    paddingBottom: hp(60),
  },
  ring: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1.5,
  },
  ringOuter:  { width: ms(220), height: ms(220) },
  ringMiddle: { width: ms(170), height: ms(170) },
  ringInner:  { width: ms(120), height: ms(120) },

  iconBubble: {
    width: ms(80),
    height: ms(80),
    borderRadius: ms(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(24),
  },
  emptyTitle: {
    fontSize: ms(20),
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: hp(8),
  },
  emptyDesc: {
    fontSize: ms(14),
    lineHeight: ms(22),
    textAlign: 'center',
    fontWeight: '400',
  },
  divider: {
    width: wp(60),
    height: StyleSheet.hairlineWidth,
    marginVertical: hp(28),
  },
  hintsWrap: {
    gap: hp(14),
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
  },
  hintIcon: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintLabel: {
    fontSize: ms(14),
    fontWeight: '500',
  },
});
