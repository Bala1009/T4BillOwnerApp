import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { hp, ms, useTheme, wp } from "../theme";

// ─── Types ──────────────────────────────────────────────────
export interface BranchDropdownProps {
  /** Array of branch objects fetched from the API */
  branches: any[];
  /** The currently selected branch object (or null) */
  selectedBranch: any | null;
  /** Callback fired when a branch is selected */
  onSelect: (branch: any) => void;
}

// ─── Helpers ────────────────────────────────────────────────
/** Safely extract a display name from a branch object with key-casing fallbacks */
const getBranchName = (b: any): string =>
  b?.branchName || b?.BranchName || b?.name || "Unknown Branch";

/** Check if two branch objects refer to the same branch */
const isSameBranch = (a: any, b: any): boolean => {
  if (!a || !b) return false;
  return (
    (a.BranchID && b.BranchID && a.BranchID === b.BranchID) ||
    (a.branchID && b.branchID && a.branchID === b.branchID) ||
    (a.BranchId && b.BranchId && a.BranchId === b.BranchId) ||
    (a.branchId && b.branchId && a.branchId === b.branchId) ||
    (a.id && b.id && a.id === b.id) ||
    a === b
  );
};

// ─── Component ──────────────────────────────────────────────
/**
 * A production-ready branch selector dropdown.
 *
 * **Usage with conditional rendering:**
 * ```tsx
 * {loading ? (
 *   <ActivityIndicator />
 * ) : branches.length > 0 ? (
 *   <BranchDropdown
 *     branches={branches}
 *     selectedBranch={selectedBranch}
 *     onSelect={setSelectedBranch}
 *   />
 * ) : null}
 * ```
 */
export default function BranchDropdown({
  branches,
  selectedBranch,
  onSelect,
}: BranchDropdownProps) {
  const { colors, isDark } = useTheme();
  const [isDropdownVisible, setDropdownVisible] = useState(false);

  // ── Guard: never render if branches is empty or undefined ──
  if (!branches || branches.length === 0) {
    return null;
  }

  const handleBranchSelect = (branch: any) => {
    onSelect(branch);
    setDropdownVisible(false);
  };

  return (
    <View>
      {/* ── Selector Button ─────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.selector, { backgroundColor: colors.card }]}
        onPress={() => setDropdownVisible(true)}
        activeOpacity={0.7}
        accessibilityLabel="Select branch"
        accessibilityRole="button"
      >
        <Feather
          name="map-pin"
          size={ms(16)}
          color={colors.primary}
          style={{ marginRight: wp(8) }}
        />
        <Text
          style={[styles.selectorText, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {selectedBranch ? getBranchName(selectedBranch) : "Select Branch"}
        </Text>
        <Feather
          name="chevron-down"
          size={ms(16)}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* ── Dropdown Modal ──────────────────────────────────── */}
      <Modal
        visible={isDropdownVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDropdownVisible(false)}>
          <View style={[styles.overlay, { justifyContent: "flex-end", padding: 0 }]}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.dropdownContent,
                  {
                    backgroundColor: colors.card,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    paddingBottom: hp(32),
                  },
                ]}
              >
                {/* Header */}
                <View style={styles.dropdownHeader}>
                  <Text
                    style={[styles.dropdownTitle, { color: colors.textPrimary }]}
                  >
                    Select Branch
                  </Text>
                  <TouchableOpacity
                    onPress={() => setDropdownVisible(false)}
                    style={styles.closeBtn}
                    accessibilityLabel="Close branch selector"
                  >
                    <Feather
                      name="x"
                      size={ms(20)}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Branch List */}
                <ScrollView
                  style={{ maxHeight: hp(300) }}
                  showsVerticalScrollIndicator={false}
                >
                  {branches.map((branch, index) => {
                    const isSelected = isSameBranch(selectedBranch, branch);
                    const name = getBranchName(branch);

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.optionRow,
                          isSelected && {
                            backgroundColor: isDark
                              ? colors.border
                              : "#F8FAFC",
                          },
                        ]}
                        onPress={() => handleBranchSelect(branch)}
                        activeOpacity={0.6}
                      >
                        <View style={styles.optionContent}>
                          <Feather
                            name="map-pin"
                            size={ms(16)}
                            color={
                              isSelected
                                ? colors.primary
                                : colors.textSecondary
                            }
                            style={{ marginRight: wp(12) }}
                          />
                          <Text
                            style={[
                              styles.optionText,
                              {
                                color: isSelected
                                  ? colors.primary
                                  : colors.textPrimary,
                                fontWeight: isSelected ? "bold" : "600",
                              },
                            ]}
                          >
                            {name}
                          </Text>
                        </View>
                        {isSelected && (
                          <Feather
                            name="check-circle"
                            size={ms(18)}
                            color={colors.primary}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  selector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(16),
    paddingVertical: hp(10),
    marginHorizontal: wp(10),
    borderRadius: wp(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  selectorText: {
    fontSize: ms(15),
    fontWeight: "600",
    flex: 1,
    paddingRight: wp(6),
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: wp(24),
  },
  dropdownContent: {
    width: "100%",
    maxHeight: hp(400),
    borderRadius: wp(16),
    padding: wp(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 4,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(12),
    paddingBottom: hp(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  dropdownTitle: {
    fontSize: ms(16),
    fontWeight: "700",
  },
  closeBtn: {
    padding: ms(4),
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: hp(16),
    paddingHorizontal: wp(16),
    borderRadius: wp(12),
    marginBottom: hp(4),
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionText: {
    fontSize: ms(15),
    flex: 1,
  },
});
