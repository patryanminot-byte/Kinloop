import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Item } from "../lib/types";
import { getInitials } from "../lib/utils";
import { distanceBetween } from "../lib/distance";
import { useAppStore } from "../stores/appStore";

export function useShop(userId: string | undefined) {
  const userLat = useAppStore((s) => s.locationLat);
  const userLng = useAppStore((s) => s.locationLng);
  const [friendItems, setFriendItems] = useState<Item[]>([]);
  const [nearbyItems, setNearbyItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // Get friend IDs
    const { data: friendships } = await supabase
      .from("friendships")
      .select("user_a, user_b")
      .eq("status", "active")
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);

    const friendIds = (friendships ?? []).map((f: any) =>
      f.user_a === userId ? f.user_b : f.user_a
    );

    // Friend items: items owned by friends that are available
    if (friendIds.length > 0) {
      const { data: fItems } = await supabase
        .from("items")
        .select("*, owner:profiles!user_id(name, avatar_initials, location_lat, location_lng)")
        .in("user_id", friendIds)
        .eq("status", "available")
        .order("created_at", { ascending: false });

      setFriendItems(
        (fItems ?? []).map((row: any) => mapItem(row, "friend", userLat, userLng))
      );
    } else {
      setFriendItems([]);
    }

    // Nearby items: visible_nearby = true, not owned by user or friends
    const excludeIds = [userId, ...friendIds];
    const { data: nItems } = await supabase
      .from("items")
      .select("*, owner:profiles!user_id(name, avatar_initials, location_lat, location_lng)")
      .eq("visible_nearby", true)
      .eq("status", "available")
      .not("user_id", "in", `(${excludeIds.join(",")})`)
      .order("created_at", { ascending: false });

    setNearbyItems(
      (nItems ?? []).map((row: any) => mapItem(row, "nearby", userLat, userLng))
    );

    setLoading(false);
  }, [userId, userLat, userLng]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { friendItems, nearbyItems, loading, refresh: fetch };
}

function mapItem(
  row: any,
  ring: "friend" | "nearby",
  userLat: number | null,
  userLng: number | null,
): Item {
  const dist = distanceBetween(
    userLat,
    userLng,
    row.owner?.location_lat ?? null,
    row.owner?.location_lng ?? null,
  );

  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    category: row.category,
    ageRange: row.age_range,
    status: row.status,
    matchedTo: null,
    emoji: row.emoji,
    isBundle: row.is_bundle,
    count: row.bundle_count,
    hasPhoto: row.has_photo,
    photoUri: row.photo_url,
    pricing: row.pricing_type
      ? { type: row.pricing_type, amount: row.pricing_amount }
      : null,
    condition: row.condition,
    from: row.owner?.name ?? "Someone",
    fromAvatar: row.owner?.avatar_initials ?? "??",
    ring,
    distance: dist?.label ?? null,
    distanceMinutes: dist?.minutes ?? null,
    postedAgo: formatTimeAgo(row.created_at),
  };
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
