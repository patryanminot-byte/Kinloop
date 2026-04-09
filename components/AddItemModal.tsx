import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { colors, gradientColors } from "../lib/colors";
import { logSearchEvent } from "../lib/searchTracking";
import { useAuth } from "../hooks/useAuth";
import type { Item } from "../lib/types";
import {
  CATEGORY_INFO,
  SIZE_OPTIONS,
  CONDITION_OPTIONS,
  BUNDLE_CATEGORIES,
  SUB_CATEGORIES,
  type CatalogEntry,
  type Category,
  type SizeSystem,
  type SubCategory,
} from "../lib/itemCatalog";
import { useItemCatalog } from "../hooks/useItemCatalog";
import Button from "./ui/Button";
import PricingPicker from "./PricingPicker";
import type { Pricing } from "../lib/types";

const { height: SCREEN_H } = Dimensions.get("window");

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (item: Omit<Item, "id" | "status" | "matchedTo">) => void;
}

type Mode = "choose" | "single" | "bundle";
type BundleStep = "category" | "size" | "count" | "details";

// Bundle count options
const COUNT_OPTIONS = [
  { label: "~5", value: 5 },
  { label: "~10", value: 10 },
  { label: "~15", value: 15 },
  { label: "~20", value: 20 },
  { label: "20+", value: 25 },
];

export default function AddItemModal({
  visible,
  onClose,
  onAdd,
}: AddItemModalProps) {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { searchCatalog, browseCategory, browseSubCategory } = useItemCatalog();

  // Mode
  const [mode, setMode] = useState<Mode>("choose");

  // Browse state
  const [browsingCategory, setBrowsingCategory] = useState<Category | null>(null);
  const [browsingSubCategory, setBrowsingSubCategory] = useState<SubCategory | null>(null);
  const [showSearchInBrowse, setShowSearchInBrowse] = useState(false);

  // Single item state
  const [query, setQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<CatalogEntry | null>(null);
  const [customName, setCustomName] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [sizeSystem, setSizeSystem] = useState<SizeSystem | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Bundle state
  const [bundleStep, setBundleStep] = useState<BundleStep>("category");
  const [bundleCategory, setBundleCategory] = useState<Category | null>(null);
  const [bundleSize, setBundleSize] = useState<string | null>(null);
  const [bundleCount, setBundleCount] = useState<number | null>(null);
  const [bundleName, setBundleName] = useState("");
  const [bundleCondition, setBundleCondition] = useState<string | null>(null);
  const [bundlePricing, setBundlePricing] = useState<Pricing | null>(null);
  const [bundlePhotoUri, setBundlePhotoUri] = useState<string | null>(null);

  // Success state
  const [justAdded, setJustAdded] = useState(false);
  const [addedName, setAddedName] = useState("");

  const searchInputRef = useRef<TextInput>(null);

  // Search results
  const suggestions = useMemo(() => {
    if (query.length < 2) return [];
    return searchCatalog(query);
  }, [query, searchCatalog]);

  // Reset everything when modal opens
  useEffect(() => {
    if (visible) {
      resetAll();
    }
  }, [visible]);

  const resetAll = () => {
    setMode("choose");
    setQuery("");
    setSelectedEntry(null);
    setCustomName("");
    setCategory(null);
    setSizeSystem(null);
    setSelectedSize(null);
    setCondition(null);
    setPricing(null);
    setPhotoUri(null);
    setShowSuggestions(false);
    setBrowsingCategory(null);
    setBrowsingSubCategory(null);
    setShowSearchInBrowse(false);
    setBundleStep("category");
    setBundleCategory(null);
    setBundleSize(null);
    setBundleCount(null);
    setBundleName("");
    setBundleCondition(null);
    setBundlePricing(null);
    setBundlePhotoUri(null);
    setJustAdded(false);
    setAddedName("");
  };

  const resetForAnother = () => {
    setMode("choose");
    setQuery("");
    setSelectedEntry(null);
    setCustomName("");
    setCategory(null);
    setSizeSystem(null);
    setSelectedSize(null);
    setCondition(null);
    setPricing(null);
    setPhotoUri(null);
    setShowSuggestions(false);
    setBrowsingCategory(null);
    setBrowsingSubCategory(null);
    setShowSearchInBrowse(false);
    setBundleStep("category");
    setBundleCategory(null);
    setBundleSize(null);
    setBundleCount(null);
    setBundleName("");
    setBundleCondition(null);
    setBundlePricing(null);
    setBundlePhotoUri(null);
    setJustAdded(false);
    setAddedName("");
  };

  // ---- Single item handlers ----

  const handleSelectSuggestion = (entry: CatalogEntry) => {
    setSelectedEntry(entry);
    setQuery(entry.brand ? `${entry.brand} ${entry.name}` : entry.name);
    setCategory(entry.category);
    setSizeSystem(entry.sizeSystem);
    setShowSuggestions(false);
  };

  const handleUseCustomName = () => {
    setSelectedEntry(null);
    setCustomName(query);
    setShowSuggestions(false);
    // Don't auto-set category — let them pick
  };

  const handleCategorySelect = (cat: Category) => {
    setCategory(cat);
    const info = CATEGORY_INFO[cat];
    if (info) {
      setSizeSystem(info.sizeSystem);
    }
  };

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleBundlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      setBundlePhotoUri(result.assets[0].uri);
    }
  };

  // ---- Computed values ----

  const displayName = selectedEntry
    ? (selectedEntry.brand ? `${selectedEntry.brand} ${selectedEntry.name}` : selectedEntry.name)
    : customName || query;

  const displayEmoji = category
    ? CATEGORY_INFO[category]?.emoji ?? "\u{1F4E6}"
    : selectedEntry
      ? CATEGORY_INFO[selectedEntry.category]?.emoji ?? "\u{1F4E6}"
      : "\u{1F4E6}";

  const sizeOptions = sizeSystem ? SIZE_OPTIONS[sizeSystem] : [];

  const isSingleValid =
    displayName.trim().length > 0 && category !== null;

  // Browse: items for current sub-category (or whole category if no sub-cats)
  const browseItems = useMemo(() => {
    if (!browsingCategory) return [];
    if (browsingSubCategory) {
      return browseSubCategory(browsingCategory, browsingSubCategory, 20);
    }
    // For categories without sub-categories, show all items
    return browseCategory(browsingCategory, 20);
  }, [browsingCategory, browsingSubCategory, browseCategory, browseSubCategory]);

  // Filtered browse search (within current category)
  const browseSearchResults = useMemo(() => {
    if (!showSearchInBrowse || query.length < 2 || !browsingCategory) return [];
    // Search within the category
    const all = searchCatalog(query);
    return all.filter(
      (e) => e.category.toLowerCase() === browsingCategory.toLowerCase()
    );
  }, [showSearchInBrowse, query, browsingCategory, searchCatalog]);

  const hasSubCategories = browsingCategory && SUB_CATEGORIES[browsingCategory];

  // ---- Bundle computed ----

  const bundleSizeSystem = bundleCategory
    ? CATEGORY_INFO[bundleCategory]?.sizeSystem ?? "age-range"
    : "age-range";
  const bundleSizeOptions = SIZE_OPTIONS[bundleSizeSystem] ?? [];

  const bundleAutoName = bundleCategory && bundleSize && bundleCount
    ? `${bundleSize} ${bundleCategory.toLowerCase()} bundle (~${bundleCount} items)`
    : "";

  useEffect(() => {
    if (bundleAutoName && !bundleName) {
      setBundleName(bundleAutoName);
    }
  }, [bundleAutoName, bundleName]);

  const isBundleValid =
    bundleCategory !== null && bundleSize !== null && bundleCount !== null;

  const bundleEmoji = bundleCategory
    ? CATEGORY_INFO[bundleCategory]?.emoji ?? "\u{1F4E6}"
    : "\u{1F4E6}";

  // ---- Submit handlers ----

  const handleAddSingle = () => {
    if (!isSingleValid || !category) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const name = displayName.trim();

    // Track search intelligence
    logSearchEvent({
      userId,
      query,
      matchedCatalog: selectedEntry !== null,
      selectedEntry: selectedEntry
        ? (selectedEntry.brand ? `${selectedEntry.brand} ${selectedEntry.name}` : selectedEntry.name)
        : undefined,
      customName: selectedEntry ? undefined : name,
      category,
      isBundle: false,
    });

    onAdd({
      name,
      category,
      ageRange: selectedSize ?? "",
      emoji: displayEmoji,
      isBundle: false,
      condition: condition ?? undefined,
      pricing: pricing ?? undefined,
      ...(photoUri ? { hasPhoto: true, photoUri } : {}),
    });
    setAddedName(name);
    setJustAdded(true);
  };

  const handleAddBundle = () => {
    if (!isBundleValid || !bundleCategory) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const name = bundleName || bundleAutoName;

    // Track bundle addition
    logSearchEvent({
      userId,
      query: name,
      matchedCatalog: false,
      customName: name,
      category: bundleCategory,
      isBundle: true,
    });

    onAdd({
      name,
      category: bundleCategory,
      ageRange: bundleSize ?? "",
      emoji: bundleEmoji,
      isBundle: true,
      count: bundleCount ?? undefined,
      condition: bundleCondition ?? undefined,
      pricing: bundlePricing ?? undefined,
      ...(bundlePhotoUri ? { hasPhoto: true, photoUri: bundlePhotoUri } : {}),
    });
    setAddedName(name);
    setJustAdded(true);
  };

  // ---- Render helpers ----

  const renderChip = (
    label: string,
    isActive: boolean,
    onPress: () => void,
  ) => {
    if (isActive) {
      return (
        <Pressable key={label} onPress={onPress}>
          <LinearGradient
            colors={gradientColors.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.chip}
          >
            <Text style={styles.chipTextActive}>{label}</Text>
          </LinearGradient>
        </Pressable>
      );
    }
    return (
      <Pressable
        key={label}
        onPress={onPress}
        style={[styles.chip, styles.chipInactive]}
      >
        <Text style={styles.chipTextInactive}>{label}</Text>
      </Pressable>
    );
  };

  const renderConditionPicker = (
    value: string | null,
    onChange: (v: string) => void,
  ) => (
    <View style={styles.conditionRow}>
      {CONDITION_OPTIONS.map((c) => (
        <TouchableOpacity
          key={c}
          style={[
            styles.conditionChip,
            value === c && styles.conditionChipActive,
          ]}
          onPress={() => onChange(c)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.conditionText,
              value === c && styles.conditionTextActive,
            ]}
          >
            {c}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ==== RENDER ====

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Drag handle */}
            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>

            {/* ============ SUCCESS STATE ============ */}
            {justAdded ? (
              <View style={styles.successContainer}>
                <Text style={styles.successEmoji}>{"\u{2728}"}</Text>
                <Text style={styles.successTitle}>Added!</Text>
                <Text style={styles.successName}>{addedName}</Text>
                <View style={styles.successActions}>
                  <Button
                    variant="primary"
                    size="lg"
                    title="Add another"
                    onPress={resetForAnother}
                    style={styles.successBtn}
                  />
                  <Button
                    variant="ghost"
                    size="md"
                    title="Done"
                    onPress={onClose}
                    style={styles.successBtn}
                  />
                </View>
              </View>
            ) : mode === "choose" ? (
              /* ============ CHOOSE MODE ============ */
              <View>
                {/* ---- State 1: Split layout — categories top, search bottom ---- */}
                {!browsingCategory && (
                  <>
                    <Text style={styles.title}>What are you adding?</Text>

                    {/* Top half: scrollable category grid */}
                    <View style={styles.categoryScrollContainer}>
                      <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.categoryGrid}
                        nestedScrollEnabled
                      >
                        {(Object.keys(CATEGORY_INFO) as Category[]).map((cat) => {
                          const info = CATEGORY_INFO[cat];
                          return (
                            <TouchableOpacity
                              key={cat}
                              style={styles.categoryCard}
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setBrowsingCategory(cat);
                                setBrowsingSubCategory(null);
                                setQuery("");
                                setShowSearchInBrowse(false);
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.categoryCardEmoji}>{info.emoji}</Text>
                              <Text style={styles.categoryCardLabel} numberOfLines={1}>{cat}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Bottom half: fixed search + bundle */}
                    <View style={styles.searchContainer}>
                      <Text style={styles.searchIcon}>{"\u{1F50D}"}</Text>
                      <TextInput
                        ref={searchInputRef}
                        style={styles.searchInput}
                        placeholder="Search by brand or item..."
                        placeholderTextColor={colors.textLight}
                        value={query}
                        onChangeText={(text) => {
                          setQuery(text);
                          setShowSuggestions(text.length >= 2);
                          setSelectedEntry(null);
                        }}
                        autoCapitalize="words"
                        returnKeyType="search"
                        onFocus={() => {
                          if (query.length >= 2) setShowSuggestions(true);
                        }}
                      />
                      {query.length > 0 && (
                        <TouchableOpacity
                          onPress={() => {
                            setQuery("");
                            setShowSuggestions(false);
                            setSelectedEntry(null);
                          }}
                        >
                          <Text style={styles.searchClear}>{"\u2715"}</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Inline suggestions */}
                    {showSuggestions && suggestions.length > 0 && (
                      <View style={styles.suggestionsBox}>
                        {suggestions.map((entry, idx) => (
                          <TouchableOpacity
                            key={`${entry.brand ?? ""}-${entry.name}-${idx}`}
                            style={styles.suggestionRow}
                            onPress={() => {
                              handleSelectSuggestion(entry);
                              setMode("single");
                            }}
                            activeOpacity={0.6}
                          >
                            <Text style={styles.suggestionEmoji}>
                              {CATEGORY_INFO[entry.category]?.emoji ?? "\u{1F4E6}"}
                            </Text>
                            <View style={styles.suggestionInfo}>
                              <Text style={styles.suggestionName}>
                                {entry.brand ? `${entry.brand} ` : ""}
                                {entry.name}
                              </Text>
                              <Text style={styles.suggestionCategory}>
                                {entry.category}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                          style={styles.suggestionRow}
                          onPress={() => {
                            handleUseCustomName();
                            setMode("single");
                          }}
                          activeOpacity={0.6}
                        >
                          <Text style={styles.suggestionEmoji}>{"\u270F\uFE0F"}</Text>
                          <View style={styles.suggestionInfo}>
                            <Text style={styles.suggestionName}>
                              Add "{query}" as custom item
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    )}

                    {showSuggestions && suggestions.length === 0 && query.length >= 2 && (
                      <TouchableOpacity
                        style={styles.customItemBtn}
                        onPress={() => {
                          handleUseCustomName();
                          setMode("single");
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.customItemText}>
                          {"\u2795"} Add "{query}" as a custom item
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Bundle shortcut */}
                    <TouchableOpacity
                      style={styles.bundleShortcut}
                      onPress={() => setMode("bundle")}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.bundleShortcutEmoji}>{"\u{1F4E6}"}</Text>
                      <View style={styles.bundleShortcutInfo}>
                        <Text style={styles.bundleShortcutTitle}>
                          Add a bundle instead
                        </Text>
                        <Text style={styles.bundleShortcutSub}>
                          Clearing out a drawer? Bundle by size in 4 taps
                        </Text>
                      </View>
                      <Text style={styles.bundleChevron}>{"\u203A"}</Text>
                    </TouchableOpacity>

                    <Button
                      variant="ghost"
                      size="md"
                      title="Cancel"
                      onPress={onClose}
                      style={styles.cancelButton}
                    />
                  </>
                )}

                {/* ---- State 2: Sub-category list (category selected, no sub-cat yet) ---- */}
                {browsingCategory && !browsingSubCategory && hasSubCategories && !showSearchInBrowse && (
                  <>
                    <TouchableOpacity
                      onPress={() => setBrowsingCategory(null)}
                      style={styles.backLink}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.backLinkText}>{"\u2190"} Back</Text>
                    </TouchableOpacity>

                    <Text style={styles.title}>
                      {CATEGORY_INFO[browsingCategory]?.emoji} {browsingCategory}
                    </Text>

                    <View style={styles.subCategoryGrid}>
                      {SUB_CATEGORIES[browsingCategory]!.map((sub) => (
                        <TouchableOpacity
                          key={sub.label}
                          style={styles.subCategoryCard}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setBrowsingSubCategory(sub);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.subCategoryEmoji}>{sub.emoji}</Text>
                          <Text style={styles.subCategoryLabel}>{sub.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Search within category */}
                    <TouchableOpacity
                      style={styles.searchShortcut}
                      onPress={() => {
                        setShowSearchInBrowse(true);
                        setQuery("");
                        setTimeout(() => searchInputRef.current?.focus(), 300);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.searchShortcutIcon}>{"\u{1F50D}"}</Text>
                      <Text style={styles.searchShortcutText}>
                        Search {browsingCategory.toLowerCase()}...
                      </Text>
                    </TouchableOpacity>

                    <Button
                      variant="ghost"
                      size="md"
                      title="Cancel"
                      onPress={onClose}
                      style={styles.cancelButton}
                    />
                  </>
                )}

                {/* ---- State 2b: Category without sub-categories → show items directly ---- */}
                {browsingCategory && !hasSubCategories && !showSearchInBrowse && (
                  <>
                    <TouchableOpacity
                      onPress={() => setBrowsingCategory(null)}
                      style={styles.backLink}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.backLinkText}>{"\u2190"} Back</Text>
                    </TouchableOpacity>

                    <Text style={styles.title}>
                      {CATEGORY_INFO[browsingCategory]?.emoji} {browsingCategory}
                    </Text>

                    {browseItems.map((entry, idx) => (
                      <TouchableOpacity
                        key={`${entry.brand ?? ""}-${entry.name}-${idx}`}
                        style={styles.browseItemRow}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          handleSelectSuggestion(entry);
                          setMode("single");
                        }}
                        activeOpacity={0.6}
                      >
                        <Text style={styles.browseItemEmoji}>{entry.emoji}</Text>
                        <Text style={styles.browseItemName} numberOfLines={1}>
                          {entry.brand ? `${entry.brand} ${entry.name}` : entry.name}
                        </Text>
                        <Text style={styles.browseChevron}>{"\u203A"}</Text>
                      </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                      style={styles.addCustomRow}
                      onPress={() => {
                        setCustomName("");
                        setCategory(browsingCategory);
                        const info = CATEGORY_INFO[browsingCategory];
                        if (info) setSizeSystem(info.sizeSystem);
                        setMode("single");
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.addCustomText}>
                        {"\u2795"} Add custom {browsingCategory.toLowerCase()} item
                      </Text>
                    </TouchableOpacity>

                    <Button
                      variant="ghost"
                      size="md"
                      title="Cancel"
                      onPress={onClose}
                      style={styles.cancelButton}
                    />
                  </>
                )}

                {/* ---- State 3: Item list (sub-category selected) ---- */}
                {browsingCategory && browsingSubCategory && !showSearchInBrowse && (
                  <>
                    <TouchableOpacity
                      onPress={() => setBrowsingSubCategory(null)}
                      style={styles.backLink}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.backLinkText}>
                        {"\u2190"} {browsingCategory}
                      </Text>
                    </TouchableOpacity>

                    <Text style={styles.title}>
                      {browsingSubCategory.emoji} {browsingSubCategory.label}
                    </Text>

                    {browseItems.length > 0 ? (
                      browseItems.map((entry, idx) => (
                        <TouchableOpacity
                          key={`${entry.brand ?? ""}-${entry.name}-${idx}`}
                          style={styles.browseItemRow}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            handleSelectSuggestion(entry);
                            setMode("single");
                          }}
                          activeOpacity={0.6}
                        >
                          <Text style={styles.browseItemEmoji}>{entry.emoji}</Text>
                          <Text style={styles.browseItemName} numberOfLines={1}>
                            {entry.brand ? `${entry.brand} ${entry.name}` : entry.name}
                          </Text>
                          <Text style={styles.browseChevron}>{"\u203A"}</Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.noItemsText}>No items yet in this sub-category</Text>
                    )}

                    <TouchableOpacity
                      style={styles.addCustomRow}
                      onPress={() => {
                        setCustomName("");
                        setCategory(browsingCategory);
                        const info = CATEGORY_INFO[browsingCategory];
                        if (info) setSizeSystem(info.sizeSystem);
                        setMode("single");
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.addCustomText}>
                        {"\u2795"} Add custom {browsingSubCategory.label.toLowerCase()} item
                      </Text>
                    </TouchableOpacity>

                    {/* Search within category */}
                    <TouchableOpacity
                      style={styles.searchShortcut}
                      onPress={() => {
                        setShowSearchInBrowse(true);
                        setQuery("");
                        setTimeout(() => searchInputRef.current?.focus(), 300);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.searchShortcutIcon}>{"\u{1F50D}"}</Text>
                      <Text style={styles.searchShortcutText}>
                        Search {browsingCategory.toLowerCase()}...
                      </Text>
                    </TouchableOpacity>

                    <Button
                      variant="ghost"
                      size="md"
                      title="Cancel"
                      onPress={onClose}
                      style={styles.cancelButton}
                    />
                  </>
                )}

                {/* ---- State 4: Search within category ---- */}
                {browsingCategory && showSearchInBrowse && (
                  <>
                    <TouchableOpacity
                      onPress={() => {
                        setShowSearchInBrowse(false);
                        setQuery("");
                      }}
                      style={styles.backLink}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.backLinkText}>
                        {"\u2190"} {browsingCategory}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.searchContainer}>
                      <Text style={styles.searchIcon}>{"\u{1F50D}"}</Text>
                      <TextInput
                        ref={searchInputRef}
                        style={styles.searchInput}
                        placeholder={`Search ${browsingCategory.toLowerCase()}...`}
                        placeholderTextColor={colors.textLight}
                        value={query}
                        onChangeText={(text) => setQuery(text)}
                        autoCapitalize="words"
                        returnKeyType="search"
                      />
                      {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery("")}>
                          <Text style={styles.searchClear}>{"\u2715"}</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {browseSearchResults.length > 0 ? (
                      browseSearchResults.map((entry, idx) => (
                        <TouchableOpacity
                          key={`${entry.brand ?? ""}-${entry.name}-${idx}`}
                          style={styles.browseItemRow}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            handleSelectSuggestion(entry);
                            setMode("single");
                          }}
                          activeOpacity={0.6}
                        >
                          <Text style={styles.browseItemEmoji}>{entry.emoji}</Text>
                          <Text style={styles.browseItemName} numberOfLines={1}>
                            {entry.brand ? `${entry.brand} ${entry.name}` : entry.name}
                          </Text>
                          <Text style={styles.browseChevron}>{"\u203A"}</Text>
                        </TouchableOpacity>
                      ))
                    ) : query.length >= 2 ? (
                      <Text style={styles.noItemsText}>No matches in {browsingCategory.toLowerCase()}</Text>
                    ) : null}

                    {query.length >= 2 && (
                      <TouchableOpacity
                        style={styles.addCustomRow}
                        onPress={() => {
                          handleUseCustomName();
                          setCategory(browsingCategory);
                          const info = CATEGORY_INFO[browsingCategory];
                          if (info) setSizeSystem(info.sizeSystem);
                          setMode("single");
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.addCustomText}>
                          {"\u2795"} Add "{query}" as custom item
                        </Text>
                      </TouchableOpacity>
                    )}

                    <Button
                      variant="ghost"
                      size="md"
                      title="Cancel"
                      onPress={onClose}
                      style={styles.cancelButton}
                    />
                  </>
                )}
              </View>
            ) : mode === "single" ? (
              /* ============ SINGLE ITEM DETAILS ============ */
              <View>
                {/* Back */}
                <TouchableOpacity
                  onPress={() => {
                    setMode("choose");
                    // If we came from browse, keep the browse state so user returns to where they were
                  }}
                  style={styles.backLink}
                  activeOpacity={0.6}
                >
                  <Text style={styles.backLinkText}>{"\u2190"} Back</Text>
                </TouchableOpacity>

                {/* Search bar for search-first path (no entry selected, no category set from browse) */}
                {!selectedEntry && !category && !customName && (
                  <>
                    <Text style={styles.title}>Add to your stuff</Text>
                    <View style={styles.searchContainer}>
                      <Text style={styles.searchIcon}>{"\u{1F50D}"}</Text>
                      <TextInput
                        ref={searchInputRef}
                        style={styles.searchInput}
                        placeholder="Search by brand or item..."
                        placeholderTextColor={colors.textLight}
                        value={query}
                        onChangeText={(text) => {
                          setQuery(text);
                          setShowSuggestions(text.length >= 2);
                          setSelectedEntry(null);
                        }}
                        autoCapitalize="words"
                        returnKeyType="search"
                        onFocus={() => {
                          if (query.length >= 2) setShowSuggestions(true);
                        }}
                      />
                      {query.length > 0 && (
                        <TouchableOpacity
                          onPress={() => {
                            setQuery("");
                            setShowSuggestions(false);
                          }}
                        >
                          <Text style={styles.searchClear}>{"\u2715"}</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {showSuggestions && suggestions.length > 0 && (
                      <View style={styles.suggestionsBox}>
                        {suggestions.map((entry, idx) => (
                          <TouchableOpacity
                            key={`${entry.brand ?? ""}-${entry.name}-${idx}`}
                            style={styles.suggestionRow}
                            onPress={() => {
                              handleSelectSuggestion(entry);
                            }}
                            activeOpacity={0.6}
                          >
                            <Text style={styles.suggestionEmoji}>
                              {CATEGORY_INFO[entry.category]?.emoji ?? "\u{1F4E6}"}
                            </Text>
                            <View style={styles.suggestionInfo}>
                              <Text style={styles.suggestionName}>
                                {entry.brand ? `${entry.brand} ` : ""}
                                {entry.name}
                              </Text>
                              <Text style={styles.suggestionCategory}>
                                {entry.category}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                          style={styles.suggestionRow}
                          onPress={() => handleUseCustomName()}
                          activeOpacity={0.6}
                        >
                          <Text style={styles.suggestionEmoji}>{"\u270F\uFE0F"}</Text>
                          <View style={styles.suggestionInfo}>
                            <Text style={styles.suggestionName}>
                              Add "{query}" as custom item
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    )}

                    {showSuggestions && suggestions.length === 0 && query.length >= 2 && (
                      <TouchableOpacity
                        style={styles.customItemBtn}
                        onPress={() => handleUseCustomName()}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.customItemText}>
                          {"\u2795"} Add "{query}" as a custom item
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {/* Item details (entry or custom name selected) */}
                {(selectedEntry || customName || category) && (
                  <>
                <Text style={styles.title}>
                  {displayEmoji} {displayName}
                </Text>

                {/* Photo */}
                <Pressable onPress={handlePickPhoto} style={styles.photoButton}>
                  {photoUri ? (
                    <Image
                      source={{ uri: photoUri }}
                      style={styles.photoImage}
                    />
                  ) : (
                    <>
                      <Text style={styles.photoEmoji}>{"\u{1F4F7}"}</Text>
                      <Text style={styles.photoLabel}>add photo</Text>
                    </>
                  )}
                </Pressable>

                {/* Category — only show if not auto-set */}
                {!category && (
                  <>
                    <Text style={styles.fieldLabel}>Category</Text>
                    <View style={styles.chipGrid}>
                      {(Object.keys(CATEGORY_INFO) as Category[]).map((cat) => {
                        const info = CATEGORY_INFO[cat];
                        return renderChip(
                          `${info.emoji} ${cat}`,
                          category === cat,
                          () => handleCategorySelect(cat),
                        );
                      })}
                    </View>
                  </>
                )}

                {/* Category badge if auto-set */}
                {category && selectedEntry && (
                  <View style={styles.autoCategoryRow}>
                    <Text style={styles.autoCategoryLabel}>Category:</Text>
                    <View style={styles.autoCategoryBadge}>
                      <Text style={styles.autoCategoryText}>
                        {CATEGORY_INFO[category]?.emoji} {category}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => { setCategory(null); setSizeSystem(null); setSelectedSize(null); }}>
                      <Text style={styles.changeCategoryText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Size picker */}
                {sizeSystem && sizeOptions.length > 0 && (
                  <>
                    <Text style={styles.fieldLabel}>
                      {sizeSystem === "clothing"
                        ? "Size"
                        : sizeSystem === "shoes"
                          ? "Shoe size"
                          : sizeSystem === "reading-level"
                            ? "Reading level"
                            : sizeSystem === "weight-range"
                              ? "Weight range"
                              : "Age range"}
                    </Text>
                    <View style={styles.chipGrid}>
                      {sizeOptions.map((size) =>
                        renderChip(size, selectedSize === size, () =>
                          setSelectedSize(size),
                        ),
                      )}
                    </View>
                  </>
                )}

                {/* Condition */}
                <Text style={styles.fieldLabel}>
                  Condition{" "}
                  <Text style={styles.optionalLabel}>(optional)</Text>
                </Text>
                {renderConditionPicker(condition, setCondition)}

                {/* Pricing */}
                <Text style={styles.fieldLabel}>
                  Pricing{" "}
                  <Text style={styles.optionalLabel}>(optional)</Text>
                </Text>
                <PricingPicker selected={pricing} onSelect={setPricing} />

                <View style={{ height: 16 }} />

                {/* Add button */}
                <Button
                  variant="primary"
                  size="lg"
                  title={
                    isSingleValid
                      ? `Add ${displayEmoji} ${displayName.slice(0, 30)}${displayName.length > 30 ? "..." : ""}`
                      : "Add item"
                  }
                  onPress={handleAddSingle}
                  disabled={!isSingleValid}
                  style={styles.addButton}
                />
                  </>
                )}

                <Button
                  variant="ghost"
                  size="md"
                  title="Cancel"
                  onPress={onClose}
                  style={styles.cancelButton}
                />

                <View style={{ height: 20 }} />
              </View>
            ) : (
              /* ============ BUNDLE FLOW ============ */
              <View>
                {/* Back */}
                <TouchableOpacity
                  onPress={() => {
                    if (bundleStep === "category") {
                      setMode("choose");
                    } else if (bundleStep === "size") {
                      setBundleStep("category");
                    } else if (bundleStep === "count") {
                      setBundleStep("size");
                    } else {
                      setBundleStep("count");
                    }
                  }}
                  style={styles.backLink}
                  activeOpacity={0.6}
                >
                  <Text style={styles.backLinkText}>{"\u2190"} Back</Text>
                </TouchableOpacity>

                <Text style={styles.title}>
                  {"\u{1F4E6}"} Add a bundle
                </Text>

                {/* Step 1: Category */}
                {bundleStep === "category" && (
                  <View>
                    <Text style={styles.bundleStepLabel}>
                      What kind of stuff?
                    </Text>
                    <View style={styles.bundleCategoryGrid}>
                      {BUNDLE_CATEGORIES.map((cat) => {
                        const info = CATEGORY_INFO[cat];
                        return (
                          <TouchableOpacity
                            key={cat}
                            style={[
                              styles.bundleCategoryCard,
                              bundleCategory === cat &&
                                styles.bundleCategoryCardActive,
                            ]}
                            onPress={() => {
                              setBundleCategory(cat);
                              setBundleStep("size");
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.bundleCategoryEmoji}>
                              {info.emoji}
                            </Text>
                            <Text
                              style={[
                                styles.bundleCategoryLabel,
                                bundleCategory === cat &&
                                  styles.bundleCategoryLabelActive,
                              ]}
                            >
                              {cat}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Step 2: Size */}
                {bundleStep === "size" && (
                  <View>
                    <Text style={styles.bundleStepLabel}>What size range?</Text>
                    <View style={styles.chipGrid}>
                      {bundleSizeOptions.map((size) => (
                        <TouchableOpacity
                          key={size}
                          style={[
                            styles.bundleSizeChip,
                            bundleSize === size &&
                              styles.bundleSizeChipActive,
                          ]}
                          onPress={() => {
                            setBundleSize(size);
                            setBundleStep("count");
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.bundleSizeText,
                              bundleSize === size &&
                                styles.bundleSizeTextActive,
                            ]}
                          >
                            {size}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Step 3: Count */}
                {bundleStep === "count" && (
                  <View>
                    <Text style={styles.bundleStepLabel}>
                      About how many items?
                    </Text>
                    <View style={styles.countRow}>
                      {COUNT_OPTIONS.map((opt) => (
                        <TouchableOpacity
                          key={opt.value}
                          style={[
                            styles.countChip,
                            bundleCount === opt.value &&
                              styles.countChipActive,
                          ]}
                          onPress={() => {
                            setBundleCount(opt.value);
                            setBundleName(
                              `${bundleSize} ${(bundleCategory ?? "").toLowerCase()} bundle (~${opt.value} items)`,
                            );
                            setBundleStep("details");
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.countText,
                              bundleCount === opt.value &&
                                styles.countTextActive,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Step 4: Details & confirm */}
                {bundleStep === "details" && (
                  <View>
                    <Text style={styles.bundlePreviewName}>
                      {bundleEmoji} {bundleName}
                    </Text>

                    {/* Editable name */}
                    <Text style={styles.fieldLabel}>
                      Name{" "}
                      <Text style={styles.optionalLabel}>(editable)</Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={bundleName}
                      onChangeText={setBundleName}
                      autoCapitalize="sentences"
                    />

                    {/* Photo */}
                    <Pressable
                      onPress={handleBundlePickPhoto}
                      style={styles.photoButton}
                    >
                      {bundlePhotoUri ? (
                        <Image
                          source={{ uri: bundlePhotoUri }}
                          style={styles.photoImage}
                        />
                      ) : (
                        <>
                          <Text style={styles.photoEmoji}>{"\u{1F4F7}"}</Text>
                          <Text style={styles.photoLabel}>add photo</Text>
                        </>
                      )}
                    </Pressable>

                    {/* Condition */}
                    <Text style={styles.fieldLabel}>
                      Condition{" "}
                      <Text style={styles.optionalLabel}>(optional)</Text>
                    </Text>
                    {renderConditionPicker(bundleCondition, setBundleCondition)}

                    {/* Pricing */}
                    <Text style={styles.fieldLabel}>
                      Pricing{" "}
                      <Text style={styles.optionalLabel}>(optional)</Text>
                    </Text>
                    <PricingPicker
                      selected={bundlePricing}
                      onSelect={setBundlePricing}
                    />

                    <View style={{ height: 16 }} />

                    <Button
                      variant="primary"
                      size="lg"
                      title={`Add ${bundleEmoji} ${bundleName.slice(0, 30)}${bundleName.length > 30 ? "..." : ""}`}
                      onPress={handleAddBundle}
                      disabled={!isBundleValid}
                      style={styles.addButton}
                    />
                  </View>
                )}

                {bundleStep !== "details" && (
                  <Button
                    variant="ghost"
                    size="md"
                    title="Cancel"
                    onPress={onClose}
                    style={styles.cancelButton}
                  />
                )}

                {bundleStep === "details" && (
                  <Button
                    variant="ghost"
                    size="md"
                    title="Cancel"
                    onPress={onClose}
                    style={styles.cancelButton}
                  />
                )}

                <View style={{ height: 20 }} />
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_H * 0.92,
    paddingHorizontal: 20,
  },

  // Handle
  handleRow: { alignItems: "center", paddingTop: 12, paddingBottom: 8 },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D1D6",
  },

  // Title
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
  },

  // Split layout container
  categoryScrollContainer: {
    maxHeight: SCREEN_H * 0.35,
    marginBottom: 0,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },

  // Category browse grid
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 4,
  },
  categoryCard: {
    width: "30%",
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    gap: 4,
  },
  categoryCardEmoji: {
    fontSize: 26,
  },
  categoryCardLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },

  // Sub-category grid
  subCategoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  subCategoryCard: {
    width: "47%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  subCategoryEmoji: {
    fontSize: 22,
  },
  subCategoryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    flexShrink: 1,
  },

  // Browse item list
  browseItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  browseItemEmoji: {
    fontSize: 22,
  },
  browseItemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  browseChevron: {
    fontSize: 20,
    color: colors.textLight,
  },
  noItemsText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: 20,
  },
  addCustomRow: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginTop: 4,
    marginBottom: 12,
  },
  addCustomText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.neonPurple,
  },

  // Search shortcut (in browse mode)
  searchShortcut: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#F5F5F3",
    marginBottom: 12,
  },
  searchShortcutIcon: {
    fontSize: 16,
  },
  searchShortcutText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textMuted,
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F3",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 8,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    height: 50,
  },
  searchClear: {
    fontSize: 16,
    color: colors.textLight,
    paddingLeft: 8,
  },

  // Suggestions
  suggestionsBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  suggestionEmoji: {
    fontSize: 24,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  suggestionCategory: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },

  // Custom item
  customItemBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.neonPurple + "0D",
    borderRadius: 12,
    marginBottom: 12,
  },
  customItemText: {
    fontSize: 15,
    color: colors.neonPurple,
    fontWeight: "600",
  },

  // Bundle shortcut
  bundleShortcut: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    gap: 12,
  },
  bundleShortcutEmoji: {
    fontSize: 32,
  },
  bundleShortcutInfo: {
    flex: 1,
  },
  bundleShortcutTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  bundleShortcutSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  bundleChevron: {
    fontSize: 24,
    color: colors.textLight,
  },

  // Back link
  backLink: {
    paddingVertical: 8,
    marginBottom: 4,
  },
  backLinkText: {
    fontSize: 15,
    color: colors.neonPurple,
    fontWeight: "600",
  },

  // Photo
  photoButton: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#D1D1D6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  photoEmoji: { fontSize: 24 },
  photoLabel: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  photoImage: { width: 72, height: 72, borderRadius: 12 },

  // Category auto-set
  autoCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  autoCategoryLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  autoCategoryBadge: {
    backgroundColor: colors.neonPurple + "15",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  autoCategoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neonPurple,
  },
  changeCategoryText: {
    fontSize: 13,
    color: colors.textLight,
    textDecorationLine: "underline",
  },

  // Fields
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  optionalLabel: {
    fontWeight: "400",
    color: colors.textLight,
  },
  input: {
    backgroundColor: "#F5F5F3",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },

  // Chips
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  chipInactive: { backgroundColor: "#F0F0ED" },
  chipTextActive: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  chipTextInactive: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },

  // Condition
  conditionRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  conditionChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#F0F0ED",
  },
  conditionChipActive: {
    backgroundColor: colors.neonGreen + "20",
    borderWidth: 1,
    borderColor: colors.neonGreen,
  },
  conditionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  conditionTextActive: {
    color: colors.neonGreen,
  },

  // Bundle flow
  bundleStepLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginTop: 12,
    marginBottom: 16,
  },
  bundleCategoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  bundleCategoryCard: {
    width: "47%",
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    gap: 6,
  },
  bundleCategoryCardActive: {
    borderColor: colors.neonPurple,
    backgroundColor: colors.neonPurple + "08",
  },
  bundleCategoryEmoji: {
    fontSize: 32,
  },
  bundleCategoryLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  bundleCategoryLabelActive: {
    color: colors.neonPurple,
  },
  bundleSizeChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#F0F0ED",
  },
  bundleSizeChipActive: {
    backgroundColor: colors.neonPurple + "20",
    borderWidth: 1,
    borderColor: colors.neonPurple,
  },
  bundleSizeText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textMuted,
  },
  bundleSizeTextActive: {
    color: colors.neonPurple,
  },
  countRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  countChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#F0F0ED",
  },
  countChipActive: {
    backgroundColor: colors.neonPurple + "20",
    borderWidth: 1,
    borderColor: colors.neonPurple,
  },
  countText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textMuted,
  },
  countTextActive: {
    color: colors.neonPurple,
  },
  bundlePreviewName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },

  // Buttons
  addButton: { width: "100%" },
  cancelButton: { alignSelf: "center", marginTop: 8 },

  // Success
  successContainer: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  successEmoji: {
    fontSize: 48,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  successName: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: 16,
  },
  successActions: {
    width: "100%",
    gap: 8,
    alignItems: "center",
  },
  successBtn: {
    width: "100%",
  },
});
