import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { gradientColors } from "../../lib/colors";

interface AvatarProps {
  initials: string;
  size?: number;
  gradient?: boolean;
}

export default function Avatar({
  initials,
  size = 40,
  gradient = false,
}: AvatarProps) {
  const fontSize = size * 0.4;
  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (gradient) {
    return (
      <LinearGradient
        colors={gradientColors.rainbow}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.center, containerStyle]}
      >
        <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.center, styles.defaultBg, containerStyle]}>
      <Text style={[styles.initials, styles.defaultText, { fontSize }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  defaultBg: {
    backgroundColor: "#F3E8FF",
  },
  initials: {
    fontWeight: "700",
    color: "#FFFFFF",
  },
  defaultText: {
    color: "#C084FC",
  },
});
