// supabase/functions/find-matches/index.ts
// Triggered after age-check: for each 'aging-out' item, look at the owner's
// friends' children. If a friend's child is in the item's age range, create a
// match row with status='ready' and a warm pre-written message.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/** Parse age_range like "0-6m", "6-12m", "1-2y" into { minDays, maxDays }. */
function parseAgeRange(ageRange: string): { minDays: number; maxDays: number } {
  const match = ageRange.match(/(\d+)\s*-\s*(\d+)\s*(m|y)/i);
  if (!match) return { minDays: 0, maxDays: Infinity };

  const min = parseInt(match[1], 10);
  const max = parseInt(match[2], 10);
  const unit = match[3].toLowerCase();
  const multiplier = unit === "m" ? 30 : 365;

  return { minDays: min * multiplier, maxDays: max * multiplier };
}

/** Calculate age in days from a date of birth. */
function ageDays(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  return Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
}

/** Generate a warm pre-written message for the match. */
function generateMessage(
  giverName: string,
  receiverName: string,
  childName: string,
  itemName: string,
  itemEmoji: string
): string {
  const templates = [
    `Hey ${receiverName}! ${childName} might be the perfect age for this ${itemEmoji} ${itemName}. Want it?`,
    `Hi ${receiverName} -- our ${itemEmoji} ${itemName} is ready for its next adventure. Would ${childName} like it?`,
    `${receiverName}, thought of ${childName} right away! We have a ${itemEmoji} ${itemName} that's looking for a new home.`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

serve(async (_req) => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch all aging-out items with their owner info
  const { data: items, error: itemsError } = await supabase
    .from("items")
    .select("id, user_id, name, emoji, age_range, pricing_type, pricing_amount")
    .eq("status", "aging-out");

  if (itemsError) {
    return new Response(JSON.stringify({ error: itemsError.message }), { status: 500 });
  }

  let matchesCreated = 0;

  for (const item of items ?? []) {
    const { minDays, maxDays } = parseAgeRange(item.age_range);

    // Get the giver's profile
    const { data: giver } = await supabase
      .from("profiles")
      .select("name")
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
      // Get the friend's profile
      const { data: friend } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", friendId)
        .single();

      // Get the friend's children
      const { data: children } = await supabase
        .from("children")
        .select("id, name, dob")
        .eq("user_id", friendId);

      if (!children) continue;

      for (const child of children) {
        const childAge = ageDays(child.dob);

        if (childAge >= minDays && childAge <= maxDays) {
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
            giver?.name ?? "A friend",
            friend?.name ?? "Friend",
            child.name,
            item.name,
            item.emoji
          );

          const { error: insertError } = await supabase.from("matches").insert({
            item_id: item.id,
            giver_id: item.user_id,
            receiver_id: friendId,
            receiver_child_id: child.id,
            status: "ready",
            message,
            pricing_type: item.pricing_type,
            pricing_amount: item.pricing_amount,
          });

          if (!insertError) matchesCreated++;
        }
      }
    }
  }

  return new Response(
    JSON.stringify({ success: true, matchesCreated }),
    { headers: { "Content-Type": "application/json" } }
  );
});
