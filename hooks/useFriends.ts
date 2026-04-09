import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Friend } from "../lib/types";
import { ageFromDob, getInitials } from "../lib/utils";

export function useFriends(userId: string | undefined) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // Get friendships where this user is either user_a or user_b
    const { data, error } = await supabase
      .from("friendships")
      .select(
        `
        *,
        friend_a:profiles!user_a(id, name, avatar_initials),
        friend_b:profiles!user_b(id, name, avatar_initials)
      `
      )
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);

    if (!error && data) {
      // For each friendship, figure out who the OTHER person is
      const friendProfiles = data.map((row: any) => {
        const isA = row.user_a === userId;
        const friend = isA ? row.friend_b : row.friend_a;
        return {
          friendId: friend?.id,
          name: friend?.name ?? "Friend",
          avatar: friend?.avatar_initials ?? "??",
          status: row.status as "active" | "invited",
          itemsShared: row.items_shared ?? 0,
        };
      });

      // Fetch kids for each friend
      const friendIds = friendProfiles
        .map((f) => f.friendId)
        .filter(Boolean);
      const { data: kidsData } = await supabase
        .from("children")
        .select("user_id, name, dob")
        .in("user_id", friendIds);

      const kidsByUser: Record<string, { name: string; age: string }[]> = {};
      (kidsData ?? []).forEach((k: any) => {
        if (!kidsByUser[k.user_id]) kidsByUser[k.user_id] = [];
        kidsByUser[k.user_id].push({
          name: k.name,
          age: ageFromDob(k.dob),
        });
      });

      setFriends(
        friendProfiles.map((f, i) => ({
          id: data[i].id,
          name: f.name,
          kids: kidsByUser[f.friendId] ?? [],
          avatar: f.avatar,
          status: f.status,
          itemsShared: f.itemsShared,
        }))
      );
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { friends, loading, refresh: fetch };
}
