import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { colors, gradientColors } from "../../lib/colors";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> =
  {
    sm: {
      container: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 },
      text: { fontSize: 14 },
    },
    md: {
      container: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
      text: { fontSize: 16 },
    },
    lg: {
      container: { paddingVertical: 16, paddingHorizontal: 32, borderRadius: 14 },
      text: { fontSize: 18 },
    },
  };

export default function Button({
  variant = "primary",
  size = "md",
  title,
  onPress,
  disabled = false,
  style,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 100 });
    opacity.value = withTiming(0.9, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
    opacity.value = withTiming(1, { duration: 150 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const sizeConfig = sizeStyles[size];

  const content = (
    <Text
      style={[
        styles.text,
        sizeConfig.text,
        variant === "primary" && styles.textPrimary,
        variant === "secondary" && styles.textSecondary,
        variant === "ghost" && styles.textGhost,
        disabled && styles.textDisabled,
      ]}
    >
      {title}
    </Text>
  );

  if (variant === "primary") {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[animatedStyle, style]}
      >
        <LinearGradient
          colors={gradientColors.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            sizeConfig.container,
            styles.center,
            disabled && styles.disabledContainer,
          ]}
        >
          {content}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        animatedStyle,
        sizeConfig.container,
        styles.center,
        variant === "secondary" && styles.secondary,
        disabled && styles.disabledContainer,
        style,
      ]}
    >
      {content}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: {
    borderWidth: 1.5,
    borderColor: colors.neonPurple,
  },
  text: {
    fontWeight: "600",
  },
  textPrimary: {
    color: "#FFFFFF",
  },
  textSecondary: {
    color: colors.neonPurple,
  },
  textGhost: {
    color: colors.neonPurple,
  },
  textDisabled: {
    opacity: 0.4,
  },
  disabledContainer: {
    opacity: 0.5,
  },
});
