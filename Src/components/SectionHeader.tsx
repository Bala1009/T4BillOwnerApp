import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ms, useTheme } from "../theme";

interface SectionHeaderProps {
   title: string;
   rightElement?: React.ReactNode;
}


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
    marginTop: 20,
    marginBottom: 16,
    marginLeft:16,
    marginRight:16
  },
  title: {
    fontSize: ms(16),
    fontWeight: "700",
  },
});
