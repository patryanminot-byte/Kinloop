import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface BadgeProps {
  color: string;
  children: React.ReactNode;
}

export default function Badge({ color, children }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color + "26" }]}>
      <Text style={[styles.text, { color }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
  },
});
