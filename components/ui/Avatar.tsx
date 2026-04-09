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
  // Detect if initials is an emoji (non-ASCII)
  const isEmoji = /\p{Emoji}/u.test(initials) && !/^[A-Za-z]+$/.test(initials);
  const fontSize = isEmoji ? size * 0.55 : size * 0.4;
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
        {isEmoji ? (
          <View style={[styles.emojiBg, { width: size * 0.7, height: size * 0.7, borderRadius: size * 0.35 }]}>
            <Text style={{ fontSize }}>{initials}</Text>
          </View>
        ) : (
          <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        )}
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
  emojiBg: {
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
});
