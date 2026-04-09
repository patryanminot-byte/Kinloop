import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { colors, gradientColors } from "../../lib/colors";
import { Match, Pricing } from "../../lib/types";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import PricingPicker from "../../components/PricingPicker";
import { useAuth } from "../../hooks/useAuth";
import { useMatches } from "../../hooks/useMatches";

const MOCK_MATCHES: Record<string, Match & { toKidEmoji: string }> = {
  "1": {
    id: "1",
    item: "Winter jacket bundle",
    itemEmoji: "🧥",
    isBundle: true,
    count: 3,
    from: "You",
    to: "Sarah Chen",
    toAvatar: "SC",
    toKid: "Oliver",
    toKidAge: "2 years",
    toKidEmoji: "👦🏽",
    status: "ready",
    message:
      "Hey Sarah! We just wrapped up winter and Maya's outgrown these jackets. Oliver's about the right size — want them?",
    personalLine: "",
    pricing: null,
    daysAgo: 0,
  },
  "2": {
    id: "2",
    item: "Bugaboo stroller",
    itemEmoji: "🚼",
    from: "You",
    to: "Mike Johnson",
    toAvatar: "MJ",
    toKid: "Emma",
    toKidAge: "8 months",
    toKidEmoji: "👶🏻",
    status: "offered",
    message:
      "Hey Mike! This stroller served us well and Emma's at the perfect age for it.",
    personalLine: "Miss you guys! Park date soon? 💛",
    pricing: { type: "free" },
    daysAgo: 2,
  },
};

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // ---- Real data from Supabase ----
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { matches, loading, sendMatch } = useMatches(userId);

  // Try real data first, fall back to mock
  const realMatch = matches.find((m) => m.id === id);
  const mockMatch = MOCK_MATCHES[id ?? ""];
  const match: (Match & { toKidEmoji?: string }) | undefined = realMatch
    ? { ...realMatch, toKidEmoji: "" }
    : mockMatch;

  const [selectedPricing, setSelectedPricing] = useState<Pricing | null>(
    match?.pricing ?? null
  );
  const [personalLine, setPersonalLine] = useState(
    match?.personalLine ?? ""
  );
  const [sent, setSent] = useState(false);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.neonPurple} />
        </View>
      </SafeAreaView>
    );
  }

  if (!match) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Match not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const firstName = match.to.split(" ")[0];
  const isReady = match.status === "ready" && !sent;

  const getButtonTitle = () => {
    if (!selectedPricing) return `Send to ${firstName}`;
    switch (selectedPricing.type) {
      case "free":
        return `Pass it on to ${firstName} 🎁`;
      case "give-what-you-can":
        return `Send to ${firstName} 💛`;
      case "set-price":
        return `Offer to ${firstName} for $${selectedPricing.amount ?? 0}`;
    }
  };

  const getPricingLine = () => {
    if (!selectedPricing) return null;
    switch (selectedPricing.type) {
      case "free":
        return "🎁 This one's free — enjoy!";
      case "give-what-you-can":
        return "💛 Give what you can — no pressure either way";
      case "set-price":
        return `🏷️ Asking $${selectedPricing.amount ?? 0}`;
    }
  };

  const getConfirmation = () => {
    if (!selectedPricing) return "";
    switch (selectedPricing.type) {
      case "free":
        return "Sent with love!";
      case "give-what-you-can":
        return "Sent — they'll give what feels right!";
      case "set-price":
        return `Offered for $${selectedPricing.amount ?? 0}!`;
    }
  };

  const handleSend = async () => {
    if (!selectedPricing) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const success = await sendMatch(
      match.id,
      selectedPricing.type,
      selectedPricing.amount ?? null,
      personalLine
    );
    if (success) {
      setSent(true);
    }
  };

  const pricingBadgeLabel = (() => {
    const p = selectedPricing ?? match.pricing;
    if (!p) return null;
    switch (p.type) {
      case "free":
        return "🎁 Free";
      case "give-what-you-can":
        return "💛 GWUC";
      case "set-price":
        return `🏷️ $${p.amount ?? 0}`;
    }
  })();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        {/* Item display */}
        <View style={styles.itemSection}>
          <Text style={styles.itemEmoji}>{match.itemEmoji}</Text>
          <Text style={styles.itemName}>{match.item}</Text>
          {match.isBundle && match.count && (
            <Text style={styles.bundleCount}>Bundle of {match.count}</Text>
          )}
          <View style={styles.badgeRow}>
            <Badge
              color={
                match.status === "ready"
                  ? colors.neonGreen
                  : colors.neonBlue
              }
            >
              {match.status === "ready" ? "Ready" : "Sent"}
            </Badge>
            {pricingBadgeLabel && (
              <Badge color={colors.neonPurple}>{pricingBadgeLabel}</Badge>
            )}
          </View>
        </View>

        {/* Friend card */}
        <Card style={styles.friendCard}>
          <View style={styles.friendRow}>
            <Avatar initials={match.toAvatar} size={44} gradient />
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{match.to}</Text>
              <Text style={styles.friendKid}>
                {match.toKid} · {match.toKidAge} {match.toKidEmoji}
              </Text>
            </View>
          </View>
        </Card>

        {/* Pricing picker */}
        {isReady && (
          <View style={styles.section}>
            <PricingPicker
              selected={selectedPricing}
              onSelect={setSelectedPricing}
            />
          </View>
        )}

        {/* Warm message card */}
        <View style={styles.section}>
          <LinearGradient
            colors={gradientColors.subtle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.messageCard}
          >
            <Text style={styles.messageLabel}>FROM KINLOOP, WITH LOVE</Text>
            <Text style={styles.messageText}>{match.message}</Text>
            {getPricingLine() && (
              <Text style={styles.pricingLine}>{getPricingLine()}</Text>
            )}
            <View style={styles.divider} />
            <Text style={styles.personalLabel}>
              Add a personal touch (optional)
            </Text>
            <TextInput
              style={styles.personalInput}
              value={personalLine}
              onChangeText={setPersonalLine}
              placeholder="e.g., Miss you! Let's do a park date soon 💛"
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </LinearGradient>
        </View>

        {/* Send button */}
        {isReady && !sent && (
          <View style={styles.section}>
            <Button
              variant="primary"
              size="lg"
              title={getButtonTitle()}
              onPress={handleSend}
              disabled={!selectedPricing}
              style={styles.sendBtn}
            />
          </View>
        )}

        {/* Sent confirmation */}
        {sent && (
          <View style={styles.confirmSection}>
            <Text style={styles.confirmEmoji}>✨</Text>
            <Text style={styles.confirmText}>{getConfirmation()}</Text>
            <Text style={styles.confirmMuted}>
              We'll let you know when {firstName} responds
            </Text>
          </View>
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
    color: colors.neonPurple,
    fontWeight: "600",
  },
  itemSection: {
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
  bundleCount: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  friendCard: {
    marginBottom: 4,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  friendKid: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  section: {
    marginTop: 20,
  },
  messageCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 15,
    fontStyle: "italic",
    color: colors.text,
    lineHeight: 22,
  },
  pricingLine: {
    fontSize: 14,
    color: colors.text,
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  personalLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 8,
  },
  personalInput: {
    fontSize: 15,
    color: colors.text,
    minHeight: 60,
    lineHeight: 21,
  },
  sendBtn: {
    width: "100%",
  },
  confirmSection: {
    marginTop: 24,
    alignItems: "center",
    gap: 8,
  },
  confirmEmoji: {
    fontSize: 32,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  confirmMuted: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
});
