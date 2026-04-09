import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { gradientColors } from "../../lib/colors";

interface EmojiPickerProps {
  selected?: string;
  onSelect?: (emoji: string) => void;
}

const EMOJI_ROWS = [
  ["\u{1F476}\u{1F3FB}", "\u{1F476}\u{1F3FC}", "\u{1F476}\u{1F3FD}", "\u{1F476}\u{1F3FE}", "\u{1F476}\u{1F3FF}"],
  ["\u{1F467}\u{1F3FB}", "\u{1F467}\u{1F3FC}", "\u{1F467}\u{1F3FD}", "\u{1F467}\u{1F3FE}", "\u{1F467}\u{1F3FF}"],
  ["\u{1F466}\u{1F3FB}", "\u{1F466}\u{1F3FC}", "\u{1F466}\u{1F3FD}", "\u{1F466}\u{1F3FE}", "\u{1F466}\u{1F3FF}"],
];

const RING_SIZE = 56;
const EMOJI_SIZE = 44;
const RING_BORDER = 3;

export default function EmojiPicker({ selected, onSelect }: EmojiPickerProps) {
  return (
    <View style={styles.grid}>
      {EMOJI_ROWS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((emoji) => {
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
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
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
    fontSize: EMOJI_SIZE * 0.6,
  },
});
