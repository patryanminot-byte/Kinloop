import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import Card from "./ui/Card";
import Badge from "./ui/Badge";
import Avatar from "./ui/Avatar";
import { colors } from "../lib/colors";
import type { Item } from "../lib/types";

interface ShopItemCardProps {
  item: Item;
}

function getPricingBadge(item: Item) {
  const pricing = item.pricing;
  if (!pricing) return null;
  switch (pricing.type) {
    case "free":
      return { label: "\uD83C\uDF81 Free", color: colors.neonGreen };
    case "give-what-you-can":
      return { label: "\uD83D\uDC9B You decide", color: colors.neonOrange };
    case "set-price":
      return {
        label: `$${pricing.amount ?? 0}`,
        color: colors.neonPurple,
      };
    default:
      return null;
  }
}

export default function ShopItemCard({ item }: ShopItemCardProps) {
  const pricingBadge = getPricingBadge(item);

  return (
    <Card
      onPress={() => router.push(`/shop/${item.id}`)}
      style={styles.card}
    >
      {item.ring === "nearby" && item.distance ? (
        <Text style={styles.distance}>{item.distance}</Text>
      ) : null}

      <Text style={styles.emoji}>{item.emoji}</Text>
      <Text style={styles.name} numberOfLines={2}>
        {item.name}
      </Text>

      {item.isBundle && item.count ? (
        <Text style={styles.bundleCount}>{item.count} items</Text>
      ) : null}

      <Text style={styles.ageRange}>{item.ageRange}</Text>

      <View style={styles.badgeWrap}>
        {item.condition ? (
          <Badge color={colors.neonGreen}>{item.condition}</Badge>
        ) : null}
        {pricingBadge ? (
          <Badge color={pricingBadge.color}>{pricingBadge.label}</Badge>
        ) : null}
      </View>

      {item.fromAvatar && item.from ? (
        <View style={styles.seller}>
          <Avatar initials={item.fromAvatar} size={20} />
          <Text style={styles.sellerName}>{item.from.split(" ")[0]}</Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    padding: 12,
  },
  distance: {
    fontSize: 12,
    color: colors.neonCyan,
    fontWeight: "600",
    textAlign: "right",
    marginBottom: 4,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  bundleCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  ageRange: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
  },
  badgeWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 8,
  },
  seller: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sellerName: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
