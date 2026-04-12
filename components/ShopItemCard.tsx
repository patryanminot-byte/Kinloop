import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { router } from "expo-router";
import Card from "./ui/Card";
import { colors } from "../lib/colors";
import type { Item } from "../lib/types";

// ─── Category background colors ────────────────────────────────────────────

const CATEGORY_BG: Record<string, string> = {
  // Kids
  Clothing: "#FFF0EC",
  Shoes: "#FFF0EC",
  Outerwear: "#FFF0EC",
  Strollers: "#FFF0EC",
  "Car Seats": "#FFF0EC",
  Gear: "#FFF0EC",
  Feeding: "#FFF0EC",
  Toys: "#FFF0EC",
  Books: "#FFF0EC",
  Furniture: "#FFF0EC",
  Sleep: "#FFF0EC",
  Bath: "#FFF0EC",
  Safety: "#FFF0EC",
  // Home
  "Home Furniture": "#EFF5EE",
  Appliances: "#EFF5EE",
  "Home Decor": "#EFF5EE",
  // Clothing/Fashion
  Fashion: "#F0EDF5",
  // Electronics
  Electronics: "#EDF2F7",
  Gaming: "#EDF2F7",
  // Outdoor
  Outdoor: "#EEF5EC",
  "Sports & Fitness": "#EEF5EC",
  "Garden & Patio": "#EEF5EC",
  // Other
  Tools: "#F5F0EB",
  Instruments: "#F5F0EB",
  "Auto & Moto": "#F5F0EB",
  Office: "#F5F0EB",
  "Free Stuff": "#F5F0EB",
};

function getCategoryBg(category: string): string {
  return CATEGORY_BG[category] ?? "#F5F0EB";
}

// ─── Pricing label ──────────────────────────────────────────────────────────

function getPricingLabel(item: Item): { text: string; accent: boolean } | null {
  const pricing = item.pricing;
  if (!pricing) return null;
  switch (pricing.type) {
    case "free":
      return { text: "Free", accent: true };
    case "give-what-you-can":
      return { text: "Pay what's fair", accent: true };
    case "set-price":
      return { text: `$${pricing.amount ?? 0}`, accent: false };
    default:
      return null;
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

interface ShopItemCardProps {
  item: Item;
}

export default function ShopItemCard({ item }: ShopItemCardProps) {
  const pricing = getPricingLabel(item);
  const bgColor = getCategoryBg(item.category);
  const hasPhoto = item.photoUri != null;

  // Detail line: "Sarah · Size 2T" or "Sarah · Good"
  const detailParts: string[] = [];
  if (item.from) detailParts.push(item.from.split(" ")[0]);
  if (item.ageRange) detailParts.push(item.ageRange);
  if (item.condition) detailParts.push(item.condition);
  const detailLine = detailParts.join(" \u00B7 ");

  return (
    <Card
      onPress={() => router.push(`/shop/${item.id}`)}
      style={styles.card}
    >
      {/* Header area: photo or emoji on colored bg */}
      {hasPhoto ? (
        <Image
          source={{ uri: item.photoUri! }}
          style={styles.photoHeader}
        />
      ) : (
        <View style={[styles.emojiHeader, { backgroundColor: bgColor }]}>
          <Text style={styles.emoji}>{item.emoji}</Text>
        </View>
      )}

      {/* Text area */}
      <View style={styles.textArea}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
          {item.isBundle && item.count ? ` (${item.count})` : ""}
        </Text>
        <Text style={styles.detail} numberOfLines={1}>
          {detailLine}
        </Text>
        {pricing && (
          <Text
            style={[
              styles.price,
              pricing.accent && styles.priceAccent,
            ]}
          >
            {pricing.text}
          </Text>
        )}
      </View>
    </Card>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    padding: 0,
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAE7E3",
  },

  // Photo header
  photoHeader: {
    width: "100%",
    aspectRatio: 1,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },

  // Emoji on color bg header
  emojiHeader: {
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  emoji: {
    fontSize: 48,
  },

  // Text area
  textArea: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  detail: {
    fontSize: 12,
    color: "#8E8E93",
    marginBottom: 2,
  },
  price: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  priceAccent: {
    color: colors.eucalyptus,
  },
});
