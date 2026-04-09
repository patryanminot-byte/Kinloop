import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
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
import HandoffScheduler from "../../components/HandoffScheduler";
import { useAuth } from "../../hooks/useAuth";
import { useMatches } from "../../hooks/useMatches";
import type { HandoffPlan } from "../../lib/types";

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
    sentAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  "3": {
    id: "3",
    item: "Board books set",
    itemEmoji: "📚",
    from: "You",
    to: "Jess Park",
    toAvatar: "JP",
    toKid: "Lily",
    toKidAge: "3 years",
    toKidEmoji: "👧🏻",
    status: "accepted",
    message:
      "Hey Jess! Lily would love these books — Maya's moved on to chapter books now.",
    personalLine: "",
    pricing: { type: "free" },
    daysAgo: 1,
    sentAt: new Date(Date.now() - 86400000).toISOString(),
  },
};

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function MatchDetailScreen() {
  const { id, nudge } = useLocalSearchParams<{ id: string; nudge?: string }>();
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
  const [editableMessage, setEditableMessage] = useState(
    match?.message ?? ""
  );
  const [sent, setSent] = useState(false);
  const [handoffPlan, setHandoffPlan] = useState<HandoffPlan | null>(
    match?.handoff ?? null,
  );
  const [markedComplete, setMarkedComplete] = useState(
    match?.status === "completed",
  );
  const scrollRef = useRef<ScrollView>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const isNudgeFromHome = nudge === "true";
  const [showNudgeComposer, setShowNudgeComposer] = useState(isNudgeFromHome);
  const [nudgeMessage, setNudgeMessage] = useState("");
  const [nudgeSent, setNudgeSent] = useState(false);

  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  };

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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
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
              {match.status === "ready" ? "Ready" : "Offer sent"}
            </Badge>
            {pricingBadgeLabel && (
              <Badge color={colors.neonPurple}>{pricingBadgeLabel}</Badge>
            )}
          </View>
        </View>

        {/* Add photo */}
        <View style={styles.photoSection}>
          {photo ? (
            <TouchableOpacity onPress={handleAddPhoto} activeOpacity={0.8}>
              <Image source={{ uri: photo }} style={styles.photoPreview} />
              <Text style={styles.photoChangeText}>Change photo</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.addPhotoBtn}
              onPress={handleAddPhoto}
              activeOpacity={0.7}
            >
              <Text style={styles.addPhotoIcon}>📷</Text>
              <Text style={styles.addPhotoText}>Add a photo</Text>
            </TouchableOpacity>
          )}
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

        {/* Warm message card — hidden during nudge */}
        {!showNudgeComposer && (
        <View style={styles.section}>
          <LinearGradient
            colors={gradientColors.subtle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.messageCard}
          >
            <Text style={styles.messageLabel}>FROM WATASU, WITH LOVE</Text>
            <Text style={styles.messageHint}>✏️ Tap to personalize</Text>
            <TextInput
              style={styles.messageTextEditable}
              value={editableMessage}
              onChangeText={setEditableMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
              returnKeyType="done"
              blurOnSubmit
            />
            {getPricingLine() && (
              <Text style={styles.pricingLine}>{getPricingLine()}</Text>
            )}
            <View style={styles.divider} />
            <Text style={styles.personalLabel}>
              Add a personal touch (optional)
            </Text>
            {!personalLine ? (
              <TouchableOpacity
                onPress={() => setPersonalLine("Miss you! Let's do a park date soon 💛")}
                activeOpacity={0.6}
              >
                <Text style={styles.suggestionText}>
                  💡 Miss you! Let's do a park date soon 💛
                </Text>
              </TouchableOpacity>
            ) : null}
            <TextInput
              style={styles.personalInput}
              value={personalLine}
              onChangeText={setPersonalLine}
              placeholder="Type your own..."
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
              returnKeyType="done"
              blurOnSubmit
            />
          </LinearGradient>
        </View>
        )}

        {/* Send button — ready state */}
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

        {/* Just sent confirmation */}
        {sent && match.status === "ready" && (
          <View style={styles.confirmSection}>
            <Text style={styles.confirmEmoji}>✨</Text>
            <Text style={styles.confirmText}>{getConfirmation()}</Text>
            <Text style={styles.confirmMuted}>
              We'll let you know when {firstName} responds
            </Text>
          </View>
        )}

        {/* Waiting state — offered but not accepted */}
        {match.status === "offered" && !sent && (
          <View style={styles.waitingSection}>
            <View style={styles.waitingDot} />
            <Text style={styles.waitingText}>
              Offer out to {firstName}! 🎉
            </Text>
            {match.sentAt && (
              <Text style={styles.waitingTime}>
                Sent {formatTimeAgo(match.sentAt)}
              </Text>
            )}

            {/* Nudge composer */}
            {(showNudgeComposer || nudgeSent) ? (
              nudgeSent ? (
                <View style={styles.nudgeSentBox}>
                  <Text style={styles.nudgeSentText}>Nudge sent! 👋</Text>
                </View>
              ) : (
                <View style={styles.nudgeComposer}>
                  <Text style={styles.nudgeComposerLabel}>Send {firstName} a little nudge:</Text>
                  {!nudgeMessage && (
                    <TouchableOpacity
                      onPress={() => setNudgeMessage(`Hey ${firstName}! Just checking in — still want the ${match.item.toLowerCase()}? No rush! 😊`)}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.suggestionText}>
                        💡 Hey {firstName}! Just checking in — still want the {match.item.toLowerCase()}? No rush! 😊
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TextInput
                    style={styles.nudgeInput}
                    value={nudgeMessage}
                    onChangeText={setNudgeMessage}
                    placeholder="Write your own..."
                    placeholderTextColor={colors.textLight}
                    multiline
                    numberOfLines={2}
                    onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
                  />
                  <Button
                    variant="primary"
                    size="md"
                    title={`Send nudge to ${firstName} 👋`}
                    onPress={() => {
                      setNudgeSent(true);
                      setShowNudgeComposer(false);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }}
                    disabled={!nudgeMessage}
                    style={styles.sendBtn}
                  />
                </View>
              )
            ) : (
              <TouchableOpacity style={styles.nudgeBtn} activeOpacity={0.7} onPress={() => setShowNudgeComposer(true)}>
                <Text style={styles.nudgeText}>👋 Nudge {firstName}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Accepted — show handoff scheduler */}
        {match.status === "accepted" && !handoffPlan && (
          <View style={styles.section}>
            <HandoffScheduler
              friendName={firstName}
              itemName={match.item}
              onConfirm={(plan) => {
                setHandoffPlan(plan);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
            />
          </View>
        )}

        {/* Scheduled — handoff plan confirmed */}
        {(match.status === "accepted" || match.status === "scheduled") && handoffPlan && !markedComplete && (
          <View style={styles.scheduledSection}>
            <Text style={styles.scheduledTitle}>Handoff plan set! 📋</Text>
            <View style={styles.scheduledCard}>
              <Text style={styles.scheduledMethod}>
                {handoffPlan.method === "porch" && "🏡 Porch drop-off"}
                {handoffPlan.method === "meetup" && "🤝 Meet up"}
                {handoffPlan.method === "school" && "🎒 School / daycare swap"}
                {handoffPlan.method === "ship" && "📦 Ship it"}
              </Text>
              <Text style={styles.scheduledDetails}>{handoffPlan.details}</Text>
            </View>
            <Button
              variant="primary"
              size="lg"
              title="Mark as handed off ✅"
              onPress={() => {
                setMarkedComplete(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
              style={styles.sendBtn}
            />
          </View>
        )}

        {/* Completed */}
        {(markedComplete || match.status === "completed") && (
          <View style={styles.completedSection}>
            <Text style={styles.completedEmoji}>🌍</Text>
            <Text style={styles.completedTitle}>Handed off!</Text>
            <Text style={styles.completedSub}>
              You kept the {match.item.toLowerCase()} out of the landfill.{"\n"}
              {firstName}'s {match.toKid} is going to love it.
            </Text>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>How did it go?</Text>
              <View style={styles.ratingBtns}>
                <TouchableOpacity style={styles.ratingBtn} activeOpacity={0.7}>
                  <Text style={styles.ratingBtnText}>👍</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.ratingBtn} activeOpacity={0.7}>
                  <Text style={styles.ratingBtnText}>👎</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
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
  messageHint: {
    fontSize: 12,
    color: colors.neonPurple,
    marginBottom: 8,
  },
  messageTextEditable: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    minHeight: 80,
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
  suggestionText: {
    fontSize: 14,
    color: colors.neonPurple,
    fontStyle: "italic",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.neonPurple + "0D",
    borderRadius: 10,
    marginBottom: 8,
    overflow: "hidden",
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

  // Waiting
  waitingSection: {
    marginTop: 24,
    alignItems: "center",
    gap: 8,
  },
  waitingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.neonPurple,
    opacity: 0.6,
  },
  waitingText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  waitingTime: {
    fontSize: 13,
    color: colors.textMuted,
  },
  nudgeBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: colors.neonPurple + "15",
  },
  nudgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neonPurple,
  },
  nudgeComposer: {
    width: "100%",
    marginTop: 12,
    gap: 10,
  },
  nudgeComposerLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  nudgeInput: {
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    minHeight: 50,
    backgroundColor: colors.card,
    lineHeight: 21,
  },
  nudgeSentBox: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: colors.neonGreen + "15",
    alignItems: "center",
  },
  nudgeSentText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.neonGreen,
  },

  // Scheduled
  scheduledSection: {
    marginTop: 24,
    alignItems: "center",
    gap: 12,
  },
  scheduledTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  scheduledCard: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 4,
  },
  scheduledMethod: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  scheduledDetails: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: "italic",
  },

  // Completed
  completedSection: {
    marginTop: 24,
    alignItems: "center",
    gap: 8,
    paddingBottom: 20,
  },
  completedEmoji: {
    fontSize: 48,
  },
  completedTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  completedSub: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  ratingRow: {
    marginTop: 12,
    alignItems: "center",
    gap: 8,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  ratingBtns: {
    flexDirection: "row",
    gap: 16,
  },
  ratingBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingBtnText: {
    fontSize: 24,
  },

  // Photo
  photoSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  addPhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.card,
  },
  addPhotoIcon: {
    fontSize: 18,
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neonPurple,
  },
  photoPreview: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  photoChangeText: {
    fontSize: 13,
    color: colors.neonPurple,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 6,
  },
});
