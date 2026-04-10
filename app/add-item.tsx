import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { colors, gradientColors } from "../lib/colors";
import {
  CATEGORY_INFO,
  SIZE_OPTIONS,
  CONDITION_OPTIONS,
  BUNDLE_CATEGORIES,
  type Category,
  type CatalogEntry,
} from "../lib/itemCatalog";
import { useItemCatalog } from "../hooks/useItemCatalog";
import { useAppStore } from "../stores/appStore";
import Button from "../components/ui/Button";

// Generate simple unique ID
let idCounter = 0;
function makeId() {
  return `tg_${Date.now()}_${++idCounter}`;
}

export default function AddItemScreen() {
  const router = useRouter();
  const addToGoItem = useAppStore((s) => s.addToGoItem);
  const { searchSmart } = useItemCatalog();

  // State
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [query, setQuery] = useState("");
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [wantsBundle, setWantsBundle] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [added, setAdded] = useState(false);

  const searchInputRef = useRef<TextInput>(null);

  // Derived
  const sizeSystem = selectedCategory
    ? CATEGORY_INFO[selectedCategory]?.sizeSystem ?? "age-range"
    : "age-range";
  const sizeOptions = SIZE_OPTIONS[sizeSystem] ?? [];
  const defaultsToBundle = selectedCategory
    ? BUNDLE_CATEGORIES.includes(selectedCategory)
    : false;

  // Smart search: brand + product type results
  const suggestions = useMemo(() => {
    if (query.length < 2 || !selectedCategory) return [];
    return searchSmart(query, selectedCategory);
  }, [query, selectedCategory, searchSmart]);

  const handleSelectCategory = (cat: Category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(cat);
    setWantsBundle(BUNDLE_CATEGORIES.includes(cat));
    setQuery("");
    setSelectedName(null);
    setSelectedEmoji(null);
    setDescription("");
    setSelectedSize(null);
    setSelectedCondition(null);
    setTimeout(() => searchInputRef.current?.focus(), 300);
  };

  const handleSelectSuggestion = (entry: CatalogEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const fullName = entry.brand ? `${entry.brand} ${entry.name}` : entry.name;
    setSelectedName(fullName);
    setSelectedEmoji(entry.emoji);
    setQuery(fullName);
    setShowSuggestions(false);
  };

  const handleUseCustomName = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedName(query.trim());
    setSelectedEmoji(
      selectedCategory ? CATEGORY_INFO[selectedCategory]?.emoji ?? "\u{1F4E6}" : "\u{1F4E6}"
    );
    setShowSuggestions(false);
  };

  const handleAdd = () => {
    if (!selectedCategory || !selectedName || !selectedSize || !selectedCondition) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    addToGoItem({
      localId: makeId(),
      name: selectedName,
      emoji: selectedEmoji ?? "\u{1F4E6}",
      category: selectedCategory,
      ageRange: selectedSize,
      condition: selectedCondition,
      wantsBundle,
      description: description.trim() || undefined,
    });

    setAdded(true);
    setTimeout(() => {
      router.replace("/to-go");
    }, 600);
  };

  const isReady =
    selectedCategory && selectedName && selectedSize && selectedCondition;

  if (added) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.addedContainer}>
          <Text style={styles.addedEmoji}>{"\u2728"}</Text>
          <Text style={styles.addedTitle}>Added!</Text>
          <Text style={styles.addedName}>{selectedName}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{"\u2190"} Back</Text>
        </Pressable>

        <Text style={styles.title}>What are you adding?</Text>

        {/* Step 1: Category */}
        {selectedCategory ? (
          <Pressable
            style={styles.selectedCategoryRow}
            onPress={() => {
              setSelectedCategory(null);
              setQuery("");
              setSelectedName(null);
              setSelectedEmoji(null);
              setSelectedSize(null);
              setSelectedCondition(null);
            }}
          >
            <Text style={styles.selectedCategoryEmoji}>
              {CATEGORY_INFO[selectedCategory]?.emoji}
            </Text>
            <Text style={styles.selectedCategoryLabel}>{selectedCategory}</Text>
            <Text style={styles.selectedCategoryChange}>Change</Text>
          </Pressable>
        ) : (
          <View style={styles.categoryGrid}>
            {(Object.keys(CATEGORY_INFO) as Category[]).map((cat) => {
              const info = CATEGORY_INFO[cat];
              return (
                <TouchableOpacity
                  key={cat}
                  style={styles.categoryCard}
                  onPress={() => handleSelectCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryEmoji}>{info.emoji}</Text>
                  <Text style={styles.categoryLabel} numberOfLines={1}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Step 2: Item search */}
        {selectedCategory && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>What is it?</Text>
            <View style={styles.searchRow}>
              <Text style={styles.searchIcon}>{"\u{1F50D}"}</Text>
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder={`Search ${selectedCategory.toLowerCase()}...`}
                placeholderTextColor={colors.textLight}
                value={query}
                onChangeText={(t) => {
                  setQuery(t);
                  setShowSuggestions(t.length >= 2);
                  if (selectedName && t !== selectedName) {
                    setSelectedName(null);
                    setSelectedEmoji(null);
                  }
                }}
                autoCapitalize="words"
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setQuery("");
                    setShowSuggestions(false);
                    setSelectedName(null);
                  }}
                >
                  <Text style={styles.clearBtn}>{"\u2715"}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Suggestions */}
            {showSuggestions && query.length >= 2 && (
              <View style={styles.suggestionsBox}>
                <TouchableOpacity
                  style={styles.suggestionRow}
                  onPress={handleUseCustomName}
                  activeOpacity={0.6}
                >
                  <Text style={styles.suggestionEmoji}>{"\u2795"}</Text>
                  <Text style={styles.suggestionName}>Add "{query}"</Text>
                </TouchableOpacity>
                {suggestions.map((entry, idx) => (
                  <TouchableOpacity
                    key={`${entry.brand ?? ""}-${entry.name}-${idx}`}
                    style={styles.suggestionRow}
                    onPress={() => handleSelectSuggestion(entry)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.suggestionEmoji}>{entry.emoji}</Text>
                    <Text style={styles.suggestionName} numberOfLines={1}>
                      {entry.brand ? `${entry.brand} ` : ""}
                      {entry.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Selected item confirmation */}
            {selectedName && !showSuggestions && (
              <View style={styles.selectedItem}>
                <Text style={styles.selectedEmoji}>{selectedEmoji}</Text>
                <Text style={styles.selectedName}>{selectedName}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedName(null);
                    setSelectedEmoji(null);
                    setQuery("");
                    setTimeout(() => searchInputRef.current?.focus(), 100);
                  }}
                >
                  <Text style={styles.changeLink}>Change</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Optional description */}
        {selectedName && !showSuggestions && (
          <View style={styles.section}>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Any details? (color, model, notes)"
              placeholderTextColor={colors.textLight}
              value={description}
              onChangeText={setDescription}
              autoCapitalize="sentences"
              returnKeyType="done"
            />
          </View>
        )}

        {/* Step 3: Size */}
        {selectedName && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Size</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillRow}
            >
              {sizeOptions.map((size) => {
                const isActive = selectedSize === size;
                return isActive ? (
                  <Pressable key={size} onPress={() => setSelectedSize(size)}>
                    <LinearGradient
                      colors={gradientColors.button}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.pill}
                    >
                      <Text style={styles.pillTextActive}>{size}</Text>
                    </LinearGradient>
                  </Pressable>
                ) : (
                  <Pressable
                    key={size}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedSize(size);
                    }}
                    style={[styles.pill, styles.pillInactive]}
                  >
                    <Text style={styles.pillTextInactive}>{size}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Step 4: Condition */}
        {selectedSize && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Condition</Text>
            <View style={styles.conditionRow}>
              {CONDITION_OPTIONS.map((c) => {
                const isActive = selectedCondition === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.conditionChip, isActive && styles.conditionChipActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCondition(c);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.conditionText, isActive && styles.conditionTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 5: Bundle toggle */}
        {selectedCondition && (
          <View style={styles.section}>
            <Pressable
              style={styles.bundleToggleRow}
              onPress={() => setWantsBundle(!wantsBundle)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.bundleToggleLabel}>Bundle this?</Text>
                <Text style={styles.bundleToggleHint}>
                  Group with similar items by size
                </Text>
              </View>
              <View style={[styles.toggleTrack, wantsBundle && styles.toggleTrackOn]}>
                <View style={[styles.toggleThumb, wantsBundle && styles.toggleThumbOn]} />
              </View>
            </Pressable>
          </View>
        )}

        {/* Add button */}
        {isReady && (
          <Button
            variant="primary"
            size="lg"
            title={`Add ${selectedEmoji ?? ""} ${selectedName}`}
            onPress={handleAdd}
            style={styles.addBtn}
          />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  backBtn: { alignSelf: "flex-start", paddingVertical: 8, marginBottom: 8 },
  backText: { fontSize: 16, color: colors.neonPurple, fontWeight: "600" },
  title: { fontSize: 24, fontWeight: "700", color: colors.text, marginBottom: 16 },

  // Category grid
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  categoryCard: {
    width: "30%",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryEmoji: { fontSize: 24, marginBottom: 4 },
  categoryLabel: { fontSize: 11, fontWeight: "600", color: colors.textMuted },
  selectedCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.neonPurple + "10",
    borderWidth: 1,
    borderColor: colors.neonPurple,
    marginBottom: 20,
  },
  selectedCategoryEmoji: { fontSize: 22 },
  selectedCategoryLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.neonPurple,
  },
  selectedCategoryChange: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neonPurple,
  },

  // Sections
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },

  // Search
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 12,
  },
  clearBtn: { fontSize: 14, color: colors.textMuted, padding: 4 },

  // Suggestions
  suggestionsBox: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: "hidden",
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionEmoji: { fontSize: 18 },
  suggestionName: { flex: 1, fontSize: 15, fontWeight: "500", color: colors.text },

  // Selected item
  selectedItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.neonGreen + "15",
    borderWidth: 1,
    borderColor: colors.neonGreen + "40",
  },
  selectedEmoji: { fontSize: 22 },
  selectedName: { flex: 1, fontSize: 16, fontWeight: "600", color: colors.text },
  changeLink: { fontSize: 14, fontWeight: "600", color: colors.neonPurple },

  // Description
  descriptionInput: {
    fontSize: 15,
    color: colors.text,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },

  // Pills
  pillRow: { gap: 8 },
  pill: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 },
  pillInactive: { backgroundColor: "#F0F0ED" },
  pillTextActive: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  pillTextInactive: { fontSize: 14, fontWeight: "600", color: colors.textMuted },

  // Condition
  conditionRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  conditionChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F0F0ED",
  },
  conditionChipActive: {
    backgroundColor: colors.neonPurple + "20",
    borderWidth: 1,
    borderColor: colors.neonPurple,
  },
  conditionText: { fontSize: 14, fontWeight: "600", color: colors.textMuted },
  conditionTextActive: { color: colors.neonPurple },

  // Bundle toggle
  bundleToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bundleToggleLabel: { fontSize: 15, fontWeight: "600", color: colors.text },
  bundleToggleHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#E5E5E3",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleTrackOn: { backgroundColor: colors.neonPurple },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
  },
  toggleThumbOn: { alignSelf: "flex-end" },

  // Add button
  addBtn: { width: "100%", marginTop: 8 },

  // Added state
  addedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addedEmoji: { fontSize: 48 },
  addedTitle: { fontSize: 24, fontWeight: "700", color: colors.neonGreen },
  addedName: { fontSize: 16, color: colors.textMuted },
});
