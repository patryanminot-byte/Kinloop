// supabase/functions/age-check/index.ts
// Daily cron: checks each item's age_range against the owner's child's current age.
// If the child is aging out within 30 days, sets status='aging-out' and computes days_left.
// If already past the range, sets days_left=0.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/** Parse an age_range string like "0-6m", "6-12m", "1-2y", "2-3y" into max age in days. */
function parseAgeRangeMaxDays(ageRange: string): number {
  const match = ageRange.match(/(\d+)\s*-\s*(\d+)\s*(m|y)/i);
  if (!match) return Infinity;

  const max = parseInt(match[2], 10);
  const unit = match[3].toLowerCase();

  if (unit === "m") return max * 30;
  if (unit === "y") return max * 365;
  return Infinity;
}

/** Calculate age in days from a date of birth. */
function ageDays(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  const diffMs = now.getTime() - birth.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

serve(async (_req) => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch all items that are 'available' or 'aging-out', joined with children via user_id
  const { data: items, error: itemsError } = await supabase
    .from("items")
    .select("id, user_id, age_range, status")
    .in("status", ["available", "aging-out"]);

  if (itemsError) {
    return new Response(JSON.stringify({ error: itemsError.message }), { status: 500 });
  }

  let updated = 0;

  for (const item of items ?? []) {
    // Get the owner's children
    const { data: children } = await supabase
      .from("children")
      .select("id, dob")
      .eq("user_id", item.user_id);

    if (!children || children.length === 0) continue;

    const maxAgeDays = parseAgeRangeMaxDays(item.age_range);

    for (const child of children) {
      const currentAgeDays = ageDays(child.dob);
      const daysUntilAgeOut = maxAgeDays - currentAgeDays;

      if (daysUntilAgeOut <= 0) {
        // Already past the age range
        await supabase
          .from("items")
          .update({ status: "aging-out", days_left: 0 })
          .eq("id", item.id);
        updated++;
      } else if (daysUntilAgeOut <= 30) {
        // Aging out within 30 days
        await supabase
          .from("items")
          .update({ status: "aging-out", days_left: daysUntilAgeOut })
          .eq("id", item.id);
        updated++;
      }
    }
  }

  return new Response(
    JSON.stringify({ success: true, itemsUpdated: updated }),
    { headers: { "Content-Type": "application/json" } }
  );
});
