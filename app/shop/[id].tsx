import React, { useState, useMemo } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { colors, gradientColors } from "../../lib/colors";
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

// --------------- Mock Data (duplicated for lookup) ---------------

const ALL_ITEMS: Item[] = [
  {
    id: "s1",
    name: "6-12mo clothes bundle",
    category: "Clothing",
    ageRange: "6-12mo",
    status: "available",
    matchedTo: null,
    emoji: "\uD83D\uDC55",
    isBundle: true,
    count: 15,
    pricing: { type: "free" },
    from: "Sarah Chen",
    fromAvatar: "SC",
    ring: "friend",
  },
  {
    id: "s2",
    name: "High chair",
    category: "Gear",
    ageRange: "6-24mo",
    status: "available",
    matchedTo: null,
    emoji: "\uD83E\uDE91",
    pricing: { type: "give-what-you-can" },
    from: "Mike Johnson",
    fromAvatar: "MJ",
    ring: "friend",
    condition: "Great",
  },
  {
    id: "s3",
    name: "Uppababy Vista",
    category: "Stroller",
    ageRange: "0-3y",
    status: "available",
    matchedTo: null,
    emoji: "\uD83D\uDEBC",
    pricing: { type: "set-price", amount: 120 },
    from: "Lisa Park",
    fromAvatar: "LP",
    ring: "friend",
    condition: "Like new",
    postedAgo: "2d ago",
  },
  {
    id: "s4",
    name: "Crib",
    category: "Furniture",
    ageRange: "0-2y",
    status: "available",
    matchedTo: null,
    emoji: "\uD83D\uDECF\uFE0F",
    pricing: { type: "set-price", amount: 75 },
    from: "Jamie R.",
    fromAvatar: "JR",
    ring: "nearby",
    distance: "About 5 min away",
    condition: "Good",
    postedAgo: "1d ago",
  },
  {
    id: "s5",
    name: "2T-3T clothes bundle",
    category: "Clothing",
    ageRange: "2-3y",
    status: "available",
    matchedTo: null,
    emoji: "\uD83D\uDC55",
    isBundle: true,
    count: 20,
    pricing: { type: "free" },
    from: "Alex M.",
    fromAvatar: "AM",
    ring: "nearby",
    distance: "About 10 min away",
    postedAgo: "3h ago",
  },
  {
    id: "s6",
    name: "Balance bike",
    category: "Toys",
    ageRange: "2-5y",
    status: "available",
    matchedTo: null,
    emoji: "\uD83D\uDEB2",
    pricing: { type: "give-what-you-can" },
    from: "Pat K.",
    fromAvatar: "PK",
    ring: "nearby",
    distance: "About 15 min away",
    condition: "Great",
    postedAgo: "5d ago",
  },
];

const GWYW_AMOUNTS = [5, 15, 25];

function getPricingBadgeInfo(item: Item) {
  const pricing = item.pricing;
  if (!pricing) return null;
  switch (pricing.type) {
    case "free":
      return { label: "\uD83C\uDF81 Free", color: colors.neonGreen };
    case "give-what-you-can":
      return { label: "\uD83D\uDC9B You decide", color: colors.neonOrange };
    case "set-price":
      return { label: `$${pricing.amount ?? 0}`, color: colors.neonPurple };
    default:
      return null;
  }
}

function getActionLabel(item: Item): string {
  const pricing = item.pricing;
  if (!pricing) return "Request this";
  switch (pricing.type) {
    case "free":
      return "Claim this \u2014 it's free! \uD83C\uDF81";
    case "give-what-you-can":
      return "Request this \uD83D\uDC9B";
    case "set-price":
      return `Buy for $${pricing.amount ?? 0} \uD83C\uDFF7\uFE0F`;
    default:
      return "Request this";
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export default function ShopItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [addedToMine, setAddedToMine] = useState(false);
  const [requested, setRequested] = useState(false);
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
            <Text style={styles.backLink}>{"\u2190"} Back to shop</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const pricingBadge = getPricingBadgeInfo(item);
  const isGWYC = item.pricing?.type === "give-what-you-can";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Back button */}
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Text style={styles.backLink}>{"\u2190"} Back to shop</Text>
        </Pressable>

        {/* Big emoji */}
        <Text style={styles.bigEmoji}>{item.emoji}</Text>

        {/* Name */}
        <Text style={styles.itemName}>{item.name}</Text>
        {item.isBundle && item.count ? (
          <Text style={styles.bundleCount}>{item.count} items in bundle</Text>
        ) : null}

        {/* Badge row */}
        <View style={styles.badgeRow}>
          {item.ring === "friend" ? (
            <Badge color={colors.neonPurple}>From a friend</Badge>
          ) : item.distance ? (
            <Badge color={colors.neonCyan}>{item.distance}</Badge>
          ) : null}
          {item.condition ? (
            <Badge color={colors.neonGreen}>{item.condition}</Badge>
          ) : null}
        </View>

        {/* Seller card */}
        <Card style={styles.sellerCard}>
          <View style={styles.sellerRow}>
            <Avatar initials={item.fromAvatar ?? "?"} size={36} />
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{item.from}</Text>
              {item.postedAgo ? (
                <Text style={styles.postedAgo}>Posted {item.postedAgo}</Text>
              ) : null}
            </View>
            {pricingBadge ? (
              <Badge color={pricingBadge.color}>{pricingBadge.label}</Badge>
            ) : null}
          </View>
        </Card>

        {/* Details card */}
        <Card style={styles.detailsCard}>
          <DetailRow label="Category" value={item.category} />
          <View style={styles.divider} />
          <DetailRow label="Age Range" value={item.ageRange} />
          {item.condition ? (
            <>
              <View style={styles.divider} />
              <DetailRow label="Condition" value={item.condition} />
            </>
          ) : null}
        </Card>

        {/* "I have this too" — add to own inventory */}
        {!addedToMine ? (
          <Pressable
            style={styles.haveThisRow}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const newItem: Item = {
                id: generateId(),
                name: item.name,
                category: item.category,
                ageRange: item.ageRange,
                status: "available",
                matchedTo: null,
                emoji: item.emoji,
                isBundle: item.isBundle,
                count: item.count,
              };
              addItem(newItem);
              if (userId) {
                await supabase.from("items").insert({
                  user_id: userId,
                  name: item.name,
                  category: item.category,
                  age_range: item.ageRange,
                  emoji: item.emoji,
                  status: "available",
                });
              }
              setAddedToMine(true);
            }}
          >
            <Text style={styles.haveThisEmoji}>{"\u270B"}</Text>
            <View style={styles.haveThisTextWrap}>
              <Text style={styles.haveThisTitle}>I have this too</Text>
              <Text style={styles.haveThisSubtitle}>
                Add to your stuff to pass along
              </Text>
            </View>
            <Text style={styles.haveThisPlus}>+</Text>
          </Pressable>
        ) : (
          <View style={[styles.haveThisRow, styles.haveThisAdded]}>
            <Text style={styles.haveThisEmoji}>{"\u2705"}</Text>
            <Text style={styles.haveThisTitle}>Added to your stuff!</Text>
          </View>
        )}

        {/* Give What You Can UI */}
        {isGWYC && (
          <View style={styles.gwycSection}>
            <Text style={styles.gwycTitle}>Give what feels right</Text>
            <View style={styles.gwycRow}>
              {GWYW_AMOUNTS.map((amt) => {
                const isSelected = selectedAmount === amt;
                return isSelected ? (
                  <LinearGradient
                    key={amt}
                    colors={gradientColors.button}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gwycPill}
                  >
                    <Pressable onPress={() => setSelectedAmount(amt)}>
                      <Text style={[styles.gwycPillText, styles.gwycPillTextActive]}>
                        ${amt}
                      </Text>
                    </Pressable>
                  </LinearGradient>
                ) : (
                  <Pressable
                    key={amt}
                    style={styles.gwycPill}
                    onPress={() => setSelectedAmount(amt)}
                  >
                    <Text style={styles.gwycPillText}>${amt}</Text>
                  </Pressable>
                );
              })}
              {selectedAmount !== -1 ? (
                <Pressable
                  style={styles.gwycPill}
                  onPress={() => setSelectedAmount(-1)}
                >
                  <Text style={styles.gwycPillText}>Other</Text>
                </Pressable>
              ) : (
                <LinearGradient
                  colors={gradientColors.button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gwycPill}
                >
                  <Pressable onPress={() => setSelectedAmount(-1)}>
                    <Text style={[styles.gwycPillText, styles.gwycPillTextActive]}>
                      Other
                    </Text>
                  </Pressable>
                </LinearGradient>
              )}
            </View>
            <Text style={styles.gwycHint}>
              Or just say thanks — no pressure either way
            </Text>
          </View>
        )}
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
                        reportReason === reason &&
                          styles.reportOptionTextSelected,
                      ]}
                    >
                      {reason}
                    </Text>
                  </Pressable>
                ))}

                <Text style={styles.reportLabel}>
                  Details{" "}
                  <Text style={styles.reportOptional}>(optional)</Text>
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

      {/* Action button pinned at bottom */}
      <View style={styles.actionBar}>
        <Button
          variant="primary"
          size="lg"
          title={requested ? "Requested! \u2714" : getActionLabel(item)}
          disabled={requested}
          onPress={async () => {
            if (item.pricing?.type === "set-price") {
              setShowPayment(true);
              return;
            }
            // Free or GWUC — create a match request
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (userId) {
              await supabase.from("matches").insert({
                item_id: item.id,
                receiver_id: userId,
                giver_id: null, // will be filled by seller
                status: "offered",
                pricing_type: item.pricing?.type ?? "free",
                pricing_amount: isGWYC ? selectedAmount : null,
              });
            }
            setRequested(true);
            Alert.alert(
              "Request sent!",
              `The owner of ${item.name} will be notified.`,
            );
          }}
          style={styles.actionButton}
        />
      </View>

      {/* Stripe payment sheet for set-price items */}
      {item.pricing?.type === "set-price" && item.pricing.amount != null && (
        <PaymentSheet
          visible={showPayment}
          itemId={item.id}
          itemName={item.name}
          itemEmoji={item.emoji}
          itemPrice={item.pricing.amount}
          sellerId={item.id} // TODO: replace with real seller user ID
          onSuccess={() => {
            setShowPayment(false);
            Alert.alert(
              "Payment successful!",
              `You bought ${item.name}. The seller will be in touch.`,
            );
          }}
          onCancel={() => setShowPayment(false)}
        />
      )}
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
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
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  notFound: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: 12,
  },

  // Back
  back: {
    marginBottom: 20,
  },
  backLink: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.neonPurple,
  },

  // Hero
  bigEmoji: {
    fontSize: 56,
    textAlign: "center",
    marginBottom: 12,
  },
  itemName: {
    fontSize: 22,
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

  // Badges
  badgeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 20,
  },

  // Seller card
  sellerCard: {
    marginBottom: 12,
  },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  postedAgo: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Details card
  detailsCard: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  // "I have this too"
  haveThisRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  haveThisAdded: {
    borderColor: colors.neonGreen,
    backgroundColor: "#F0FDF4",
  },
  haveThisEmoji: {
    fontSize: 20,
  },
  haveThisTextWrap: {
    flex: 1,
  },
  haveThisTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  haveThisSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  haveThisPlus: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.neonPurple,
  },

  // GWYC
  gwycSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  gwycTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  gwycRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  gwycPill: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  gwycPillText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  gwycPillTextActive: {
    color: "#FFFFFF",
  },

  gwycHint: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // Report
  reportLink: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 8,
  },
  reportLinkText: {
    fontSize: 13,
    color: "#AEAEB2",
    textDecorationLine: "underline",
  },
  reportOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  reportModal: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  reportLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    marginTop: 12,
    marginBottom: 8,
  },
  reportOptional: {
    fontWeight: "400",
  },
  reportOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 6,
  },
  reportOptionSelected: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  reportOptionText: {
    fontSize: 15,
    color: colors.text,
  },
  reportOptionTextSelected: {
    color: "#EF4444",
    fontWeight: "600",
  },
  reportInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    minHeight: 70,
    backgroundColor: colors.card,
  },
  reportSubmitBtn: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  reportSubmitBtnDisabled: {
    opacity: 0.4,
  },
  reportSubmitText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  reportCancelText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 12,
  },
  reportSuccess: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 20,
  },
  reportSuccessEmoji: { fontSize: 32 },
  reportSuccessText: {
    fontSize: 16,
    color: colors.text,
    textAlign: "center",
  },
  reportDoneBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  reportDoneBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },

  // Action bar
  actionBar: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    width: "100%",
  },
});
