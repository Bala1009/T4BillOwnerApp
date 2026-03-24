import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { hp, ms, useTheme, wp } from "../theme";

export interface EmptyBranchStateProps {
  /** Optional main title. Defaults to "No Branches Available" */
  title?: string;
  /** Optional description text. Defaults to a generic message. */
  message?: string;
  /** Optional retry callback. If provided, a "Retry" button is shown. */
  onRetry?: () => void;
}

/**
 * Consistent empty state UI displayed when no branch data is available.
 *
 * Used across all screens (Dashboard, Inventory, Performance, Orders)
 * to provide a uniform experience when:
 * - The branch API returns an empty list
 * - No branch has been selected / persisted
 * - Branch data is required but unavailable
 */
export default function EmptyBranchState({
  title = "No Branches Available",
  message = "Branch data is required to display this screen. Please ensure branches are configured for your account, or try again later.",
  onRetry,
}: EmptyBranchStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {/* Icon circle */}
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: colors.orangeBg || `${colors.orange}15` },
        ]}
      >
        <Feather name="map-pin" size={ms(36)} color={colors.orange} />
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {title}
      </Text>

      {/* Description */}
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {message}
      </Text>

      {/* Optional retry button */}
      {onRetry && (
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          onPress={onRetry}
          activeOpacity={0.7}
          accessibilityLabel="Retry loading branches"
          accessibilityRole="button"
        >
          <Feather
            name="refresh-cw"
            size={ms(14)}
            color="#FFF"
            style={{ marginRight: wp(6) }}
          />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(32),
    paddingVertical: hp(48),
  },
  iconCircle: {
    width: ms(80),
    height: ms(80),
    borderRadius: ms(40),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: hp(24),
  },
  title: {
    fontSize: ms(18),
    fontWeight: "700",
    textAlign: "center",
    marginBottom: hp(12),
    letterSpacing: -0.2,
  },
  message: {
    fontSize: ms(14),
    fontWeight: "400",
    textAlign: "center",
    lineHeight: ms(20),
    marginBottom: hp(28),
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(24),
    paddingVertical: hp(12),
    borderRadius: ms(12),
  },
  retryText: {
    color: "#FFF",
    fontSize: ms(14),
    fontWeight: "700",
  },
});
