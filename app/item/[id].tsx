import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
} from "react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../lib/colors";
import type { Item } from "../../lib/types";
import {
  CATEGORY_INFO,
  SIZE_OPTIONS,
  CONDITION_OPTIONS,
  type CatalogEntry,
  type Category,
  type SizeSystem,
} from "../../lib/itemCatalog";
import { useItemCatalog } from "../../hooks/useItemCatalog";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useInventory } from "../../hooks/useInventory";

// Mock items (covers IDs from home screen and stuff screen)
const MOCK_ITEMS: Record<string, Item> = {
  a1: {
    id: "a1",
    name: "Snow boots",
    category: "Clothing",
    ageRange: "2-3y",
    status: "aging-out",
    matchedTo: null,
    emoji: "\u{1F462}",
    daysLeft: 0,
  },
  a2: {
    id: "a2",
    name: "Board books set",
    category: "Books",
    ageRange: "12-18mo",
    status: "aging-out",
    matchedTo: null,
    emoji: "\u{1F4DA}",
    daysLeft: 5,
  },
  a3: {
    id: "a3",
    name: "Sleep sack",
    category: "Gear",
    ageRange: "6-12mo",
    status: "aging-out",
    matchedTo: null,
    emoji: "\u{1F634}",
    daysLeft: 12,
  },
  // Stuff screen mock IDs
  "1": {
    id: "1",
    name: "3-6mo clothes bundle",
    category: "Clothing",
    ageRange: "3-6mo",
    status: "aging-out",
    matchedTo: null,
    emoji: "\u{1F455}",
    daysLeft: 0,
    isBundle: true,
    count: 12,
  },
  "2": {
    id: "2",
    name: "Bugaboo stroller",
    category: "Strollers",
    ageRange: "6-12mo",
    status: "matched",
    matchedTo: "Mike J.",
    emoji: "\u{1F6BC}",
  },
  "3": {
    id: "3",
    name: "Winter jacket bundle",
    category: "Clothing",
    ageRange: "2-3y",
    status: "aging-out",
    matchedTo: null,
    emoji: "\u{1F9E5}",
    daysLeft: 5,
    isBundle: true,
    count: 3,
  },
  "4": {
    id: "4",
    name: "Board books set",
    category: "Books",
    ageRange: "12-18mo",
    status: "available",
    matchedTo: null,
    emoji: "\u{1F4DA}",
    isBundle: true,
    count: 8,
  },
  "5": {
    id: "5",
    name: "Infant car seat",
    category: "Car Seats",
    ageRange: "0-12mo",
    status: "handed-off",
    matchedTo: "Sarah C.",
    emoji: "\u{1F697}",
  },
  "6": {
    id: "6",
    name: "Play mat",
    category: "Gear",
    ageRange: "0-6mo",
    status: "available",
    matchedTo: null,
    emoji: "\u{1F3AA}",
  },
  fi1: {
    id: "fi1",
    name: "Rain boots",
    category: "Clothing",
    ageRange: "3-4y",
    status: "available",
    matchedTo: null,
    emoji: "\u{1F462}",
    from: "Sarah Chen",
    fromAvatar: "SC",
  },
  fi2: {
    id: "fi2",
    name: "Wooden blocks set",
    category: "Toys",
    ageRange: "2-4y",
    status: "available",
    matchedTo: null,
    emoji: "\u{1F9F1}",
    from: "Sarah Chen",
    fromAvatar: "SC",
  },
  fi3: {
    id: "fi3",
    name: "Baby monitor",
    category: "Gear",
    ageRange: "0-2y",
    status: "available",
    matchedTo: null,
    emoji: "\u{1F4F1}",
    from: "Mike Johnson",
    fromAvatar: "MJ",
  },
  fi4: {
    id: "fi4",
    name: "Toddler bike",
    category: "Gear",
    ageRange: "2-3y",
    status: "available",
    matchedTo: null,
    emoji: "\u{1F6B2}",
    from: "Lisa Park",
    fromAvatar: "LP",
  },
  fi5: {
    id: "fi5",
    name: "Winter coat",
    category: "Clothing",
    ageRange: "18mo-2y",
    status: "available",
    matchedTo: null,
    emoji: "\u{1F9E5}",
    from: "Lisa Park",
    fromAvatar: "LP",
  },
  fi6: {
    id: "fi6",
    name: "Stacking cups",
    category: "Toys",
    ageRange: "1-2y",
    status: "available",
    matchedTo: null,
    emoji: "\u{1FAA3}",
    from: "Lisa Park",
    fromAvatar: "LP",
  },
};

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { session } = useAuth();
  const userId = session?.user?.id;
  const { items, updateItem } = useInventory(userId);
  const { searchSmart } = useItemCatalog();

  // Try real data first, fall back to mock
  const realItem = items.find((i) => i.id === id);
  const item: Item | undefined = realItem ?? MOCK_ITEMS[id ?? ""];

  const [photo, setPhoto] = useState<string | null>(item?.photoUri ?? null);

  // ── Edit / smart search state ──────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editQuery, setEditQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editedName, setEditedName] = useState<string | null>(null);
  const [editedEmoji, setEditedEmoji] = useState<string | null>(null);
  const [editedCategory, setEditedCategory] = useState<Category | null>(null);
  const [editedSizeSystem, setEditedSizeSystem] = useState<SizeSystem | null>(null);
  const [editedSize, setEditedSize] = useState<string | null>(null);
  const [editedCondition, setEditedCondition] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  // Bundle item editing
  const [bundleItems, setBundleItems] = useState<{ name: string; emoji: string }[]>(
    item?.bundleItems ?? []
  );
  const [bundleAddQuery, setBundleAddQuery] = useState("");
  const bundleAddSuggestions = useMemo(() => {
    if (bundleAddQuery.length < 2 || !item?.category) return [];
    return searchSmart(bundleAddQuery, item.category as Category);
  }, [bundleAddQuery, searchSmart, item?.category]);

  const addBundleItem = (name: string, emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBundleItems((prev) => [...prev, { name, emoji }]);
    setBundleAddQuery("");
  };

  const removeBundleItem = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBundleItems((prev) => prev.filter((_, i) => i !== index));
  };

  const editCategory = (editedCategory ?? item?.category ?? "Gear") as Category;
  const suggestions = useMemo(() => {
    if (editQuery.length < 2) return [];
    return searchSmart(editQuery, editCategory);
  }, [editQuery, searchSmart, editCategory]);

  const startEditing = () => {
    setIsEditing(true);
    setEditQuery("");
    setShowSuggestions(false);
    setEditedName(null);
    setEditedEmoji(null);
    setEditedCategory(null);
    setEditedSizeSystem(null);
    setEditedSize(null);
    setEditedCondition(null);
    setSaved(false);
    setTimeout(() => searchInputRef.current?.focus(), 300);
  };

  const handleSelectSuggestion = (entry: CatalogEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const fullName = entry.brand ? `${entry.brand} ${entry.name}` : entry.name;
    setEditedName(fullName);
    setEditedEmoji(entry.emoji);
    setEditedCategory(entry.category);
    setEditedSizeSystem(entry.sizeSystem);
    setEditQuery(fullName);
    setShowSuggestions(false);
  };

  const handleUseCustomName = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditedName(editQuery);
    setEditedEmoji(null);
    setEditedCategory(null);
    setEditedSizeSystem(null);
    setShowSuggestions(false);
  };

  const handleCategorySelect = (cat: Category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const info = CATEGORY_INFO[cat];
    setEditedCategory(cat);
    setEditedEmoji(info?.emoji ?? item?.emoji ?? "📦");
    setEditedSizeSystem(info?.sizeSystem ?? "age-range");
  };

  const handleSave = async () => {
    if (!item || !id) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const updates: Record<string, any> = {};
    if (editedName) updates.name = editedName;
    if (editedEmoji) updates.emoji = editedEmoji;
    if (editedCategory) updates.category = editedCategory;
    if (editedSize) updates.ageRange = editedSize;
    if (editedCondition) updates.condition = editedCondition;
    if (item.isBundle && bundleItems.length > 0) {
      updates.bundleItems = bundleItems;
    }
    await updateItem(id, updates);
    setSaved(true);
    setTimeout(() => {
      setIsEditing(false);
      setSaved(false);
    }, 1200);
  };

  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  };

  if (!item) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Item not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Display values (edited or original)
  const displayName = editedName ?? item.name;
  const displayEmoji = editedEmoji ?? item.emoji;
  const displayCategory = editedCategory ?? (item.category as Category);
  const displaySize = editedSize ?? item.ageRange;
  const displayCondition = editedCondition ?? item.condition;
  const activeSizeSystem = editedSizeSystem ?? "age-range";
  const sizeOptions = SIZE_OPTIONS[activeSizeSystem] ?? [];

  const statusBadge = () => {
    switch (item.status) {
      case "aging-out":
        return <Badge color={colors.coral}>Time to go?</Badge>;
      case "available":
        return <Badge color={colors.eucalyptus}>Available</Badge>;
      case "matched":
        return <Badge color={colors.blue}>Matched</Badge>;
      case "handed-off":
        return <Badge color={colors.violet}>Handed off</Badge>;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{"\u2190"} Back</Text>
        </Pressable>

        {/* Item header — compact when editing */}
        {isEditing ? (
          <View style={styles.itemHeaderCompact}>
            <Text style={styles.itemEmojiCompact}>{displayEmoji}</Text>
            <View style={styles.itemHeaderCompactInfo}>
              <Text style={styles.itemNameCompact} numberOfLines={1}>{displayName}</Text>
              <Text style={styles.metaTextCompact}>
                {displayCategory} {"\u00B7"} {displaySize}
                {displayCondition ? ` \u00B7 ${displayCondition}` : ""}
              </Text>
            </View>
            {statusBadge()}
          </View>
        ) : (
          <View style={styles.itemHeader}>
            <Text style={styles.itemEmoji}>{displayEmoji}</Text>
            <Text style={styles.itemName}>{displayName}</Text>
            {item.isBundle && item.count && (
              <Text style={styles.bundleCount}>Bundle of {item.count}</Text>
            )}
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{displayCategory}</Text>
              <Text style={styles.metaDot}>{"\u00B7"}</Text>
              <Text style={styles.metaText}>{displaySize}</Text>
              {displayCondition && (
                <>
                  <Text style={styles.metaDot}>{"\u00B7"}</Text>
                  <Text style={styles.metaText}>{displayCondition}</Text>
                </>
              )}
            </View>
            <View style={styles.badgeRow}>{statusBadge()}</View>
          </View>
        )}

        {/* ── Bundle items list ── */}
        {item.isBundle && bundleItems.length > 0 && !isEditing && (
          <Card style={styles.bundleCard}>
            <Text style={styles.bundleCardTitle}>
              What's in this bundle ({bundleItems.length})
            </Text>
            {bundleItems.map((bi, idx) => (
              <View key={idx} style={styles.bundleListRow}>
                <Text style={styles.bundleListEmoji}>{bi.emoji}</Text>
                <Text style={styles.bundleListName} numberOfLines={1}>{bi.name}</Text>
                <TouchableOpacity onPress={() => removeBundleItem(idx)} style={styles.bundleListRemove}>
                  <Text style={styles.bundleListRemoveText}>{"\u2715"}</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Add more items inline */}
            <View style={styles.bundleAddRow}>
              <TextInput
                style={styles.bundleAddInput}
                placeholder="Add an item..."
                placeholderTextColor={colors.textLight}
                value={bundleAddQuery}
                onChangeText={setBundleAddQuery}
                autoCapitalize="words"
              />
            </View>
            {bundleAddQuery.length >= 2 && (
              <View style={styles.bundleAddSuggestions}>
                <TouchableOpacity
                  style={styles.bundleAddSuggestionRow}
                  onPress={() => addBundleItem(bundleAddQuery, item.emoji)}
                  activeOpacity={0.6}
                >
                  <Text style={{ fontSize: 16 }}>{"\u2795"}</Text>
                  <Text style={styles.bundleAddSuggestionText}>Add "{bundleAddQuery}"</Text>
                </TouchableOpacity>
                {bundleAddSuggestions.map((entry, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.bundleAddSuggestionRow}
                    onPress={() => addBundleItem(
                      entry.brand ? `${entry.brand} ${entry.name}` : entry.name,
                      entry.emoji
                    )}
                    activeOpacity={0.6}
                  >
                    <Text style={{ fontSize: 16 }}>{entry.emoji}</Text>
                    <Text style={styles.bundleAddSuggestionText} numberOfLines={1}>
                      {entry.brand ? `${entry.brand} ` : ""}{entry.name}
                    </Text>
                    <Text style={{ fontSize: 16, color: colors.eucalyptus }}>+</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Save bundle changes */}
            <TouchableOpacity
              style={styles.bundleSaveBtn}
              onPress={async () => {
                await updateItem(id!, { bundleItems });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.bundleSaveBtnText}>Save changes</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* ── Edit / Smart Search Section ── */}
        {!isEditing && (
          <TouchableOpacity
            style={styles.editBtnRow}
            onPress={startEditing}
            activeOpacity={0.7}
          >
            <Text style={styles.editBtnIcon}>{"\u270F\uFE0F"}</Text>
            <Text style={styles.editBtnText}>Update item details</Text>
          </TouchableOpacity>
        )}

        {isEditing && (
          <Card style={styles.editCard}>
            {saved ? (
              <View style={styles.savedBox}>
                <Text style={styles.savedEmoji}>{"\u2728"}</Text>
                <Text style={styles.savedText}>Updated!</Text>
              </View>
            ) : (
              <>
                {/* Smart search bar */}
                <Text style={styles.editLabel}>What is this item?</Text>
                <View style={styles.searchRow}>
                  <TextInput
                    ref={searchInputRef}
                    style={styles.searchInput}
                    placeholder="Search brands & items..."
                    placeholderTextColor={colors.textLight}
                    value={editQuery}
                    onChangeText={(t) => {
                      setEditQuery(t);
                      setShowSuggestions(t.length >= 2);
                      // Reset selection when typing new query
                      if (editedName && t !== editedName) {
                        setEditedName(null);
                        setEditedEmoji(null);
                        setEditedCategory(null);
                        setEditedSizeSystem(null);
                        setEditedSize(null);
                      }
                    }}
                    autoCapitalize="words"
                    returnKeyType="search"
                  />
                  {editQuery.length > 0 && (
                    <Pressable
                      onPress={() => {
                        setEditQuery("");
                        setShowSuggestions(false);
                        setEditedName(null);
                      }}
                      style={styles.clearBtn}
                    >
                      <Text style={styles.clearBtnText}>{"\u2715"}</Text>
                    </Pressable>
                  )}
                </View>

                {/* Suggestions dropdown */}
                {showSuggestions && editQuery.length >= 2 && (
                  <View style={styles.suggestionsBox}>
                    {/* Custom name — always first */}
                    <TouchableOpacity
                      style={[styles.suggestionRow, styles.customRow]}
                      onPress={handleUseCustomName}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.suggestionEmoji}>{"\u2795"}</Text>
                      <Text style={styles.customText}>
                        Use "{editQuery}" as name
                      </Text>
                    </TouchableOpacity>
                    {suggestions.map((entry, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.suggestionRow}
                        onPress={() => handleSelectSuggestion(entry)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.suggestionEmoji}>{entry.emoji}</Text>
                        <View style={styles.suggestionInfo}>
                          <Text style={styles.suggestionName} numberOfLines={1}>
                            {entry.brand ? `${entry.brand} ${entry.name}` : entry.name}
                          </Text>
                          <Text style={styles.suggestionCategory}>{entry.category}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Category picker (shown for custom names) */}
                {editedName && !editedCategory && (
                  <View style={styles.pickerSection}>
                    <Text style={styles.pickerLabel}>Category</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.chipRow}
                    >
                      {Object.entries(CATEGORY_INFO).map(([cat, info]) => (
                        <TouchableOpacity
                          key={cat}
                          style={styles.chip}
                          onPress={() => handleCategorySelect(cat as Category)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.chipEmoji}>{info.emoji}</Text>
                          <Text style={styles.chipText}>{cat}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Size picker */}
                {editedName && editedCategory && sizeOptions.length > 0 && (
                  <View style={styles.pickerSection}>
                    <Text style={styles.pickerLabel}>Size</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.chipRow}
                    >
                      {sizeOptions.map((size) => (
                        <TouchableOpacity
                          key={size}
                          style={[
                            styles.chip,
                            editedSize === size && styles.chipActive,
                          ]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setEditedSize(size);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              editedSize === size && styles.chipTextActive,
                            ]}
                          >
                            {size}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Condition picker */}
                {editedName && editedCategory && (
                  <View style={styles.pickerSection}>
                    <Text style={styles.pickerLabel}>Condition</Text>
                    <View style={styles.conditionRow}>
                      {CONDITION_OPTIONS.map((c) => (
                        <TouchableOpacity
                          key={c}
                          style={[
                            styles.chip,
                            editedCondition === c && styles.chipActive,
                          ]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setEditedCondition(c);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              editedCondition === c && styles.chipTextActive,
                            ]}
                          >
                            {c}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Action buttons */}
                <View style={styles.editActions}>
                  <Pressable
                    onPress={() => setIsEditing(false)}
                    style={styles.cancelBtn}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                  {editedName && editedCategory && (
                    <Button
                      variant="primary"
                      size="md"
                      title="Save changes"
                      onPress={handleSave}
                    />
                  )}
                </View>
              </>
            )}
          </Card>
        )}

        {/* Photo — hidden when editing to save space */}
        {!isEditing && (
          <View style={styles.photoSection}>
            {photo ? (
              <TouchableOpacity onPress={handleAddPhoto} activeOpacity={0.8}>
                <Image source={{ uri: photo }} style={styles.photoPreview} />
                <Text style={styles.photoChangeText}>Change photo</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.addPhotoBtn}
                onPress={handleAddPhoto}
                activeOpacity={0.7}
              >
                <Text style={styles.addPhotoIcon}>{"\u{1F4F7}"}</Text>
                <Text style={styles.addPhotoText}>Add a photo</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Status-specific content */}
        {item.status === "aging-out" && (
          <Card style={styles.statusCard}>
            <Text style={styles.statusTitle}>
              Ready to pass this along?
            </Text>
            <Text style={styles.statusSub}>
              If your little one has moved on, we can find it a new home in your circle.
            </Text>
            <Button
              variant="primary"
              size="md"
              title="Find a match now"
              onPress={() => router.push("/(tabs)/shop")}
              style={styles.actionBtn}
            />
          </Card>
        )}

        {item.status === "matched" && item.matchedTo && (
          <Card style={styles.statusCard}>
            <Text style={styles.statusTitle}>Matched!</Text>
            <Text style={styles.statusSub}>
              This item has been matched to {item.matchedTo}.
            </Text>
          </Card>
        )}

        {item.status === "handed-off" && (
          <Card style={styles.statusCard}>
            <Text style={styles.statusEmoji}>{"\u{1F30D}"}</Text>
            <Text style={styles.statusTitle}>Handed off!</Text>
            <Text style={styles.statusSub}>
              This item found a new home. Thanks for keeping it out of the
              landfill!
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    color: colors.violet,
    fontWeight: "600",
  },

  // Item header — full
  itemHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  itemEmoji: {
    fontSize: 56,
  },
  itemName: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginTop: 8,
    textAlign: "center",
  },

  // Item header — compact (when editing)
  itemHeaderCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemEmojiCompact: {
    fontSize: 28,
  },
  itemHeaderCompactInfo: {
    flex: 1,
  },
  itemNameCompact: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  metaTextCompact: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  bundleCount: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  metaText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  metaDot: {
    fontSize: 14,
    color: colors.textLight,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },

  // Photo
  photoSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  addPhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.card,
  },
  addPhotoIcon: {
    fontSize: 18,
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.violet,
  },
  photoPreview: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  photoChangeText: {
    fontSize: 13,
    color: colors.violet,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 6,
  },

  // Edit button
  editBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.violet,
    borderStyle: "dashed",
    backgroundColor: colors.card,
    alignSelf: "center",
  },
  editBtnIcon: {
    fontSize: 16,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.violet,
  },

  // Edit card
  editCard: {
    marginBottom: 16,
    gap: 12,
  },
  editLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 12,
  },
  clearBtn: {
    padding: 6,
  },
  clearBtnText: {
    fontSize: 14,
    color: colors.textMuted,
  },

  // Suggestions
  suggestionsBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
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
  suggestionEmoji: {
    fontSize: 20,
    width: 28,
    textAlign: "center",
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
  customRow: {
    backgroundColor: colors.bg,
    borderBottomWidth: 0,
  },
  customText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.violet,
  },

  // Pickers
  pickerSection: {
    gap: 8,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  chipRow: {
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.eucalyptus,
    borderColor: colors.eucalyptus,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  chipTextActive: {
    color: "#000",
  },
  conditionRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },

  // Edit actions
  editActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },

  // Saved state
  savedBox: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 6,
  },
  savedEmoji: {
    fontSize: 28,
  },
  savedText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.eucalyptus,
  },

  // Status cards
  statusCard: {
    alignItems: "center",
    gap: 8,
  },
  statusEmoji: {
    fontSize: 36,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  statusSub: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  actionBtn: {
    marginTop: 8,
  },

  // Bundle items
  bundleCard: {
    marginBottom: 16,
    gap: 4,
  },
  bundleCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  bundleListRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  bundleListEmoji: {
    fontSize: 18,
  },
  bundleListName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  bundleListRemove: {
    padding: 4,
  },
  bundleListRemoveText: {
    fontSize: 14,
    color: colors.textLight,
  },
  bundleAddRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: colors.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  bundleAddInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 10,
  },
  bundleAddSuggestions: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginTop: 4,
  },
  bundleAddSuggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bundleAddSuggestionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  bundleSaveBtn: {
    alignSelf: "center",
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: colors.violet,
  },
  bundleSaveBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
