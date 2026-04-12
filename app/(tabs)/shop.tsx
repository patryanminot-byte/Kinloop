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
import GradientText from "../../components/ui/GradientText";
import { useAuth } from "../../hooks/useAuth";
import { useShop } from "../../hooks/useShop";
import { useAppStore } from "../../stores/appStore";
import LocationPrompt from "../../components/LocationPrompt";
import { CATEGORY_INFO, type Category } from "../../lib/itemCatalog";

// ─── Top-level browse tiles ─────────────────────────────────────────────────

interface BrowseTile {
  key: string;
  label: string;
  emoji: string;
  categories: Category[];
}

const BROWSE_TILES: BrowseTile[] = [
  {
    key: "kids",
    label: "Kids",
    emoji: "\uD83D\uDC76",
    categories: [
      "Clothing", "Shoes", "Outerwear", "Strollers", "Car Seats",
      "Gear", "Feeding", "Toys", "Books", "Furniture", "Sleep", "Bath", "Safety",
    ],
  },
  {
    key: "home",
    label: "Home",
    emoji: "\uD83C\uDFE0",
    categories: ["Home Furniture", "Appliances", "Home Decor"],
  },
  {
    key: "clothing",
    label: "Clothing",
    emoji: "\uD83D\uDC55",
    categories: ["Fashion"],
  },
  {
    key: "electronics",
    label: "Electronics",
    emoji: "\uD83D\uDCF1",
    categories: ["Electronics", "Gaming"],
  },
  {
    key: "outdoor",
    label: "Outdoor",
    emoji: "\uD83C\uDF33",
    categories: ["Outdoor", "Sports & Fitness", "Garden & Patio"],
  },
  {
    key: "more",
    label: "More",
    emoji: "\u00B7\u00B7\u00B7",
    categories: ["Tools", "Instruments", "Auto & Moto", "Office", "Free Stuff"],
  },
];

// ─── Mock data ──────────────────────────────────────────────────────────────

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
    category: "Strollers",
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
];

// ─── Distance brackets ──────────────────────────────────────────────────────

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
    (a, b) => (a.distanceMinutes ?? 999) - (b.distanceMinutes ?? 999)
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

// ─── Search mapping: "stroller" → Kids > Strollers ──────────────────────────

function findCategoryBySearch(query: string): Category | null {
  const q = query.toLowerCase();
  const allCats = Object.keys(CATEGORY_INFO) as Category[];
  return allCats.find((cat) => cat.toLowerCase().includes(q)) ?? null;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function BrowseScreen() {
  const router = useRouter();
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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTile, setSelectedTile] = useState<BrowseTile | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<Category | null>(null);
  const locationLat = useAppStore((s) => s.locationLat);
  const [locationDismissed, setLocationDismissed] = useState(false);
  const showLocationPrompt = !locationLat && !locationDismissed;
  const children = useAppStore((s) => s.children);

  // Active category filter (from tile + subcategory or search)
  const activeCategories: Category[] | null = useMemo(() => {
    if (selectedSubCategory) return [selectedSubCategory];
    if (selectedTile) return selectedTile.categories;
    if (searchQuery.length >= 2) {
      const match = findCategoryBySearch(searchQuery);
      return match ? [match] : null;
    }
    return null;
  }, [selectedTile, selectedSubCategory, searchQuery]);

  const filteredFriendItems = useMemo(() => {
    if (!activeCategories) return friendItems;
    return friendItems.filter((i) => activeCategories.includes(i.category as Category));
  }, [friendItems, activeCategories]);

  const filteredNearbyItems = useMemo(() => {
    if (!activeCategories) return nearbyItems;
    return nearbyItems.filter((i) => activeCategories.includes(i.category as Category));
  }, [nearbyItems, activeCategories]);

  // Text search across item names
  const textFilteredFriendItems = useMemo(() => {
    if (searchQuery.length < 2 || activeCategories) return filteredFriendItems;
    const q = searchQuery.toLowerCase();
    return friendItems.filter((i) => i.name.toLowerCase().includes(q));
  }, [filteredFriendItems, friendItems, searchQuery, activeCategories]);

  const textFilteredNearbyItems = useMemo(() => {
    if (searchQuery.length < 2 || activeCategories) return filteredNearbyItems;
    const q = searchQuery.toLowerCase();
    return nearbyItems.filter((i) => i.name.toLowerCase().includes(q));
  }, [filteredNearbyItems, nearbyItems, searchQuery, activeCategories]);

  const nearbyGroups = useMemo(
    () => groupByDistance(textFilteredNearbyItems),
    [textFilteredNearbyItems]
  );

  const showResults = selectedTile || selectedSubCategory || searchQuery.length >= 2;

  if (loading && realFriendItems.length === 0 && realNearbyItems.length === 0) {
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text style={styles.title}>What are you looking for?</Text>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>{"\u{1F50D}"}</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={(t) => {
              setSearchQuery(t);
              if (t.length === 0) {
                setSelectedTile(null);
                setSelectedSubCategory(null);
              }
            }}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => {
                setSearchQuery("");
                setSelectedTile(null);
                setSelectedSubCategory(null);
              }}
            >
              <Text style={styles.clearBtn}>{"\u2715"}</Text>
            </Pressable>
          )}
        </View>

        {/* Category tiles */}
        {!showResults && (
          <View style={styles.tileGrid}>
            {BROWSE_TILES.map((tile) => (
              <Pressable
                key={tile.key}
                style={styles.tile}
                onPress={() => {
                  setSelectedTile(tile);
                  setSelectedSubCategory(null);
                  setSearchQuery("");
                }}
              >
                <Text style={styles.tileEmoji}>{tile.emoji}</Text>
                <Text style={styles.tileLabel}>{tile.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Subcategory chips (when a tile is selected) */}
        {selectedTile && !selectedSubCategory && (
          <>
            <Pressable
              style={styles.breadcrumb}
              onPress={() => setSelectedTile(null)}
            >
              <Text style={styles.breadcrumbText}>
                {"\u2190"} All categories
              </Text>
            </Pressable>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subChipRow}
            >
              <Pressable
                style={[styles.subChip, styles.subChipActive]}
                onPress={() => setSelectedSubCategory(null)}
              >
                <Text style={[styles.subChipText, styles.subChipTextActive]}>
                  All {selectedTile.label}
                </Text>
              </Pressable>
              {selectedTile.categories.map((cat) => (
                <Pressable
                  key={cat}
                  style={styles.subChip}
                  onPress={() => setSelectedSubCategory(cat)}
                >
                  <Text style={styles.subChipText}>{cat}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {/* Selected subcategory header */}
        {selectedSubCategory && (
          <Pressable
            style={styles.breadcrumb}
            onPress={() => setSelectedSubCategory(null)}
          >
            <Text style={styles.breadcrumbText}>
              {"\u2190"} {selectedTile?.label} {"\u203A"} {selectedSubCategory}
            </Text>
          </Pressable>
        )}

        {/* Family member chips */}
        {showResults && children.length > 0 && (
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

        {/* Results */}
        {showResults && (
          <>
            {/* Friends section */}
            {textFilteredFriendItems.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {"\u2661"} From friends ({textFilteredFriendItems.length})
                </Text>
                <ItemGrid items={textFilteredFriendItems} />
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

            {/* Nearby section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {"\u25C9"} Nearby ({textFilteredNearbyItems.length})
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
                    {selectedSubCategory
                      ? ` in ${selectedSubCategory}`
                      : selectedTile
                        ? ` in ${selectedTile.label}`
                        : ""}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Safety link */}
        <Pressable
          onPress={() =>
            router.push("/legal/safety-and-privacy" as `/${string}`)
          }
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
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },

  // Search bar
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 12,
  },
  clearBtn: { fontSize: 14, color: colors.textMuted, padding: 4 },

  // Tile grid (6 tiles, 3x2)
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  tile: {
    width: "30%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  tileEmoji: { fontSize: 28 },
  tileLabel: { fontSize: 13, fontWeight: "600", color: colors.text },

  // Breadcrumb
  breadcrumb: { marginBottom: 12 },
  breadcrumbText: { fontSize: 15, color: colors.violet, fontWeight: "600" },

  // Subcategory chips
  subChipRow: { gap: 8, marginBottom: 16, paddingRight: 20 },
  subChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subChipActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  subChipText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  subChipTextActive: { color: "#FFFFFF" },

  // Family chips
  familyChipRow: { gap: 8, marginBottom: 16, paddingRight: 20 },
  familyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.violet + "15",
    borderWidth: 1,
    borderColor: colors.violet + "30",
  },
  familyChipEmoji: { fontSize: 16 },
  familyChipName: { fontSize: 13, fontWeight: "600", color: colors.violet },
  familyChipAdd: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  familyChipAddText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },

  // Sections
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },

  // Grid
  grid: { gap: 0 },
  gridRow: { flexDirection: "row", marginHorizontal: -6 },
  gridSpacer: { flex: 1, margin: 6 },

  // Distance groups
  distanceGroup: { marginBottom: 8 },
  distanceHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 4,
    gap: 10,
  },
  distanceLine: { flex: 1, height: 1, backgroundColor: colors.border },
  distanceLabel: { fontSize: 13, fontWeight: "600", color: colors.textMuted },

  // Empty
  emptySection: { alignItems: "center", paddingVertical: 24 },
  emptySectionText: { fontSize: 14, color: colors.textLight },

  // Safety
  safetyLink: { alignItems: "center", paddingVertical: 16, marginTop: 4 },
  safetyLinkText: { fontSize: 13, color: colors.textMuted, fontWeight: "500" },

  bottomSpacer: { height: 100 },
});
