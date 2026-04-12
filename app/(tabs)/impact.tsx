import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "../../lib/colors";
import { useAuth } from "../../hooks/useAuth";
import { useInventory } from "../../hooks/useInventory";

// ── Warm palette ────────────────────────────────────────────────────

const warm = {
  textDark: "#1A1A1A",
  textMuted: "#8E8E93",
  screenBg: "#FAFAF8",
  cardBg: "#FFFFFF",
  divider: "#E5E2DE",
  progressBg: "#F0EDEA",
};

// ── Milestones ──────────────────────────────────────────────────────

interface MilestoneData {
  id: string;
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: string;
  current?: number;
  target?: number;
}

const MOCK_MILESTONES: MilestoneData[] = [
  { id: "m1", emoji: "\u{1F381}", title: "First Pass", description: "Passed along your first item", unlocked: true },
  { id: "m2", emoji: "\u{1F91D}", title: "Circle Starter", description: "Invited 3 friends", unlocked: true },
  { id: "m3", emoji: "\u{1F4E6}", title: "Bundle of Joy", description: "Sent a bundle of 3+ items", unlocked: true },
  { id: "m4", emoji: "\u{1F504}", title: "Full Circle", description: "Received an item AND passed one along", unlocked: false, progress: "Receive your first item to unlock" },
  { id: "m5", emoji: "\u{1F331}", title: "Seedling", description: "Pass along 10 items", unlocked: false, current: 6, target: 10 },
  { id: "m6", emoji: "\u{1F30D}", title: "Planet Protector", description: "50 lbs kept out of landfills", unlocked: false, current: 28, target: 50 },
];

// ── Screen ──────────────────────────────────────────────────────────

export default function ImpactScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { items } = useInventory(userId);

  const impact = useMemo(() => {
    const given = items.filter((i) => i.status === "handed-off").length;
    const valueShared = items
      .filter((i) => i.status === "handed-off")
      .reduce((sum, i) => sum + (i.pricing?.amount ?? 85), 0);
    return { given, received: 0, valueShared, lbsDiverted: given * 7 };
  }, [items]);

  const displayImpact = impact.given > 0
    ? impact
    : { given: 4, received: 2, valueShared: 340, lbsDiverted: 28 };

  const totalItems = displayImpact.given + displayImpact.received;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{"\u2190"} Your impact</Text>
        </Pressable>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{"\u{1F30D}"}</Text>
          <Text style={styles.heroStat}>{displayImpact.lbsDiverted} lbs kept from landfill</Text>
          <Text style={styles.heroStat}>${displayImpact.valueShared} saved in your community</Text>
          <Text style={styles.heroStat}>{totalItems} items given a new home</Text>
        </View>

        <View style={styles.divider} />

        {/* Milestones */}
        <Text style={styles.sectionTitle}>Milestones</Text>
        {MOCK_MILESTONES.map((m) => (
          <View key={m.id} style={[styles.milestoneRow, !m.unlocked && { opacity: 0.5 }]}>
            <View style={[styles.milestoneCircle, m.unlocked ? styles.milestoneUnlocked : styles.milestoneLocked]}>
              <Text style={styles.milestoneEmoji}>{m.emoji}</Text>
            </View>
            <View style={styles.milestoneInfo}>
              <Text style={styles.milestoneName}>{m.title}</Text>
              <Text style={styles.milestoneDesc}>
                {m.unlocked ? m.description : m.progress ?? m.description}
              </Text>
              {!m.unlocked && m.current !== undefined && m.target !== undefined && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min((m.current / m.target) * 100, 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>{m.current}/{m.target}</Text>
                </View>
              )}
            </View>
            {m.unlocked && <Text style={styles.milestoneCheck}>{"\u2713"}</Text>}
          </View>
        ))}

        <View style={styles.divider} />

        {/* Share */}
        <Pressable
          style={styles.shareButton}
          onPress={() => Alert.alert("Coming soon", "Share your impact card")}
        >
          <Text style={styles.shareButtonText}>Share your impact</Text>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: warm.screenBg },
  container: { flex: 1 },
  content: { padding: 20 },

  backBtn: { marginBottom: 24 },
  backText: { fontSize: 16, color: warm.textMuted, fontWeight: "500" },

  hero: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  heroEmoji: { fontSize: 48, marginBottom: 8 },
  heroStat: {
    fontSize: 16,
    color: warm.textDark,
    textAlign: "center",
    lineHeight: 24,
  },

  divider: {
    height: 1,
    backgroundColor: warm.divider,
    marginVertical: 24,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: warm.textDark,
    marginBottom: 16,
  },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    gap: 12,
  },
  milestoneCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  milestoneUnlocked: {
    backgroundColor: colors.eucalyptusLight,
  },
  milestoneLocked: {
    backgroundColor: warm.progressBg,
  },
  milestoneEmoji: { fontSize: 20 },
  milestoneInfo: { flex: 1 },
  milestoneName: {
    fontSize: 15,
    fontWeight: "600",
    color: warm.textDark,
  },
  milestoneDesc: {
    fontSize: 13,
    color: warm.textMuted,
    marginTop: 2,
  },
  milestoneCheck: {
    fontSize: 16,
    color: colors.eucalyptus,
    fontWeight: "700",
    marginTop: 4,
  },

  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: warm.progressBg,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.violet,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    color: warm.textMuted,
  },

  shareButton: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.violet,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
