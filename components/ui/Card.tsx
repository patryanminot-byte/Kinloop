import React from "react";
import { Pressable, View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { colors } from "../../lib/colors";

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const springConfig = { damping: 15, stiffness: 150 };

export default function Card({ children, onPress, style }: CardProps) {
  const translateY = useSharedValue(0);
  const shadowOpacity = useSharedValue(0.04);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    shadowOpacity: shadowOpacity.value,
  }));

  if (!onPress) {
    return <View style={[styles.card, style]}>{children}</View>;
  }

  const handlePressIn = () => {
    translateY.value = withSpring(-2, springConfig);
    shadowOpacity.value = withSpring(0.12, springConfig);
  };

  const handlePressOut = () => {
    translateY.value = withSpring(0, springConfig);
    shadowOpacity.value = withSpring(0.04, springConfig);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, styles.shadow, animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
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
    shadowRadius: 12,
    elevation: 4,
  },
});
