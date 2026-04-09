import React from "react";
import { Text, StyleSheet, TextStyle, StyleProp } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { gradientColors } from "../../lib/colors";

interface GradientTextProps {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

export default function GradientText({ children, style }: GradientTextProps) {
  return (
    <MaskedView
      maskElement={
        <Text style={[styles.text, style]}>{children}</Text>
      }
    >
      <LinearGradient
        colors={gradientColors.rainbow}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[styles.text, style, styles.invisible]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: "700",
  },
  invisible: {
    opacity: 0,
  },
});
