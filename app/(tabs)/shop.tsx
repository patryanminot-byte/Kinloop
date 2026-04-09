import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../lib/colors";
import type { Item } from "../../lib/types";
import ShopItemCard from "../../components/ShopItemCard";
import GradientText from "../../components/ui/GradientText";
import { useAuth } from "../../hooks/useAuth";
import { useShop } from "../../hooks/useShop";

// --------------- Mock Data ---------------

const MOCK_FRIEND_ITEMS: Item[] = [
  {
    id: "s1",
    name: "6-12mo clothes bundle",
    category: "Clothing",
    ageRange: "6-12mo",
    status: "available",
    matchedTo: null,
    emoji: "\uD83D\uDC55",
    isBundle: true,
    count: 15,
    pricing: { type: "free" },
    from: "Sarah Chen",
    fromAvatar: "SC",
    ring: "friend",
  },
  {
    id: "s2",
    name: "High chair",
    category: "Gear",
    ageRange: "6-24mo",
    status: "available",
    matchedTo: null,
    emoji: "\uD83E\uDE91",
    pricing: { type: "give-what-you-can" },
    from: "Mike Johnson",
    fromAvatar: "MJ",
    ring: "friend",
    condition: "Great",
  },
  {
    id: "s3",
    name: "Uppababy Vista",
    category: "Stroller",
    ageRange: "0-3y",
    status: "available",
    matchedTo: null,
    emoji: "\uD83D\uDEBC",
    pricing: { type: "set-price", amount: 120 },
    from: "Lisa Park",
    fromAvatar: "LP",
    ring: "friend",
    condition: "Like new",
    postedAgo: "2d ago",
  },
];

const MOCK_NEARBY_ITEMS: Item[] = [
  // Under 10 min
  {
    id: "s4",
    name: "Crib",
    category: "Furniture",
    ageRange: "0-2y",
    status: "available",
    matchedTo: null,
    emoji: "\uD83D\uDECF\uFE0F",
    pricing: { type: "set-price", amount: 75 },
    from: "Jamie R.",
    fromAvatar: "JR",
    ring: "nearby",
    distance: "About 5 min away",
    distanceMinutes: 5,
    condition: "Good",
    postedAgo: "1d ago",
  },
  {
    id: "s5",
    name: "2T-3T clothes bundle",
    category: "Clothing",
    ageRange: "2-3y",
    status: "available",
    matchedTo: null,
    emoji: "\uD83D\uDC55",
    isBundle: true,
    count: 20,
    pricing: { type: "free" },
    from: "Alex M.",
    fromAvatar: "AM",
    ring: "nearby",
    distance: "About 8 min away",
    distanceMinutes: 8,
    postedAgo: "3h ago",
  },
  // 10-25 min
  {
    id: "s6",
    name: "Balance bike",
    category: "Toys",
    ageRange: "2-5y",
    status: "available",
    matchedTo: null,
    emoji: "\uD83D\uDEB2",
    pricing: { type: "give-what-you-can" },
    from: "Pat K.",
    fromAvatar: "PK",
    ring: "nearby",
    distance: "About 15 min away",
    distanceMinutes: 15,
    condition: "Great",
    postedAgo: "5d ago",
  },
  {
    id: "s7",
    name: "Baby carrier",
    category: "Gear",
    ageRange: "0-18mo",
    status: "available",
    matchedTo: null,
    emoji: "\uD83D\uDC76",
    pricing: { type: "free" },
    from: "Megan T.",
    fromAvatar: "MT",
    ring: "nearby",
    distance: "About 20 min away",
    distanceMinutes: 20,
    condition: "Like new",
    postedAgo: "2d ago",
  },
  // 25-40 min
  {
    id: "s8",
    name: "Toddler bed frame",
    category: "Furniture",
    ageRange: "2-5y",
    status: "available",
    matchedTo: null,
    emoji: "\uD83D\uDECF\uFE0F",
    pricing: { type: "set-price", amount: 50 },
    from: "Chris L.",
    fromAvatar: "CL",
    ring: "nearby",
    distance: "About 30 min away",
    distanceMinutes: 30,
    condition: "Good",
    postedAgo: "4d ago",
  },
  {
    id: "s9",
    name: "Play kitchen",
    category: "Toys",
    ageRange: "2-6y",
    status: "available",
    matchedTo: null,
    emoji: "\uD83C\uDF73",
    pricing: { type: "give-what-you-can" },
    from: "Dana W.",
    fromAvatar: "DW",
    ring: "nearby",
    distance: "About 35 min away",
    distanceMinutes: 35,
    postedAgo: "1d ago",
  },
  // 40-55 min
  {
    id: "s10",
    name: "Jogging stroller",
    category: "Stroller",
    ageRange: "6mo-4y",
    status: "available",
    matchedTo: null,
    emoji: "\uD83D\uDEBC",
    pricing: { type: "set-price", amount: 85 },
    from: "Sam N.",
    fromAvatar: "SN",
    ring: "nearby",
    distance: "About 45 min away",
    distanceMinutes: 45,
    condition: "Great",
    postedAgo: "6d ago",
  },
];

const CATEGORIES = [
  "All",
  "Clothing",
  "Gear",
  "Stroller",
  "Toys",
  "Household",
  "Outdoor",
  "Furniture",
  "Electronics",
];

// Distance brackets
interface DistanceBracket {
  label: string;
  min: number;
  max: number;
}

const DISTANCE_BRACKETS: DistanceBracket[] = [
  { label: "Under 10 min", min: 0, max: 10 },
  { label: "10\u201325 min away", min: 10, max: 25 },
  { label: "25\u201340 min away", min: 25, max: 40 },
  { label: "40\u201355 min away", min: 40, max: 55 },
  { label: "55+ min away", min: 55, max: Infinity },
];

function groupByDistance(items: Item[]): { label: string; items: Item[] }[] {
  const sorted = [...items].sort(
    (a, b) => (a.distanceMinutes ?? 999) - (b.distanceMinutes ?? 999),
  );

  const groups: { label: string; items: Item[] }[] = [];
  for (const bracket of DISTANCE_BRACKETS) {
    const bracketItems = sorted.filter((item) => {
      const d = item.distanceMinutes ?? 999;
      return d >= bracket.min && d < bracket.max;
    });
    if (bracketItems.length > 0) {
      groups.push({ label: bracket.label, items: bracketItems });
    }
  }
  return groups;
}

// Render items in a 2-column grid
function ItemGrid({ items }: { items: Item[] }) {
  const rows: Item[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }
  return (
    <View style={styles.grid}>
      {rows.map((row, idx) => (
        <View key={idx} style={styles.gridRow}>
          {row.map((item) => (
            <ShopItemCard key={item.id} item={item} />
          ))}
          {row.length === 1 && <View style={styles.gridSpacer} />}
        </View>
      ))}
    </View>
  );
}

export default function ShopScreen() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const {
    friendItems: realFriendItems,
    nearbyItems: realNearbyItems,
    loading,
  } = useShop(userId);

  const friendItems =
    realFriendItems.length > 0 || loading
      ? realFriendItems
      : MOCK_FRIEND_ITEMS;
  const nearbyItems =
    realNearbyItems.length > 0 || loading
      ? realNearbyItems
      : MOCK_NEARBY_ITEMS;

  const [activeCategory, setActiveCategory] = useState("All");

  const filteredFriendItems = useMemo(() => {
    if (activeCategory === "All") return friendItems;
    return friendItems.filter((i) => i.category === activeCategory);
  }, [friendItems, activeCategory]);

  const filteredNearbyItems = useMemo(() => {
    if (activeCategory === "All") return nearbyItems;
    return nearbyItems.filter((i) => i.category === activeCategory);
  }, [nearbyItems, activeCategory]);

  const nearbyGroups = useMemo(
    () => groupByDistance(filteredNearbyItems),
    [filteredNearbyItems],
  );

  if (
    loading &&
    realFriendItems.length === 0 &&
    realNearbyItems.length === 0
  ) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* Header */}
        <View>
          <GradientText style={styles.title}>Shop</GradientText>
          <Text style={styles.subtitle}>
            Browse what's available near you
          </Text>
        </View>

        {/* Sticky category filter pills */}
        <View style={styles.pillBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillContainer}
          >
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                style={[
                  styles.pill,
                  activeCategory === cat && styles.pillActive,
                ]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text
                  style={[
                    styles.pillText,
                    activeCategory === cat && styles.pillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ---- Friends section ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {"\u2661"} From friends ({filteredFriendItems.length})
          </Text>
          {filteredFriendItems.length > 0 ? (
            <ItemGrid items={filteredFriendItems} />
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>
                No friend items
                {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
              </Text>
            </View>
          )}
        </View>

        {/* ---- Nearby section with distance groups ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {"\u25C9"} Nearby ({filteredNearbyItems.length})
          </Text>

          {nearbyGroups.length > 0 ? (
            nearbyGroups.map((group) => (
              <View key={group.label} style={styles.distanceGroup}>
                <View style={styles.distanceHeaderRow}>
                  <View style={styles.distanceLine} />
                  <Text style={styles.distanceLabel}>{group.label}</Text>
                  <View style={styles.distanceLine} />
                </View>
                <ItemGrid items={group.items} />
              </View>
            ))
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>
                No nearby items
                {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 12,
  },

  // Sticky pill bar
  pillBar: {
    backgroundColor: colors.bg,
    paddingBottom: 12,
    paddingTop: 4,
  },
  pillContainer: {
    gap: 8,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  pillTextActive: {
    color: "#FFFFFF",
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },

  // Grid
  grid: {
    gap: 0,
  },
  gridRow: {
    flexDirection: "row",
    marginHorizontal: -6,
  },
  gridSpacer: {
    flex: 1,
    margin: 6,
  },

  // Distance groups
  distanceGroup: {
    marginBottom: 8,
  },
  distanceHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 4,
    gap: 10,
  },
  distanceLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  distanceLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },

  // Empty states
  emptySection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptySectionText: {
    fontSize: 14,
    color: colors.textLight,
  },

  bottomSpacer: {
    height: 100,
  },
});
