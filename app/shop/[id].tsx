import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { colors } from "../../lib/colors";
import type { Item } from "../../lib/types";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import PaymentSheet from "../../components/PaymentSheet";
import { useAuth } from "../../hooks/useAuth";
import { useShop } from "../../hooks/useShop";
import { useAppStore } from "../../stores/appStore";
import { supabase } from "../../lib/supabase";

// ─── Mock Data ──────────────────────────────────────────────────────────────

const ALL_ITEMS: Item[] = [
  {
    id: "s1", name: "6-12mo clothes bundle", category: "Clothing", ageRange: "6-12mo",
    status: "available", matchedTo: null, emoji: "\uD83D\uDC55", isBundle: true, count: 15,
    pricing: { type: "free" }, from: "Sarah Chen", fromAvatar: "SC", ring: "friend",
  },
  {
    id: "s2", name: "High chair", category: "Gear", ageRange: "6-24mo",
    status: "available", matchedTo: null, emoji: "\uD83E\uDE91",
    pricing: { type: "give-what-you-can" }, from: "Mike Johnson", fromAvatar: "MJ",
    ring: "friend", condition: "Great",
  },
  {
    id: "s3", name: "Uppababy Vista", category: "Strollers", ageRange: "0-3y",
    status: "available", matchedTo: null, emoji: "\uD83D\uDEBC",
    pricing: { type: "set-price", amount: 120 }, from: "Lisa Park", fromAvatar: "LP",
    ring: "friend", condition: "Like new", postedAgo: "2d ago",
  },
  {
    id: "s4", name: "Crib", category: "Furniture", ageRange: "0-2y",
    status: "available", matchedTo: null, emoji: "\uD83D\uDECF\uFE0F",
    pricing: { type: "set-price", amount: 75 }, from: "Jamie R.", fromAvatar: "JR",
    ring: "nearby", distance: "About 5 min away", condition: "Good", postedAgo: "1d ago",
  },
  {
    id: "s5", name: "2T-3T clothes bundle", category: "Clothing", ageRange: "2-3y",
    status: "available", matchedTo: null, emoji: "\uD83D\uDC55", isBundle: true, count: 20,
    pricing: { type: "free" }, from: "Alex M.", fromAvatar: "AM",
    ring: "nearby", distance: "About 10 min away", postedAgo: "3h ago",
  },
  {
    id: "s6", name: "Balance bike", category: "Toys", ageRange: "2-5y",
    status: "available", matchedTo: null, emoji: "\uD83D\uDEB2",
    pricing: { type: "give-what-you-can" }, from: "Pat K.", fromAvatar: "PK",
    ring: "nearby", distance: "About 15 min away", condition: "Great", postedAgo: "5d ago",
  },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function getMaxPrice(item: Item): number {
  if (item.pricing?.type === "set-price" && item.pricing.amount) return item.pricing.amount;
  // Estimate based on category
  const cat = item.category;
  if (cat === "Strollers" || cat === "Car Seats") return 200;
  if (cat === "Furniture" || cat === "Gear") return 100;
  if (cat === "Electronics") return 150;
  return 40;
}

// ─── Pure JS Slider (replaces native @react-native-community/slider) ────────

function Slider({
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  value = 0,
  onValueChange,
  minimumTrackTintColor = "#007AFF",
  maximumTrackTintColor = "#E0E0E0",
  thumbTintColor = "#007AFF",
  style,
}: {
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  value?: number;
  onValueChange: (v: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  style?: any;
}) {
  const trackWidth = useRef(0);
  const range = maximumValue - minimumValue;
  const pct = range > 0 ? ((value - minimumValue) / range) * 100 : 0;

  const computeValue = (locationX: number) => {
    if (trackWidth.current <= 0) return;
    const ratio = Math.max(0, Math.min(1, locationX / trackWidth.current));
    let raw = minimumValue + ratio * range;
    if (step > 0) raw = Math.round(raw / step) * step;
    onValueChange(Math.max(minimumValue, Math.min(maximumValue, raw)));
  };

  return (
    <View
      style={[{ height: 40, justifyContent: "center" }, style]}
      onLayout={(e) => { trackWidth.current = e.nativeEvent.layout.width; }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => computeValue(e.nativeEvent.locationX)}
      onResponderMove={(e) => computeValue(e.nativeEvent.locationX)}
    >
      <View style={{ height: 6, borderRadius: 3, backgroundColor: maximumTrackTintColor }}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: minimumTrackTintColor, width: `${pct}%` }} />
      </View>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: `${pct}%`,
          marginLeft: -13,
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: thumbTintColor,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
        }}
      />
    </View>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ShopItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showClaimFlow, setShowClaimFlow] = useState(false);
  const [claimAmount, setClaimAmount] = useState(0);
  const [claimed, setClaimed] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportNote, setReportNote] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const { session } = useAuth();
  const userId = session?.user?.id;
  const { friendItems, nearbyItems } = useShop(userId);
  const addItem = useAppStore((s) => s.addItem);

  const item = useMemo(() => {
    const realItems = [...friendItems, ...nearbyItems];
    return realItems.find((i) => i.id === id) ?? ALL_ITEMS.find((i) => i.id === id);
  }, [id, friendItems, nearbyItems]);

  if (!item) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.notFound}>Item not found</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backLink}>{"\u2190"} Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isFree = item.pricing?.type === "free";
  const isSetPrice = item.pricing?.type === "set-price";
  const maxPrice = getMaxPrice(item);

  const handleWantThis = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isFree) {
      // Skip slider, claim directly
      handleClaim(0);
      return;
    }
    setShowClaimFlow(true);
    if (isSetPrice && item.pricing?.amount) {
      setClaimAmount(item.pricing.amount);
    }
  };

  const handleClaim = async (amount: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (amount > 0 && isSetPrice) {
      // Route through Stripe payment
      setShowPayment(true);
      return;
    }

    // Free claim or pay-what-you-can with $0
    if (userId) {
      await supabase.from("matches").insert({
        item_id: item.id,
        receiver_id: userId,
        giver_id: item.userId,
        status: "offered",
        pricing_type: amount > 0 ? "give-what-you-can" : "free",
        pricing_amount: amount > 0 ? amount : null,
      });
    }
    setClaimed(true);
  };

  // ─── Claimed state ──────────────────────────────────────────────────

  if (claimed) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.claimedContainer}>
          <Text style={styles.claimedTitle}>
            It's yours! {"\uD83D\uDC9B"}
          </Text>
          <Text style={styles.claimedSub}>
            {item.from} will be notified
          </Text>
          <Button
            variant="primary"
            size="md"
            title="Back to Browse"
            onPress={() => router.replace("/(tabs)/shop" as `/${string}`)}
            style={{ marginTop: 24 }}
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
        {/* Back */}
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Text style={styles.backLink}>{"\u2190"} Back</Text>
        </Pressable>

        {/* Hero emoji */}
        <Text style={styles.bigEmoji}>{item.emoji}</Text>

        {/* Name */}
        <Text style={styles.itemName}>{item.name}</Text>
        {item.isBundle && item.count && (
          <Text style={styles.bundleCount}>{item.count} items in bundle</Text>
        )}

        {/* Seller line */}
        <View style={styles.sellerLine}>
          <Avatar initials={item.fromAvatar ?? "?"} size={28} />
          <Text style={styles.sellerText}>
            {item.from}
            {item.ring === "friend" ? " \u00B7 Friends" : ""}
            {item.distance ? ` \u00B7 ${item.distance}` : ""}
          </Text>
        </View>

        {/* Details */}
        <View style={styles.detailsRow}>
          {item.condition && (
            <Badge color={colors.eucalyptus}>{item.condition}</Badge>
          )}
          <Badge color={colors.blue}>{item.ageRange}</Badge>
        </View>

        {/* Description / note placeholder */}
        {item.description && (
          <Text style={styles.description}>"{item.description}"</Text>
        )}

        {/* Pricing display */}
        <View style={styles.pricingDisplay}>
          {isFree && (
            <Text style={styles.pricingLabel}>Free</Text>
          )}
          {item.pricing?.type === "give-what-you-can" && (
            <Text style={styles.pricingLabel}>Pay what's fair</Text>
          )}
          {isSetPrice && item.pricing?.amount != null && (
            <Text style={styles.pricingLabel}>${item.pricing.amount}</Text>
          )}
        </View>

        {/* Report link */}
        <Pressable
          onPress={() => setShowReport(true)}
          style={styles.reportLink}
        >
          <Text style={styles.reportLinkText}>
            See something unsafe? Report this item
          </Text>
        </Pressable>
      </ScrollView>

      {/* ─── Bottom action ─── */}
      {!showClaimFlow && (
        <View style={styles.actionBar}>
          <Button
            variant="primary"
            size="lg"
            title="I want this"
            onPress={handleWantThis}
            style={styles.actionButton}
          />
        </View>
      )}

      {/* ─── Claim flow with slider ─── */}
      {showClaimFlow && (
        <View style={styles.claimBar}>
          <Text style={styles.claimTitle}>
            It's yours! {"\uD83D\uDC9B"}
          </Text>

          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={maxPrice}
              step={1}
              value={claimAmount}
              onValueChange={setClaimAmount}
              minimumTrackTintColor={colors.eucalyptus}
              maximumTrackTintColor={colors.surface}
              thumbTintColor={colors.eucalyptus}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderMin}>$0</Text>
              <Text style={styles.sliderValue}>
                {claimAmount > 0 ? `$${Math.round(claimAmount)}` : "Free"}
              </Text>
              <Text style={styles.sliderMax}>${maxPrice}</Text>
            </View>
          </View>

          {claimAmount > 0 ? (
            <Button
              variant="primary"
              size="lg"
              title={`Pay $${Math.round(claimAmount)} with Apple Pay`}
              onPress={() => handleClaim(Math.round(claimAmount))}
              style={styles.actionButton}
            />
          ) : (
            <Button
              variant="primary"
              size="lg"
              title={`Claim it \uD83D\uDC9B`}
              onPress={() => handleClaim(0)}
              style={styles.actionButton}
            />
          )}

          <Pressable onPress={() => setShowClaimFlow(false)} style={{ marginTop: 8 }}>
            <Text style={styles.claimFreeHint}>
              {claimAmount > 0
                ? "or just claim it \u2014 free works too"
                : ""}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Report modal */}
      <Modal visible={showReport} animationType="slide" transparent>
        <View style={styles.reportOverlay}>
          <View style={styles.reportModal}>
            <Text style={styles.reportTitle}>Report this item</Text>

            {reportSubmitted ? (
              <View style={styles.reportSuccess}>
                <Text style={styles.reportSuccessEmoji}>{"\u2705"}</Text>
                <Text style={styles.reportSuccessText}>
                  Report submitted. We'll review it shortly.
                </Text>
                <Pressable
                  onPress={() => {
                    setShowReport(false);
                    setReportSubmitted(false);
                    setReportReason("");
                    setReportNote("");
                  }}
                  style={styles.reportDoneBtn}
                >
                  <Text style={styles.reportDoneBtnText}>Done</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={styles.reportLabel}>Reason</Text>
                {[
                  "Recalled item",
                  "Unsafe/damaged",
                  "Misleading description",
                  "Spam",
                  "Other",
                ].map((reason) => (
                  <Pressable
                    key={reason}
                    style={[
                      styles.reportOption,
                      reportReason === reason && styles.reportOptionSelected,
                    ]}
                    onPress={() => setReportReason(reason)}
                  >
                    <Text
                      style={[
                        styles.reportOptionText,
                        reportReason === reason && styles.reportOptionTextSelected,
                      ]}
                    >
                      {reason}
                    </Text>
                  </Pressable>
                ))}

                <Text style={styles.reportLabel}>
                  Details <Text style={styles.reportOptional}>(optional)</Text>
                </Text>
                <TextInput
                  style={styles.reportInput}
                  value={reportNote}
                  onChangeText={setReportNote}
                  placeholder="Tell us more..."
                  placeholderTextColor="#AEAEB2"
                  multiline
                  numberOfLines={3}
                />

                <Pressable
                  style={[
                    styles.reportSubmitBtn,
                    !reportReason && styles.reportSubmitBtnDisabled,
                  ]}
                  onPress={async () => {
                    if (!reportReason) return;
                    await supabase.from("reports").insert({
                      item_id: item?.id,
                      reporter_id: userId,
                      reason: reportReason,
                      note: reportNote || null,
                    });
                    setReportSubmitted(true);
                  }}
                  disabled={!reportReason}
                >
                  <Text style={styles.reportSubmitText}>Submit Report</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setShowReport(false);
                    setReportReason("");
                    setReportNote("");
                  }}
                >
                  <Text style={styles.reportCancelText}>Cancel</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Stripe payment sheet */}
      {isSetPrice && item.pricing?.amount != null && (
        <PaymentSheet
          visible={showPayment}
          itemId={item.id}
          itemName={item.name}
          itemEmoji={item.emoji}
          itemPrice={Math.round(claimAmount) || item.pricing.amount}
          sellerId={item.userId ?? ""}
          onSuccess={async () => {
            if (userId) {
              await supabase.from("matches").insert({
                item_id: item.id,
                receiver_id: userId,
                giver_id: item.userId,
                status: "offered",
                pricing_type: "set-price",
                pricing_amount: Math.round(claimAmount) || item.pricing!.amount,
              });
            }
            setShowPayment(false);
            setClaimed(true);
          }}
          onCancel={() => setShowPayment(false)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  notFound: { fontSize: 16, color: colors.textMuted, marginBottom: 12 },

  // Back
  back: { marginBottom: 20 },
  backLink: { fontSize: 15, fontWeight: "600", color: colors.violet },

  // Hero
  bigEmoji: { fontSize: 56, textAlign: "center", marginBottom: 12 },
  itemName: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  bundleCount: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 8,
  },

  // Seller
  sellerLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  sellerText: {
    fontSize: 15,
    color: colors.textMuted,
  },

  // Details
  detailsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },

  description: {
    fontSize: 15,
    color: colors.text,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
    paddingHorizontal: 20,
  },

  // Pricing display
  pricingDisplay: {
    alignItems: "center",
    marginBottom: 16,
  },
  pricingLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.eucalyptus,
  },

  // Action bar
  actionBar: {
    padding: 20,
    paddingBottom: 36,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: { width: "100%" },

  // Claim flow
  claimBar: {
    padding: 20,
    paddingBottom: 36,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  claimTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 16,
  },
  sliderContainer: {
    marginBottom: 16,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  sliderMin: { fontSize: 13, color: colors.textMuted },
  sliderValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.eucalyptus,
  },
  sliderMax: { fontSize: 13, color: colors.textMuted },
  claimFreeHint: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },

  // Claimed state
  claimedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  claimedTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  claimedSub: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: "center",
  },

  // Report
  reportLink: { alignItems: "center", paddingVertical: 16, marginTop: 8 },
  reportLinkText: { fontSize: 13, color: "#AEAEB2", textDecorationLine: "underline" },
  reportOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  reportModal: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  reportTitle: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 16 },
  reportLabel: { fontSize: 13, fontWeight: "600", color: colors.textMuted, marginTop: 12, marginBottom: 8 },
  reportOptional: { fontWeight: "400" },
  reportOption: {
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border, marginBottom: 6,
  },
  reportOptionSelected: { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
  reportOptionText: { fontSize: 15, color: colors.text },
  reportOptionTextSelected: { color: "#EF4444", fontWeight: "600" },
  reportInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    padding: 14, fontSize: 15, color: colors.text, minHeight: 70, backgroundColor: colors.card,
  },
  reportSubmitBtn: {
    backgroundColor: "#EF4444", borderRadius: 12, paddingVertical: 14,
    alignItems: "center", marginTop: 16,
  },
  reportSubmitBtnDisabled: { opacity: 0.4 },
  reportSubmitText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  reportCancelText: { fontSize: 15, color: colors.textMuted, textAlign: "center", marginTop: 12 },
  reportSuccess: { alignItems: "center", gap: 8, paddingVertical: 20 },
  reportSuccessEmoji: { fontSize: 32 },
  reportSuccessText: { fontSize: 16, color: colors.text, textAlign: "center" },
  reportDoneBtn: {
    paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, marginTop: 8,
  },
  reportDoneBtnText: { fontSize: 15, fontWeight: "600", color: colors.text },
});
