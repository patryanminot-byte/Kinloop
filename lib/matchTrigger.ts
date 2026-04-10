import { supabase } from "./supabase";

/**
 * Trigger the find-matches edge function.
 * Call after adding an item or creating a friendship.
 *
 * @param scope Optional: { item_id } to check one item, { user_id } to check all of a user's items
 */
export async function triggerMatchEngine(
  scope?: { item_id?: string; user_id?: string }
) {
  try {
    await supabase.functions.invoke("find-matches", {
      body: scope ?? {},
    });
  } catch {
    // Silent fail — matching is best-effort, not blocking
  }
}
