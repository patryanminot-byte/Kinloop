import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradientColors } from "../lib/colors";
import { Pricing } from "../lib/types";

interface PricingPickerProps {
  selected: Pricing | null;
  onSelect: (pricing: Pricing) => void;
}

type PricingType = "free" | "give-what-you-can" | "set-price";

interface OptionConfig {
  type: PricingType;
  emoji: string;
  label: string;
  subtitle: string;
}

const OPTIONS: OptionConfig[] = [
  {
    type: "free",
    emoji: "🎁",
    label: "Free",
    subtitle: "Just pass it along",
  },
  {
    type: "give-what-you-can",
    emoji: "💛",
    label: "You decide",
    subtitle: "They choose what feels right",
  },
  {
    type: "set-price",
    emoji: "🏷️",
    label: "Set a price",
    subtitle: "Name your price",
  },
];

const GWUC_PILLS = ["$5", "$15", "$25", "Custom"];

export default function PricingPicker({
  selected,
  onSelect,
}: PricingPickerProps) {
  const [priceText, setPriceText] = useState("");

  const handleOptionPress = (type: PricingType) => {
    if (type === "set-price") {
      const amount = parseInt(priceText, 10);
      onSelect({ type, amount: isNaN(amount) ? null : amount });
    } else {
      onSelect({ type });
    }
  };

  const handlePriceChange = (text: string) => {
    setPriceText(text);
    const amount = parseInt(text, 10);
    if (!isNaN(amount) && amount > 0) {
      onSelect({ type: "set-price", amount });
    }
  };

  const isSelected = (type: PricingType) => selected?.type === type;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How do you want to share this?</Text>

      {OPTIONS.map((option) => {
        const active = isSelected(option.type);

        const inner = (
          <View style={[styles.optionInner, !active && styles.optionUnselected]}>
            <Text style={styles.optionEmoji}>{option.emoji}</Text>
            <View style={styles.optionTextCol}>
              <Text style={styles.optionLabel}>{option.label}</Text>
              <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
            </View>
            {active && <Text style={styles.checkmark}>✓</Text>}
          </View>
        );

        if (active) {
          return (
            <Pressable
              key={option.type}
              onPress={() => handleOptionPress(option.type)}
            >
              <LinearGradient
                colors={gradientColors.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientBorder}
              >
                {inner}
              </LinearGradient>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={option.type}
            onPress={() => handleOptionPress(option.type)}
          >
            <View style={styles.optionBorderWrap}>{inner}</View>
          </Pressable>
        );
      })}

      {/* Set a price input */}
      {isSelected("set-price") && (
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.priceInput}
              value={priceText}
              onChangeText={handlePriceChange}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.textLight}
            />
          </View>
          {priceText.length > 0 && !isNaN(parseInt(priceText, 10)) && parseInt(priceText, 10) > 0 && (
            <View style={styles.feeInfo}>
              <Text style={styles.receiveText}>
                You'll receive ${(Math.round(parseInt(priceText, 10) * 0.90 * 100) / 100).toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Give what you can preview */}
      {isSelected("give-what-you-can") && (
        <View style={styles.gwucSection}>
          <Text style={styles.gwucLabel}>What they'll see:</Text>
          <View style={styles.pillRow}>
            {GWUC_PILLS.map((pill) => (
              <View key={pill} style={styles.pill}>
                <Text style={styles.pillText}>{pill}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.gwucNote}>
            Or just say thanks — no pressure either way
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  gradientBorder: {
    borderRadius: 12,
    padding: 2,
  },
  optionBorderWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  optionUnselected: {
    borderRadius: 11,
  },
  optionEmoji: {
    fontSize: 24,
  },
  optionTextCol: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  optionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.neonPurple,
  },
  priceSection: {
    marginTop: 4,
    paddingHorizontal: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dollarSign: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.text,
  },
  priceInput: {
    fontSize: 32,
    fontWeight: "600",
    color: colors.text,
    minWidth: 80,
    textAlign: "center",
  },
  feeInfo: {
    marginTop: 8,
    gap: 2,
  },
  feeText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  receiveText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.neonGreen,
  },
  gwucSection: {
    marginTop: 4,
    paddingHorizontal: 4,
    gap: 8,
  },
  gwucLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  pillRow: {
    flexDirection: "row",
    gap: 8,
  },
  pill: {
    backgroundColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "500",
  },
  gwucNote: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
