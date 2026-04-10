import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Match } from "../lib/types";
import { ageFromDob, getInitials } from "../lib/utils";

export function useMatches(userId: string | undefined) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
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

    if (!error && data) {
      setMatches(
        data.map((row: any) => ({
          id: row.id,
          item: row.item?.name ?? "Item",
          itemEmoji: row.item?.emoji ?? "📦",
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
    const fee =
      pricingType === "set-price" && pricingAmount
        ? pricingAmount < 50
          ? 2
          : pricingAmount <= 150
            ? 5
            : 8
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

  return { matches, loading, refresh: fetch, sendMatch };
}
