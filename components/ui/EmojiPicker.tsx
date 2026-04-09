import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { gradientColors, colors } from "../../lib/colors";

interface EmojiPickerProps {
  selected?: string;
  onSelect?: (emoji: string) => void;
}

const EMOJI_SECTIONS = [
  {
    label: "Faces",
    emojis: [
      "\u{1F476}", "\u{1F476}\u{1F3FB}", "\u{1F476}\u{1F3FC}",
      "\u{1F476}\u{1F3FD}", "\u{1F476}\u{1F3FE}", "\u{1F476}\u{1F3FF}",
      "\u{1F9D2}", "\u{1F9D2}\u{1F3FB}", "\u{1F9D2}\u{1F3FC}",
      "\u{1F9D2}\u{1F3FD}", "\u{1F9D2}\u{1F3FE}", "\u{1F9D2}\u{1F3FF}",
      "\u{1F466}", "\u{1F466}\u{1F3FC}", "\u{1F466}\u{1F3FE}",
      "\u{1F467}", "\u{1F467}\u{1F3FC}", "\u{1F467}\u{1F3FE}",
      "\u{1F9D1}", "\u{1F9D1}\u{1F3FB}", "\u{1F9D1}\u{1F3FC}",
      "\u{1F9D1}\u{1F3FD}", "\u{1F9D1}\u{1F3FE}", "\u{1F9D1}\u{1F3FF}",
      "\u{1F60A}", "\u{1F604}", "\u{1F970}", "\u{1F60E}",
      "\u{1F929}", "\u{1F607}", "\u{1F973}", "\u{1F60B}",
      "\u{1F917}", "\u{1F61C}", "\u{1F643}",
    ],
  },
  {
    label: "Animals",
    emojis: [
      "\u{1F43B}", "\u{1F98A}", "\u{1F430}", "\u{1F431}",
      "\u{1F981}", "\u{1F43C}", "\u{1F428}", "\u{1F984}",
      "\u{1F42C}", "\u{1F98B}", "\u{1F422}", "\u{1F41D}",
    ],
  },
  {
    label: "Fun",
    emojis: [
      "\u{1F31F}", "\u{1F308}", "\u{1F33B}", "\u{1F338}",
      "\u{1F340}", "\u{1F331}", "\u{1F30A}", "\u{2728}",
      "\u{1F680}", "\u{1F388}", "\u{1F3A8}", "\u{1F996}",
    ],
  },
];

const RING_SIZE = 48;
const RING_BORDER = 3;

export default function EmojiPicker({ selected, onSelect }: EmojiPickerProps) {
  return (
    <View style={styles.container}>
      {EMOJI_SECTIONS.map((section) => (
        <View key={section.label}>
          <Text style={styles.sectionLabel}>{section.label}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {section.emojis.map((emoji) => {
              const isSelected = selected === emoji;
              return (
                <Pressable
                  key={emoji}
                  onPress={() => onSelect?.(emoji)}
                  style={styles.cell}
                >
                  {isSelected ? (
                    <LinearGradient
                      colors={gradientColors.rainbow}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.ring}
                    >
                      <View style={styles.ringInner}>
                        <Text style={styles.emoji}>{emoji}</Text>
                      </View>
                    </LinearGradient>
                  ) : (
                    <View style={styles.ringPlaceholder}>
                      <Text style={styles.emoji}>{emoji}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  scrollContent: {
    gap: 6,
    paddingVertical: 4,
  },
  cell: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    width: RING_SIZE - RING_BORDER * 2,
    height: RING_SIZE - RING_BORDER * 2,
    borderRadius: (RING_SIZE - RING_BORDER * 2) / 2,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  ringPlaceholder: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 24,
  },
});
