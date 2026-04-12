import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "../lib/colors";
import { useAuth } from "../hooks/useAuth";
import { useInventory } from "../hooks/useInventory";

// ── Warm palette ────────────────────────────────────────────────────

const warm = {
  textDark: "#1A1A1A",
  textMuted: "#8E8E93",
  screenBg: "#FAFAF8",
  cardBg: "#FFFFFF",
  divider: "#EAE7E3",
};

// ── Milestones ──────────────────────────────────────────────────────

interface MilestoneData {
  id: string;
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: string;
}

const MOCK_MILESTONES: MilestoneData[] = [
  { id: "m1", emoji: "\u{1F381}", title: "First Pass", description: "Passed along your first item", unlocked: true },
  { id: "m2", emoji: "\u{1F91D}", title: "Circle Starter", description: "Invited 3 friends", unlocked: true },
  { id: "m3", emoji: "\u{1F4E6}", title: "Bundle of Joy", description: "Sent a bundle of 3+ items", unlocked: true },
  { id: "m4", emoji: "\u{1F504}", title: "Full Circle", description: "Received an item AND passed one along", unlocked: false, progress: "Receive your first item to unlock" },
  { id: "m5", emoji: "\u{1F3C6}", title: "Neighborhood Hero", description: "10 items circulated", unlocked: false, progress: "6 more to go!" },
  { id: "m6", emoji: "\u{1F30D}", title: "Planet Protector", description: "50 lbs kept out of landfills", unlocked: false, progress: "22 lbs to go!" },
];

// ── Helpers ─────────────────────────────────────────────────────────

function getRankTitle(count: number): { title: string; emoji: string } {
  if (count >= 20) return { title: "Circulation Legend", emoji: "\u{1F451}" };
  if (count >= 10) return { title: "Neighborhood Hero", emoji: "\u{1F3C6}" };
  if (count >= 5) return { title: "Gear Guardian", emoji: "\u{1F6E1}" };
  if (count >= 1) return { title: "Kind Starter", emoji: "\u{1F331}" };
  return { title: "Getting Started", emoji: "\u{1F44B}" };
}

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
  const totalCirculated = displayImpact.given + displayImpact.received;
  const rank = getRankTitle(totalCirculated);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{"\u2039"} Profile</Text>
        </Pressable>

        {/* Title */}
        <Text style={styles.title}>Your impact</Text>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{displayImpact.given}</Text>
            <Text style={styles.statLabel}>passed along</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{displayImpact.received}</Text>
            <Text style={styles.statLabel}>received</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>${displayImpact.valueShared}</Text>
            <Text style={styles.statLabel}>saved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{displayImpact.lbsDiverted}</Text>
            <Text style={styles.statLabel}>lbs from landfill</Text>
          </View>
        </View>

        {/* Rank */}
        <View style={styles.rankCard}>
          <Text style={styles.rankEmoji}>{rank.emoji}</Text>
          <Text style={styles.rankTitle}>{rank.title}</Text>
        </View>

        {/* Milestones */}
        <Text style={styles.sectionTitle}>Milestones</Text>
        {MOCK_MILESTONES.map((m) => (
          <View key={m.id} style={[styles.milestoneRow, !m.unlocked && { opacity: 0.4 }]}>
            <View style={[styles.milestoneCircle, m.unlocked ? styles.milestoneUnlocked : styles.milestoneLocked]}>
              <Text style={styles.milestoneEmoji}>{m.emoji}</Text>
            </View>
            <View style={styles.milestoneInfo}>
              <Text style={styles.milestoneName}>{m.title}</Text>
              <Text style={styles.milestoneDesc}>{m.unlocked ? m.description : m.progress ?? m.description}</Text>
            </View>
            {m.unlocked && <Text style={styles.milestoneCheck}>{"\u2713"}</Text>}
          </View>
        ))}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: warm.screenBg },
  container: { flex: 1 },
  content: { padding: 20 },

  backBtn: { marginBottom: 16 },
  backText: { fontSize: 16, color: warm.textMuted, fontWeight: "500" },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: warm.textDark,
    marginBottom: 20,
  },

  // Stats
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: "47%",
    backgroundColor: warm.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: warm.divider,
    padding: 16,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: warm.textDark,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: warm.textMuted,
  },

  // Rank
  rankCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.eucalyptusLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  rankEmoji: { fontSize: 24 },
  rankTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.eucalyptus,
  },

  // Milestones
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: warm.textDark,
    marginBottom: 12,
  },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  milestoneCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneUnlocked: {
    backgroundColor: colors.eucalyptusLight,
  },
  milestoneLocked: {
    backgroundColor: "#F5F3F0",
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
    marginTop: 1,
  },
  milestoneCheck: {
    fontSize: 16,
    color: colors.eucalyptus,
    fontWeight: "700",
  },
});
