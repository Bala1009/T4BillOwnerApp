import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { hp, ms, useTheme, wp } from '../theme';
import { useAuth } from '../context/AuthContext';

type MenuItem = {
  label: string;
  icon: string;
  action: 'tab' | 'screen';
  target: string;
};

const MENU_ITEMS: MenuItem[] = [
  { label: 'Dashboard',    icon: 'home',        action: 'tab',    target: 'Dashboard'       },
  { label: 'Inventory',    icon: 'box',         action: 'tab',    target: 'Inventory'       },
  { label: 'Orders',       icon: 'pie-chart',   action: 'tab',    target: 'PurchaseOrders'  },
  { label: 'Performance',  icon: 'activity',    action: 'tab',    target: 'Performance'     },
];

export default function CustomDrawerContent(props: any) {
  const { colors, isDark } = useTheme();
  const { authData, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const getFirstName = () => {
    const ud = authData?.userDetails || {};
    const name = ud?.userName || ud?.name || ud?.loginUserName || '';
    if (!name) return 'User';
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const getEmail = () => {
    const ud = authData?.userDetails || {};
    return ud?.email || ud?.loginEmail || '';
  };

  const activeRouteName: string = (() => {
    const state = props.state;
    const mainTabsRoute = state?.routes?.find((r: any) => r.name === 'MainTabs');
    if (mainTabsRoute?.state) {
      const idx = mainTabsRoute.state.index ?? 0;
      return mainTabsRoute.state.routeNames?.[idx] || '';
    }
    const active = state?.routes?.[state?.index ?? 0];
    return active?.name || '';
  })();

  const handleItemPress = (item: MenuItem) => {
    if (item.action === 'tab') {
      props.navigation.closeDrawer();
      props.navigation.navigate('MainTabs', { screen: item.target });
    } else {
      props.navigation.closeDrawer();
      props.navigation.navigate(item.target);
    }
  };

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    props.navigation.closeDrawer();
    await logout();
    // Reset navigation stack and navigate to Login so user can't go back
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    );
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const isActive = (item: MenuItem): boolean => {
    return activeRouteName === item.target;
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        {/* ── Profile Header ── */}
        <View style={[styles.profileHeader, { backgroundColor: colors.purple }]}>
          <View style={[styles.avatarWrap, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={styles.avatarText}>{getFirstName().charAt(0)}</Text>
          </View>
          <Text style={styles.profileName}>{getFirstName()}</Text>
          {getEmail() ? <Text style={styles.profileEmail}>{getEmail()}</Text> : null}
        </View>

        {/* ── Menu Items ── */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item, idx) => {
            const active = isActive(item);
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.7}
                style={[
                  styles.menuItem,
                  {
                    backgroundColor: active ? colors.primaryLight : 'transparent',
                    borderLeftColor: active ? colors.primary : 'transparent',
                  },
                ]}
              >
                <Feather
                  name={item.icon as any}
                  size={ms(20)}
                  color={active ? colors.primary : colors.textSecondary}
                  style={styles.menuIcon}
                />
                <Text style={[styles.menuLabel, { color: active ? colors.primary : colors.textPrimary, fontWeight: active ? '700' : '500' }]}>
                  {item.label}
                </Text>
                {active && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </DrawerContentScrollView>

      {/* ── Logout at Bottom ── */}
      <View style={[styles.logoutSection, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleLogoutPress}
          activeOpacity={0.7}
          style={styles.logoutButton}
        >
          <Feather name="log-out" size={ms(20)} color={colors.red} style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { color: colors.red, fontWeight: '600' }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* ── Modern Logout Confirmation Modal ── */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleLogoutCancel}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            {/* Icon */}
            <View style={[styles.modalIconWrap, { backgroundColor: colors.redBg }]}>
              <Feather name="log-out" size={ms(28)} color={colors.red} />
            </View>

            {/* Title */}
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Logout
            </Text>

            {/* Message */}
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              Are you sure you want to logout?
            </Text>

            {/* Divider */}
            <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />

            {/* Buttons */}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                onPress={handleLogoutCancel}
                activeOpacity={0.7}
                style={[
                  styles.modalButton,
                  styles.modalButtonNo,
                  {
                    backgroundColor: isDark ? colors.cardAlt : colors.cardAlt,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.modalButtonText, { color: colors.textPrimary }]}>
                  No
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogoutConfirm}
                activeOpacity={0.7}
                style={[
                  styles.modalButton,
                  styles.modalButtonYes,
                  { backgroundColor: colors.red },
                ]}
              >
                <Feather name="check" size={ms(16)} color="#FFF" style={{ marginRight: wp(6) }} />
                <Text style={[styles.modalButtonText, { color: '#FFF' }]}>
                  Yes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  profileHeader: {
    paddingTop: hp(56),
    paddingBottom: hp(28),
    paddingHorizontal: wp(24),
    borderBottomRightRadius: ms(28),
    marginBottom: hp(8),
  },
  avatarWrap: {
    width: ms(60),
    height: ms(60),
    borderRadius: ms(30),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(12),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: {
    fontSize: ms(26),
    fontWeight: 'bold',
    color: '#FFF',
  },
  profileName: {
    fontSize: ms(18),
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: hp(4),
  },
  profileEmail: {
    fontSize: ms(13),
    color: 'rgba(255,255,255,0.8)',
  },
  menuSection: {
    paddingVertical: hp(8),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(14),
    paddingHorizontal: wp(20),
    borderLeftWidth: 4,
    marginBottom: hp(2),
    borderRadius: ms(8),
    marginHorizontal: wp(8),
  },
  menuIcon: {
    width: ms(28),
    marginRight: wp(4),
  },
  menuLabel: {
    fontSize: ms(15),
    flex: 1,
  },
  activeIndicator: {
    width: ms(6),
    height: ms(6),
    borderRadius: ms(3),
  },
  logoutSection: {
    borderTopWidth: 1,
    paddingVertical: hp(8),
    paddingBottom: hp(32),
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(14),
    paddingHorizontal: wp(20),
    marginHorizontal: wp(8),
    borderRadius: ms(8),
  },
  // ── Modal Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(32),
  },
  modalCard: {
    width: '100%',
    borderRadius: ms(24),
    paddingTop: hp(32),
    paddingHorizontal: wp(24),
    paddingBottom: hp(24),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  modalIconWrap: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(20),
  },
  modalTitle: {
    fontSize: ms(20),
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: hp(8),
  },
  modalMessage: {
    fontSize: ms(15),
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: ms(22),
    marginBottom: hp(24),
  },
  modalDivider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    marginBottom: hp(20),
  },
  modalButtonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: wp(12),
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(14),
    borderRadius: ms(14),
  },
  modalButtonNo: {
    borderWidth: 1,
  },
  modalButtonYes: {},
  modalButtonText: {
    fontSize: ms(15),
    fontWeight: '700',
  },
});
