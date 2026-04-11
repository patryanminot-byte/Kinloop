import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Match } from "../lib/types";
import { ageFromDob, getInitials } from "../lib/utils";

export function useMatches(userId: string | undefined) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [incomingOffers, setIncomingOffers] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // Fetch outgoing matches (user is giver)
    const { data: outgoing, error: outError } = await supabase
      .from("matches")
      .select(
        `
        *,
        item:items(*),
        receiver:profiles!receiver_id(name, avatar_initials),
        receiver_child:children!receiver_child_id(name, dob, emoji)
      `
      )
      .eq("giver_id", userId)
      .order("score", { ascending: false })
      .order("created_at", { ascending: false });

    if (!outError && outgoing) {
      setMatches(
        outgoing.map((row: any) => ({
          id: row.id,
          item: row.item?.name ?? "Item",
          itemEmoji: row.item?.emoji ?? "\u{1F4E6}",
          isBundle: row.item?.is_bundle,
          count: row.item?.bundle_count,
          from: "You",
          to: row.receiver?.name ?? "Friend",
          toAvatar: row.receiver?.avatar_initials ?? "??",
          toKid: row.receiver_child?.name ?? "Child",
          toKidAge: row.receiver_child?.dob
            ? ageFromDob(row.receiver_child.dob)
            : "",
          status: row.status,
          message: row.message ?? "",
          personalLine: row.personal_line ?? "",
          pricing: row.pricing_type
            ? { type: row.pricing_type, amount: row.pricing_amount }
            : null,
          daysAgo: Math.floor(
            (Date.now() - new Date(row.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          ),
          sentAt: row.offered_at,
          handoff: row.handoff ?? null,
          rating: row.rating ?? null,
          role: "giver" as const,
        }))
      );
    }

    // Fetch incoming offers (user is receiver) — include all statuses so
    // deep-links to declined/completed matches show the correct state
    // instead of "Match not found"
    const { data: incoming, error: inError } = await supabase
      .from("matches")
      .select(
        `
        *,
        item:items(*),
        giver:profiles!giver_id(name, avatar_initials),
        receiver_child:children!receiver_child_id(name, dob, emoji)
      `
      )
      .eq("receiver_id", userId)
      .order("created_at", { ascending: false });

    if (!inError && incoming) {
      setIncomingOffers(
        incoming.map((row: any) => ({
          id: row.id,
          item: row.item?.name ?? "Item",
          itemEmoji: row.item?.emoji ?? "\u{1F4E6}",
          isBundle: row.item?.is_bundle,
          count: row.item?.bundle_count,
          from: row.giver?.name ?? "Someone",
          fromAvatar: row.giver?.avatar_initials ?? "??",
          to: "You",
          toAvatar: "",
          toKid: row.receiver_child?.name ?? "Your child",
          toKidAge: row.receiver_child?.dob
            ? ageFromDob(row.receiver_child.dob)
            : "",
          status: row.status,
          message: row.message ?? "",
          personalLine: row.personal_line ?? "",
          pricing: row.pricing_type
            ? { type: row.pricing_type, amount: row.pricing_amount }
            : null,
          daysAgo: Math.floor(
            (Date.now() - new Date(row.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          ),
          sentAt: row.offered_at,
          handoff: row.handoff ?? null,
          rating: row.rating ?? null,
          role: "receiver" as const,
        }))
      );
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const sendMatch = async (
    matchId: string,
    pricingType: string,
    pricingAmount: number | null,
    personalLine: string
  ) => {
    // 10% total fee (includes processing). Watasu keeps ~7.1%, Stripe gets ~2.9%+$0.30
    const fee =
      pricingType === "set-price" && pricingAmount
        ? Math.round(pricingAmount * 0.10 * 100) / 100
        : null;

    const { error } = await supabase
      .from("matches")
      .update({
        status: "offered",
        pricing_type: pricingType,
        pricing_amount: pricingAmount,
        watasu_fee: fee,
        personal_line: personalLine || null,
        offered_at: new Date().toISOString(),
      })
      .eq("id", matchId);

    if (!error) await fetch();
    return !error;
  };

  const acceptMatch = async (matchId: string) => {
    // Get match details for notification before updating
    const { data: matchData } = await supabase
      .from("matches")
      .select("giver_id, item:items(name, emoji), receiver_child:children!receiver_child_id(name)")
      .eq("id", matchId)
      .single();

    const { error } = await supabase
      .from("matches")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", matchId);

    if (!error) {
      await fetch();
      // Notify the giver
      if (matchData?.giver_id) {
        const item = matchData.item as any;
        const child = matchData.receiver_child as any;
        supabase.functions.invoke("send-notification", {
          body: {
            user_id: matchData.giver_id,
            title: `${child?.name ?? "Someone"} is getting your ${item?.name ?? "item"}!`,
            body: `Your offer was accepted ${item?.emoji ?? ""} — time to arrange the handoff`,
            data: { matchId },
          },
        }).catch(() => {});
      }
    }
    return !error;
  };

  const declineMatch = async (matchId: string) => {
    // Get match details for notification
    const { data: matchData } = await supabase
      .from("matches")
      .select("giver_id, item:items(name, emoji)")
      .eq("id", matchId)
      .single();

    const { error } = await supabase
      .from("matches")
      .update({ status: "declined" })
      .eq("id", matchId);

    if (!error) {
      await fetch();
      // Notify the giver (gently)
      if (matchData?.giver_id) {
        const item = matchData.item as any;
        supabase.functions.invoke("send-notification", {
          body: {
            user_id: matchData.giver_id,
            title: `${item?.emoji ?? ""} ${item?.name ?? "Your item"} is still available`,
            body: "We'll keep looking for the perfect match",
            data: { screen: "/(tabs)" },
          },
        }).catch(() => {});
      }
    }
    return !error;
  };

  return {
    matches,
    incomingOffers,
    loading,
    refresh: fetch,
    sendMatch,
    acceptMatch,
    declineMatch,
  };
}
