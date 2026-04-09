import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Button from "../../components/ui/Button";
import { useAppStore } from "../../stores/appStore";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { colors, gradientColors } from "../../lib/colors";
import { searchProducts, Product } from "../../lib/productDatabase";

const SEGMENTS = 3;

const AGE_SUGGESTIONS: Record<string, string[]> = {
  "0-3": [
    "Newborn clothes",
    "Swaddles",
    "Bassinet",
    "Infant car seat",
    "Baby monitor",
    "Bottles",
    "Burp cloths",
    "Nursing pillow",
    "Diaper bag",
    "Play mat",
    "Pacifiers",
    "White noise machine",
  ],
  "3-6": [
    "3-6mo clothes",
    "Bouncer",
    "Activity gym",
    "Bumbo seat",
    "Teething toys",
    "Sleep sack",
    "High chair",
    "Exersaucer",
    "Baby carrier",
  ],
  "6-12": [
    "6-12mo clothes",
    "High chair",
    "Jumperoo",
    "Push walker",
    "Board books",
    "Sippy cups",
    "Baby gate",
    "Convertible car seat",
    "Sleep sack",
    "Stacking toys",
  ],
  "12-24": [
    "12-18mo clothes",
    "18-24mo clothes",
    "Toddler shoes",
    "Push walker",
    "Ride-on toys",
    "Toddler bed rail",
    "Potty seat",
    "Step stool",
    "Crayons",
    "Duplo blocks",
    "Balance bike",
  ],
  "24-36": [
    "2T-3T clothes",
    "Tricycle",
    "Balance bike",
    "Toddler backpack",
    "Potty seat",
    "Rain boots",
    "Play kitchen",
    "Art supplies",
    "Toddler bed",
    "Scooter",
  ],
  "36-60": [
    "3T-5T clothes",
    "Bicycle with training wheels",
    "Backpack",
    "Lunch box",
    "Art supplies",
    "Sports equipment",
    "Scooter",
    "Rain boots",
    "Chapter books",
    "Booster seat",
  ],
};

function getAgeMonths(dobStr: string): number {
  const dob = new Date(dobStr);
  const now = new Date();
  return (
    (now.getFullYear() - dob.getFullYear()) * 12 +
    (now.getMonth() - dob.getMonth())
  );
}

function getSuggestionsForAge(months: number): string[] {
  if (months < 3) return AGE_SUGGESTIONS["0-3"];
  if (months < 6) return AGE_SUGGESTIONS["3-6"];
  if (months < 12) return AGE_SUGGESTIONS["6-12"];
  if (months < 24) return AGE_SUGGESTIONS["12-24"];
  if (months < 36) return AGE_SUGGESTIONS["24-36"];
  return AGE_SUGGESTIONS["36-60"];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export default function InventorySuggestScreen() {
  const router = useRouter();
  const children = useAppStore((s) => s.children);
  const addItem = useAppStore((s) => s.addItem);
  const setOnboardingComplete = useAppStore((s) => s.setOnboardingComplete);
  const { session } = useAuth();

  const firstChild = children[0];
  const childName = firstChild?.name ?? "your kiddo";

  const suggestions = useMemo(() => {
    if (!firstChild) return AGE_SUGGESTIONS["0-3"];
    const months = getAgeMonths(firstChild.dob);
    return getSuggestionsForAge(months);
  }, [firstChild]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCustom, setShowCustom] = useState(false);
  const [customItem, setCustomItem] = useState("");

  const autocompleteResults = useMemo(() => {
    if (!customItem.trim()) return [];
    return searchProducts(customItem);
  }, [customItem]);

  const toggleChip = (item: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
  };

  const handleAddCustom = () => {
    const trimmed = customItem.trim();
    if (trimmed.length > 0) {
      setSelected((prev) => new Set(prev).add(trimmed));
      setCustomItem("");
      setShowCustom(false);
    }
  };

  const handleSelectProduct = (product: Product) => {
    setSelected((prev) => new Set(prev).add(product.name));
    setCustomItem("");
    setShowCustom(false);
  };

  const handleDone = async () => {
    selected.forEach((itemName) => {
      addItem({
        id: generateId(),
        name: itemName,
        category: "general",
        ageRange: "",
        status: "available",
        matchedTo: null,
        emoji: "📦",
      });
    });

    if (session?.user?.id) {
      const rows = Array.from(selected).map((itemName) => ({
        user_id: session.user.id,
        name: itemName,
        category: "General",
        age_range: "",
        emoji: "📦",
        status: "available",
      }));
      await supabase.from("items").insert(rows);
    }

    setOnboardingComplete();
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress bar — all filled */}
      <View style={styles.progressRow}>
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <View key={i} style={styles.segmentWrapper}>
            <LinearGradient
              colors={gradientColors.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.segment}
            />
          </View>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>What does {childName} have?</Text>
        <Text style={styles.subtitle}>
          Tap what you own. We'll track when it's time to pass it on.
        </Text>

        {/* Suggestion chips */}
        <View style={styles.chipGrid}>
          {suggestions.map((item) => {
            const isSelected = selected.has(item);
            return (
              <Pressable key={item} onPress={() => toggleChip(item)}>
                {isSelected ? (
                  <LinearGradient
                    colors={gradientColors.button}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.chip}
                  >
                    <Text style={styles.chipTextSelected}>{item}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.chipUnselected}>
                    <Text style={styles.chipText}>{item}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Custom item */}
        {showCustom ? (
          <View style={styles.customSection}>
            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                placeholder="e.g., Baby Monitor"
                placeholderTextColor={colors.textLight}
                value={customItem}
                onChangeText={setCustomItem}
                autoFocus
                onSubmitEditing={handleAddCustom}
              />
              <Button
                variant="secondary"
                size="sm"
                title="Add"
                onPress={handleAddCustom}
              />
            </View>
            {/* Autocomplete dropdown */}
            {autocompleteResults.length > 0 && (
              <View style={styles.autocompleteList}>
                {autocompleteResults.map((product) => (
                  <Pressable
                    key={product.name}
                    style={styles.autocompleteRow}
                    onPress={() => handleSelectProduct(product)}
                  >
                    <Text style={styles.autocompleteEmoji}>
                      {product.emoji}
                    </Text>
                    <View style={styles.autocompleteTextWrap}>
                      <Text style={styles.autocompleteName}>
                        {product.name}
                      </Text>
                      <Text style={styles.autocompleteCategory}>
                        {product.category}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ) : (
          <Button
            variant="ghost"
            size="md"
            title="+ Add something else"
            onPress={() => setShowCustom(true)}
            style={styles.addCustomButton}
          />
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottom}>
        <Button
          variant="primary"
          size="lg"
          title="Done — show me matches ✨"
          onPress={handleDone}
          disabled={selected.size === 0}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  progressRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  segmentWrapper: {
    flex: 1,
  },
  segment: {
    height: 4,
    borderRadius: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 8,
    marginBottom: 28,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  chipUnselected: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F0F0ED",
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  chipTextSelected: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  addCustomButton: {
    marginTop: 16,
    alignSelf: "flex-start",
  },
  customSection: {
    marginTop: 16,
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.card,
  },
  autocompleteList: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
    overflow: "hidden",
  },
  autocompleteRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  autocompleteEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  autocompleteTextWrap: {
    flex: 1,
  },
  autocompleteName: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
  },
  autocompleteCategory: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  bottom: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: "center",
  },
  button: {
    width: "100%",
  },
});
