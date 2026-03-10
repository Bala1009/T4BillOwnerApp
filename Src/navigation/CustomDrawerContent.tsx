import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { hp, ms, useTheme, wp } from '../theme';
import { useAuth } from '../context/AuthContext';

type MenuItem = {
  label: string;
  icon: string;
  action: 'tab' | 'screen';
  /** For tab items, the name of the Tab route. For screen items, the name of Stack/Drawer route. */
  target: string;
};

const MENU_ITEMS: MenuItem[] = [
  { label: 'Dashboard',    icon: 'home',        action: 'tab',    target: 'Dashboard'       },
  { label: 'Inventory',    icon: 'box',         action: 'tab',    target: 'Inventory'       },
  { label: 'Orders',       icon: 'pie-chart',   action: 'tab',    target: 'PurchaseOrders'  },
  { label: 'Performance',  icon: 'activity',    action: 'tab',    target: 'Performance'     },
  { label: 'Profile',      icon: 'user',        action: 'screen', target: 'Profile'         },
];

export default function CustomDrawerContent(props: any) {
  const { colors } = useTheme();
  const { authData } = useAuth();
  const navigation = useNavigation<any>();

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

  // Figure out which tab is currently active to highlight the right item
  const activeRouteName: string = (() => {
    const state = props.state;
    // state.routes[0] is MainTabs; its nested state has the active tab
    const mainTabsRoute = state?.routes?.find((r: any) => r.name === 'MainTabs');
    if (mainTabsRoute?.state) {
      const idx = mainTabsRoute.state.index ?? 0;
      return mainTabsRoute.state.routeNames?.[idx] || '';
    }
    // Fallback: check direct routes (Profile screen)
    const active = state?.routes?.[state?.index ?? 0];
    return active?.name || '';
  })();

  const handleItemPress = (item: MenuItem) => {
    if (item.action === 'tab') {
      // Navigate inside MainTabs: close drawer then jump to correct tab
      props.navigation.closeDrawer();
      props.navigation.navigate('MainTabs', { screen: item.target });
    } else {
      // Navigate to a root Drawer screen (e.g. Profile)
      props.navigation.closeDrawer();
      props.navigation.navigate(item.target);
    }
  };

  const isActive = (item: MenuItem): boolean => {
    if (item.action === 'screen') return activeRouteName === item.target;
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
});
