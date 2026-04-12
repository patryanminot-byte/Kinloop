import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "../../lib/colors";
import type { Match, Item } from "../../lib/types";
import GradientText from "../../components/ui/GradientText";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useMatches } from "../../hooks/useMatches";
import { useInventory } from "../../hooks/useInventory";
import { useFriends } from "../../hooks/useFriends";
import { useAppStore } from "../../stores/appStore";

// --------------- Helpers ---------------

function firstName(fullName: string): string {
  return fullName.split(" ")[0];
}

function getSeason(): "spring" | "summer" | "fall" | "winter" {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

const SEASONAL_COPY: Record<string, { emoji: string; line1: string; line2: string }> = {
  spring: { emoji: "\u2744\uFE0F", line1: "Winter's over", line2: "Any jackets or snow gear\nto pass along?" },
  summer: { emoji: "\u2600\uFE0F", line1: "Kids grow fast in summer", line2: "Anything that doesn't fit?" },
  fall: { emoji: "\uD83C\uDF92", line1: "Back to school", line2: "Outgrown shoes or uniforms?" },
  winter: { emoji: "\uD83C\uDF81", line1: "End of year clearout", line2: "Toys, books, gear?" },
};

// --------------- Component ---------------

export default function HomeScreen() {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  // ---- Real data from Supabase ----
  const { session } = useAuth();
  const userId = session?.user?.id;
  const {
    matches,
    incomingOffers,
    loading: matchesLoading,
    acceptMatch,
    declineMatch,
  } = useMatches(userId);
  const { items, loading: itemsLoading } = useInventory(userId);
  const { friends, loading: friendsLoading } = useFriends(userId);
  const userInitials = useAppStore((s) => s.userInitials) || "\uD83C\uDF31";
  const children = useAppStore((s) => s.children);

  const isLoading =
    (matchesLoading || itemsLoading || friendsLoading) && !timedOut;

  React.useEffect(() => {
    if (!matchesLoading && !itemsLoading && !friendsLoading) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(timer);
  }, [matchesLoading, itemsLoading, friendsLoading]);

  // Seasonal nudge dismissal
  const [seasonalDismissed, setSeasonalDismissed] = useState(false);

  // ---- Determine if this is a "new" user (no items, no matches) ----
  const hasActivity =
    items.length > 0 || matches.length > 0 || incomingOffers.length > 0;

  // ---- Build smart feed cards ----
  const handedOffItems = items.filter((i) => i.status === "handed-off");
  const handedOffCount = handedOffItems.length;
  const estimatedSaved = handedOffCount * 85;

  // Matches that need attention (outgoing)
  const actionMatches = matches.filter(
    (m) => m.status === "ready" || m.status === "offered"
  );

  // Incoming offers waiting for response
  const pendingIncoming = incomingOffers.filter(
    (o) => o.status === "offered"
  );

  // Items matched to the user (accepted, coming their way)
  const comingYourWay = incomingOffers.filter(
    (o) => o.status === "accepted" || o.status === "scheduled"
  );

  // Seasonal nudge — only if user has listed items before
  const season = getSeason();
  const seasonalInfo = SEASONAL_COPY[season];
  const showSeasonal = hasActivity && !seasonalDismissed;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.violet} />
        </View>
      </SafeAreaView>
    );
  }

  // ========================
  // NEW USER — two big buttons
  // ========================
  if (!hasActivity) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.newUserContainer}>
          <GradientText style={styles.newUserLogo}>Watasu</GradientText>

          <View style={styles.newUserButtons}>
            <Pressable
              style={styles.bigButton}
              onPress={() => router.push("/add-item")}
            >
              <Text style={styles.bigButtonText}>I have something</Text>
            </Pressable>

            <Pressable
              style={[styles.bigButton, styles.bigButtonOutline]}
              onPress={() => router.push("/(tabs)/shop" as `/${string}`)}
            >
              <Text style={[styles.bigButtonText, styles.bigButtonTextOutline]}>
                I need something
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ========================
  // RETURNING USER — compact buttons + smart feed
  // ========================
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
          <Pressable
            onPress={() =>
              router.push("/(tabs)/profile" as `/${string}`)
            }
          >
            <Avatar initials={userInitials} size={36} gradient />
          </Pressable>
        </View>

        {/* ---- Compact action buttons ---- */}
        <View style={styles.compactRow}>
          <Pressable
            style={styles.compactButton}
            onPress={() => router.push("/add-item")}
          >
            <Text style={styles.compactButtonText}>I have something</Text>
          </Pressable>
          <Pressable
            style={[styles.compactButton, styles.compactButtonOutline]}
            onPress={() => router.push("/(tabs)/shop" as `/${string}`)}
          >
            <Text
              style={[
                styles.compactButtonText,
                styles.compactButtonTextOutline,
              ]}
            >
              I need something
            </Text>
          </Pressable>
        </View>

        {/* ---- SMART FEED ---- */}

        {/* Card A: Action matches — items ready to send */}
        {actionMatches.map((match) => (
          <Card
            key={match.id}
            style={styles.feedCard}
            onPress={() =>
              router.push(`/match/${match.id}` as `/${string}`)
            }
          >
            <View style={styles.feedItemRow}>
              <Text style={styles.feedEmoji}>{match.itemEmoji}</Text>
              <View style={styles.feedItemInfo}>
                <Text style={styles.feedItemName}>{match.item}</Text>
                <Text style={styles.feedItemSub}>
                  {"\u2192"} {firstName(match.to)}'s {match.toKid} (
                  {match.toKidAge})
                </Text>
              </View>
            </View>
            {match.status === "ready" && (
              <Button
                variant="primary"
                size="sm"
                title="Send"
                onPress={() =>
                  router.push(`/match/${match.id}` as `/${string}`)
                }
              />
            )}
            {match.status === "offered" && (
              <Badge color={colors.blue}>Waiting for response</Badge>
            )}
          </Card>
        ))}

        {/* Card B/C: Someone claimed or paid */}
        {matches
          .filter((m) => m.status === "accepted" || m.status === "handed-off")
          .slice(0, 2)
          .map((match) => (
            <Card key={match.id} style={styles.feedCard}>
              <Text style={styles.feedClaimText}>
                {match.pricing?.amount
                  ? `${firstName(match.to)} gave you $${match.pricing.amount} \uD83D\uDC9B`
                  : `${firstName(match.to)} claimed your ${match.item.toLowerCase()}! \uD83D\uDC9B`}
              </Text>
              {!match.pricing?.amount && (
                <Text style={styles.feedClaimSub}>
                  {"\u2192"} {match.toKid}
                </Text>
              )}
            </Card>
          ))}

        {/* Card D: Items matched to you (incoming offers) */}
        {pendingIncoming.map((offer) => (
          <Card key={offer.id} style={styles.feedCard}>
            <View style={styles.feedItemRow}>
              <Text style={styles.feedEmoji}>{offer.itemEmoji}</Text>
              <View style={styles.feedItemInfo}>
                <Text style={styles.feedItemName}>
                  {offer.item}
                </Text>
                <Text style={styles.feedItemSub}>
                  {firstName(offer.from)}'s {offer.toKid} {"\u00B7"}{" "}
                  {offer.toKidAge}
                </Text>
              </View>
            </View>
            <View style={styles.feedActions}>
              <Button
                variant="primary"
                size="sm"
                title={`Accept \uD83D\uDC9C`}
                onPress={() => acceptMatch(offer.id)}
              />
              <Button
                variant="secondary"
                size="sm"
                title="No thanks"
                onPress={() => declineMatch(offer.id)}
                style={{ marginLeft: 8 }}
              />
            </View>
          </Card>
        ))}

        {/* Coming your way */}
        {comingYourWay.map((offer) => (
          <Card key={offer.id} style={styles.feedCard}>
            <View style={styles.feedItemRow}>
              <Text style={styles.feedEmoji}>{offer.itemEmoji}</Text>
              <View style={styles.feedItemInfo}>
                <Text style={styles.feedItemName}>{offer.item}</Text>
                <Text style={styles.feedItemSub}>
                  From {firstName(offer.from)} {"\u2192"} {offer.toKid}
                </Text>
              </View>
            </View>
            <Badge color={colors.violet}>
              {offer.status === "accepted"
                ? "Arranging handoff"
                : "Handoff planned"}
            </Badge>
          </Card>
        ))}

        {/* Card E: Seasonal nudge */}
        {showSeasonal && (
          <Card style={styles.feedCard}>
            <Pressable
              style={styles.nudgeDismiss}
              onPress={() => setSeasonalDismissed(true)}
              hitSlop={12}
            >
              <Text style={styles.nudgeDismissText}>{"\u2715"}</Text>
            </Pressable>
            <Text style={styles.nudgeEmoji}>{seasonalInfo.emoji}</Text>
            <Text style={styles.nudgeLine1}>{seasonalInfo.line1}</Text>
            <Text style={styles.nudgeLine2}>{seasonalInfo.line2}</Text>
            <Button
              variant="primary"
              size="sm"
              title="Take a photo"
              onPress={() => router.push("/add-item")}
              style={{ marginTop: 12, alignSelf: "flex-start" }}
            />
          </Card>
        )}

        {/* Card F: Savings stat (subtle) */}
        {handedOffCount > 0 && (
          <View style={styles.impactLine}>
            <Text style={styles.impactText}>
              {handedOffCount} items passed along {"\u00B7"} ~$
              {estimatedSaved} saved
            </Text>
          </View>
        )}

        {/* bottom spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // ========================
  // NEW USER
  // ========================
  newUserContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  newUserLogo: {
    fontSize: 40,
    marginBottom: 64,
  },
  newUserButtons: {
    width: "100%",
    gap: 16,
  },
  bigButton: {
    backgroundColor: colors.eucalyptus,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bigButtonOutline: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.eucalyptus,
  },
  bigButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  bigButtonTextOutline: {
    color: colors.eucalyptus,
  },

  // ========================
  // RETURNING USER
  // ========================
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  logo: {
    fontSize: 24,
  },

  // Compact action buttons
  compactRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  compactButton: {
    flex: 1,
    backgroundColor: colors.eucalyptus,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  compactButtonOutline: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.eucalyptus,
  },
  compactButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  compactButtonTextOutline: {
    color: colors.eucalyptus,
  },

  // Smart feed cards
  feedCard: {
    marginBottom: 12,
    position: "relative",
  },
  feedItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  feedEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  feedItemInfo: {
    flex: 1,
  },
  feedItemName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  feedItemSub: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  feedActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  feedClaimText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  feedClaimSub: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Seasonal nudge
  nudgeDismiss: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
  },
  nudgeDismissText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  nudgeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  nudgeLine1: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  nudgeLine2: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },

  // Impact
  impactLine: {
    paddingVertical: 16,
    alignItems: "center",
  },
  impactText: {
    fontSize: 14,
    color: colors.textMuted,
  },

  bottomSpacer: {
    height: 40,
  },
});
