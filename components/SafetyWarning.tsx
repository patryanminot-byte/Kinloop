import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../lib/colors";

interface SafetyWarningProps {
  message: string;
  checked: boolean;
  onToggle: () => void;
}

/**
 * Safety warning card shown before listing certain item categories.
 * Requires user to check a confirmation box before proceeding.
 */
export default function SafetyWarning({
  message,
  checked,
  onToggle,
}: SafetyWarningProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>{"\u26A0\uFE0F"}</Text>
        <Text style={styles.title}>Safety check</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
      <Pressable style={styles.checkRow} onPress={onToggle}>
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && <Text style={styles.checkmark}>{"\u2713"}</Text>}
        </View>
        <Text style={styles.checkLabel}>
          I've verified this item is safe
        </Text>
      </Pressable>
    </View>
  );
}

/**
 * Returns a safety warning message for the given category and item name,
 * or null if no warning is needed.
 */
export function getSafetyWarning(
  category: string,
  itemName: string,
): string | null {
  const nameLower = itemName.toLowerCase();

  if (nameLower.includes("car seat") || nameLower.includes("carseat")) {
    return "Car seats should not be shared if they've been in an accident, are expired, or have been recalled. Check cpsc.gov/recalls before listing. By listing this item, you confirm it has not been in an accident, is not expired, and has not been recalled.";
  }

  if (
    (category === "Furniture" &&
      (nameLower.includes("crib") || nameLower.includes("bassinet"))) ||
    nameLower.includes("crib") ||
    nameLower.includes("bassinet")
  ) {
    return "Drop-side cribs are banned. Cribs must meet current CPSC standards with slats no more than 2 3/8 inches apart and a firm, tight-fitting mattress. Check cpsc.gov/recalls before listing.";
  }

  if (category === "Stroller" || nameLower.includes("stroller")) {
    return "Verify all brakes and locks work, harness is intact, and frame has no cracks. Check cpsc.gov/recalls.";
  }

  if (nameLower.includes("high chair") || nameLower.includes("highchair")) {
    return "Verify harness and restraints work, tray locks securely, and the chair is stable. Check cpsc.gov/recalls.";
  }

  return null;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFBEB",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
    padding: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  icon: { fontSize: 20 },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#92400E",
  },
  message: {
    fontSize: 14,
    color: "#78350F",
    lineHeight: 20,
    marginBottom: 14,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D97706",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#D97706",
    borderColor: "#D97706",
  },
  checkmark: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  checkLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
  },
});
