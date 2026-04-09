import { supabase } from "./supabase";

interface SearchEvent {
  userId: string | undefined;
  query: string;
  matchedCatalog: boolean;
  selectedEntry?: string; // "Brand Name" or "Name" for catalog picks
  customName?: string; // what they typed for custom items
  category?: string;
  isBundle?: boolean;
}

/**
 * Log a search/add event to Supabase for catalog intelligence.
 *
 * Called when a user:
 * - Picks a catalog suggestion (matchedCatalog = true, selectedEntry = "Patagonia Baby Down Sweater Hoody")
 * - Types a custom item (matchedCatalog = false, customName = "random Target onesies")
 * - Adds a bundle (isBundle = true, category = "Clothing")
 *
 * This data powers:
 * - custom_items_ranked view: what to add to the catalog
 * - popular_catalog_items view: what's trending
 */
export async function logSearchEvent(event: SearchEvent): Promise<void> {
  if (!event.userId) return; // don't log anonymous

  try {
    await supabase.from("search_queries").insert({
      user_id: event.userId,
      query: event.query.trim().slice(0, 200),
      matched_catalog: event.matchedCatalog,
      selected_entry: event.selectedEntry?.slice(0, 200) ?? null,
      custom_name: event.customName?.slice(0, 200) ?? null,
      category: event.category ?? null,
      is_bundle: event.isBundle ?? false,
    });
  } catch {
    // Silently fail — search tracking should never block the user
  }
}
