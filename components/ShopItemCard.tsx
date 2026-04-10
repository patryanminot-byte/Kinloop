import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import Card from "./ui/Card";
import Avatar from "./ui/Avatar";
import { colors } from "../lib/colors";
import type { Item } from "../lib/types";

interface ShopItemCardProps {
  item: Item;
}

function getPricingLabel(item: Item): string | null {
  const pricing = item.pricing;
  if (!pricing) return null;
  switch (pricing.type) {
    case "free": return "Free";
    case "give-what-you-can": return "You decide";
    case "set-price": return `$${pricing.amount ?? 0}`;
    default: return null;
  }
}

export default function ShopItemCard({ item }: ShopItemCardProps) {
  const pricingLabel = getPricingLabel(item);

  // Single metadata line: "6-12mo · Free" or "2-3y · $120"
  const metaParts = [item.ageRange];
  if (item.isBundle && item.count) metaParts.push(`${item.count} items`);
  if (pricingLabel) metaParts.push(pricingLabel);
  const metaLine = metaParts.join(" \u00B7 ");

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

      <Text style={styles.meta}>{metaLine}</Text>

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
    color: colors.blue,
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
  meta: {
    fontSize: 12,
    color: colors.textMuted,
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
