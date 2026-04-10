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
import { supabase } from "../../lib/supabase";
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
  const { matches, incomingOffers, loading, sendMatch, acceptMatch, declineMatch } = useMatches(userId);

  // Try real data first (outgoing or incoming), fall back to mock
  const realMatch = matches.find((m) => m.id === id) || incomingOffers.find((m) => m.id === id);
  const mockMatch = MOCK_MATCHES[id ?? ""];
  const match: (Match & { toKidEmoji?: string }) | undefined = realMatch
    ? { ...realMatch, toKidEmoji: "" }
    : mockMatch;

  const isReceiver = match?.role === "receiver";

  const [selectedPricing, setSelectedPricing] = useState<Pricing | null>(
    match?.pricing ?? { type: "give-what-you-can" }
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
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [safetyTipDismissed, setSafetyTipDismissed] = useState(false);

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
  const fromFirstName = match.from?.split(" ")[0] ?? "Someone";
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
      default:
        return `Send to ${firstName}`;
    }
  };

  const getPricingLine = () => {
    if (!selectedPricing) return null;
    switch (selectedPricing.type) {
      case "free":
        return "🎁 This one's free — enjoy!";
      case "give-what-you-can":
        return "💛 Pay what feels fair — or nothing at all";
      case "set-price": {
        const amount = selectedPricing.amount ?? 0;
        const youReceive = (Math.round(amount * 0.90 * 100) / 100).toFixed(2);
        return amount > 0
          ? `🏷️ Asking $${amount} · You'll receive $${youReceive}`
          : null;
      }
      default:
        return null;
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
      default:
        return "Sent!";
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
        return "💛 You decide";
      case "set-price":
        return `🏷️ $${p.amount ?? 0}`;
      default:
        return null;
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

        {/* ---- RECEIVER VIEW ---- */}
        {isReceiver ? (
          <>
            <View style={styles.itemSection}>
              <View style={[styles.itemEmojiCircle, {
                backgroundColor: match.status === "offered" ? colors.violetLight
                  : match.status === "accepted" ? colors.goldenLight
                  : colors.eucalyptusLight,
              }]}>
                <Text style={styles.itemEmojiCompact}>{match.itemEmoji}</Text>
              </View>
              <Text style={styles.itemName}>
                {match.item}
                {match.isBundle && match.count ? ` (\u00D7${match.count})` : ""}
              </Text>
              <Text style={styles.bundleCount}>
                {match.status === "offered" ? `Offer from ${fromFirstName}` : ""}
                {match.status === "accepted" ? "You accepted!" : ""}
                {match.status === "handed-off" ? "Received" : ""}
                {pricingBadgeLabel ? ` \u00B7 ${pricingBadgeLabel}` : ""}
              </Text>
            </View>

            {/* From card */}
            <Card style={styles.friendCard}>
              <View style={styles.friendRow}>
                <Avatar initials={match.fromAvatar ?? "??"} size={44} gradient />
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{match.from}</Text>
                  <Text style={styles.friendKid}>
                    For {match.toKid} ({match.toKidAge})
                  </Text>
                </View>
              </View>
            </Card>

            {/* Message from giver */}
            {match.message ? (
              <View style={styles.section}>
                <LinearGradient
                  colors={gradientColors.subtle}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.messageCard}
                >
                  <Text style={styles.messageLabel}>MESSAGE FROM {fromFirstName.toUpperCase()}</Text>
                  <Text style={styles.receiverMessageText}>{match.message}</Text>
                  {match.personalLine ? (
                    <Text style={styles.receiverPersonalLine}>{match.personalLine}</Text>
                  ) : null}
                </LinearGradient>
              </View>
            ) : null}

            {/* Accept/Decline buttons */}
            {match.status === "offered" && (
              <View style={styles.section}>
                <Button
                  variant="primary"
                  size="lg"
                  title={`Yes, I'd love this! ${"\u{1F49C}"}`}
                  onPress={async () => {
                    await acceptMatch(match.id);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    router.back();
                  }}
                  style={styles.sendBtn}
                />
                <Pressable
                  style={styles.declineBtn}
                  onPress={async () => {
                    await declineMatch(match.id);
                    router.back();
                  }}
                >
                  <Text style={styles.declineText}>No thanks — pass to someone else</Text>
                </Pressable>
              </View>
            )}

            {/* Accepted confirmation */}
            {match.status === "accepted" && (
              <View style={styles.section}>
                <View style={styles.acceptedConfirm}>
                  <Text style={styles.acceptedEmoji}>{"\u{1F389}"}</Text>
                  <Text style={styles.acceptedTitle}>You're getting this!</Text>
                  <Text style={styles.acceptedSub}>
                    {fromFirstName} will arrange the handoff. Sit tight!
                  </Text>
                </View>
              </View>
            )}

            {/* Declined */}
            {match.status === "declined" && (
              <View style={styles.section}>
                <View style={styles.acceptedConfirm}>
                  <Text style={styles.acceptedEmoji}>{"\u{1F44B}"}</Text>
                  <Text style={styles.acceptedTitle}>Passed on this one</Text>
                  <Text style={styles.acceptedSub}>
                    No worries — it'll find a great home with someone else.
                  </Text>
                </View>
              </View>
            )}

            {/* Handed off */}
            {match.status === "handed-off" && (
              <View style={styles.section}>
                <View style={styles.acceptedConfirm}>
                  <Text style={styles.acceptedEmoji}>{"\u{1F30D}"}</Text>
                  <Text style={styles.acceptedTitle}>Received!</Text>
                  <Text style={styles.acceptedSub}>
                    One more item kept out of the landfill. {match.toKid} is going to love it.
                  </Text>
                </View>
              </View>
            )}
          </>
        ) : (
        <>
        {/* ---- GIVER VIEW (original) ---- */}
        {/* Item display — compact */}
        <View style={styles.itemSection}>
          <View style={[styles.itemEmojiCircle, {
            backgroundColor: match.status === "ready" ? colors.eucalyptusLight : colors.violetLight,
          }]}>
            <Text style={styles.itemEmojiCompact}>{match.itemEmoji}</Text>
          </View>
          <Text style={styles.itemName}>
            {match.item}
            {match.isBundle && match.count ? ` (\u00D7${match.count})` : ""}
          </Text>
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
                    onPress={async () => {
                      // Send actual push notification to receiver
                      const { data: matchData } = await supabase
                        .from("matches")
                        .select("receiver_id")
                        .eq("id", id)
                        .single();

                      if (matchData?.receiver_id) {
                        await supabase.functions.invoke("send-notification", {
                          body: {
                            user_id: matchData.receiver_id,
                            title: `${fromFirstName} is checking in...`,
                            body: nudgeMessage,
                            data: { matchId: id },
                          },
                        }).catch(() => {});
                      }

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
              onConfirm={async (plan) => {
                setHandoffPlan(plan);
                // Save handoff plan to DB and update status
                await supabase
                  .from("matches")
                  .update({ handoff: plan, status: "scheduled" })
                  .eq("id", id);
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
              onPress={async () => {
                // Update match status in Supabase
                const now = new Date().toISOString();
                await supabase
                  .from("matches")
                  .update({
                    status: "handed-off",
                    completed_at: now,
                  })
                  .eq("id", id);

                // Smart sizing: update receiver child's current_size
                // based on the item's age range (the item they just received)
                if (match) {
                  const { data: matchRow } = await supabase
                    .from("matches")
                    .select("receiver_child_id, item:items(age_range, category)")
                    .eq("id", id)
                    .single();

                  if (matchRow?.receiver_child_id && matchRow?.item) {
                    const item = matchRow.item as any;
                    // For clothing, the age_range IS the size
                    if (item.category?.toLowerCase() === "clothing" && item.age_range) {
                      await supabase
                        .from("children")
                        .update({ current_size: item.age_range })
                        .eq("id", matchRow.receiver_child_id);
                    }
                  }

                  // Also update giver's child sizing from what they gave away
                  // (they've outgrown this size, so their kid is bigger)
                  const { data: giverMatch } = await supabase
                    .from("matches")
                    .select("giver_id, item:items(age_range, category)")
                    .eq("id", id)
                    .single();

                  if (giverMatch?.item) {
                    const giverItem = giverMatch.item as any;
                    if (giverItem.category?.toLowerCase() === "clothing" && giverItem.age_range) {
                      // Find giver's children and update the one closest in age
                      const { data: giverChildren } = await supabase
                        .from("children")
                        .select("id, dob")
                        .eq("user_id", giverMatch.giver_id);

                      if (giverChildren && giverChildren.length > 0) {
                        // Mark the item's size as "outgrown" — next size up
                        // We store the outgrown size with a ">" prefix
                        const eldest = giverChildren.sort(
                          (a: any, b: any) =>
                            new Date(a.dob).getTime() - new Date(b.dob).getTime()
                        )[0];
                        await supabase
                          .from("children")
                          .update({ current_size: `>${giverItem.age_range}` })
                          .eq("id", eldest.id);
                      }
                    }
                  }
                }

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
              {rating ? (
                <Text style={styles.ratingThanks}>Thanks for the feedback!</Text>
              ) : (
                <View style={styles.ratingBtns}>
                  <TouchableOpacity
                    style={styles.ratingBtn}
                    activeOpacity={0.7}
                    onPress={async () => {
                      setRating("up");
                      await supabase.from("matches").update({ rating: "up" }).eq("id", id);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }}
                  >
                    <Text style={styles.ratingBtnText}>👍</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.ratingBtn}
                    activeOpacity={0.7}
                    onPress={async () => {
                      setRating("down");
                      await supabase.from("matches").update({ rating: "down" }).eq("id", id);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    }}
                  >
                    <Text style={styles.ratingBtnText}>👎</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
        </>
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
  itemEmojiCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  itemEmojiCompact: {
    fontSize: 28,
  },
  itemName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginTop: 8,
    textAlign: "center",
  },
  bundleCount: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: "center",
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
  // Safety tip
  safetyTip: {
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    padding: 14,
    marginTop: 12,
  },
  safetyTipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  safetyTipIcon: { fontSize: 16 },
  safetyTipTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#1E40AF",
  },
  safetyTipDismiss: {
    fontSize: 14,
    color: "#93C5FD",
    padding: 4,
  },
  safetyTipText: {
    fontSize: 13,
    color: "#1E3A8A",
    lineHeight: 19,
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
  ratingThanks: {
    fontSize: 14,
    color: colors.neonPurple,
    fontWeight: "600",
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

  // Receiver-specific styles
  receiverMessageText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginTop: 8,
  },
  receiverPersonalLine: {
    fontSize: 14,
    color: colors.neonPurple,
    marginTop: 8,
    fontStyle: "italic",
  },
  declineBtn: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 8,
  },
  declineText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "500",
  },
  acceptedConfirm: {
    alignItems: "center",
    paddingVertical: 20,
  },
  acceptedEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  acceptedTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  acceptedSub: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
});
