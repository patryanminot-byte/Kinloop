import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { colors } from "../../lib/colors";
import type { Item } from "../../lib/types";
import ShopItemCard from "../../components/ShopItemCard";
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
    distance: "About 10 min away",
    postedAgo: "3h ago",
  },
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
    condition: "Great",
    postedAgo: "5d ago",
  },
];

const CATEGORIES = ["All", "Clothing", "Gear", "Stroller", "Toys", "Household", "Outdoor", "Furniture", "Electronics"];

type RingTab = "friend" | "nearby";

export default function ShopScreen() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { friendItems: realFriendItems, nearbyItems: realNearbyItems, loading } = useShop(userId);

  const friendItems = realFriendItems.length > 0 || loading ? realFriendItems : MOCK_FRIEND_ITEMS;
  const nearbyItems = realNearbyItems.length > 0 || loading ? realNearbyItems : MOCK_NEARBY_ITEMS;

  const [activeRing, setActiveRing] = useState<RingTab>("friend");
  const [activeCategory, setActiveCategory] = useState("All");
  const { width } = useWindowDimensions();

  // Animated toggle indicator
  const toggleX = useSharedValue(0);
  const halfWidth = (width - 40 - 8) / 2; // container padding 20*2, inner padding 4*2

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: toggleX.value }],
    width: halfWidth,
  }));

  const switchRing = (ring: RingTab) => {
    setActiveRing(ring);
    toggleX.value = withTiming(ring === "friend" ? 0 : halfWidth, {
      duration: 250,
    });
  };

  const sourceItems = activeRing === "friend" ? friendItems : nearbyItems;

  const filteredItems = useMemo(() => {
    if (activeCategory === "All") return sourceItems;
    return sourceItems.filter((i) => i.category === activeCategory);
  }, [sourceItems, activeCategory]);

  const friendCount = friendItems.length;
  const nearbyCount = nearbyItems.length;

  if (loading && realFriendItems.length === 0 && realNearbyItems.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={
          <>
            {/* Header */}
            <Text style={styles.title}>Shop</Text>
            <Text style={styles.subtitle}>Browse what's available near you</Text>

            {/* Ring toggle */}
            <View style={styles.toggleContainer}>
              <Animated.View style={[styles.toggleIndicator, indicatorStyle]} />
              <Pressable style={styles.toggleButton} onPress={() => switchRing("friend")}>
                <Text
                  style={[
                    styles.toggleText,
                    activeRing === "friend" && styles.toggleTextActive,
                  ]}
                >
                  {"\u2661"} Friends ({friendCount})
                </Text>
              </Pressable>
              <Pressable style={styles.toggleButton} onPress={() => switchRing("nearby")}>
                <Text
                  style={[
                    styles.toggleText,
                    activeRing === "nearby" && styles.toggleTextActive,
                  ]}
                >
                  {"\u25C9"} Nearby ({nearbyCount})
                </Text>
              </Pressable>
            </View>

            {/* Category filter pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.pillScroll}
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

            {/* Nearby explainer */}
            {activeRing === "nearby" && (
              <View style={styles.explainer}>
                <Text style={styles.explainerText}>
                  Community items — from Kinloop parents near Madison. Your items
                  go here too when you opt in.
                </Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => <ShopItemCard item={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>{"\uD83D\uDD0D"}</Text>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyHint}>
              Check back soon — new items drop daily
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  columnWrapper: {
    marginHorizontal: -6,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },

  // Ring toggle
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: colors.border,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    position: "relative",
  },
  toggleIndicator: {
    position: "absolute",
    top: 4,
    left: 4,
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    zIndex: 1,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  toggleTextActive: {
    color: colors.text,
  },

  // Category pills
  pillScroll: {
    marginBottom: 16,
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

  // Nearby explainer
  explainer: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  explainerText: {
    fontSize: 13,
    color: "#3B82F6",
    lineHeight: 18,
  },

  // Empty state
  empty: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: "center",
  },
});
