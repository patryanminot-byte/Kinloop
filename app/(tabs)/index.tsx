import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "../../lib/colors";
import type { Match } from "../../lib/types";
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

// ─── Warm neutral palette ───────────────────────────────────────────────────

const warm = {
  textDark: "#1A1A1A",
  textMuted: "#8E8E93",
  tagline: "#6B6B6B",
  divider: "#EAE7E3",
  screenBg: "#FAFAF8",
  accent: colors.eucalyptus,
  brandAccent: colors.violet,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

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

// ─── Pressable button with scale animation ──────────────────────────────────

function WarmButton({
  title,
  onPress,
  variant = "filled",
}: {
  title: string;
  onPress: () => void;
  variant?: "filled" | "outlined";
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.timing(scale, {
      toValue: 0.97,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const isFilled = variant === "filled";

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View
        style={[
          styles.warmButton,
          isFilled ? styles.warmButtonFilled : styles.warmButtonOutlined,
          { transform: [{ scale }] },
        ]}
      >
        <Text
          style={[
            styles.warmButtonText,
            isFilled ? styles.warmButtonTextFilled : styles.warmButtonTextOutlined,
          ]}
        >
          {title}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

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

  const [seasonalDismissed, setSeasonalDismissed] = useState(false);

  const hasActivity =
    items.length > 0 || matches.length > 0 || incomingOffers.length > 0;

  // Smart feed data
  const handedOffItems = items.filter((i) => i.status === "handed-off");
  const handedOffCount = handedOffItems.length;
  const estimatedSaved = handedOffCount * 85;

  const actionMatches = matches.filter(
    (m) => m.status === "ready" || m.status === "offered"
  );
  const pendingIncoming = incomingOffers.filter(
    (o) => o.status === "offered"
  );
  const comingYourWay = incomingOffers.filter(
    (o) => o.status === "accepted" || o.status === "scheduled"
  );

  const season = getSeason();
  const seasonalInfo = SEASONAL_COPY[season];
  const showSeasonal = hasActivity && !seasonalDismissed;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={warm.textMuted} />
        </View>
      </SafeAreaView>
    );
  }

  // ========================
  // NEW USER — logo + tagline + two warm buttons
  // ========================
  if (!hasActivity) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.newUserContainer}>
          {/* Top third — logo */}
          <View style={styles.newUserTop}>
            <GradientText style={styles.newUserLogo}>Watasu</GradientText>
          </View>

          {/* Middle — tagline */}
          <View style={styles.newUserMiddle}>
            <Text style={styles.taglineLine1}>Love it, then pass it along.</Text>
            <Text style={styles.taglineLine2}>Let Watasu find the perfect next home.</Text>
          </View>

          {/* Bottom third — buttons */}
          <View style={styles.newUserBottom}>
            <View style={styles.newUserButtons}>
              <WarmButton
                title="I have something"
                variant="filled"
                onPress={() => router.push("/add-item")}
              />
              <WarmButton
                title="I need something"
                variant="outlined"
                onPress={() => router.push("/(tabs)/shop" as `/${string}`)}
              />
            </View>
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
        {/* Header */}
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

        {/* Compact action buttons */}
        <View style={styles.compactRow}>
          <Pressable
            style={[styles.compactButton, styles.compactButtonFilled]}
            onPress={() => router.push("/add-item")}
          >
            <Text style={styles.compactButtonTextFilled}>I have something</Text>
          </Pressable>
          <Pressable
            style={[styles.compactButton, styles.compactButtonOutlined]}
            onPress={() => router.push("/(tabs)/shop" as `/${string}`)}
          >
            <Text style={styles.compactButtonTextOutlined}>I need something</Text>
          </Pressable>
        </View>

        {/* ── SMART FEED ── */}

        {/* Action matches */}
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

        {/* Claims */}
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

        {/* Incoming offers */}
        {pendingIncoming.map((offer) => (
          <Card key={offer.id} style={styles.feedCard}>
            <View style={styles.feedItemRow}>
              <Text style={styles.feedEmoji}>{offer.itemEmoji}</Text>
              <View style={styles.feedItemInfo}>
                <Text style={styles.feedItemName}>{offer.item}</Text>
                <Text style={styles.feedItemSub}>
                  {firstName(offer.from)} {"\u00B7"} {offer.toKidAge}
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

        {/* Seasonal nudge */}
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
            <Pressable
              style={styles.nudgeAction}
              onPress={() => router.push("/add-item")}
            >
              <Text style={styles.nudgeActionText}>Take a photo</Text>
            </Pressable>
          </Card>
        )}

        {/* Impact line */}
        {handedOffCount > 0 && (
          <View style={styles.impactLine}>
            <Text style={styles.impactText}>
              {handedOffCount} items passed along {"\u00B7"} ~$
              {estimatedSaved} saved
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: warm.screenBg },
  container: { flex: 1 },
  content: { padding: 16 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },

  // ── New user ──────────────────────────────────────────────────────
  newUserContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  newUserTop: {
    flex: 2,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 24,
  },
  newUserMiddle: {
    alignItems: "center",
    paddingVertical: 8,
  },
  newUserBottom: {
    flex: 3,
    justifyContent: "flex-start",
    paddingTop: 48,
  },
  newUserLogo: {
    fontSize: 48,
  },
  taglineLine1: {
    fontSize: 16,
    fontWeight: "400",
    color: warm.tagline,
    textAlign: "center",
    marginBottom: 4,
  },
  taglineLine2: {
    fontSize: 16,
    fontWeight: "400",
    color: warm.tagline,
    textAlign: "center",
  },
  newUserButtons: {
    width: "100%",
    gap: 12,
  },

  // Warm buttons
  warmButton: {
    borderRadius: 16,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  warmButtonFilled: {
    backgroundColor: warm.brandAccent,
    shadowColor: "rgba(124, 92, 252, 0.15)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  warmButtonOutlined: {
    backgroundColor: warm.screenBg,
    borderWidth: 1.5,
    borderColor: warm.brandAccent,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  warmButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  warmButtonTextFilled: {
    color: "#FFFFFF",
  },
  warmButtonTextOutlined: {
    color: warm.brandAccent,
  },

  // ── Returning user ────────────────────────────────────────────────
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  logo: {
    fontSize: 24,
  },

  // Compact buttons (same warm style, side by side)
  compactRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  compactButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  compactButtonFilled: {
    backgroundColor: warm.brandAccent,
  },
  compactButtonOutlined: {
    backgroundColor: warm.screenBg,
    borderWidth: 1.5,
    borderColor: warm.brandAccent,
  },
  compactButtonTextFilled: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  compactButtonTextOutlined: {
    fontSize: 14,
    fontWeight: "600",
    color: warm.brandAccent,
  },

  // Feed cards
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
  feedItemInfo: { flex: 1 },
  feedItemName: {
    fontSize: 15,
    fontWeight: "700",
    color: warm.textDark,
  },
  feedItemSub: {
    fontSize: 14,
    color: warm.textMuted,
    marginTop: 2,
  },
  feedActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  feedClaimText: {
    fontSize: 15,
    fontWeight: "600",
    color: warm.textDark,
  },
  feedClaimSub: {
    fontSize: 14,
    color: warm.textMuted,
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
    color: warm.textMuted,
  },
  nudgeEmoji: { fontSize: 32, marginBottom: 8 },
  nudgeLine1: {
    fontSize: 17,
    fontWeight: "700",
    color: warm.textDark,
    marginBottom: 4,
  },
  nudgeLine2: {
    fontSize: 15,
    color: warm.textMuted,
    lineHeight: 22,
  },
  nudgeAction: { marginTop: 12 },
  nudgeActionText: {
    fontSize: 15,
    fontWeight: "600",
    color: warm.accent,
  },

  // Impact
  impactLine: { paddingVertical: 16, alignItems: "center" },
  impactText: { fontSize: 14, color: warm.textMuted },

  bottomSpacer: { height: 40 },
});
