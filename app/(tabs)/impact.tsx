import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradientColors } from "../../lib/colors";
import Avatar from "../../components/ui/Avatar";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import GradientText from "../../components/ui/GradientText";
import GradientBar from "../../components/ui/GradientBar";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useAppStore } from "../../stores/appStore";
import { useInventory } from "../../hooks/useInventory";
import { useFriends } from "../../hooks/useFriends";

// ---- Mock data ----

const MOCK_IMPACT = {
  given: 4,
  received: 2,
  valueShared: 340,
  lbsDiverted: 28,
};

interface MilestoneData {
  id: string;
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: string;
}

const MOCK_MILESTONES: MilestoneData[] = [
  {
    id: "m1",
    emoji: "\u{1F381}",
    title: "First Pass",
    description: "Passed along your first item",
    unlocked: true,
  },
  {
    id: "m2",
    emoji: "\u{1F91D}",
    title: "Circle Starter",
    description: "Invited 3 friends",
    unlocked: true,
  },
  {
    id: "m3",
    emoji: "\u{1F4E6}",
    title: "Bundle of Joy",
    description: "Sent a bundle of 3+ items",
    unlocked: true,
  },
  {
    id: "m4",
    emoji: "\u{1F504}",
    title: "Full Circle",
    description: "Received an item AND passed one along",
    unlocked: false,
    progress: "Receive your first item to unlock",
  },
  {
    id: "m5",
    emoji: "\u{1F3C6}",
    title: "Neighborhood Hero",
    description: "10 items circulated",
    unlocked: false,
    progress: "6 more to go!",
  },
  {
    id: "m6",
    emoji: "\u{1F30D}",
    title: "Planet Protector",
    description: "50 lbs kept out of landfills",
    unlocked: false,
    progress: "22 lbs to go!",
  },
];

interface ActivityItem {
  id: string;
  emoji: string;
  text: string;
  timeAgo: string;
}

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: "act1",
    emoji: "\u{1F49C}",
    text: "You passed along Snow Boots to Sarah's Oliver",
    timeAgo: "3 days ago",
  },
  {
    id: "act2",
    emoji: "\u{1F389}",
    text: "Mike accepted your Bugaboo stroller offer",
    timeAgo: "5 days ago",
  },
  {
    id: "act3",
    emoji: "\u{1F4E6}",
    text: "You sent a Winter Jacket bundle to Sarah",
    timeAgo: "1 week ago",
  },
  {
    id: "act4",
    emoji: "\u{1F331}",
    text: "Lisa passed along a Toddler Bike to your Maya",
    timeAgo: "2 weeks ago",
  },
];

// ---- Helpers ----

function getRankTitle(itemCount: number): { title: string; emoji: string } {
  if (itemCount >= 20) return { title: "Circulation Legend", emoji: "\u{1F451}" };
  if (itemCount >= 10) return { title: "Neighborhood Hero", emoji: "\u{1F3C6}" };
  if (itemCount >= 5) return { title: "Gear Guardian", emoji: "\u{1F6E1}" };
  if (itemCount >= 1) return { title: "Kind Starter", emoji: "\u{1F331}" };
  return { title: "Getting Started", emoji: "\u{1F44B}" };
}

// ---- Component ----

export default function ImpactScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { userName, userInitials } = useAppStore();
  const { items: inventoryItems } = useInventory(userId);
  const { friends } = useFriends(userId);

  const impact = useMemo(() => {
    const given = inventoryItems.filter((i) => i.status === "handed-off").length;
    const valueShared = inventoryItems
      .filter((i) => i.status === "handed-off")
      .reduce((sum, i) => sum + (i.pricing?.amount ?? 85), 0);
    return {
      given,
      received: 0,
      valueShared,
      lbsDiverted: given * 7,
    };
  }, [inventoryItems]);

  const displayImpact =
    impact.given > 0 ? impact : MOCK_IMPACT;

  const totalCirculated = displayImpact.given + displayImpact.received;
  const rank = getRankTitle(totalCirculated);

  const circleItemCount = displayImpact.given + displayImpact.received;
  const circleFriendCount = friends.length > 0 ? friends.length : 4;

  const comingSoon = () => Alert.alert("Coming soon");

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header row */}
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Impact</Text>
          <Pressable
            onPress={() => router.push("/profile" as `/${string}`)}
            hitSlop={12}
          >
            <Avatar initials={userInitials || "??"} size={36} gradient />
          </Pressable>
        </View>

        {/* ---- Hero Stats Card ---- */}
        <Card style={styles.heroCardOuter}>
          <LinearGradient
            colors={gradientColors.subtle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            {/* Rank */}
            <Text style={styles.rankEmoji}>{rank.emoji}</Text>
            <GradientText style={styles.rankTitle}>{rank.title}</GradientText>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <GradientText style={styles.statNumber}>
                  {displayImpact.given}
                </GradientText>
                <Text style={styles.statLabel}>passed{"\n"}along</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <GradientText style={styles.statNumber}>
                  {displayImpact.received}
                </GradientText>
                <Text style={styles.statLabel}>received</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <GradientText style={styles.statNumber}>
                  ${displayImpact.valueShared}
                </GradientText>
                <Text style={styles.statLabel}>saved</Text>
              </View>
            </View>

            {/* Share button */}
            <Button
              variant="ghost"
              size="sm"
              title={"Share your impact \u2197"}
              onPress={comingSoon}
              style={styles.shareBtn}
            />
          </LinearGradient>
        </Card>

        {/* ---- Environmental Impact ---- */}
        <Card style={styles.envCard}>
          <View style={styles.envRow}>
            <Text style={styles.envEmoji}>{"\u{1F30D}"}</Text>
            <View style={styles.envInfo}>
              <Text style={styles.envTitle}>
                {displayImpact.lbsDiverted} lbs kept out of landfills
              </Text>
              <Text style={styles.envSub}>
                That's like saving {Math.max(1, Math.round(displayImpact.lbsDiverted / 15))} trees worth of resources
              </Text>
            </View>
          </View>
        </Card>

        {/* ---- Circle Stats ---- */}
        <Card style={styles.circleCard}>
          <Text style={styles.circleTitle}>Your circle together</Text>
          <View style={styles.circleStatsRow}>
            <View style={styles.circleStatCol}>
              <Text style={styles.circleStatNumber}>{circleFriendCount}</Text>
              <Text style={styles.circleStatLabel}>friends</Text>
            </View>
            <View style={styles.circleStatCol}>
              <Text style={styles.circleStatNumber}>{circleItemCount + 19}</Text>
              <Text style={styles.circleStatLabel}>items{"\n"}circulated</Text>
            </View>
            <View style={styles.circleStatCol}>
              <Text style={styles.circleStatNumber}>${displayImpact.valueShared + 580}</Text>
              <Text style={styles.circleStatLabel}>total{"\n"}saved</Text>
            </View>
          </View>
          <Text style={styles.circleNote}>
            More friends = better matches for everyone {"\u{2728}"}
          </Text>
        </Card>

        {/* ---- Milestones ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Milestones</Text>
          <View style={styles.milestoneList}>
            {MOCK_MILESTONES.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.milestoneRow,
                  !m.unlocked && styles.milestoneLocked,
                ]}
              >
                <View
                  style={[
                    styles.milestoneEmojiCircle,
                    !m.unlocked && styles.milestoneEmojiLocked,
                  ]}
                >
                  <Text style={styles.milestoneEmoji}>{m.emoji}</Text>
                </View>
                <View style={styles.milestoneInfo}>
                  <Text
                    style={[
                      styles.milestoneName,
                      !m.unlocked && styles.milestoneNameLocked,
                    ]}
                  >
                    {m.title}
                  </Text>
                  <Text style={styles.milestoneDesc}>
                    {m.unlocked ? m.description : m.progress ?? m.description}
                  </Text>
                </View>
                {m.unlocked && (
                  <Text style={styles.milestoneCheck}>{"\u2713"}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* ---- Recent Activity ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          <View style={styles.activityList}>
            {MOCK_ACTIVITY.map((a) => (
              <View key={a.id} style={styles.activityRow}>
                <Text style={styles.activityEmoji}>{a.emoji}</Text>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityText}>{a.text}</Text>
                  <Text style={styles.activityTime}>{a.timeAgo}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---- Styles ----

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  content: { padding: 20 },

  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },

  // Hero stats
  heroCardOuter: {
    padding: 0,
    overflow: "hidden",
    marginBottom: 16,
  },
  heroGradient: {
    padding: 24,
    alignItems: "center",
    borderRadius: 15,
  },
  rankEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  rankTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: "center",
    lineHeight: 15,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  shareBtn: {
    marginTop: 18,
  },

  // Environmental
  envCard: {
    marginBottom: 16,
  },
  envRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  envEmoji: {
    fontSize: 36,
  },
  envInfo: {
    flex: 1,
  },
  envTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 22,
  },
  envSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },

  // Circle stats
  circleCard: {
    marginBottom: 24,
    alignItems: "center",
  },
  circleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.violet,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  circleStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 12,
  },
  circleStatCol: {
    alignItems: "center",
  },
  circleStatNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  circleStatLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: "center",
    lineHeight: 14,
  },
  circleNote: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: "italic",
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },

  // Milestones
  milestoneList: {
    gap: 10,
  },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  milestoneLocked: {
    opacity: 0.5,
  },
  milestoneEmojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.violet + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneEmojiLocked: {
    backgroundColor: colors.border,
  },
  milestoneEmoji: {
    fontSize: 22,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  milestoneNameLocked: {
    color: colors.textMuted,
  },
  milestoneDesc: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  milestoneCheck: {
    fontSize: 18,
    color: colors.eucalyptus,
    fontWeight: "700",
  },

  // Activity
  activityList: {
    gap: 0,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  activityEmoji: {
    fontSize: 20,
    marginTop: 2,
  },
  activityInfo: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  activityTime: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },

  bottomSpacer: {
    height: 100,
  },
});
