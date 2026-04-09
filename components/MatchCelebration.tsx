import React, { useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors } from "../lib/colors";
import GradientText from "./ui/GradientText";
import Button from "./ui/Button";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const CENTER_X = SCREEN_W / 2;
const CENTER_Y = SCREEN_H * 0.35;

const PARTICLE_COLORS = [
  colors.neonPink,
  colors.neonPurple,
  colors.neonBlue,
  colors.neonCyan,
  colors.neonGreen,
  colors.neonYellow,
  colors.neonOrange,
];

const NUM_PARTICLES = 20;

interface MatchCelebrationProps {
  visible: boolean;
  item: string;
  itemEmoji: string;
  friendName: string;
  kidName: string;
  onSend: () => void;
  onDismiss: () => void;
}

// Pre-generate random angles and distances for particles
const particleData = Array.from({ length: NUM_PARTICLES }, (_, i) => {
  const angle = (i / NUM_PARTICLES) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
  const distance = 80 + Math.random() * 120;
  return {
    angle,
    distance,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    size: 6 + Math.random() * 8,
  };
});

function Particle({ index }: { index: number }) {
  const data = particleData[index];
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(1, { damping: 8, stiffness: 80 });
    opacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withDelay(400, withTiming(0, { duration: 400 }))
    );
  }, [progress, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: Math.cos(data.angle) * data.distance * progress.value },
      { translateY: Math.sin(data.angle) * data.distance * progress.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: data.size,
          height: data.size,
          borderRadius: data.size / 2,
          backgroundColor: data.color,
          left: CENTER_X - data.size / 2,
          top: CENTER_Y - data.size / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

export default function MatchCelebration({
  visible,
  item,
  itemEmoji,
  friendName,
  kidName,
  onSend,
  onDismiss,
}: MatchCelebrationProps) {
  // Overlay
  const overlayOpacity = useSharedValue(0);

  // Phase 1: emoji circle
  const emojiScale = useSharedValue(0);
  const emojiOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0);

  // Phase 2: text
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);

  // Buttons
  const buttonsOpacity = useSharedValue(0);

  const triggerHeavyHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  const triggerLightHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  useEffect(() => {
    if (visible) {
      // Reset
      emojiScale.value = 0;
      emojiOpacity.value = 0;
      glowScale.value = 0;
      textOpacity.value = 0;
      textTranslateY.value = 20;
      buttonsOpacity.value = 0;

      // Phase 0: overlay + particles + haptic
      overlayOpacity.value = withTiming(1, { duration: 300 });
      runOnJS(triggerHeavyHaptic)();

      // Phase 1 (800ms): emoji circle grows
      glowScale.value = withDelay(
        800,
        withSpring(1, { damping: 12, stiffness: 100 })
      );
      emojiScale.value = withDelay(
        800,
        withSpring(1, { damping: 12, stiffness: 100 })
      );
      emojiOpacity.value = withDelay(
        800,
        withTiming(1, { duration: 300 })
      );

      // Phase 2 (1600ms): text fades in + light haptic
      textOpacity.value = withDelay(
        1600,
        withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) })
      );
      textTranslateY.value = withDelay(
        1600,
        withSpring(0, { damping: 15, stiffness: 120 })
      );

      // Trigger light haptic at phase 2
      const timer = setTimeout(() => {
        triggerLightHaptic();
      }, 1600);

      // Buttons appear after text
      buttonsOpacity.value = withDelay(
        2000,
        withTiming(1, { duration: 400 })
      );

      return () => clearTimeout(timer);
    } else {
      overlayOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [
    visible,
    overlayOpacity,
    emojiScale,
    emojiOpacity,
    glowScale,
    textOpacity,
    textTranslateY,
    buttonsOpacity,
    triggerHeavyHaptic,
    triggerLightHaptic,
  ]);

  const overlayAnimStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const glowAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: emojiOpacity.value,
  }));

  const emojiAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
    opacity: emojiOpacity.value,
  }));

  const textAnimStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const buttonsAnimStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, overlayAnimStyle]}>
      {/* Particles */}
      {Array.from({ length: NUM_PARTICLES }, (_, i) => (
        <Particle key={i} index={i} />
      ))}

      {/* Glowing circle */}
      <Animated.View style={[styles.glowCircle, glowAnimStyle]}>
        <View style={styles.glowInner} />
      </Animated.View>

      {/* Emoji */}
      <Animated.View style={[styles.emojiContainer, emojiAnimStyle]}>
        <Text style={styles.bigEmoji}>{itemEmoji}</Text>
      </Animated.View>

      {/* Text */}
      <Animated.View style={[styles.textContainer, textAnimStyle]}>
        <GradientText style={styles.matchTitle}>
          It's a match! {"\u2728"}
        </GradientText>
        <Text style={styles.matchItem}>{item}</Text>
        <Text style={styles.matchRecipient}>
          {"\u2192"} {friendName}'s {kidName}
        </Text>
      </Animated.View>

      {/* Buttons */}
      <Animated.View style={[styles.buttonsContainer, buttonsAnimStyle]}>
        <Button
          variant="primary"
          size="lg"
          title="Send the love \u{1F48C}"
          onPress={onSend}
        />
        <View style={styles.buttonSpacer} />
        <Button variant="ghost" size="md" title="Maybe later" onPress={onDismiss} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Particles
  particle: {
    position: "absolute",
  },

  // Glow circle
  glowCircle: {
    position: "absolute",
    top: CENTER_Y - 60,
    left: CENTER_X - 60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(192,132,252,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  glowInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(192,132,252,0.1)",
  },

  // Emoji
  emojiContainer: {
    position: "absolute",
    top: CENTER_Y - 32,
    left: CENTER_X - 32,
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  bigEmoji: {
    fontSize: 48,
  },

  // Text
  textContainer: {
    position: "absolute",
    top: CENTER_Y + 80,
    alignItems: "center",
    paddingHorizontal: 40,
  },
  matchTitle: {
    fontSize: 24,
    marginBottom: 8,
  },
  matchItem: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  matchRecipient: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
  },

  // Buttons
  buttonsContainer: {
    position: "absolute",
    bottom: 100,
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 40,
  },
  buttonSpacer: {
    height: 12,
  },
});
