import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ms, useTheme } from "../theme";

interface SectionHeaderProps {
  /** Main title */
  title: string;
  /** Optional right-side element */
  rightElement?: React.ReactNode;
}

/**
 * Section header with title and optional right element (chips, badges, totals).
 * Used at the top of Card sections in Dashboard.
 */
export default function SectionHeader({
  title,
  rightElement,
}: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {rightElement}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: 16,
    marginRight: 16,
  },
  title: {
    fontSize: ms(16),
    fontWeight: "700",
  },
});
