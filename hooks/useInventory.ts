import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Item } from "../lib/types";
import { categoryEmojis } from "../lib/utils";

export function useInventory(userId: string | undefined) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setItems(
        data.map((row) => ({
          id: row.id,
          name: row.name,
          category: row.category,
          ageRange: row.age_range,
          status: row.status,
          matchedTo: null,
          emoji: row.emoji,
          daysLeft: undefined,
          isBundle: row.is_bundle,
          count: row.bundle_count,
          hasPhoto: row.has_photo,
          photoUri: row.photo_url,
          pricing: row.pricing_type
            ? { type: row.pricing_type, amount: row.pricing_amount }
            : null,
          condition: row.condition,
        }))
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
      })
      .select()
      .single();

    if (!error && data) {
      await fetch();
      return data;
    }
    return null;
  };

  return { items, loading, refresh: fetch, addItem };
}
