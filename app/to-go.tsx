import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { colors, gradientColors } from "../lib/colors";
import { CONDITION_OPTIONS } from "../lib/itemCatalog";
import type { ToGoItem, Pricing } from "../lib/types";
import { useAppStore } from "../stores/appStore";
import { useAuth } from "../hooks/useAuth";
import { useInventory } from "../hooks/useInventory";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import PricingPicker from "../components/PricingPicker";

// ── Grouping logic ──────────────────────────────────────────────────

const CONDITION_RANK = ["Fair", "Good", "Great", "Like new"];

function medianCondition(items: ToGoItem[]): string {
  const indices = items
    .map((i) => CONDITION_RANK.indexOf(i.condition))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b);
  if (indices.length === 0) return "Good";
  const mid = Math.floor(indices.length / 2);
  return CONDITION_RANK[indices[mid]];
}

interface ToGoLine {
  type: "bundle" | "standalone";
  key: string;
  category: string;
  emoji: string;
  ageRange: string;
  items: ToGoItem[];
  displayCondition: string;
}

function groupToGoItems(items: ToGoItem[]): ToGoLine[] {
  const bundled = items.filter((i) => i.wantsBundle);
  const standalone = items.filter((i) => !i.wantsBundle);

  const bundleGroups = new Map<string, ToGoItem[]>();
  for (const item of bundled) {
    const key = `${item.category}::${item.ageRange}`;
    const group = bundleGroups.get(key) || [];
    group.push(item);
    bundleGroups.set(key, group);
  }

  const lines: ToGoLine[] = [];

  for (const [key, groupItems] of bundleGroups) {
    lines.push({
      type: "bundle",
      key,
      category: groupItems[0].category,
      emoji: groupItems[0].emoji,
      ageRange: groupItems[0].ageRange,
      items: groupItems,
      displayCondition: medianCondition(groupItems),
    });
  }

  for (const item of standalone) {
    lines.push({
      type: "standalone",
      key: item.localId,
      category: item.category,
      emoji: item.emoji,
      ageRange: item.ageRange,
      items: [item],
      displayCondition: item.condition,
    });
  }

  return lines;
}

// ── Component ───────────────────────────────────────────────────────

export default function ToGoScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { addItem } = useInventory(userId);

  const toGoItems = useAppStore((s) => s.toGoItems);
  const updateToGoItem = useAppStore((s) => s.updateToGoItem);
  const removeToGoItem = useAppStore((s) => s.removeToGoItem);
  const clearToGo = useAppStore((s) => s.clearToGo);

  const [pricingMap, setPricingMap] = useState<Record<string, Pricing | null>>({});
  const [expandedLine, setExpandedLine] = useState<string | null>(null);
  const [bundleModalLine, setBundleModalLine] = useState<ToGoLine | null>(null);
  const [saving, setSaving] = useState(false);

  const lines = useMemo(() => groupToGoItems(toGoItems), [toGoItems]);

  const setPricingForLine = (key: string, pricing: Pricing) => {
    setPricingMap((prev) => ({ ...prev, [key]: pricing }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      for (const line of lines) {
        const pricing = pricingMap[line.key] ?? null;
        if (line.type === "bundle") {
          await addItem({
            name: `${line.ageRange} ${line.category.toLowerCase()} bundle`,
            category: line.category,
            ageRange: line.ageRange,
            emoji: line.emoji,
            isBundle: true,
            count: line.items.length,
            bundleItems: line.items.map((i) => ({ name: i.name, emoji: i.emoji })),
            condition: line.displayCondition,
            pricing,
          });
        } else {
          const item = line.items[0];
          await addItem({
            name: item.name,
            category: item.category,
            ageRange: item.ageRange,
            emoji: item.emoji,
            condition: item.condition,
            pricing,
          });
        }
      }
      clearToGo();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/stuff");
    } catch (e) {
      console.error("Save failed:", e);
    } finally {
      setSaving(false);
    }
  };

  // Empty state
  if (toGoItems.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>{"\u{1F4E6}"}</Text>
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptyHint}>Add some items to get started</Text>
          <Button
            variant="primary"
            size="lg"
            title="+ Add an item"
            onPress={() => router.replace("/add-item")}
            style={styles.emptyBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Ready to go</Text>
          <Badge color={colors.neonPurple}>
            {toGoItems.length} item{toGoItems.length !== 1 ? "s" : ""}
          </Badge>
        </View>

        {/* Add another */}
        <TouchableOpacity
          style={styles.addAnotherBtn}
          onPress={() => router.push("/add-item")}
          activeOpacity={0.7}
        >
          <Text style={styles.addAnotherText}>+ Add another</Text>
        </TouchableOpacity>

        {/* Lines */}
        {lines.map((line) => {
          const isExpanded = expandedLine === line.key;
          const pricing = pricingMap[line.key] ?? null;
          const lineName =
            line.type === "bundle"
              ? `${line.ageRange} ${line.category.toLowerCase()} (\u00D7${line.items.length})`
              : line.items[0].name;

          return (
            <Card key={line.key} style={styles.lineCard}>
              {/* Line header */}
              <Pressable
                style={styles.lineHeader}
                onPress={() => {
                  if (line.type === "bundle") {
                    setBundleModalLine(line);
                  }
                }}
              >
                <LinearGradient
                  colors={["#FFF0F3", "#F3E8FF"]}
                  style={styles.emojiCircle}
                >
                  <Text style={styles.lineEmoji}>{line.emoji}</Text>
                </LinearGradient>
                <View style={styles.lineInfo}>
                  <Text style={styles.lineName} numberOfLines={1}>
                    {lineName}
                  </Text>
                  <View style={styles.lineMetaRow}>
                    <Badge color={colors.neonGreen}>{line.displayCondition}</Badge>
                    {line.type === "bundle" && (
                      <Text style={styles.tapHint}>Tap to manage</Text>
                    )}
                  </View>
                </View>
                {line.type === "standalone" && (
                  <TouchableOpacity
                    onPress={() => removeToGoItem(line.items[0].localId)}
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeBtnText}>{"\u2715"}</Text>
                  </TouchableOpacity>
                )}
              </Pressable>

              {/* Pricing toggle */}
              <Pressable
                style={styles.pricingToggle}
                onPress={() =>
                  setExpandedLine(isExpanded ? null : line.key)
                }
              >
                <Text style={styles.pricingToggleText}>
                  {pricing
                    ? pricing.type === "free"
                      ? "\u{1F381} Free"
                      : pricing.type === "give-what-you-can"
                      ? "\u{1F49B} You decide"
                      : `\u{1F3F7}\uFE0F $${pricing.amount ?? 0}`
                    : "Set pricing..."}
                </Text>
                <Text style={styles.pricingChevron}>
                  {isExpanded ? "\u25B2" : "\u25BC"}
                </Text>
              </Pressable>

              {isExpanded && (
                <View style={styles.pricingPickerWrapper}>
                  <PricingPicker
                    selected={pricing}
                    onSelect={(p) => setPricingForLine(line.key, p)}
                  />
                </View>
              )}
            </Card>
          );
        })}

        {/* Save all */}
        <View style={styles.saveSection}>
          <Button
            variant="primary"
            size="lg"
            title={saving ? "Saving..." : "All set \u2014 share these!"}
            onPress={handleSaveAll}
            disabled={saving}
            style={styles.saveBtn}
          />
          <Button
            variant="ghost"
            size="md"
            title="Cancel"
            onPress={() => router.back()}
            style={styles.cancelBtn}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bundle management modal */}
      <Modal
        visible={bundleModalLine !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setBundleModalLine(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setBundleModalLine(null)}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>
            {bundleModalLine?.emoji}{" "}
            {bundleModalLine?.ageRange} {bundleModalLine?.category}
          </Text>
          <Text style={styles.modalSubtitle}>
            Toggle items in or out of the bundle
          </Text>
          <ScrollView style={styles.modalList}>
            {bundleModalLine?.items.map((item) => (
              <View key={item.localId} style={styles.modalItemRow}>
                <Text style={styles.modalItemEmoji}>{item.emoji}</Text>
                <View style={styles.modalItemInfo}>
                  <Text style={styles.modalItemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.modalItemCondition}>{item.condition}</Text>
                </View>
                <Pressable
                  style={[
                    styles.bundleToggle,
                    item.wantsBundle && styles.bundleToggleOn,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateToGoItem(item.localId, {
                      wantsBundle: !item.wantsBundle,
                    });
                  }}
                >
                  <Text style={styles.bundleToggleText}>
                    {item.wantsBundle ? "Bundled" : "Solo"}
                  </Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.modalRemoveAll}
            onPress={() => {
              if (bundleModalLine) {
                for (const item of bundleModalLine.items) {
                  removeToGoItem(item.localId);
                }
                setBundleModalLine(null);
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.modalRemoveAllText}>Remove entire bundle</Text>
          </TouchableOpacity>
          <Button
            variant="primary"
            size="md"
            title="Done"
            onPress={() => setBundleModalLine(null)}
            style={styles.modalDoneBtn}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: "700", color: colors.text },

  // Add another
  addAnotherBtn: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.neonPurple,
    borderStyle: "dashed",
    marginBottom: 16,
  },
  addAnotherText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neonPurple,
  },

  // Line card
  lineCard: { marginBottom: 12 },
  lineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  emojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  lineEmoji: { fontSize: 20 },
  lineInfo: { flex: 1 },
  lineName: { fontSize: 16, fontWeight: "700", color: colors.text },
  lineMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  tapHint: { fontSize: 12, color: colors.textLight },
  removeBtn: { padding: 8 },
  removeBtnText: { fontSize: 14, color: colors.textLight },

  // Pricing toggle
  pricingToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pricingToggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textMuted,
  },
  pricingChevron: { fontSize: 10, color: colors.textLight },
  pricingPickerWrapper: { marginTop: 12 },

  // Save
  saveSection: { marginTop: 8, gap: 4 },
  saveBtn: { width: "100%" },
  cancelBtn: { alignSelf: "center" },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 8,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: colors.text },
  emptyHint: { fontSize: 14, color: colors.textMuted },
  emptyBtn: { marginTop: 16, width: "100%" },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalSheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: "70%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 16,
  },
  modalList: { maxHeight: 300 },
  modalItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  modalItemEmoji: { fontSize: 20 },
  modalItemInfo: { flex: 1 },
  modalItemName: { fontSize: 15, fontWeight: "600", color: colors.text },
  modalItemCondition: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  bundleToggle: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#F0F0ED",
  },
  bundleToggleOn: {
    backgroundColor: colors.neonPurple + "20",
    borderWidth: 1,
    borderColor: colors.neonPurple,
  },
  bundleToggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  modalRemoveAll: {
    alignSelf: "center",
    marginTop: 16,
    paddingVertical: 8,
  },
  modalRemoveAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.danger,
  },
  modalDoneBtn: { width: "100%", marginTop: 8 },
});
