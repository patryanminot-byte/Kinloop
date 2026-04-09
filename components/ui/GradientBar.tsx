import React from "react";
import { StyleSheet, ViewStyle, StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { gradientColors } from "../../lib/colors";

interface GradientBarProps {
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export default function GradientBar({ height = 3, style }: GradientBarProps) {
  return (
    <LinearGradient
      colors={gradientColors.rainbow}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.bar, { height }, style]}
    />
  );
}

const styles = StyleSheet.create({
  bar: {
    width: "100%",
    borderRadius: 2,
  },
});
