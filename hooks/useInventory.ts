import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Item } from "../lib/types";
import { categoryEmojis } from "../lib/utils";
import { triggerMatchEngine } from "../lib/matchTrigger";

/** Parse "6-12mo" or "2-3y" and return the max in days from birth */
function parseAgeRangeMaxDays(ageRange: string | null): number | null {
  if (!ageRange) return null;
  const parts = ageRange.match(/(\d+)\s*(mo|y)/gi);
  if (!parts || parts.length === 0) return null;
  // Take the last match (the max end)
  const last = parts[parts.length - 1];
  const m = last.match(/(\d+)\s*(mo|y)/i);
  if (!m) return null;
  const val = parseInt(m[1], 10);
  return m[2].toLowerCase() === "y" ? val * 365 : val * 30;
}

export function useInventory(userId: string | undefined) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // Fetch items and the user's youngest child's DOB for daysLeft calc
    const [itemsRes, childRes] = await Promise.all([
      supabase
        .from("items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("children")
        .select("dob")
        .eq("user_id", userId)
        .order("dob", { ascending: false })
        .limit(1),
    ]);

    const { data, error } = itemsRes;
    const youngestDob = childRes.data?.[0]?.dob
      ? new Date(childRes.data[0].dob)
      : null;

    if (!error && data) {
      setItems(
        data.map((row) => {
          // Calculate daysLeft: days until child outgrows this item's age range
          let daysLeft: number | undefined;
          if (youngestDob && row.age_range) {
            const maxDays = parseAgeRangeMaxDays(row.age_range);
            if (maxDays !== null) {
              const childAgeDays = Math.floor(
                (Date.now() - youngestDob.getTime()) / (1000 * 60 * 60 * 24)
              );
              daysLeft = Math.max(0, maxDays - childAgeDays);
            }
          }

          return {
            id: row.id,
            name: row.name,
            category: row.category,
            ageRange: row.age_range,
            status: row.status,
            matchedTo: null,
            emoji: row.emoji,
            daysLeft,
            isBundle: row.is_bundle,
            count: row.bundle_count,
            hasPhoto: row.has_photo,
            photoUri: row.photo_url,
            pricing: row.pricing_type
              ? { type: row.pricing_type, amount: row.pricing_amount }
              : null,
            condition: row.condition,
          };
        })
      );
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addItem = async (item: {
    name: string;
    category: string;
    ageRange: string;
    emoji: string;
    isBundle?: boolean;
    photoUri?: string;
    condition?: string;
    pricing?: { type: string; amount?: number | null } | null;
  }) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from("items")
      .insert({
        user_id: userId,
        name: item.name,
        category: item.category,
        age_range: item.ageRange,
        emoji: item.emoji || categoryEmojis[item.category] || "📦",
        is_bundle: item.isBundle ?? false,
        has_photo: !!item.photoUri,
        photo_url: item.photoUri || null,
        condition: item.condition || null,
        pricing_type: item.pricing?.type || null,
        pricing_amount: item.pricing?.amount || null,
      })
      .select()
      .single();

    if (!error && data) {
      await fetch();
      // Trigger matching for this new item
      triggerMatchEngine({ item_id: data.id });
      return data;
    }
    return null;
  };

  return { items, loading, refresh: fetch, addItem };
}
