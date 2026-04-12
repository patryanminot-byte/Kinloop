import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "../../lib/colors";
import type { Item } from "../../lib/types";
import ShopItemCard from "../../components/ShopItemCard";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useShop } from "../../hooks/useShop";
import { useAppStore } from "../../stores/appStore";
import LocationPrompt from "../../components/LocationPrompt";
import { type Category } from "../../lib/itemCatalog";

// ─── Warm neutral palette ───────────────────────────────────────────────────

const warm = {
  textDark: "#1A1A1A",
  textMuted: "#8E8E93",
  searchBg: "#F5F3F0",
  chipBg: "#F0EDEA",
  chipActiveBg: "#1A1A1A",
  divider: "#EAE7E3",
  screenBg: "#FAFAF8",
};

// ─── Category chips ─────────────────────────────────────────────────────────

interface ChipDef {
  key: string;
  label: string;
  categories: Category[];
}

const CHIPS: ChipDef[] = [
  { key: "all", label: "All", categories: [] },
  { key: "kids", label: "Kids", categories: ["Clothing","Shoes","Outerwear","Strollers","Car Seats","Gear","Feeding","Toys","Books","Furniture","Sleep","Bath","Safety"] },
  { key: "home", label: "Home", categories: ["Home Furniture","Appliances","Home Decor"] },
  { key: "clothing", label: "Clothing", categories: ["Fashion"] },
  { key: "electronics", label: "Electronics", categories: ["Electronics","Gaming"] },
  { key: "outdoor", label: "Outdoor", categories: ["Outdoor","Sports & Fitness","Garden & Patio"] },
  { key: "more", label: "More", categories: ["Tools","Instruments","Auto & Moto","Office","Free Stuff"] },
];

// ─── Mock data ──────────────────────────────────────────────────────────────

const MOCK_FRIEND_ITEMS: Item[] = [
  { id: "s1", name: "6-12mo clothes bundle", category: "Clothing", ageRange: "6-12mo", status: "available", matchedTo: null, emoji: "\uD83D\uDC55", isBundle: true, count: 15, pricing: { type: "free" }, from: "Sarah Chen", fromAvatar: "SC", ring: "friend" },
  { id: "s2", name: "High chair", category: "Gear", ageRange: "6-24mo", status: "available", matchedTo: null, emoji: "\uD83E\uDE91", pricing: { type: "give-what-you-can" }, from: "Mike Johnson", fromAvatar: "MJ", ring: "friend", condition: "Great" },
  { id: "s3", name: "Uppababy Vista", category: "Strollers", ageRange: "0-3y", status: "available", matchedTo: null, emoji: "\uD83D\uDEBC", pricing: { type: "set-price", amount: 120 }, from: "Lisa Park", fromAvatar: "LP", ring: "friend", condition: "Like new", postedAgo: "2d ago" },
];

const MOCK_NEARBY_ITEMS: Item[] = [
  { id: "s4", name: "Crib", category: "Furniture", ageRange: "0-2y", status: "available", matchedTo: null, emoji: "\uD83D\uDECF\uFE0F", pricing: { type: "set-price", amount: 75 }, from: "Jamie R.", fromAvatar: "JR", ring: "nearby", distance: "About 5 min away", distanceMinutes: 5, condition: "Good", postedAgo: "1d ago" },
  { id: "s5", name: "2T-3T clothes bundle", category: "Clothing", ageRange: "2-3y", status: "available", matchedTo: null, emoji: "\uD83D\uDC55", isBundle: true, count: 20, pricing: { type: "free" }, from: "Alex M.", fromAvatar: "AM", ring: "nearby", distance: "About 8 min away", distanceMinutes: 8, postedAgo: "3h ago" },
  { id: "s6", name: "Balance bike", category: "Toys", ageRange: "2-5y", status: "available", matchedTo: null, emoji: "\uD83D\uDEB2", pricing: { type: "give-what-you-can" }, from: "Pat K.", fromAvatar: "PK", ring: "nearby", distance: "About 15 min away", distanceMinutes: 15, condition: "Great", postedAgo: "5d ago" },
  { id: "s7", name: "Baby carrier", category: "Gear", ageRange: "0-18mo", status: "available", matchedTo: null, emoji: "\uD83D\uDC76", pricing: { type: "free" }, from: "Megan T.", fromAvatar: "MT", ring: "nearby", distance: "About 20 min away", distanceMinutes: 20, condition: "Like new", postedAgo: "2d ago" },
];

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

// ─── Component ──────────────────────────────────────────────────────────────

export default function BrowseScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { friendItems: realFriendItems, nearbyItems: realNearbyItems, loading } = useShop(userId);

  const friendItems = realFriendItems.length > 0 || loading ? realFriendItems : MOCK_FRIEND_ITEMS;
  const nearbyItems = realNearbyItems.length > 0 || loading ? realNearbyItems : MOCK_NEARBY_ITEMS;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeChip, setActiveChip] = useState("all");
  const locationLat = useAppStore((s) => s.locationLat);
  const [locationDismissed, setLocationDismissed] = useState(false);
  const showLocationPrompt = !locationLat && !locationDismissed;
  const children = useAppStore((s) => s.children);

  // Filter by chip
  const activeCategories = useMemo(() => {
    const chip = CHIPS.find((c) => c.key === activeChip);
    if (!chip || chip.key === "all") return null;
    return chip.categories;
  }, [activeChip]);

  // Filter items
  const filterItems = (items: Item[]) => {
    let filtered = items;
    if (activeCategories) {
      filtered = filtered.filter((i) => activeCategories.includes(i.category as Category));
    }
    if (searchQuery.length >= 2) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
      );
    }
    return filtered;
  };

  const filteredFriendItems = useMemo(() => filterItems(friendItems), [friendItems, activeCategories, searchQuery]);
  const filteredNearbyItems = useMemo(() => filterItems(nearbyItems), [nearbyItems, activeCategories, searchQuery]);

  // Show family chips in size-relevant categories
  const showFamilyChips =
    children.length > 0 &&
    (activeChip === "kids" || activeChip === "clothing");

  if (loading && realFriendItems.length === 0 && realNearbyItems.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={warm.textMuted} />
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  const hasItems = filteredFriendItems.length > 0 || filteredNearbyItems.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        stickyHeaderIndices={[0]}
      >
        {/* Sticky header: search + chips */}
        <View style={styles.stickyHeader}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>{"\u{1F50D}"}</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="What are you looking for?"
              placeholderTextColor={warm.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Text style={styles.clearBtn}>{"\u2715"}</Text>
              </Pressable>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {CHIPS.map((chip) => (
              <Pressable
                key={chip.key}
                style={[
                  styles.chip,
                  activeChip === chip.key && styles.chipActive,
                ]}
                onPress={() => setActiveChip(chip.key)}
              >
                <Text
                  style={[
                    styles.chipText,
                    activeChip === chip.key && styles.chipTextActive,
                  ]}
                >
                  {chip.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Family chips (progressive disclosure) */}
          {showFamilyChips && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.familyChipRow}
            >
              {children.map((child) => (
                <View key={child.id} style={styles.familyChip}>
                  <Text style={styles.familyChipEmoji}>{child.emoji || "\uD83D\uDC76"}</Text>
                  <Text style={styles.familyChipName}>{child.name}</Text>
                </View>
              ))}
              <Pressable
                style={[styles.familyChip, styles.familyChipAdd]}
                onPress={() => router.push("/(tabs)/profile" as `/${string}`)}
              >
                <Text style={styles.familyChipAddText}>+ Add</Text>
              </Pressable>
            </ScrollView>
          )}
        </View>

        {/* Items feed */}
        {hasItems ? (
          <>
            {/* From your friends */}
            {filteredFriendItems.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>From your friends</Text>
                <ItemGrid items={filteredFriendItems} />
              </View>
            )}

            {/* Location prompt */}
            {showLocationPrompt && (
              <View style={styles.section}>
                <LocationPrompt
                  onComplete={() => setLocationDismissed(true)}
                  onDismiss={() => setLocationDismissed(true)}
                />
              </View>
            )}

            {/* Nearby */}
            {filteredNearbyItems.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Nearby</Text>
                <ItemGrid items={filteredNearbyItems} />
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Nothing here yet.</Text>
            <Text style={styles.emptySub}>
              Invite friends to start seeing{"\n"}things from people you trust.
            </Text>
            <Pressable
              style={styles.emptyButton}
              onPress={() => router.push("/(tabs)/friends" as `/${string}`)}
            >
              <Text style={styles.emptyButtonText}>Invite friends</Text>
            </Pressable>
          </View>
        )}

        {/* Safety */}
        <Pressable
          onPress={() => router.push("/legal/safety-and-privacy" as `/${string}`)}
          style={styles.safetyLink}
        >
          <Text style={styles.safetyLinkText}>
            {"\u{1F6E1}\uFE0F"} How we keep you safe
          </Text>
        </Pressable>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: warm.screenBg },
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Sticky header
  stickyHeader: {
    backgroundColor: warm.screenBg,
    paddingTop: 16,
    paddingBottom: 8,
  },

  // Search bar
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: warm.searchBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 12,
  },
  searchIcon: { fontSize: 16, marginRight: 8, color: warm.textMuted },
  searchInput: { flex: 1, fontSize: 16, color: warm.textDark },
  clearBtn: { fontSize: 14, color: warm.textMuted, padding: 4 },

  // Category chips
  chipRow: { gap: 8, paddingBottom: 8 },
  chip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: warm.chipBg,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: warm.chipActiveBg,
  },
  chipText: {
    fontSize: 14,
    color: warm.textDark,
  },
  chipTextActive: {
    color: "#FFFFFF",
  },

  // Family chips
  familyChipRow: { gap: 8, paddingBottom: 8, paddingTop: 4 },
  familyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.violet + "12",
    borderWidth: 1,
    borderColor: colors.violet + "25",
  },
  familyChipEmoji: { fontSize: 14 },
  familyChipName: { fontSize: 13, fontWeight: "600", color: colors.violet },
  familyChipAdd: {
    backgroundColor: warm.chipBg,
    borderColor: warm.divider,
  },
  familyChipAddText: { fontSize: 13, fontWeight: "600", color: warm.textMuted },

  // Sections
  section: { marginBottom: 8 },
  sectionLabel: {
    fontSize: 13,
    color: warm.textMuted,
    marginBottom: 8,
  },

  // Grid
  grid: { gap: 4 },
  gridRow: { flexDirection: "row", marginHorizontal: -6 },
  gridSpacer: { flex: 1, margin: 6 },

  // Empty state
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: warm.textDark,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 15,
    color: warm.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: "#F8F6F3",
    borderWidth: 1,
    borderColor: "#E5E2DE",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: warm.textDark,
  },

  // Safety
  safetyLink: { alignItems: "center", paddingVertical: 16, marginTop: 4 },
  safetyLinkText: { fontSize: 13, color: warm.textMuted, fontWeight: "500" },

  bottomSpacer: { height: 100 },
});
