import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { colors, gradientColors } from "../../lib/colors";
import type { Match, Item, Friend } from "../../lib/types";
import GradientText from "../../components/ui/GradientText";
import GradientBar from "../../components/ui/GradientBar";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import SectionHeader from "../../components/ui/SectionHeader";
import MatchCelebration from "../../components/MatchCelebration";
import { useAuth } from "../../hooks/useAuth";
import { useMatches } from "../../hooks/useMatches";
import { useInventory } from "../../hooks/useInventory";
import { useFriends } from "../../hooks/useFriends";
import { useAppStore } from "../../stores/appStore";
import {
  getCurrentSeasonalPrompt,
  getNextMilestone,
} from "../../lib/milestones";
import { getActiveNudge, type Nudge } from "../../lib/nudges";

// --------------- Mock data ---------------

const MOCK_MATCHES: Match[] = [
  {
    id: "1",
    item: "Winter jacket bundle",
    itemEmoji: "\u{1F9E5}",
    isBundle: true,
    count: 3,
    from: "You",
    to: "Sarah Chen",
    toAvatar: "SC",
    toKid: "Oliver",
    toKidAge: "2 years",
    status: "ready",
    message:
      "Hey Sarah! We just wrapped up winter and Maya's outgrown these jackets. Oliver's about the right size \u2014 want them?",
    personalLine: "",
    pricing: null,
    daysAgo: 0,
  },
  {
    id: "2",
    item: "Bugaboo stroller",
    itemEmoji: "\u{1F6BC}",
    from: "You",
    to: "Mike Johnson",
    toAvatar: "MJ",
    toKid: "Emma",
    toKidAge: "8 months",
    status: "offered",
    message:
      "Hey Mike! This stroller served us well and Emma's at the perfect age for it.",
    personalLine: "Miss you guys! Park date soon? \u{1F49B}",
    pricing: { type: "free" },
    daysAgo: 2,
    sentAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

const MOCK_AGING_ITEMS: Item[] = [
  {
    id: "a1",
    name: "Snow boots",
    category: "Clothing",
    ageRange: "2-3y",
    status: "aging-out",
    matchedTo: null,
    emoji: "\u{1F462}",
    daysLeft: 0,
  },
  {
    id: "a2",
    name: "Board books set",
    category: "Books",
    ageRange: "12-18mo",
    status: "aging-out",
    matchedTo: null,
    emoji: "\u{1F4DA}",
    daysLeft: 5,
  },
  {
    id: "a3",
    name: "Sleep sack",
    category: "Gear",
    ageRange: "6-12mo",
    status: "aging-out",
    matchedTo: null,
    emoji: "\u{1F634}",
    daysLeft: 12,
  },
];

const MOCK_FRIENDS: Friend[] = [
  {
    id: "f1",
    name: "Sarah Chen",
    kids: [{ name: "Oliver", age: "2y" }],
    avatar: "SC",
    status: "active",
    itemsShared: 4,
  },
  {
    id: "f2",
    name: "Mike Johnson",
    kids: [{ name: "Emma", age: "8mo" }],
    avatar: "MJ",
    status: "active",
    itemsShared: 2,
  },
  {
    id: "f3",
    name: "Jess Park",
    kids: [{ name: "Lily", age: "3y" }],
    avatar: "JP",
    status: "active",
    itemsShared: 1,
  },
  {
    id: "f4",
    name: "Amy Lin",
    kids: [{ name: "Noah", age: "1y" }],
    avatar: "AL",
    status: "invited",
    itemsShared: 0,
  },
];

const MOCK_IMPACT = {
  itemCount: 4,
  estimatedValue: 340,
};

// --------------- Helpers ---------------

function firstName(fullName: string): string {
  return fullName.split(" ")[0];
}

// --------------- Component ---------------

export default function HomeScreen() {
  const router = useRouter();
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMatch, setCelebrationMatch] = useState<Match | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  // ---- Real data from Supabase ----
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { matches, loading: matchesLoading } = useMatches(userId);
  const { items, loading: itemsLoading } = useInventory(userId);
  const { friends, loading: friendsLoading } = useFriends(userId);
  const userInitials = useAppStore((s) => s.userInitials) || "\u{1F331}";
  const children = useAppStore((s) => s.children);

  // Nudge from backend (priority) or seasonal/milestone fallback
  const [promptDismissed, setPromptDismissed] = useState(false);
  const [activeNudge, setActiveNudge] = useState<Nudge | null>(null);
  const seasonalPrompt = getCurrentSeasonalPrompt();
  const firstChild = children[0];
  const nextMilestone = firstChild?.dob
    ? getNextMilestone(firstChild.dob)
    : null;

  // Fetch nudge on mount
  React.useEffect(() => {
    if (!userId || children.length === 0) return;
    const childData = children.map((c) => ({
      id: c.id,
      name: c.name,
      dob: c.dob,
    }));
    getActiveNudge(userId, childData).then(setActiveNudge);
  }, [userId, children]);

  const isLoading = (matchesLoading || itemsLoading || friendsLoading) && !timedOut;

  // Loading timeout: after 3 seconds, show mock data anyway
  React.useEffect(() => {
    if (!matchesLoading && !itemsLoading && !friendsLoading) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(timer);
  }, [matchesLoading, itemsLoading, friendsLoading]);

  // Fallback to mock data when no real data and not loading (or timed out)
  const displayMatches =
    matches.length > 0 ? matches : isLoading ? [] : MOCK_MATCHES;
  const agingItems = items.filter((i) => i.status === "aging-out");
  const displayAgingItems =
    agingItems.length > 0 ? agingItems : isLoading ? [] : MOCK_AGING_ITEMS;
  const displayFriends =
    friends.length > 0 ? friends : isLoading ? [] : MOCK_FRIENDS;

  // Impact stats from real data
  const handedOffItems = items.filter((i) => i.status === "handed-off");
  const realImpact = {
    itemCount: handedOffItems.length,
    estimatedValue: handedOffItems.length * 85, // rough estimate per item
  };
  const displayImpact =
    handedOffItems.length > 0 ? realImpact : MOCK_IMPACT;

  const handleSend = (match: Match) => {
    setCelebrationMatch(match);
    setShowCelebration(true);
  };

  const handleCelebrationSend = () => {
    setShowCelebration(false);
    setCelebrationMatch(null);
  };

  const handleCelebrationDismiss = () => {
    setShowCelebration(false);
    setCelebrationMatch(null);
  };

  const readyMatches = displayMatches.filter(
    (m) => m.status === "ready" || m.status === "offered" || m.status === "accepted" || m.status === "scheduled"
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.neonPurple} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Header ---- */}
        <View style={styles.headerRow}>
          <GradientText style={styles.logo}>Watasu</GradientText>
          <Pressable onPress={() => router.push("/profile")}>
            <Avatar initials={userInitials} size={40} gradient />
          </Pressable>
        </View>

        {/* ---- Nudge / Seasonal / Milestone prompt ---- */}
        {!promptDismissed && (activeNudge || seasonalPrompt || nextMilestone) && (
          <View style={styles.section}>
            <Card style={styles.promptCard}>
              <Pressable
                style={styles.promptDismiss}
                onPress={() => setPromptDismissed(true)}
                hitSlop={12}
              >
                <Text style={styles.promptDismissText}>{"\u2715"}</Text>
              </Pressable>
              {activeNudge ? (
                <>
                  <Text style={styles.promptEmoji}>{activeNudge.emoji}</Text>
                  <Text style={styles.promptTitle}>{activeNudge.title}</Text>
                  <Text style={styles.promptMessage}>{activeNudge.message}</Text>
                  <Pressable
                    style={styles.promptAction}
                    onPress={() => router.push(activeNudge.actionRoute as `/${string}`)}
                  >
                    <Text style={styles.promptActionText}>
                      {activeNudge.actionLabel} {"\u2192"}
                    </Text>
                  </Pressable>
                </>
              ) : nextMilestone ? (
                <>
                  <Text style={styles.promptEmoji}>{"\u{1F382}"}</Text>
                  <Text style={styles.promptTitle}>
                    {firstChild?.name ?? "Your kiddo"} {nextMilestone.prompt}
                  </Text>
                  <Pressable
                    style={styles.promptAction}
                    onPress={() => router.push("/(tabs)/stuff" as `/${string}`)}
                  >
                    <Text style={styles.promptActionText}>
                      Review items {"\u2192"}
                    </Text>
                  </Pressable>
                </>
              ) : seasonalPrompt ? (
                <>
                  <Text style={styles.promptEmoji}>{seasonalPrompt.emoji}</Text>
                  <Text style={styles.promptTitle}>{seasonalPrompt.title}</Text>
                  <Text style={styles.promptMessage}>
                    {seasonalPrompt.message}
                  </Text>
                  <Pressable
                    style={styles.promptAction}
                    onPress={() => router.push("/(tabs)/stuff" as `/${string}`)}
                  >
                    <Text style={styles.promptActionText}>
                      Check your stuff {"\u2192"}
                    </Text>
                  </Pressable>
                </>
              ) : null}
            </Card>
          </View>
        )}

        {/* ---- Ready to go ---- */}
        {readyMatches.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Ready to go" />
            <View style={styles.sectionGap} />
            {readyMatches.map((match) => (
              <Card
                key={match.id}
                onPress={() =>
                  router.push(`/match/${match.id}` as `/${string}`)
                }
                style={styles.matchCard}
              >
                {match.status === "ready" && (
                  <GradientBar
                    height={3}
                    style={styles.matchGradientBar}
                  />
                )}

                {/* Item row */}
                <View style={styles.matchItemRow}>
                  <Text style={styles.matchEmoji}>{match.itemEmoji}</Text>
                  <View style={styles.matchItemInfo}>
                    <Text style={styles.matchItemName}>{match.item}</Text>
                    <Text style={styles.matchTo}>
                      {"\u2192"} {firstName(match.to)}'s {match.toKid} (
                      {match.toKidAge})
                    </Text>
                  </View>
                </View>

                {/* Badge */}
                <View style={styles.badgeRow}>
                  {match.status === "ready" && (
                    <Badge color="#34D399">Match found!</Badge>
                  )}
                  {match.status === "offered" && (
                    <>
                      <Badge color="#60A5FA">Offer out! 🎉</Badge>
                      {match.sentAt && (Date.now() - new Date(match.sentAt).getTime()) > 48 * 3600000 && (
                        <Pressable onPress={() => router.push(`/match/${match.id}?nudge=true` as `/${string}`)}>
                          <Badge color="#FB923C">👋 Nudge {firstName(match.to)}</Badge>
                        </Pressable>
                      )}
                    </>
                  )}
                  {match.status === "accepted" && (
                    <Badge color="#C084FC">Offer accepted! 🙌</Badge>
                  )}
                  {match.status === "scheduled" && (
                    <Badge color="#FB923C">Handoff planned</Badge>
                  )}
                </View>

                {/* Message preview for ready matches */}
                {match.status === "ready" && (
                  <LinearGradient
                    colors={gradientColors.subtle}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.messagePreview}
                  >
                    <Text style={styles.messageLabel}>FROM WATASU, WITH LOVE</Text>
                    <Text style={styles.messageText}>{match.message}</Text>
                    <Text style={styles.messageTapHint}>Tap to send or edit ✏️</Text>
                  </LinearGradient>
                )}

                {/* Personal line */}
                {match.personalLine ? (
                  <Text style={styles.personalLine}>
                    {match.status === "offered"
                      ? `You added: "${match.personalLine}"`
                      : match.personalLine}
                  </Text>
                ) : null}

                {/* Action buttons for ready matches */}
                {match.status === "ready" && (
                  <View style={styles.matchActions}>
                    <Button
                      variant="primary"
                      size="sm"
                      title={`Send to ${firstName(match.to)} \u{1F48C}`}
                      onPress={() => handleSend(match)}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      title="Edit"
                      onPress={() =>
                        router.push(`/match/${match.id}` as `/${string}`)
                      }
                      style={styles.editButton}
                    />
                  </View>
                )}
              </Card>
            ))}
          </View>
        )}

        {/* ---- Aging out soon ---- */}
        <View style={styles.section}>
          <SectionHeader
            title="Aging out soon"
            actionLabel="See all"
            onAction={() => {}}
          />
          <View style={styles.sectionGap} />
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={displayAgingItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.agingList}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push(`/item/${item.id}` as `/${string}`)}
              >
                <Card style={styles.agingCard}>
                  <Text style={styles.agingEmoji}>{item.emoji}</Text>
                  <Text style={styles.agingName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.agingAge}>{item.ageRange}</Text>
                  <View style={styles.agingBadge}>
                    {item.daysLeft === 0 ? (
                      <Badge color="#FF6B9D">Ready now</Badge>
                    ) : (
                      <Badge color="#FB923C">{item.daysLeft} days</Badge>
                    )}
                  </View>
                </Card>
              </Pressable>
            )}
          />
        </View>

        {/* ---- Your network ---- */}
        <View style={styles.section}>
          <SectionHeader
            title="Your network"
            actionLabel="Invite"
            onAction={() => {}}
          />
          <View style={styles.sectionGap} />
          <Card onPress={() => router.push("/(tabs)/friends" as `/${string}`)}>
            <View style={styles.networkRow}>
              <View style={styles.avatarStack}>
                {displayFriends.slice(0, 4).map((friend, idx) => (
                  <View
                    key={friend.id}
                    style={[
                      styles.stackedAvatar,
                      idx > 0 && { marginLeft: -12 },
                      { zIndex: 4 - idx },
                    ]}
                  >
                    <Avatar initials={friend.avatar} size={36} />
                  </View>
                ))}
              </View>
              <Text style={styles.friendCount}>
                {displayFriends.length} friends in your circle
              </Text>
            </View>
          </Card>
          <View style={styles.sectionGap} />
          <Card
            onPress={() => router.push("/friends/nearby" as `/${string}`)}
            style={styles.finderCard}
          >
            <Text style={styles.finderEmoji}>{"\u{1F30D}"}</Text>
            <View style={styles.finderText}>
              <Text style={styles.finderTitle}>
                Families nearby with similar-age kids?
              </Text>
              <Text style={styles.finderSub}>
                You might make a friend {"\u{1F49C}"}
              </Text>
            </View>
            <Text style={styles.finderArrow}>{"\u2192"}</Text>
          </Card>
        </View>

        {/* ---- Impact card ---- */}
        <View style={styles.section}>
          <Card style={styles.impactCardOuter} onPress={() => router.push("/(tabs)/impact" as `/${string}`)}>
            <LinearGradient
              colors={gradientColors.subtle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.impactGradient}
            >
              <Text style={styles.impactLabel}>Your circle's impact</Text>
              <GradientText style={styles.impactNumber}>
                {displayImpact.itemCount} items
              </GradientText>
              <Text style={styles.impactSub}>
                kept out of landfills, worth ~${displayImpact.estimatedValue}
              </Text>
            </LinearGradient>
          </Card>
        </View>

        {/* bottom spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ---- Celebration overlay ---- */}
      {celebrationMatch && (
        <MatchCelebration
          visible={showCelebration}
          item={celebrationMatch.item}
          itemEmoji={celebrationMatch.itemEmoji}
          friendName={firstName(celebrationMatch.to)}
          kidName={celebrationMatch.toKid}
          onSend={handleCelebrationSend}
          onDismiss={handleCelebrationDismiss}
        />
      )}
    </SafeAreaView>
  );
}

// --------------- Styles ---------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  logo: {
    fontSize: 28,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionGap: {
    height: 12,
  },

  // Prompt card
  promptCard: {
    alignItems: "center",
    paddingVertical: 20,
    position: "relative",
  },
  promptDismiss: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  promptDismissText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  promptEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  promptMessage: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  promptAction: {
    marginTop: 8,
  },
  promptActionText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.neonPurple,
  },

  // Match cards
  matchCard: {
    marginBottom: 12,
    overflow: "hidden",
  },
  matchGradientBar: {
    marginTop: -16,
    marginHorizontal: -16,
    marginBottom: 12,
    borderRadius: 0,
  },
  matchItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  matchEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  matchItemInfo: {
    flex: 1,
  },
  matchItemName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  matchTo: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  messagePreview: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  messageLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "600",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  messageText: {
    fontSize: 14,
    color: colors.text,
    fontStyle: "italic",
    lineHeight: 20,
  },
  messageTapHint: {
    fontSize: 12,
    color: colors.neonPurple,
    fontWeight: "600",
    marginTop: 8,
  },
  personalLine: {
    fontSize: 14,
    color: colors.neonPurple,
    marginBottom: 8,
  },
  matchActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  editButton: {
    marginLeft: 4,
  },

  // Aging out
  agingList: {
    paddingRight: 20,
  },
  agingCard: {
    minWidth: 140,
    marginRight: 12,
    alignItems: "flex-start",
  },
  agingEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  agingName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  agingAge: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 8,
  },
  agingBadge: {},

  // Network
  networkRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarStack: {
    flexDirection: "row",
    marginRight: 12,
  },
  stackedAvatar: {
    borderWidth: 2,
    borderColor: colors.card,
    borderRadius: 20,
  },
  friendCount: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },

  // Friend finder
  finderCard: {
    flexDirection: "row",
    alignItems: "center",
  },
  finderEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  finderText: {
    flex: 1,
  },
  finderTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  finderSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  finderArrow: {
    fontSize: 18,
    color: colors.neonPurple,
    fontWeight: "600",
  },

  // Impact
  impactCardOuter: {
    padding: 0,
    overflow: "hidden",
  },
  impactGradient: {
    padding: 24,
    alignItems: "center",
  },
  impactLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neonPurple,
    marginBottom: 8,
  },
  impactNumber: {
    fontSize: 32,
    marginBottom: 4,
  },
  impactSub: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },

  bottomSpacer: {
    height: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
