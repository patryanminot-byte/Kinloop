import React from "react";
import { Pressable, View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { colors } from "../../lib/colors";

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function Card({ children, onPress, style }: CardProps) {
  if (!onPress) {
    return <View style={[styles.card, style]}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        styles.shadow,
        pressed && {
          transform: [{ translateY: -2 }],
          shadowOpacity: 0.12,
        },
        style as ViewStyle,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
  },
});
