import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { colors } from "../lib/colors";
import { useLocation } from "../hooks/useLocation";

interface LocationPromptProps {
  onComplete?: () => void;
  onDismiss?: () => void;
}

/**
 * A subtle inline prompt for sharing location.
 * Compact single-row design — not a big card.
 */
export default function LocationPrompt({ onComplete, onDismiss }: LocationPromptProps) {
  const { requestLocation, loading } = useLocation();
  const [done, setDone] = useState(false);

  const handleShare = async () => {
    const success = await requestLocation();
    if (success) {
      setDone(true);
      setTimeout(() => onComplete?.(), 600);
    }
  };

  if (done) {
    return (
      <View style={styles.row}>
        <Text style={styles.doneText}>{"\u2705"} Location saved</Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Text style={styles.pin}>{"\u{1F4CD}"}</Text>
      <Text style={styles.label}>
        Share your approximate location to see what's nearby
      </Text>
      {loading ? (
        <ActivityIndicator size="small" color={colors.violet} style={styles.loader} />
      ) : (
        <Pressable onPress={handleShare} hitSlop={8} style={styles.shareBtn}>
          <Text style={styles.shareBtnText}>Share</Text>
        </Pressable>
      )}
      <Pressable onPress={onDismiss} hitSlop={12}>
        <Text style={styles.dismiss}>{"\u2715"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  pin: {
    fontSize: 16,
  },
  label: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  shareBtn: {
    backgroundColor: colors.violet,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  dismiss: {
    fontSize: 14,
    color: colors.textLight,
    paddingLeft: 2,
  },
  loader: {
    marginHorizontal: 8,
  },
  doneText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
});
