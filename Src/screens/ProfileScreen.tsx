import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
    DeviceEventEmitter,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";
import { Card, ScreenWrapper } from "../components";
import { hp, ms, useTheme, wp } from "../theme";
import { useAuth } from "../context/AuthContext";

// ─── Settings Rows ──────────────────────────────────────────
const SETTINGS_SECTIONS = [
  {
    title: "General",
    items: [
      { icon: "globe" as const, label: "Language", value: "English" },
      { icon: "map-pin" as const, label: "Region", value: "India" },
      { icon: "bell" as const, label: "Notifications", value: "" },
    ],
  },
  {
    title: "Business",
    items: [
      { icon: "briefcase" as const, label: "Business Info", value: "" },
      { icon: "users" as const, label: "Staff Management", value: "" },
      { icon: "printer" as const, label: "Bill Settings", value: "" },
    ],
  },
  {
    title: "Account",
    items: [
      { icon: "shield" as const, label: "Privacy & Security", value: "" },
      { icon: "help-circle" as const, label: "Help & Support", value: "" },
      { icon: "info" as const, label: "About", value: "v1.0.0" },
    ],
  },
];

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark, isSystem, preference, setTheme } = useTheme();
  const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);
  const { logout } = useAuth();

  const THEME_OPTIONS = [
    { key: "system" as const, label: "System", icon: "smartphone" as const },
    { key: "light" as const, label: "Light", icon: "sun" as const },
    { key: "dark" as const, label: "Dark", icon: "moon" as const },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      DeviceEventEmitter.emit("AUTH_FAILED");
    } catch (error) {
      console.error("Error logging out", error);
    }
  };

  return (
    <ScreenWrapper scrollable>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hp(40) }}
      >
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.cardAlt }]}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather
              name="arrow-left"
              size={ms(22)}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Profile
          </Text>
          <View style={styles.headerRight} />
        </View>

        {/* Profile Card */}
        <Card noMargin padding={16} style={styles.profileCard}>
          <View
            style={[styles.avatar, { backgroundColor: colors.primaryLight }]}
          >
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              B
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>
              Bala
            </Text>
            <Text
              style={[styles.profileEmail, { color: colors.textSecondary }]}
            >
              bala@touch4bill.com
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: colors.primaryLight }]}
          >
            <Feather name="edit-2" size={ms(16)} color={colors.primary} />
          </TouchableOpacity>
        </Card>

        {/* ─── Theme Selector ─────────────────────────── */}
        <Card padding={16}>
          <View style={styles.themeTitleRow}>
            <View
              style={[
                styles.themeIconWrap,
                { backgroundColor: isDark ? colors.orangeBg : colors.blueBg },
              ]}
            >
              <Feather
                name={isDark ? "moon" : "sun"}
                size={ms(20)}
                color={isDark ? colors.orange : colors.blue}
              />
            </View>
            <View style={styles.themeInfo}>
              <Text style={[styles.themeLabel, { color: colors.textPrimary }]}>
                Appearance
              </Text>
              <Text style={[styles.themeSub, { color: colors.textTertiary }]}>
                {isSystem
                  ? `Following system (${isDark ? "Dark" : "Light"})`
                  : isDark
                    ? "Dark theme active"
                    : "Light theme active"}
              </Text>
            </View>
          </View>
          {/* 3-way Pill Selector */}
          <View
            style={[styles.themePillRow, { backgroundColor: colors.cardAlt }]}
          >
            {THEME_OPTIONS.map((opt) => {
              const isActive = preference === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.themePill,
                    isActive && [
                      styles.themePillActive,
                      { backgroundColor: colors.card },
                    ],
                  ]}
                  onPress={() => setTheme(opt.key)}
                  activeOpacity={0.7}
                >
                  <Feather
                    name={opt.icon}
                    size={ms(16)}
                    color={isActive ? colors.primary : colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.themePillText,
                      {
                        color: isActive ? colors.primary : colors.textTertiary,
                      },
                      isActive && styles.themePillTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* ─── Settings Sections ──────────────────── */}
        {SETTINGS_SECTIONS.map((section, sIdx) => (
          <View key={sIdx} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
              {section.title}
            </Text>
            <View
              style={[styles.sectionCard, { backgroundColor: colors.card }]}
            >
              {section.items.map((item, iIdx) => (
                <TouchableOpacity
                  key={iIdx}
                  style={[
                    styles.settingRow,
                    iIdx < section.items.length - 1 && [
                      styles.settingRowBorder,
                      { borderBottomColor: colors.border },
                    ],
                  ]}
                  activeOpacity={0.6}
                >
                  <View
                    style={[
                      styles.settingIconWrap,
                      { backgroundColor: colors.cardAlt },
                    ]}
                  >
                    <Feather
                      name={item.icon}
                      size={ms(18)}
                      color={colors.textSecondary}
                    />
                  </View>
                  <Text
                    style={[styles.settingLabel, { color: colors.textPrimary }]}
                  >
                    {item.label}
                  </Text>
                  <View style={styles.settingRight}>
                    {item.value ? (
                      <Text
                        style={[
                          styles.settingValue,
                          { color: colors.textTertiary },
                        ]}
                      >
                        {item.value}
                      </Text>
                    ) : null}
                    <Feather
                      name="chevron-right"
                      size={ms(18)}
                      color={colors.textTertiary}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* ─── Logout ─────────────────────────────── */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.redBg }]}
          activeOpacity={0.7}
          onPress={() => setLogoutModalVisible(true)}
        >
          <Feather name="log-out" size={ms(18)} color={colors.red} />
          <Text style={[styles.logoutText, { color: colors.red }]}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: hp(32), paddingBottom: hp(20) }} />
      </ScrollView>
      {/* ─── Logout Modal ───────────────────────── */}
      <Modal
        transparent={true}
        visible={isLogoutModalVisible}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setLogoutModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[styles.modalContent, { backgroundColor: colors.card }]}
              >
                <View
                  style={[
                    styles.modalIconWrap,
                    { backgroundColor: colors.redBg },
                  ]}
                >
                  <Feather name="log-out" size={ms(24)} color={colors.red} />
                </View>
                <Text
                  style={[styles.modalTitle, { color: colors.textPrimary }]}
                >
                  Log Out
                </Text>
                <Text
                  style={[
                    styles.modalSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Are you sure you want to log out of your account?
                </Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      styles.modalBtnCancel,
                      { backgroundColor: colors.cardAlt },
                    ]}
                    onPress={() => setLogoutModalVisible(false)}
                  >
                    <Text
                      style={[
                        styles.modalBtnText,
                        { color: colors.textPrimary },
                      ]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      styles.modalBtnConfirm,
                      { backgroundColor: colors.red },
                    ]}
                    onPress={() => {
                      setLogoutModalVisible(false);
                      handleLogout();
                    }}
                  >
                    <Text style={[styles.modalBtnText, { color: "#FFFFFF" }]}>
                      Yes, Log Out
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: hp(16),
    marginBottom: hp(24),
  },
  backBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(12),
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: ms(20),
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerRight: {
    width: wp(40), // Balances the back button for centering the title
  },

  // Page Title
  pageTitle: {
    fontSize: ms(28),
    fontWeight: "700",
    marginTop: hp(16),
    marginBottom: hp(20),
    letterSpacing: -0.3,
  },

  // Profile Card
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: wp(54),
    height: wp(54),
    borderRadius: wp(16),
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: ms(22),
    fontWeight: "700",
  },
  profileInfo: {
    flex: 1,
    marginLeft: wp(14),
  },
  profileName: {
    fontSize: ms(18),
    fontWeight: "700",
  },
  profileEmail: {
    fontSize: ms(13),
    marginTop: hp(2),
  },
  editBtn: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(10),
    justifyContent: "center",
    alignItems: "center",
  },

  // Theme Selector
  themeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  themeIconWrap: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(12),
    justifyContent: "center",
    alignItems: "center",
  },
  themeInfo: {
    flex: 1,
    marginLeft: wp(12),
  },
  themeLabel: {
    fontSize: ms(15),
    fontWeight: "600",
  },
  themeSub: {
    fontSize: ms(12),
    marginTop: hp(2),
  },
  themePillRow: {
    flexDirection: "row",
    borderRadius: wp(12),
    padding: wp(4),
    marginTop: hp(14),
  },
  themePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(10),
    borderRadius: wp(10),
    gap: wp(6),
  },
  themePillActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  themePillText: {
    fontSize: ms(12),
    fontWeight: "500",
  },
  themePillTextActive: {
    fontWeight: "700",
  },

  // Settings Sections
  section: {
    marginTop: hp(20),
  },
  sectionTitle: {
    fontSize: ms(12),
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: hp(8),
    marginLeft: wp(4),
  },
  sectionCard: {
    borderRadius: wp(16),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(14),
    paddingHorizontal: wp(16),
  },
  settingRowBorder: {
    borderBottomWidth: 1,
  },
  settingIconWrap: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(10),
    justifyContent: "center",
    alignItems: "center",
  },
  settingLabel: {
    flex: 1,
    fontSize: ms(14),
    fontWeight: "500",
    marginLeft: wp(12),
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(6),
  },
  settingValue: {
    fontSize: ms(13),
  },

  // Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: hp(24),
    padding: hp(16),
    borderRadius: wp(16),
    gap: wp(8),
  },
  logoutText: {
    fontSize: ms(15),
    fontWeight: "600",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: wp(24),
  },
  modalContent: {
    width: "100%",
    borderRadius: wp(24),
    padding: wp(24),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconWrap: {
    width: wp(56),
    height: wp(56),
    borderRadius: wp(28),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: hp(16),
  },
  modalTitle: {
    fontSize: ms(20),
    fontWeight: "700",
    marginBottom: hp(8),
  },
  modalSubtitle: {
    fontSize: ms(14),
    textAlign: "center",
    lineHeight: ms(22),
    marginBottom: hp(24),
  },
  modalActions: {
    flexDirection: "row",
    width: "100%",
    gap: wp(12),
  },
  modalBtn: {
    flex: 1,
    height: hp(48),
    borderRadius: wp(12),
    justifyContent: "center",
    alignItems: "center",
  },
  modalBtnCancel: {
    // defined by dynamic color
  },
  modalBtnConfirm: {
    // defined by dynamic color
  },
  modalBtnText: {
    fontSize: ms(15),
    fontWeight: "600",
  },
});
