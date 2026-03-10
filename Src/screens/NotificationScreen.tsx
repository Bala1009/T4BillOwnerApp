import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hp, ms, useTheme, wp } from "../theme";

export default function NotificationScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.purple, paddingTop: insets.top + 12 },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={ms(22)} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifications</Text>

        <View style={styles.headerBtn} />
      </View>

      {/* Minimal Empty State */}
      <View style={styles.emptyWrap}>
        <View
          style={[styles.iconBubble, { backgroundColor: colors.primaryLight }]}
        >
          <Feather name="bell" size={ms(32)} color={colors.primary} />
        </View>

        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
          No Notifications
        </Text>

        <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
          You’ll see updates about orders, inventory,{"\n"}
          and performance here.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: hp(20),
    paddingHorizontal: wp(16),
    borderBottomLeftRadius: ms(24),
    borderBottomRightRadius: ms(24),
  },

  headerBtn: {
    width: ms(40),
    height: ms(40),
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: ms(20),
    fontWeight: "700",
    color: "#FFF",
  },

  /* Empty State */
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(32),
  },

  iconBubble: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(18),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: hp(16),
  },

  emptyTitle: {
    fontSize: ms(18),
    fontWeight: "600",
    marginBottom: hp(6),
  },

  emptyDesc: {
    fontSize: ms(14),
    textAlign: "center",
    lineHeight: ms(20),
  },
});
