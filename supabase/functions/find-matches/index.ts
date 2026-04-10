// supabase/functions/find-matches/index.ts
// Finds matches for aging-out or available items by checking friends' children.
// Uses category-aware age windows:
//   Clothing: kid 0-6mo younger than item min (they'll grow into it)
//   Gear: kid anywhere in item's age range
//   Toys/Books: kid in range or up to 6mo younger
//   Safety (car seats, cribs): kid must be in range
//
// Can be called with an optional item_id or user_id to scope the search,
// or with no body to scan all aging-out items (daily cron mode).

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ---- Age parsing ----

interface AgeRange {
  minDays: number;
  maxDays: number;
}

function parseAgeRange(ageRange: string): AgeRange {
  // Handles: "0-6mo", "6-12mo", "12-18mo", "2-3y", "0-3y", "6mo-4y"
  const parts = ageRange.match(/(\d+)\s*(mo|y)?\s*[-–]\s*(\d+)\s*(mo|y)/i);
  if (!parts) return { minDays: 0, maxDays: Infinity };

  const minVal = parseInt(parts[1], 10);
  const minUnit = (parts[2] || parts[4] || "mo").toLowerCase();
  const maxVal = parseInt(parts[3], 10);
  const maxUnit = (parts[4] || "mo").toLowerCase();

  const toDays = (val: number, unit: string) =>
    unit === "y" ? val * 365 : val * 30;

  return {
    minDays: toDays(minVal, minUnit),
    maxDays: toDays(maxVal, maxUnit),
  };
}

function ageDays(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  return Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
}

// ---- Category-aware matching ----

const SAFETY_CATEGORIES = ["car seat", "crib", "bassinet"];

function isMatch(
  category: string,
  itemRange: AgeRange,
  childAgeDays: number
): boolean {
  const catLower = category.toLowerCase();
  const sixMonths = 180;

  // Safety items: kid must be within the exact range
  if (SAFETY_CATEGORIES.some((s) => catLower.includes(s))) {
    return childAgeDays >= itemRange.minDays && childAgeDays <= itemRange.maxDays;
  }

  // Clothing: kid is 0-6mo younger than item's min age (they'll grow into it)
  if (catLower === "clothing") {
    return (
      childAgeDays >= itemRange.minDays - sixMonths &&
      childAgeDays <= itemRange.maxDays
    );
  }

  // Gear (strollers, furniture, etc): kid anywhere in range
  if (
    catLower === "gear" ||
    catLower === "stroller" ||
    catLower === "furniture"
  ) {
    return childAgeDays >= itemRange.minDays && childAgeDays <= itemRange.maxDays;
  }

  // Toys, Books, everything else: in range or up to 6mo younger
  return (
    childAgeDays >= itemRange.minDays - sixMonths &&
    childAgeDays <= itemRange.maxDays
  );
}

// ---- Scoring ----

function calculateScore(
  category: string,
  itemRange: AgeRange,
  childAgeDays: number,
  isFriend: boolean,
  distanceMiles: number | null
): number {
  let score = 0;

  // Relationship: friend or nearby
  if (isFriend) score += 50;
  if (distanceMiles !== null && distanceMiles <= 5) score += 50;

  // Age fit quality: how well does the kid's age fit the item?
  const rangeMid = (itemRange.minDays + itemRange.maxDays) / 2;
  const ageDiff = Math.abs(childAgeDays - rangeMid);
  const rangeSpan = itemRange.maxDays - itemRange.minDays;
  if (rangeSpan > 0) {
    const fitRatio = 1 - Math.min(ageDiff / rangeSpan, 1);
    score += Math.round(fitRatio * 30); // 0-30 points
  } else {
    score += 15;
  }

  // Category priority: safety items slightly boosted
  const catLower = category.toLowerCase();
  if (SAFETY_CATEGORIES.some((s) => catLower.includes(s))) {
    score += 10;
  }

  return score;
}

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---- Message generation ----

function generateMessage(
  receiverName: string,
  childName: string,
  itemName: string,
  itemEmoji: string
): string {
  const templates = [
    `Hey ${receiverName}! ${childName} might be the perfect age for this ${itemEmoji} ${itemName}. Want it?`,
    `Hi ${receiverName} — our ${itemEmoji} ${itemName} is ready for its next adventure. Would ${childName} like it?`,
    `${receiverName}, thought of ${childName} right away! We have a ${itemEmoji} ${itemName} looking for a new home.`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

// ---- Main handler ----

serve(async (req) => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Optional scoping: { item_id?, user_id? }
  let scopeItemId: string | null = null;
  let scopeUserId: string | null = null;

  try {
    const body = await req.json();
    scopeItemId = body?.item_id ?? null;
    scopeUserId = body?.user_id ?? null;
  } catch {
    // No body — full scan mode (cron)
  }

  // Build query for items to check
  let query = supabase
    .from("items")
    .select("id, user_id, name, emoji, age_range, category, pricing_type, pricing_amount")
    .in("status", ["aging-out", "available"]);

  if (scopeItemId) {
    query = query.eq("id", scopeItemId);
  } else if (scopeUserId) {
    query = query.eq("user_id", scopeUserId);
  }

  const { data: items, error: itemsError } = await query;

  if (itemsError) {
    return new Response(JSON.stringify({ error: itemsError.message }), {
      status: 500,
    });
  }

  let matchesCreated = 0;

  for (const item of items ?? []) {
    const itemRange = parseAgeRange(item.age_range);

    // Get the giver's profile (including location for distance scoring)
    const { data: giver } = await supabase
      .from("profiles")
      .select("name, location_lat, location_lng")
      .eq("id", item.user_id)
      .single();

    // Find the owner's active friends
    const { data: friendships } = await supabase
      .from("friendships")
      .select("user_a, user_b")
      .eq("status", "active")
      .or(`user_a.eq.${item.user_id},user_b.eq.${item.user_id}`);

    if (!friendships || friendships.length === 0) continue;

    const friendIds = friendships.map((f) =>
      f.user_a === item.user_id ? f.user_b : f.user_a
    );

    for (const friendId of friendIds) {
      const { data: friend } = await supabase
        .from("profiles")
        .select("name, location_lat, location_lng")
        .eq("id", friendId)
        .single();

      // Calculate distance between giver and receiver
      let distanceMiles: number | null = null;
      if (
        giver?.location_lat && giver?.location_lng &&
        friend?.location_lat && friend?.location_lng
      ) {
        distanceMiles = haversineDistance(
          giver.location_lat, giver.location_lng,
          friend.location_lat, friend.location_lng
        );
      }

      const { data: children } = await supabase
        .from("children")
        .select("id, name, dob")
        .eq("user_id", friendId);

      if (!children) continue;

      for (const child of children) {
        const childAge = ageDays(child.dob);

        if (isMatch(item.category, itemRange, childAge)) {
          // Check for existing match to avoid duplicates
          const { data: existing } = await supabase
            .from("matches")
            .select("id")
            .eq("item_id", item.id)
            .eq("receiver_id", friendId)
            .eq("receiver_child_id", child.id)
            .maybeSingle();

          if (existing) continue;

          const message = generateMessage(
            friend?.name ?? "Friend",
            child.name,
            item.name,
            item.emoji
          );

          const score = calculateScore(
            item.category,
            itemRange,
            childAge,
            true, // these are all friend matches
            distanceMiles
          );

          const { error: insertError } = await supabase
            .from("matches")
            .insert({
              item_id: item.id,
              giver_id: item.user_id,
              receiver_id: friendId,
              receiver_child_id: child.id,
              status: "ready",
              message,
              score,
              pricing_type: item.pricing_type,
              pricing_amount: item.pricing_amount,
            });

          if (!insertError) {
            matchesCreated++;

            // Send push notification to the receiver
            try {
              const { data: receiverProfile } = await supabase
                .from("profiles")
                .select("push_token")
                .eq("id", friendId)
                .single();

              if (receiverProfile?.push_token) {
                await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${supabaseServiceKey}`,
                  },
                  body: JSON.stringify({
                    user_id: friendId,
                    title: `${giver?.name ?? "A friend"} has something for ${child.name}!`,
                    body: `${item.emoji} ${item.name} — tap to see the match`,
                    data: { screen: "/(tabs)" },
                  }),
                });
              }
            } catch {
              // Notification failure shouldn't block match creation
            }
          }
        }
      }
    }
  }

  return new Response(
    JSON.stringify({ success: true, matchesCreated }),
    { headers: { "Content-Type": "application/json" } }
  );
});
