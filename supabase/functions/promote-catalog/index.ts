// supabase/functions/promote-catalog/index.ts
// Monthly cron (or manual): promotes popular custom items into the catalog.
// Queries custom_items_ranked for items with unique_users >= 5 that don't
// already exist in catalog_entries, then inserts them with status='pending'
// for admin review before they go live.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/** Convert a string to Title Case. */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (char) => char.toUpperCase());
}

Deno.serve(async (_req) => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 1. Fetch all candidates from the ranked view
  const { data: candidates, error: viewError } = await supabase
    .from("custom_items_ranked")
    .select("item_name, category, times_typed, unique_users, last_typed")
    .gte("unique_users", 5);

  if (viewError) {
    return new Response(
      JSON.stringify({ error: viewError.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const candidateList = candidates ?? [];
  let promoted = 0;

  for (const item of candidateList) {
    const normalizedName = item.item_name.trim().toLowerCase();

    // 2. Check for an existing catalog entry (case-insensitive)
    const { data: existing, error: lookupError } = await supabase
      .from("catalog_entries")
      .select("id")
      .ilike("name", normalizedName)
      .maybeSingle();

    if (lookupError) {
      console.error(`Lookup error for "${item.item_name}":`, lookupError.message);
      continue;
    }

    if (existing) {
      // Already in the catalog — skip
      continue;
    }

    // 3. Insert the new catalog entry with status='pending'
    const { error: insertError } = await supabase
      .from("catalog_entries")
      .insert({
        name: toTitleCase(item.item_name),
        category: item.category ?? "Free Stuff",
        emoji: "📦",
        size_system: "one-size",
        keywords: [normalizedName],
        source: "auto-promoted",
        status: "pending",
        promoted_from: item.item_name,
        times_typed: item.times_typed,
        unique_users: item.unique_users,
      });

    if (insertError) {
      console.error(`Insert error for "${item.item_name}":`, insertError.message);
      continue;
    }

    promoted++;
  }

  // 4. Refresh popularity scores from search data
  //    Update every catalog entry's popularity from how often it's been selected
  const { data: popular } = await supabase
    .from("popular_catalog_items")
    .select("item_name, times_selected");

  let popularityUpdated = 0;
  if (popular && popular.length > 0) {
    // Reset all popularity first
    await supabase
      .from("catalog_entries")
      .update({ popularity: 0 })
      .neq("id", "00000000-0000-0000-0000-000000000000"); // match all rows

    for (const p of popular) {
      const { error: upErr } = await supabase
        .from("catalog_entries")
        .update({ popularity: p.times_selected, updated_at: new Date().toISOString() })
        .ilike("name", p.item_name);

      if (!upErr) popularityUpdated++;
    }
  }

  return new Response(
    JSON.stringify({ promoted, candidates: candidateList.length, popularityUpdated }),
    { headers: { "Content-Type": "application/json" } }
  );
});
