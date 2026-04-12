import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  Image,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../lib/colors";
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

// ─── Warm palette ──────────────────────────────────────────────────────────

const warm = {
  textDark: "#1A1A1A",
  textMuted: "#8E8E93",
  screenBg: "#FAFAF8",
  cardBg: "#FFFFFF",
  divider: "#E5E2DE",
  photoBg: "#F5F3F0",
  photoBorder: "#D5D0CB",
  accent: colors.violet,
};

const SCREEN_WIDTH = Dimensions.get("window").width;
const PHOTO_SIZE = Math.floor((SCREEN_WIDTH - 48 - 16) / 3); // 24px margins, 8px gaps

// ─── Top-level category tiles ──────────────────────────────────────────────

interface TopCategory {
  key: string;
  label: string;
  emoji: string;
  children: Category[];
}

const TOP_CATEGORIES: TopCategory[] = [
  {
    key: "kids",
    label: "Kids",
    emoji: "\uD83D\uDC76",
    children: [
      "Clothing", "Shoes", "Outerwear", "Strollers", "Car Seats",
      "Gear", "Feeding", "Toys", "Books", "Furniture", "Sleep", "Bath", "Safety",
    ],
  },
  { key: "home", label: "Home", emoji: "\uD83C\uDFE0", children: ["Home Furniture", "Appliances", "Home Decor"] },
  { key: "clothing", label: "Clothing", emoji: "\uD83D\uDC55", children: ["Fashion"] },
  { key: "electronics", label: "Electronics", emoji: "\uD83D\uDCF1", children: ["Electronics", "Gaming"] },
  { key: "outdoor", label: "Outdoor", emoji: "\uD83C\uDF33", children: ["Outdoor", "Sports & Fitness", "Garden & Patio"] },
  { key: "more", label: "More", emoji: "\u00B7\u00B7\u00B7", children: ["Tools", "Instruments", "Auto & Moto", "Office", "Free Stuff"] },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

let idCounter = 0;
function makeId() {
  return `tg_${Date.now()}_${++idCounter}`;
}

type PricingMode = "free" | "pay-what-feels-fair" | "set-price";

// Categories where size isn't relevant
const NO_SIZE_CATEGORIES: Category[] = [
  "Toys", "Books", "Electronics", "Home Furniture", "Appliances",
  "Home Decor", "Instruments", "Office", "Gaming", "Free Stuff",
  "Tools", "Auto & Moto", "Safety",
];

// ─── Component ─────────────────────────────────────────────────────────────

export default function AddItemScreen() {
  const router = useRouter();
  const addToGoItem = useAppStore((s) => s.addToGoItem);
  const { searchSmart } = useItemCatalog();

  // State
  const [photos, setPhotos] = useState<string[]>([]);
  const [itemName, setItemName] = useState("");
  const [selectedTopCategory, setSelectedTopCategory] = useState<TopCategory | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [pricingMode, setPricingMode] = useState<PricingMode>("pay-what-feels-fair");
  const [customPrice, setCustomPrice] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [done, setDone] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  // Derived
  const showSize = selectedCategory && !NO_SIZE_CATEGORIES.includes(selectedCategory);
  const sizeSystem = selectedCategory
    ? CATEGORY_INFO[selectedCategory]?.sizeSystem ?? "age-range"
    : "age-range";
  const sizeOptions = SIZE_OPTIONS[sizeSystem] ?? [];

  const suggestions = useMemo(() => {
    if (itemName.length < 2) return [];
    if (selectedCategory) return searchSmart(itemName, selectedCategory);
    // Search across all categories
    const results: CatalogEntry[] = [];
    for (const top of TOP_CATEGORIES) {
      for (const cat of top.children) {
        results.push(...searchSmart(itemName, cat));
        if (results.length >= 8) return results.slice(0, 8);
      }
    }
    return results.slice(0, 8);
  }, [itemName, selectedCategory, searchSmart]);

  const hasEdits = itemName.length > 0 || photos.length > 0 || selectedCategory !== null;
  const canSubmit = itemName.trim().length > 0;

  // Category display string
  const categoryDisplay = selectedCategory
    ? (() => {
        const top = TOP_CATEGORIES.find((t) => t.children.includes(selectedCategory));
        return top ? `${top.label} > ${selectedCategory}` : selectedCategory;
      })()
    : null;

  // ─── Photo handling ──────────────────────────────────────────────────────

  const addPhoto = () => {
    Alert.alert("Add Photo", "Choose an option", [
      {
        text: "Take Photo",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") { Alert.alert("Permission needed", "Camera access is required."); return; }
          const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] });
          if (!result.canceled && result.assets[0]) {
            setPhotos((prev) => [...prev, result.assets[0].uri].slice(0, 5));
          }
        },
      },
      {
        text: "Choose from Library",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true, aspect: [1, 1],
          });
          if (!result.canceled && result.assets[0]) {
            setPhotos((prev) => [...prev, result.assets[0].uri].slice(0, 5));
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Category selection ──────────────────────────────────────────────────

  const handleSelectTopCategory = (top: TopCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (top.children.length === 1) {
      setSelectedCategory(top.children[0]);
      setSelectedTopCategory(null);
      setShowCategoryPicker(false);
    } else {
      setSelectedTopCategory(top);
    }
  };

  const handleSelectSubCategory = (cat: Category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(cat);
    setSelectedTopCategory(null);
    setShowCategoryPicker(false);
    setSelectedSize(null);
  };

  // ─── Suggestion selection ────────────────────────────────────────────────

  const handleSelectSuggestion = (entry: CatalogEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const fullName = entry.brand ? `${entry.brand} ${entry.name}` : entry.name;
    setItemName(fullName);
    if (!selectedCategory) {
      setSelectedCategory(entry.category);
    }
    setShowSuggestions(false);
  };

  // ─── Submit ──────────────────────────────────────────────────────────────

  const handleCancel = () => {
    if (hasEdits) {
      Alert.alert("Discard this listing?", "", [
        { text: "Keep editing", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  const handleList = () => {
    if (!canSubmit) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const category = selectedCategory ?? "Free Stuff";
    const emoji = selectedCategory ? CATEGORY_INFO[selectedCategory]?.emoji ?? "\u{1F4E6}" : "\u{1F4E6}";

    addToGoItem({
      localId: makeId(),
      name: itemName.trim(),
      emoji,
      category,
      ageRange: selectedSize ?? "One size",
      condition: selectedCondition ?? "Good",
      wantsBundle: selectedCategory ? BUNDLE_CATEGORIES.includes(selectedCategory) : false,
      description: note.trim() || undefined,
      photoUri: photos[0] ?? undefined,
      pricingType: pricingMode === "free" ? "free" : pricingMode === "set-price" ? "set-price" : "give-what-you-can",
      pricingAmount: pricingMode === "set-price" && customPrice ? Number(customPrice) : undefined,
    });

    setDone(true);
  };

  const resetForm = () => {
    setPhotos([]);
    setItemName("");
    setSelectedTopCategory(null);
    setSelectedCategory(null);
    setSelectedSize(null);
    setSelectedCondition(null);
    setNote("");
    setPricingMode("pay-what-feels-fair");
    setCustomPrice("");
    setShowSuggestions(false);
    setShowCategoryPicker(false);
    setShowSizePicker(false);
    setDone(false);
  };

  // ========================
  // DONE STATE
  // ========================
  if (done) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.doneContainer}>
          <Text style={styles.doneCheck}>{"\u2713"}</Text>
          <Text style={styles.doneTitle}>We'll find the right match.</Text>
          <View style={styles.doneButtons}>
            <Pressable style={styles.doneButtonPrimary} onPress={resetForm}>
              <Text style={styles.doneButtonPrimaryText}>List another</Text>
            </Pressable>
            <Pressable
              style={styles.doneButtonSecondary}
              onPress={() => router.replace("/(tabs)/" as `/${string}`)}
            >
              <Text style={styles.doneButtonSecondaryText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ========================
  // SINGLE-SCREEN FORM
  // ========================
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleCancel} hitSlop={12}>
          <Text style={styles.headerCancel}>{"\u2190"} Cancel</Text>
        </Pressable>
        <Pressable onPress={handleList} disabled={!canSubmit} hitSlop={12}>
          <Text style={[styles.headerList, !canSubmit && styles.headerListDisabled]}>
            List it {"\u2192"}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Photo Row ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photoRow}
        >
          {photos.map((uri, i) => (
            <Pressable key={uri} onPress={() => removePhoto(i)}>
              <Image source={{ uri }} style={styles.photoFilled} />
              <View style={styles.photoRemoveBadge}>
                <Text style={styles.photoRemoveX}>{"\u2715"}</Text>
              </View>
            </Pressable>
          ))}
          {photos.length < 5 && (
            <Pressable style={styles.photoPlaceholder} onPress={addPhoto}>
              <Text style={styles.photoPlaceholderIcon}>
                {photos.length === 0 ? "\u{1F4F7}" : "+"}
              </Text>
            </Pressable>
          )}
          {photos.length === 0 && (
            <>
              <Pressable style={styles.photoPlaceholder} onPress={addPhoto}>
                <Text style={styles.photoPlaceholderPlus}>+</Text>
              </Pressable>
              <Pressable style={styles.photoPlaceholder} onPress={addPhoto}>
                <Text style={styles.photoPlaceholderPlus}>+</Text>
              </Pressable>
            </>
          )}
        </ScrollView>

        {/* ── What is it? ── */}
        <View style={styles.fieldGroup}>
          <TextInput
            ref={searchInputRef}
            style={styles.nameInput}
            placeholder="What is it?"
            placeholderTextColor={warm.textMuted}
            value={itemName}
            onChangeText={(t) => {
              setItemName(t);
              setShowSuggestions(t.length >= 2);
            }}
            autoCapitalize="words"
            returnKeyType="done"
          />
          <View style={styles.fieldDivider} />

          {/* Autocomplete suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsBox}>
              {suggestions.map((entry, idx) => (
                <Pressable
                  key={`${entry.brand ?? ""}-${entry.name}-${idx}`}
                  style={styles.suggestionRow}
                  onPress={() => handleSelectSuggestion(entry)}
                >
                  <Text style={styles.suggestionEmoji}>{entry.emoji}</Text>
                  <View style={styles.suggestionInfo}>
                    <Text style={styles.suggestionName} numberOfLines={1}>
                      {entry.brand ? `${entry.brand} ` : ""}{entry.name}
                    </Text>
                    <Text style={styles.suggestionCategory}>{entry.category}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* ── Category ── */}
        <View style={styles.fieldGroup}>
          <Pressable
            style={styles.fieldRow}
            onPress={() => { setShowCategoryPicker(!showCategoryPicker); setSelectedTopCategory(null); }}
          >
            <Text style={styles.fieldLabel}>Category</Text>
            {categoryDisplay ? (
              <Text style={[styles.fieldValue, styles.fieldValueAutoFilled]}>{categoryDisplay}</Text>
            ) : (
              <Text style={styles.fieldValuePlaceholder}>Select</Text>
            )}
            <Text style={styles.chevron}>{"\u203A"}</Text>
          </Pressable>
          <View style={styles.fieldDivider} />

          {/* Category picker inline */}
          {showCategoryPicker && !selectedTopCategory && (
            <View style={styles.pickerGrid}>
              {TOP_CATEGORIES.map((top) => (
                <Pressable
                  key={top.key}
                  style={styles.pickerTile}
                  onPress={() => handleSelectTopCategory(top)}
                >
                  <Text style={styles.pickerTileEmoji}>{top.emoji}</Text>
                  <Text style={styles.pickerTileLabel}>{top.label}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Subcategory chips */}
          {showCategoryPicker && selectedTopCategory && (
            <View style={styles.subCatContainer}>
              <Pressable onPress={() => setSelectedTopCategory(null)}>
                <Text style={styles.subCatBack}>{"\u2190"} {selectedTopCategory.label}</Text>
              </Pressable>
              <View style={styles.subCatChips}>
                {selectedTopCategory.children.map((cat) => (
                  <Pressable
                    key={cat}
                    style={styles.subCatChip}
                    onPress={() => handleSelectSubCategory(cat)}
                  >
                    <Text style={styles.subCatChipEmoji}>{CATEGORY_INFO[cat]?.emoji ?? "\u{1F4E6}"}</Text>
                    <Text style={styles.subCatChipLabel}>{cat}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* ── Size ── */}
        {showSize && (
          <View style={styles.fieldGroup}>
            <Pressable
              style={styles.fieldRow}
              onPress={() => setShowSizePicker(!showSizePicker)}
            >
              <Text style={styles.fieldLabel}>Size</Text>
              {selectedSize ? (
                <Text style={styles.fieldValue}>{selectedSize}</Text>
              ) : (
                <Text style={styles.fieldValuePlaceholder}>Select</Text>
              )}
              <Text style={styles.chevron}>{"\u203A"}</Text>
            </Pressable>
            <View style={styles.fieldDivider} />

            {showSizePicker && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sizeRow}
              >
                {sizeOptions.map((size) => (
                  <Pressable
                    key={size}
                    style={[styles.sizePill, selectedSize === size && styles.sizePillActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedSize(size);
                      setShowSizePicker(false);
                    }}
                  >
                    <Text style={[styles.sizePillText, selectedSize === size && styles.sizePillTextActive]}>
                      {size}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* ── Condition ── */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Condition</Text>
            <View style={styles.conditionSegment}>
              {CONDITION_OPTIONS.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.conditionOption, selectedCondition === c && styles.conditionOptionActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCondition(c);
                  }}
                >
                  <Text style={[styles.conditionOptionText, selectedCondition === c && styles.conditionOptionTextActive]}>
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.fieldDivider} />
        </View>

        {/* ── Note ── */}
        <View style={styles.fieldGroup}>
          <TextInput
            style={styles.noteInput}
            placeholder="Add a note"
            placeholderTextColor={warm.textMuted}
            value={note}
            onChangeText={setNote}
            autoCapitalize="sentences"
            returnKeyType="done"
          />
          <View style={styles.fieldDivider} />
        </View>

        {/* ── Price ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.priceLabel}>Price</Text>
          <View style={styles.priceOptions}>
            {(["free", "pay-what-feels-fair", "set-price"] as PricingMode[]).map((mode) => {
              const isActive = pricingMode === mode;
              const label = mode === "free" ? "Free" : mode === "pay-what-feels-fair" ? "Pay what's fair" : "Set price";
              return (
                <Pressable
                  key={mode}
                  style={styles.priceRow}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPricingMode(mode);
                  }}
                >
                  <View style={[styles.radioOuter, isActive && styles.radioOuterActive]}>
                    {isActive && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[styles.priceRowText, isActive && styles.priceRowTextActive]}>{label}</Text>
                  {mode === "set-price" && isActive && (
                    <TextInput
                      style={styles.priceAmountInput}
                      placeholder="$"
                      placeholderTextColor={warm.textMuted}
                      value={customPrice}
                      onChangeText={setCustomPrice}
                      keyboardType="numeric"
                      returnKeyType="done"
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: warm.screenBg },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 8 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: warm.divider,
  },
  headerCancel: {
    fontSize: 16,
    fontWeight: "500",
    color: warm.textDark,
  },
  headerList: {
    fontSize: 16,
    fontWeight: "600",
    color: warm.accent,
  },
  headerListDisabled: {
    opacity: 0.35,
  },

  // Photo row
  photoRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 16,
  },
  photoPlaceholder: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 12,
    backgroundColor: warm.photoBg,
    borderWidth: 1.5,
    borderColor: warm.photoBorder,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderIcon: {
    fontSize: 24,
    color: warm.textMuted,
  },
  photoPlaceholderPlus: {
    fontSize: 20,
    color: warm.textMuted,
  },
  photoFilled: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 12,
  },
  photoRemoveBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: warm.textDark,
    alignItems: "center",
    justifyContent: "center",
  },
  photoRemoveX: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // Fields
  fieldGroup: {
    marginBottom: 4,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  fieldLabel: {
    fontSize: 16,
    color: warm.textDark,
    width: 90,
  },
  fieldValue: {
    flex: 1,
    fontSize: 16,
    color: warm.textDark,
    textAlign: "right",
  },
  fieldValueAutoFilled: {
    color: warm.accent,
  },
  fieldValuePlaceholder: {
    flex: 1,
    fontSize: 16,
    color: warm.textMuted,
    textAlign: "right",
  },
  chevron: {
    fontSize: 20,
    color: warm.textMuted,
    marginLeft: 8,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: warm.divider,
  },

  // Name input
  nameInput: {
    fontSize: 16,
    color: warm.textDark,
    paddingVertical: 14,
  },

  // Suggestions
  suggestionsBox: {
    backgroundColor: warm.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: warm.divider,
    overflow: "hidden",
    marginBottom: 8,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: warm.divider,
  },
  suggestionEmoji: { fontSize: 18 },
  suggestionInfo: { flex: 1 },
  suggestionName: { fontSize: 15, fontWeight: "500", color: warm.textDark },
  suggestionCategory: { fontSize: 12, color: warm.textMuted, marginTop: 1 },

  // Category picker
  pickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingVertical: 12,
  },
  pickerTile: {
    width: "30%",
    aspectRatio: 1.2,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: warm.cardBg,
    borderWidth: 1,
    borderColor: warm.divider,
    gap: 4,
  },
  pickerTileEmoji: { fontSize: 24 },
  pickerTileLabel: { fontSize: 13, fontWeight: "600", color: warm.textDark },

  // Subcategory
  subCatContainer: { paddingVertical: 12, gap: 10 },
  subCatBack: { fontSize: 15, fontWeight: "600", color: warm.accent },
  subCatChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  subCatChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: warm.cardBg,
    borderWidth: 1,
    borderColor: warm.divider,
  },
  subCatChipEmoji: { fontSize: 16 },
  subCatChipLabel: { fontSize: 14, fontWeight: "500", color: warm.textDark },

  // Size pills
  sizeRow: { gap: 8, paddingVertical: 12 },
  sizePill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: warm.photoBg,
  },
  sizePillActive: {
    backgroundColor: warm.accent,
  },
  sizePillText: {
    fontSize: 14,
    fontWeight: "600",
    color: warm.textMuted,
  },
  sizePillTextActive: {
    color: "#FFFFFF",
  },

  // Condition
  conditionSegment: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "flex-end",
  },
  conditionOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: warm.photoBg,
  },
  conditionOptionActive: {
    backgroundColor: warm.accent + "20",
    borderWidth: 1,
    borderColor: warm.accent,
  },
  conditionOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: warm.textMuted,
  },
  conditionOptionTextActive: {
    color: warm.accent,
  },

  // Note
  noteInput: {
    fontSize: 16,
    color: warm.textDark,
    paddingVertical: 14,
  },

  // Price
  priceLabel: {
    fontSize: 16,
    color: warm.textDark,
    paddingTop: 14,
    marginBottom: 8,
  },
  priceOptions: { gap: 4 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: warm.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: warm.accent,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: warm.accent,
  },
  priceRowText: {
    fontSize: 16,
    color: warm.textDark,
  },
  priceRowTextActive: {
    fontWeight: "600",
  },
  priceAmountInput: {
    fontSize: 16,
    color: warm.textDark,
    borderBottomWidth: 1,
    borderBottomColor: warm.divider,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 60,
  },

  // Done
  doneContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  doneCheck: {
    fontSize: 48,
    color: colors.eucalyptus,
    fontWeight: "300",
  },
  doneTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: warm.textDark,
    textAlign: "center",
  },
  doneButtons: {
    flexDirection: "row",
    marginTop: 20,
    gap: 12,
  },
  doneButtonPrimary: {
    backgroundColor: warm.accent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  doneButtonPrimaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  doneButtonSecondary: {
    backgroundColor: warm.screenBg,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1.5,
    borderColor: warm.accent,
  },
  doneButtonSecondaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: warm.accent,
  },
});
