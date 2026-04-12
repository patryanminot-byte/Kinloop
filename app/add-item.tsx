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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
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

// ─── Top-level category tiles ───────────────────────────────────────────────

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
      "Clothing",
      "Shoes",
      "Outerwear",
      "Strollers",
      "Car Seats",
      "Gear",
      "Feeding",
      "Toys",
      "Books",
      "Furniture",
      "Sleep",
      "Bath",
      "Safety",
    ],
  },
  {
    key: "home",
    label: "Home",
    emoji: "\uD83C\uDFE0",
    children: [
      "Home Furniture",
      "Appliances",
      "Home Decor",
    ],
  },
  {
    key: "clothing",
    label: "Clothing",
    emoji: "\uD83D\uDC55",
    children: ["Fashion"],
  },
  {
    key: "electronics",
    label: "Electronics",
    emoji: "\uD83D\uDCF1",
    children: ["Electronics", "Gaming"],
  },
  {
    key: "outdoor",
    label: "Outdoor",
    emoji: "\uD83C\uDF33",
    children: ["Outdoor", "Sports & Fitness", "Garden & Patio"],
  },
  {
    key: "more",
    label: "More",
    emoji: "\u00B7\u00B7\u00B7",
    children: [
      "Tools",
      "Instruments",
      "Auto & Moto",
      "Office",
      "Free Stuff",
    ],
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

let idCounter = 0;
function makeId() {
  return `tg_${Date.now()}_${++idCounter}`;
}

// ─── Price slider positions ─────────────────────────────────────────────────

type PricingMode = "free" | "pay-what-feels-fair" | "set-price";

// ─── Component ──────────────────────────────────────────────────────────────

export default function AddItemScreen() {
  const router = useRouter();
  const addToGoItem = useAppStore((s) => s.addToGoItem);
  const { searchSmart } = useItemCatalog();

  // Steps: "camera" → "details" → "done"
  const [step, setStep] = useState<"camera" | "details" | "done">("camera");

  // Photo
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Details
  const [selectedTopCategory, setSelectedTopCategory] = useState<TopCategory | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [query, setQuery] = useState("");
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [pricingMode, setPricingMode] = useState<PricingMode>("pay-what-feels-fair");
  const [customPrice, setCustomPrice] = useState("");
  const [wantsBundle, setWantsBundle] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  // Derived
  const sizeSystem = selectedCategory
    ? CATEGORY_INFO[selectedCategory]?.sizeSystem ?? "age-range"
    : "age-range";
  const sizeOptions = SIZE_OPTIONS[sizeSystem] ?? [];

  const suggestions = useMemo(() => {
    if (query.length < 2 || !selectedCategory) return [];
    return searchSmart(query, selectedCategory);
  }, [query, selectedCategory, searchSmart]);

  // ─── Camera step ────────────────────────────────────────────────────────

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setStep("details");
    }
  };

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setStep("details");
    }
  };

  const skipPhoto = () => {
    setStep("details");
  };

  // ─── Details helpers ──────────────────────────────────────────────────

  const handleSelectTopCategory = (top: TopCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (top.children.length === 1) {
      setSelectedTopCategory(top);
      setSelectedCategory(top.children[0]);
      setWantsBundle(BUNDLE_CATEGORIES.includes(top.children[0]));
      setTimeout(() => searchInputRef.current?.focus(), 300);
    } else {
      setSelectedTopCategory(top);
    }
  };

  const handleSelectSubCategory = (cat: Category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(cat);
    setWantsBundle(BUNDLE_CATEGORIES.includes(cat));
    setQuery("");
    setSelectedName(null);
    setSelectedEmoji(null);
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

  const handleList = () => {
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
      description: note.trim() || undefined,
      photoUri: photoUri ?? undefined,
      pricingType: pricingMode === "free" ? "free" : pricingMode === "set-price" ? "set-price" : "give-what-you-can",
      pricingAmount: pricingMode === "set-price" && customPrice ? Number(customPrice) : undefined,
    });

    setStep("done");
  };

  const isReady = selectedCategory && selectedName && selectedSize && selectedCondition;

  // ========================
  // STEP: Done
  // ========================
  if (step === "done") {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.doneContainer}>
          <Text style={styles.doneCheck}>{"\u2713"}</Text>
          <Text style={styles.doneTitle}>We'll find the right match.</Text>
          <View style={styles.doneButtons}>
            <Button
              variant="primary"
              size="md"
              title="List another"
              onPress={() => {
                setStep("camera");
                setPhotoUri(null);
                setSelectedTopCategory(null);
                setSelectedCategory(null);
                setQuery("");
                setSelectedName(null);
                setSelectedEmoji(null);
                setSelectedSize(null);
                setSelectedCondition(null);
                setNote("");
                setPricingMode("pay-what-feels-fair");
                setCustomPrice("");
              }}
            />
            <Button
              variant="secondary"
              size="md"
              title="Home"
              onPress={() => router.replace("/(tabs)/" as `/${string}`)}
              style={{ marginLeft: 12 }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ========================
  // STEP: Camera
  // ========================
  if (step === "camera") {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.cameraContainer}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>{"\u2190"} Back</Text>
          </Pressable>

          <View style={styles.cameraPlaceholder}>
            <Text style={styles.cameraIcon}>{"\uD83D\uDCF7"}</Text>
            <Text style={styles.cameraTitle}>Take a photo of your item</Text>
            <Text style={styles.cameraSub}>
              We'll suggest a category and title
            </Text>
          </View>

          <View style={styles.cameraActions}>
            <Pressable style={styles.shutterButton} onPress={takePhoto}>
              <View style={styles.shutterInner} />
            </Pressable>
          </View>

          <View style={styles.cameraSecondary}>
            <Pressable onPress={pickFromLibrary}>
              <Text style={styles.cameraSecondaryText}>
                {"\uD83D\uDDBC\uFE0F"} Photo library
              </Text>
            </Pressable>
            <Pressable onPress={skipPhoto}>
              <Text style={styles.cameraSecondaryText}>
                or browse categories
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ========================
  // STEP: Details
  // ========================
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <Pressable onPress={() => setStep("camera")} style={styles.backBtn}>
          <Text style={styles.backText}>{"\u2190"} Back</Text>
        </Pressable>

        {/* Photo thumbnail */}
        {photoUri && (
          <Pressable style={styles.photoThumb} onPress={takePhoto}>
            <Image source={{ uri: photoUri }} style={styles.photoImage} />
            <Text style={styles.photoRetake}>Retake</Text>
          </Pressable>
        )}

        {/* Category — top level tiles */}
        {!selectedCategory && !selectedTopCategory && (
          <>
            <Text style={styles.sectionLabel}>What is it?</Text>
            <View style={styles.topCategoryGrid}>
              {TOP_CATEGORIES.map((top) => (
                <TouchableOpacity
                  key={top.key}
                  style={styles.topCategoryTile}
                  onPress={() => handleSelectTopCategory(top)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.topCategoryEmoji}>{top.emoji}</Text>
                  <Text style={styles.topCategoryLabel}>{top.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Category — subcategory selection */}
        {selectedTopCategory && !selectedCategory && (
          <>
            <Pressable
              style={styles.breadcrumb}
              onPress={() => setSelectedTopCategory(null)}
            >
              <Text style={styles.breadcrumbText}>
                {"\u2190"} {selectedTopCategory.label}
              </Text>
            </Pressable>
            <View style={styles.subCategoryGrid}>
              {selectedTopCategory.children.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={styles.subCategoryChip}
                  onPress={() => handleSelectSubCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.subCategoryEmoji}>
                    {CATEGORY_INFO[cat]?.emoji ?? "\u{1F4E6}"}
                  </Text>
                  <Text style={styles.subCategoryLabel}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Selected category header */}
        {selectedCategory && (
          <Pressable
            style={styles.selectedCategoryRow}
            onPress={() => {
              setSelectedCategory(null);
              setSelectedTopCategory(null);
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
        )}

        {/* Item name search */}
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

            {selectedName && !showSuggestions && (
              <View style={styles.selectedItem}>
                <Text style={styles.selectedItemEmoji}>{selectedEmoji}</Text>
                <Text style={styles.selectedItemName}>{selectedName}</Text>
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

        {/* Size */}
        {selectedName && !showSuggestions && (
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
                  <Pressable key={size}>
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

        {/* Condition */}
        {selectedSize && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Condition</Text>
            <View style={styles.conditionRow}>
              {CONDITION_OPTIONS.map((c) => {
                const isActive = selectedCondition === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.conditionChip,
                      isActive && styles.conditionChipActive,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCondition(c);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.conditionText,
                        isActive && styles.conditionTextActive,
                      ]}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Note */}
        {selectedCondition && (
          <View style={styles.section}>
            <TextInput
              style={styles.noteInput}
              placeholder="Add a note"
              placeholderTextColor={colors.textLight}
              value={note}
              onChangeText={setNote}
              autoCapitalize="sentences"
              returnKeyType="done"
            />
          </View>
        )}

        {/* Price */}
        {selectedCondition && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Price</Text>
            <View style={styles.pricingRow}>
              <Pressable
                style={[
                  styles.pricingOption,
                  pricingMode === "free" && styles.pricingOptionActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPricingMode("free");
                }}
              >
                <Text
                  style={[
                    styles.pricingOptionText,
                    pricingMode === "free" && styles.pricingOptionTextActive,
                  ]}
                >
                  Free
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.pricingOption,
                  pricingMode === "pay-what-feels-fair" &&
                    styles.pricingOptionActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPricingMode("pay-what-feels-fair");
                }}
              >
                <Text
                  style={[
                    styles.pricingOptionText,
                    pricingMode === "pay-what-feels-fair" &&
                      styles.pricingOptionTextActive,
                  ]}
                >
                  Pay what's fair
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.pricingOption,
                  pricingMode === "set-price" && styles.pricingOptionActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPricingMode("set-price");
                }}
              >
                <Text
                  style={[
                    styles.pricingOptionText,
                    pricingMode === "set-price" &&
                      styles.pricingOptionTextActive,
                  ]}
                >
                  $___
                </Text>
              </Pressable>
            </View>
            {pricingMode === "set-price" && (
              <TextInput
                style={styles.priceInput}
                placeholder="Enter price"
                placeholderTextColor={colors.textLight}
                value={customPrice}
                onChangeText={setCustomPrice}
                keyboardType="numeric"
                returnKeyType="done"
              />
            )}
          </View>
        )}

        {/* List button */}
        {isReady && (
          <Button
            variant="primary"
            size="lg"
            title="List it"
            onPress={handleList}
            style={styles.listBtn}
          />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Back
  backBtn: { alignSelf: "flex-start", paddingVertical: 8, marginBottom: 8 },
  backText: { fontSize: 16, color: colors.violet, fontWeight: "600" },

  // ─── Camera step ────────────────────────────────────────────────────
  cameraContainer: {
    flex: 1,
    padding: 20,
  },
  cameraPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  cameraIcon: {
    fontSize: 64,
  },
  cameraTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  cameraSub: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
  },
  cameraActions: {
    alignItems: "center",
    paddingBottom: 24,
  },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: colors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.text,
  },
  cameraSecondary: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 32,
  },
  cameraSecondaryText: {
    fontSize: 15,
    color: colors.violet,
    fontWeight: "600",
  },

  // ─── Photo thumbnail ───────────────────────────────────────────────
  photoThumb: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  photoImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  photoRetake: {
    fontSize: 14,
    color: colors.violet,
    fontWeight: "600",
  },

  // ─── Top category grid (6 tiles) ──────────────────────────────────
  topCategoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  topCategoryTile: {
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
  topCategoryEmoji: { fontSize: 28 },
  topCategoryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },

  // ─── Subcategory chips ─────────────────────────────────────────────
  breadcrumb: { marginBottom: 12 },
  breadcrumbText: {
    fontSize: 16,
    color: colors.violet,
    fontWeight: "600",
  },
  subCategoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  subCategoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subCategoryEmoji: { fontSize: 18 },
  subCategoryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },

  // ─── Selected category ────────────────────────────────────────────
  selectedCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.violet + "10",
    borderWidth: 1,
    borderColor: colors.violet,
    marginBottom: 20,
  },
  selectedCategoryEmoji: { fontSize: 22 },
  selectedCategoryLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.violet,
  },
  selectedCategoryChange: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.violet,
  },

  // ─── Sections ─────────────────────────────────────────────────────
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },

  // ─── Search ───────────────────────────────────────────────────────
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
  selectedItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.eucalyptus + "15",
    borderWidth: 1,
    borderColor: colors.eucalyptus + "40",
  },
  selectedItemEmoji: { fontSize: 22 },
  selectedItemName: { flex: 1, fontSize: 16, fontWeight: "600", color: colors.text },
  changeLink: { fontSize: 14, fontWeight: "600", color: colors.violet },

  // ─── Pills ────────────────────────────────────────────────────────
  pillRow: { gap: 8 },
  pill: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 },
  pillInactive: { backgroundColor: colors.surface },
  pillTextActive: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  pillTextInactive: { fontSize: 14, fontWeight: "600", color: colors.textMuted },

  // ─── Condition ────────────────────────────────────────────────────
  conditionRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  conditionChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  conditionChipActive: {
    backgroundColor: colors.violet + "20",
    borderWidth: 1,
    borderColor: colors.violet,
  },
  conditionText: { fontSize: 14, fontWeight: "600", color: colors.textMuted },
  conditionTextActive: { color: colors.violet },

  // ─── Note ─────────────────────────────────────────────────────────
  noteInput: {
    fontSize: 15,
    color: colors.text,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },

  // ─── Pricing ──────────────────────────────────────────────────────
  pricingRow: {
    flexDirection: "row",
    gap: 8,
  },
  pricingOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  pricingOptionActive: {
    backgroundColor: colors.eucalyptus + "20",
    borderWidth: 1,
    borderColor: colors.eucalyptus,
  },
  pricingOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  pricingOptionTextActive: {
    color: colors.eucalyptus,
  },
  priceInput: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },

  // ─── List button ──────────────────────────────────────────────────
  listBtn: { width: "100%", marginTop: 8 },

  // ─── Done step ────────────────────────────────────────────────────
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
    color: colors.text,
    textAlign: "center",
  },
  doneButtons: {
    flexDirection: "row",
    marginTop: 20,
  },
});
