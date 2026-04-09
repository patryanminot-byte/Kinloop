import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradientColors } from "../lib/colors";
import { useLocation } from "../hooks/useLocation";

interface LocationPromptProps {
  onComplete?: () => void;
  onDismiss?: () => void;
}

/**
 * A non-intrusive card prompting for location.
 * Show this contextually — e.g., when browsing matches or items.
 */
export default function LocationPrompt({ onComplete, onDismiss }: LocationPromptProps) {
  const { requestLocation, loading } = useLocation();
  const [done, setDone] = useState(false);

  const handleShare = async () => {
    const success = await requestLocation();
    if (success) {
      setDone(true);
      setTimeout(() => onComplete?.(), 800);
    }
  };

  if (done) {
    return (
      <View style={styles.card}>
        <Text style={styles.doneEmoji}>{"\u2705"}</Text>
        <Text style={styles.doneText}>Location saved!</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{"\u{1F4CD}"}</Text>
        <View style={styles.headerText}>
          <Text style={styles.title}>See what's nearby</Text>
          <Text style={styles.subtitle}>
            Share your location to find items minutes away — not miles.
          </Text>
        </View>
        <Pressable onPress={onDismiss} hitSlop={12}>
          <Text style={styles.dismiss}>{"\u2715"}</Text>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={handleShare} disabled={loading} style={styles.shareBtn}>
          <LinearGradient
            colors={gradientColors.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shareBtnGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.shareBtnText}>Share location</Text>
            )}
          </LinearGradient>
        </Pressable>

        <Pressable onPress={onDismiss}>
          <Text style={styles.notNowText}>Not now</Text>
        </Pressable>
      </View>

      <Text style={styles.privacy}>
        {"\u{1F512}"} We round your location to ~1km. Your exact address is never shared.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  emoji: {
    fontSize: 28,
    marginTop: 2,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  dismiss: {
    fontSize: 16,
    color: colors.textMuted,
    padding: 4,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 10,
  },
  shareBtn: {
    flex: 1,
  },
  shareBtnGradient: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  notNowText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "500",
  },
  privacy: {
    fontSize: 11,
    color: colors.textLight,
    lineHeight: 16,
  },
  doneEmoji: {
    fontSize: 32,
    textAlign: "center",
  },
  doneText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
    marginTop: 4,
  },
});
