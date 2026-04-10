import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradientColors } from "../lib/colors";
import { HandoffMethod, HandoffPlan } from "../lib/types";
import Button from "./ui/Button";

interface HandoffSchedulerProps {
  friendName: string;
  itemName: string;
  onConfirm: (plan: HandoffPlan) => void;
}

interface MethodOption {
  method: HandoffMethod;
  emoji: string;
  label: string;
  placeholder: string;
}

const METHODS: MethodOption[] = [
  {
    method: "porch",
    emoji: "🏡",
    label: "Porch drop-off",
    placeholder: "I'll leave it on your porch Saturday morning",
  },
  {
    method: "meetup",
    emoji: "🤝",
    label: "Meet up",
    placeholder: "Saturday at Garner Park around 10?",
  },
  {
    method: "school",
    emoji: "🎒",
    label: "School / daycare swap",
    placeholder: "I'll send it with Maya on Tuesday",
  },
  {
    method: "ship",
    emoji: "📦",
    label: "Ship it",
    placeholder: "I'll drop it at UPS this week",
  },
];

export default function HandoffScheduler({
  friendName,
  itemName,
  onConfirm,
}: HandoffSchedulerProps) {
  const [selectedMethod, setSelectedMethod] = useState<HandoffMethod | null>(
    null,
  );
  const [details, setDetails] = useState("");

  const selected = METHODS.find((m) => m.method === selectedMethod);

  const handleMethodTap = (method: HandoffMethod) => {
    setSelectedMethod(method);
    setDetails("");
  };

  const handleSuggestionTap = () => {
    if (selected) {
      setDetails(selected.placeholder);
    }
  };

  const handleConfirm = () => {
    if (!selectedMethod) return;
    onConfirm({
      method: selectedMethod,
      details: details || selected?.placeholder || "",
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {friendName} wants it! 🎉
      </Text>
      <Text style={styles.subtitle}>
        How do you want to hand off the {itemName}?
      </Text>

      {/* Method cards */}
      <View style={styles.methodGrid}>
        {METHODS.map((option) => {
          const isActive = selectedMethod === option.method;
          return (
            <TouchableOpacity
              key={option.method}
              onPress={() => handleMethodTap(option.method)}
              activeOpacity={0.7}
              style={styles.methodTouchable}
            >
              {isActive ? (
                <LinearGradient
                  colors={gradientColors.button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.methodGradientBorder}
                >
                  <View style={styles.methodCardInner}>
                    <Text style={styles.methodEmoji}>{option.emoji}</Text>
                    <Text style={[styles.methodLabel, styles.methodLabelActive]}>
                      {option.label}
                    </Text>
                  </View>
                </LinearGradient>
              ) : (
                <View style={styles.methodCard}>
                  <Text style={styles.methodEmoji}>{option.emoji}</Text>
                  <Text style={styles.methodLabel}>{option.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Details section */}
      {selected && (
        <View style={styles.detailsSection}>
          <Text style={styles.detailsLabel}>Add details:</Text>

          {!details && (
            <TouchableOpacity
              onPress={handleSuggestionTap}
              activeOpacity={0.6}
            >
              <Text style={styles.suggestionText}>
                💡 {selected.placeholder}
              </Text>
            </TouchableOpacity>
          )}

          <TextInput
            style={styles.detailsInput}
            value={details}
            onChangeText={setDetails}
            placeholder="Type your own..."
            placeholderTextColor={colors.textLight}
            multiline
            numberOfLines={2}
          />

          <Button
            variant="primary"
            size="lg"
            title={`Confirm handoff plan ✓`}
            onPress={handleConfirm}
            style={styles.confirmBtn}
          />
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
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 4,
  },

  // Method grid
  methodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  methodTouchable: {
    width: "47%",
    flexGrow: 1,
  },
  methodCard: {
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    gap: 6,
  },
  methodGradientBorder: {
    borderRadius: 14,
    padding: 2,
  },
  methodCardInner: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.card,
    gap: 6,
  },
  methodEmoji: {
    fontSize: 28,
  },
  methodLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  methodLabelActive: {
    color: colors.violet,
  },

  // Details
  detailsSection: {
    marginTop: 4,
    gap: 8,
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.violet,
    fontStyle: "italic",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.violet + "0D",
    borderRadius: 10,
    overflow: "hidden",
  },
  detailsInput: {
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    minHeight: 50,
    backgroundColor: colors.card,
    lineHeight: 21,
  },
  confirmBtn: {
    width: "100%",
    marginTop: 4,
  },
});
