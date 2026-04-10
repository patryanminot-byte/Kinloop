import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradientColors } from "../../lib/colors";
import type { Item } from "../../lib/types";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useInventory } from "../../hooks/useInventory";
import { useAppStore } from "../../stores/appStore";
import { supabase } from "../../lib/supabase";

// ── Mock Data ──────────────────────────────────────────────────────────
const MOCK_ITEMS: Item[] = [
  { id: "1", name: "3-6mo clothes bundle", category: "Clothing", ageRange: "3-6mo", status: "aging-out", matchedTo: null, emoji: "👕", daysLeft: 0, isBundle: true, count: 12 },
  { id: "2", name: "Bugaboo stroller", category: "Stroller", ageRange: "6-12mo", status: "matched", matchedTo: "Mike J.", emoji: "🚼" },
  { id: "3", name: "Winter jacket bundle", category: "Clothing", ageRange: "2-3y", status: "aging-out", matchedTo: null, emoji: "🧥", daysLeft: 5, isBundle: true, count: 3 },
  { id: "4", name: "Board books set", category: "Books", ageRange: "12-18mo", status: "available", matchedTo: null, emoji: "📚", isBundle: true, count: 8 },
  { id: "5", name: "Infant car seat", category: "Car Seat", ageRange: "0-12mo", status: "handed-off", matchedTo: "Sarah C.", emoji: "🚗", hasPhoto: true },
  { id: "6", name: "Play mat", category: "Gear", ageRange: "0-6mo", status: "available", matchedTo: null, emoji: "🎪" },
];

const CATEGORIES = ["All", "Clothing", "Gear", "Stroller", "Car Seat", "Books", "Toys", "Household", "Outdoor", "Furniture", "Electronics", "Other"];

const STATUS_ORDER: Record<Item["status"], number> = {
  "aging-out": 0,
  available: 1,
  matched: 2,
  "handed-off": 3,
};

// ── Helpers ────────────────────────────────────────────────────────────

function sortItems(items: Item[]): Item[] {
  return [...items].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
}

function badgeFor(item: Item): { label: string; color: string } {
  if (item.status === "aging-out")
    return { label: "Time to go?", color: "#FB923C" };
  if (item.status === "available")
    return { label: "Available", color: "#22D3EE" };
  if (item.status === "handed-off")
    return { label: "Done", color: "#34D399" };
  // matched — no badge needed on right side, but provide a fallback
  return { label: "Matched", color: colors.neonPurple };
}

// ── Components ─────────────────────────────────────────────────────────

function CategoryPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  if (active) {
    return (
      <Pressable onPress={onPress} style={styles.pillWrapper}>
        <LinearGradient
          colors={gradientColors.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.pill}
        >
          <Text style={styles.pillTextActive}>{label}</Text>
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} style={[styles.pill, styles.pillInactive]}>
      <Text style={styles.pillTextInactive}>{label}</Text>
    </Pressable>
  );
}

function ItemRow({ item, onPress }: { item: Item; onPress: () => void }) {
  const { label, color } = badgeFor(item);
  const isHandedOff = item.status === "handed-off";

  return (
    <Pressable style={[styles.itemRow, isHandedOff && styles.itemRowHandedOff]} onPress={onPress}>
      {/* Emoji circle */}
      <LinearGradient
        colors={["#FFF0F3", "#F3E8FF"]}
        style={styles.emojiCircle}
      >
        <Text style={styles.emoji}>{item.emoji}</Text>
      </LinearGradient>

      {/* Middle text */}
      <View style={styles.itemMiddle}>
        <Text style={styles.itemName}>
          {item.name}
          {item.isBundle && item.count ? ` (×${item.count})` : ""}
          {item.hasPhoto ? " 📸" : ""}
        </Text>
        {item.status === "handed-off" && item.matchedTo ? (
          <Text style={styles.itemSubHandedOff}>
            Handed to {item.matchedTo} ✓
          </Text>
        ) : item.status === "matched" && item.matchedTo ? (
          <Text style={styles.itemSubMatched}>
            Matched → {item.matchedTo}
          </Text>
        ) : (
          <Text style={styles.itemSubMuted}>{item.ageRange}</Text>
        )}
      </View>

      {/* Badge */}
      <Badge color={color}>{label}</Badge>
    </Pressable>
  );
}

function VisibilityRow({ userId }: { userId?: string }) {
  const visibility = useAppStore((s) => s.itemVisibility);
  const setVisibility = useAppStore((s) => s.setItemVisibility);
  const isPublic = visibility === "public";

  const toggle = async () => {
    const next = isPublic ? "circle" : "public";
    setVisibility(next);
    if (userId) {
      await supabase
        .from("profiles")
        .update({ item_visibility: next })
        .eq("id", userId);
    }
  };

  return (
    <View style={styles.visibilityContainer}>
      <Pressable onPress={toggle} style={styles.visibilityRow}>
        <Text style={[styles.visibilityEndLabel, !isPublic && styles.visibilityEndLabelActive, !isPublic && styles.visibilityFriendsActive]}>
          Friends only
        </Text>
        <View style={[styles.toggleTrack, isPublic && styles.toggleTrackOn]}>
          <View style={[styles.toggleThumb, isPublic && styles.toggleThumbOn]} />
        </View>
        <Text style={[styles.visibilityEndLabel, isPublic && styles.visibilityEndLabelActive, isPublic && styles.visibilityPublicActive]}>
          All of Watasu
        </Text>
      </Pressable>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────

export default function StuffScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");

  // ---- Real data from Supabase ----
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { items: realItems, loading } = useInventory(userId);

  // To-go badge count
  const toGoCount = useAppStore((s) => s.toGoItems.length);

  // Fallback to mock data when no real data and not loading
  const items = realItems.length > 0 ? realItems : loading ? [] : MOCK_ITEMS;

  const filtered = activeCategory === "All"
    ? items
    : items.filter((i) => i.category === activeCategory);

  const sorted = sortItems(filtered);

  const showClothingInfo =
    activeCategory === "All" || activeCategory === "Clothing";

  const renderItem = useCallback(
    ({ item }: { item: Item }) => (
      <ItemRow item={item} onPress={() => router.push(`/item/${item.id}` as `/${string}`)} />
    ),
    [router],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your stuff</Text>
          <View style={styles.headerActions}>
            {toGoCount > 0 && (
              <Pressable onPress={() => router.push("/to-go")} style={styles.toGoBadge}>
                <Text style={styles.toGoBadgeText}>{toGoCount} to go</Text>
              </Pressable>
            )}
            <Button
              variant="secondary"
              size="sm"
              title="+ Add"
              onPress={() => router.push("/add-item")}
            />
          </View>
        </View>

        {/* Category pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
          style={styles.pillScroll}
        >
          {CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat}
              label={cat}
              active={activeCategory === cat}
              onPress={() => setActiveCategory(cat)}
            />
          ))}
        </ScrollView>

        {/* Clothing info card */}
        {showClothingInfo && (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Clothes auto-bundle by size. No need to list each piece — just
              confirm the size range.
            </Text>
          </View>
        )}

        {/* Visibility quick toggle */}
        <VisibilityRow userId={userId} />

        {/* Item list */}
        {sorted.length > 0 ? (
          <FlatList
            data={sorted}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyTitle}>No items in this category</Text>
            <Text style={styles.emptyHint}>Tap + Add to get started</Text>
          </View>
        )}
      </View>

    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: "700", color: colors.text },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  toGoBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.neonPurple + "20",
    borderWidth: 1,
    borderColor: colors.neonPurple,
  },
  toGoBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.neonPurple,
  },

  // Pills
  pillScroll: { flexGrow: 0, marginBottom: 12 },
  pillRow: { gap: 8, paddingRight: 20 },
  pillWrapper: {},
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  pillInactive: { backgroundColor: "#F0F0ED" },
  pillTextActive: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  pillTextInactive: { fontSize: 14, fontWeight: "600", color: colors.textMuted },

  // Info card
  infoCard: {
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  infoText: { fontSize: 13, color: "#7B6F00", lineHeight: 18 },

  // List
  listContent: { paddingBottom: 40 },

  // Item row
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemRowHandedOff: { opacity: 0.5 },
  emojiCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  emoji: { fontSize: 22 },
  itemMiddle: { flex: 1, marginRight: 8 },
  itemName: { fontSize: 16, fontWeight: "700", color: colors.text },
  itemSubHandedOff: { fontSize: 13, color: colors.success, marginTop: 2 },
  itemSubMatched: { fontSize: 13, color: colors.neonPurple, marginTop: 2 },
  itemSubMuted: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

  // Empty state
  emptyState: { alignItems: "center", paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 4 },
  emptyHint: { fontSize: 14, color: colors.textLight },

  // Visibility toggle
  visibilityContainer: {
    marginBottom: 12,
  },
  visibilityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  visibilityEndLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  visibilityEndLabelActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  visibilityFriendsActive: {
    backgroundColor: colors.neonPurple,
  },
  visibilityPublicActive: {
    backgroundColor: colors.neonGreen,
  },
  toggleTrack: {
    width: 40,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.neonPurple,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleTrackOn: {
    backgroundColor: colors.neonGreen,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  toggleThumbOn: {
    alignSelf: "flex-end",
  },
});
