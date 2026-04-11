import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Button from "../../components/ui/Button";
import { useAppStore } from "../../stores/appStore";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { colors, gradientColors } from "../../lib/colors";
import {
  getSuggestedItems,
  getRelevantMilestone,
  type MilestoneItem,
} from "../../lib/milestones";

const SEGMENTS = 4;
const CURRENT_STEP = 4;

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

  // Get milestone-based suggestions from the child's age
  const milestone = useMemo(() => {
    if (!firstChild?.dob) return null;
    return getRelevantMilestone(firstChild.dob);
  }, [firstChild]);

  const suggestedItems = useMemo(() => {
    if (!firstChild?.dob) return [];
    return getSuggestedItems(firstChild.dob);
  }, [firstChild]);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleItem = (item: MilestoneItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(item.name)) {
        next.delete(item.name);
      } else {
        next.add(item.name);
      }
      return next;
    });
  };

  const handleDone = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Add selected items to local store
    const itemsToAdd = suggestedItems.filter((i) => selected.has(i.name));
    itemsToAdd.forEach((item) => {
      addItem({
        id: generateId(),
        name: item.name,
        category: item.category,
        ageRange: "",
        status: "available",
        matchedTo: null,
        emoji: item.emoji,
      });
    });

    // Persist to Supabase
    if (session?.user?.id && itemsToAdd.length > 0) {
      const rows = itemsToAdd.map((item) => ({
        user_id: session.user.id,
        name: item.name,
        category: item.category,
        age_range: "",
        emoji: item.emoji,
        status: "available",
      }));
      await supabase.from("items").insert(rows);
    }

    setOnboardingComplete();
    router.replace("/(tabs)");
  };

  const handleSkip = () => {
    setOnboardingComplete();
    router.replace("/(tabs)");
  };

  // Friendly age label
  const ageLabel = milestone?.label ?? "";

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

      {/* Back button */}
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>{"\u2190"} Back</Text>
      </Pressable>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Friendly prompt */}
        <Text style={styles.heroEmoji}>
          {firstChild?.emoji ?? "\u{1F476}"}
        </Text>
        <Text style={styles.title}>
          {childName} is {ageLabel}!
        </Text>
        <Text style={styles.subtitle}>
          Anything come to mind that's been outgrown?{"\n"}
          Tap what you're ready to pass along.
        </Text>

        {/* Milestone items as tappable chips */}
        <View style={styles.chipGrid}>
          {suggestedItems.map((item) => {
            const isSelected = selected.has(item.name);
            return (
              <Pressable key={item.name} onPress={() => toggleItem(item)}>
                {isSelected ? (
                  <LinearGradient
                    colors={gradientColors.button}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.chip}
                  >
                    <Text style={styles.chipEmoji}>{item.emoji}</Text>
                    <Text style={styles.chipTextSelected}>{item.name}</Text>
                    <Text style={styles.chipCheck}>{"\u2713"}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.chipUnselected}>
                    <Text style={styles.chipEmoji}>{item.emoji}</Text>
                    <Text style={styles.chipText}>{item.name}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Reassurance */}
        <View style={styles.reassuranceCard}>
          <Text style={styles.reassuranceEmoji}>{"\u{1F4A1}"}</Text>
          <Text style={styles.reassuranceText}>
            No pressure! You can always add items later.{"\n"}
            We'll send friendly reminders at the right time.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom CTAs */}
      <View style={styles.bottom}>
        {selected.size > 0 ? (
          <Button
            variant="primary"
            size="lg"
            title={`Add ${selected.size} item${selected.size > 1 ? "s" : ""} \u2728`}
            onPress={handleDone}
            style={styles.button}
          />
        ) : (
          <Button
            variant="primary"
            size="lg"
            title="Done \u2014 show me the app \u2728"
            onPress={handleDone}
            style={styles.button}
          />
        )}
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    alignSelf: "flex-start",
  },
  backText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.violet,
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
    paddingTop: 24,
    paddingBottom: 20,
  },

  // Hero
  heroEmoji: {
    fontSize: 56,
    textAlign: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 8,
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },

  // Chips
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  chipUnselected: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    gap: 6,
  },
  chipEmoji: {
    fontSize: 16,
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
  chipCheck: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // Reassurance
  reassuranceCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reassuranceEmoji: {
    fontSize: 20,
    marginTop: 1,
  },
  reassuranceText: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },

  // Bottom
  bottom: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: "center",
    gap: 12,
  },
  button: {
    width: "100%",
  },
  skipText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textMuted,
  },
});
