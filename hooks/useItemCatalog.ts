import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ITEM_CATALOG,
  CATEGORY_INFO,
  SUB_CATEGORIES,
  BRANDS,
  PRODUCT_TYPES,
  MODEL_CATEGORIES,
  type CatalogEntry,
  type Category,
  type SubCategory,
} from "../lib/itemCatalog";
import { supabase } from "../lib/supabase";

// ─── Constants ───────────────────────────────────────────────────────────────

const CACHE_KEY = "catalog_cache_v2"; // v2: emoji sanitization
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Types ───────────────────────────────────────────────────────────────────

interface CatalogCache {
  entries: CatalogEntry[];
  fetchedAt: number;
}

interface UseItemCatalogResult {
  catalog: CatalogEntry[];
  searchCatalog: (query: string) => CatalogEntry[];
  /** New brand-aware search: pass the selected category for smarter results. */
  searchSmart: (query: string, category: Category) => CatalogEntry[];
  browseCategory: (category: string, limit?: number) => CatalogEntry[];
  browseSubCategory: (category: string, subCategory: SubCategory, limit?: number) => CatalogEntry[];
  loading: boolean;
  isLive: boolean;
}

// ─── DB row shape returned by Supabase ───────────────────────────────────────

interface CatalogRow {
  brand?: string | null;
  name: string;
  category: string;
  emoji: string;
  size_system: string;
  keywords: string[];
  status: string;
  popularity?: number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Validate that an emoji string contains actual emoji (not garbled encoding).
// Garbled strings often contain Apple logo / replacement chars / control chars.
const EMOJI_REGEX = /\p{Emoji_Presentation}|\p{Emoji}\uFE0F/u;
function isValidEmoji(s: string | null | undefined): boolean {
  if (!s || s.length === 0) return false;
  return EMOJI_REGEX.test(s);
}

// Build a lookup from the static catalog for emoji fallback
const STATIC_EMOJI_LOOKUP = new Map<string, string>();
for (const entry of ITEM_CATALOG) {
  const key = `${(entry.brand ?? "").toLowerCase()}|${entry.name.toLowerCase()}`;
  STATIC_EMOJI_LOOKUP.set(key, entry.emoji);
}

/** Fix garbled emoji on any catalog entry, using static catalog as fallback. */
function fixEmoji(entry: { brand?: string | null; name: string; category: string; emoji: string }): string {
  if (isValidEmoji(entry.emoji)) return entry.emoji;
  const key = `${(entry.brand ?? "").toLowerCase()}|${entry.name.toLowerCase()}`;
  return STATIC_EMOJI_LOOKUP.get(key) ?? CATEGORY_INFO[entry.category as Category]?.emoji ?? "\u{1F4E6}";
}

function mapRowToEntry(row: CatalogRow): CatalogEntry {
  return {
    brand: row.brand ?? undefined,
    name: row.name,
    category: row.category as CatalogEntry["category"],
    emoji: fixEmoji(row),
    sizeSystem: row.size_system as CatalogEntry["sizeSystem"],
    keywords: row.keywords ?? [],
    popularity: row.popularity ?? 0,
  };
}

/** Sanitize emoji on cached entries that may have been stored with garbled data. */
function sanitizeCachedEntries(entries: CatalogEntry[]): CatalogEntry[] {
  let anyFixed = false;
  const fixed = entries.map((e) => {
    const good = fixEmoji(e);
    if (good !== e.emoji) {
      anyFixed = true;
      return { ...e, emoji: good };
    }
    return e;
  });
  return anyFixed ? fixed : entries;
}

function searchCatalogEntries(
  query: string,
  catalog: CatalogEntry[]
): CatalogEntry[] {
  if (!query || query.trim().length === 0) return [];
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);
  const scored: { entry: CatalogEntry; score: number }[] = [];

  // Find the max popularity across the catalog for normalization
  let maxPop = 1;
  for (const entry of catalog) {
    if ((entry.popularity ?? 0) > maxPop) maxPop = entry.popularity!;
  }

  for (const entry of catalog) {
    const haystack = [entry.brand ?? "", entry.name, ...entry.keywords]
      .join(" ")
      .toLowerCase();
    let matched = 0;
    for (const term of terms) {
      if (haystack.includes(term)) matched++;
    }
    if (matched === 0) continue;
    let score = matched / terms.length;
    if (matched === terms.length) score += 1;
    const lowerQuery = query.toLowerCase();
    if (entry.brand && entry.brand.toLowerCase().includes(lowerQuery))
      score += 0.5;
    if (entry.name.toLowerCase().includes(lowerQuery)) score += 0.5;

    // Popularity boost: up to +0.3 for the most-selected items
    // This is a tiebreaker — relevance still wins, but popular items float up
    const pop = entry.popularity ?? 0;
    if (pop > 0) {
      score += 0.3 * (pop / maxPop);
    }

    scored.push({ entry, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 8).map((s) => s.entry);
}

// ─── Brand-aware smart search ────────────────────────────────────────────────

const MODEL_SET = new Set(MODEL_CATEGORIES);

function searchBrandProducts(query: string, category: Category): CatalogEntry[] {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  const sizeSystem = CATEGORY_INFO[category]?.sizeSystem ?? "age-range";
  const categoryEmoji = CATEGORY_INFO[category]?.emoji ?? "\u{1F4E6}";
  const isModelCat = MODEL_SET.has(category);
  const types = PRODUCT_TYPES[category] ?? [];

  const results: CatalogEntry[] = [];
  const seen = new Set<string>(); // dedupe key: "brand|name"

  const addResult = (brand: string | undefined, name: string, emoji: string) => {
    const key = `${(brand ?? "").toLowerCase()}|${name.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push({
      brand,
      name,
      category,
      emoji,
      sizeSystem,
      keywords: [],
    });
  };

  // 1. Find brands matching the query that participate in this category
  const matchingBrands = BRANDS.filter((b) => {
    if (!b.categories.includes(category)) return false;
    const haystack = [b.name, ...b.keywords].join(" ").toLowerCase();
    return haystack.includes(q);
  });

  // 2. For each matching brand, generate results
  for (const brand of matchingBrands) {
    if (isModelCat && brand.models?.[category]) {
      // Hard good: show specific models
      for (const model of brand.models[category]!) {
        addResult(brand.name, model, categoryEmoji);
      }
    } else {
      // Soft good: show brand + product types
      for (const type of types) {
        addResult(brand.name, type.name, type.emoji);
      }
    }
  }

  // 3. Check if query matches a product type name (e.g., "fleece", "shirt")
  const matchingTypes = types.filter((t) => t.name.toLowerCase().includes(q));
  if (matchingTypes.length > 0) {
    for (const type of matchingTypes) {
      // Generic (no brand)
      addResult(undefined, type.name, type.emoji);
      // Top brands for this category that aren't already shown
      const brandsInCat = BRANDS.filter(
        (b) => b.categories.includes(category) && !matchingBrands.includes(b)
      );
      for (const brand of brandsInCat.slice(0, 4)) {
        if (isModelCat && brand.models?.[category]) {
          // For model categories, filter models that match the type query
          for (const model of brand.models[category]!) {
            if (model.toLowerCase().includes(q)) {
              addResult(brand.name, model, categoryEmoji);
            }
          }
        } else {
          addResult(brand.name, type.name, type.emoji);
        }
      }
    }
  }

  // 4. If no brand or type matches, check if query matches any model names
  if (results.length === 0 && isModelCat) {
    for (const brand of BRANDS) {
      if (!brand.categories.includes(category)) continue;
      const models = brand.models?.[category];
      if (!models) continue;
      for (const model of models) {
        if (model.toLowerCase().includes(q)) {
          addResult(brand.name, model, categoryEmoji);
        }
      }
    }
  }

  // 5. If still nothing, search keywords across all brands in this category
  if (results.length === 0) {
    for (const brand of BRANDS) {
      if (!brand.categories.includes(category)) continue;
      const matches = brand.keywords.some((k) => k.includes(q) || q.includes(k));
      if (!matches) continue;
      if (isModelCat && brand.models?.[category]) {
        for (const model of brand.models[category]!) {
          addResult(brand.name, model, categoryEmoji);
        }
      } else {
        for (const type of types) {
          addResult(brand.name, type.name, type.emoji);
        }
      }
    }
  }

  return results.slice(0, 8);
}

async function readCache(): Promise<CatalogCache | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CatalogCache;
  } catch {
    return null;
  }
}

async function writeCache(entries: CatalogEntry[]): Promise<void> {
  try {
    const cache: CatalogCache = { entries, fetchedAt: Date.now() };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Non-fatal — silently ignore cache write failures
  }
}

async function fetchFromSupabase(): Promise<CatalogEntry[] | null> {
  try {
    const { data, error } = await supabase
      .from("catalog_entries")
      .select("brand, name, category, emoji, size_system, keywords, popularity")
      .eq("status", "active");

    if (error || !data) return null;
    return (data as CatalogRow[]).map(mapRowToEntry);
  } catch {
    return null;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useItemCatalog(): UseItemCatalogResult {
  const [catalog, setCatalog] = useState<CatalogEntry[]>(ITEM_CATALOG);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  const refresh = useCallback(async (currentCatalog: CatalogEntry[]) => {
    const fresh = await fetchFromSupabase();
    if (fresh && fresh.length > 0) {
      setCatalog(fresh);
      setIsLive(true);
      await writeCache(fresh);
    } else if (currentCatalog === ITEM_CATALOG) {
      // Fetch failed and we have no live data — keep static catalog as-is
      setIsLive(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      const cache = await readCache();

      if (cache && cache.entries.length > 0) {
        const ageMs = Date.now() - cache.fetchedAt;
        const cleanEntries = sanitizeCachedEntries(cache.entries);
        if (!cancelled) {
          setCatalog(cleanEntries);
          setIsLive(true);
          setLoading(false);
        }
        // Re-write cache if emoji were fixed
        if (cleanEntries !== cache.entries) {
          writeCache(cleanEntries);
        }

        if (ageMs >= CACHE_TTL_MS) {
          // Cache is stale — refresh in the background
          refresh(cache.entries);
        }
        return;
      }

      // No usable cache — fetch from Supabase
      const fresh = await fetchFromSupabase();
      if (!cancelled) {
        if (fresh && fresh.length > 0) {
          setCatalog(fresh);
          setIsLive(true);
          writeCache(fresh); // fire-and-forget
        } else {
          // Offline or fetch failed — fall back to static catalog
          setCatalog(ITEM_CATALOG);
          setIsLive(false);
        }
        setLoading(false);
      }
    }

    initialize();

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const search = useCallback(
    (query: string) => searchCatalogEntries(query, catalog),
    [catalog]
  );

  const smartSearch = useCallback(
    (query: string, category: Category) => searchBrandProducts(query, category),
    []
  );

  /** Return top items in a category, sorted by popularity (most popular first). */
  const browseCategory = useCallback(
    (category: string, limit = 20): CatalogEntry[] => {
      const matches = catalog.filter(
        (e) => e.category.toLowerCase() === category.toLowerCase()
      );
      // Sort by popularity descending, then alphabetically by name
      matches.sort((a, b) => {
        const popDiff = (b.popularity ?? 0) - (a.popularity ?? 0);
        if (popDiff !== 0) return popDiff;
        const nameA = a.brand ? `${a.brand} ${a.name}` : a.name;
        const nameB = b.brand ? `${b.brand} ${b.name}` : b.name;
        return nameA.localeCompare(nameB);
      });
      return matches.slice(0, limit);
    },
    [catalog]
  );

  /** Return items matching a sub-category within a category. */
  const browseSubCategory = useCallback(
    (category: string, subCategory: SubCategory, limit = 20): CatalogEntry[] => {
      const matches = catalog.filter((e) => {
        if (e.category.toLowerCase() !== category.toLowerCase()) return false;
        const haystack = [e.brand ?? "", e.name, ...e.keywords]
          .join(" ")
          .toLowerCase();
        return subCategory.matchers.some((m) => haystack.includes(m));
      });
      // Sort by popularity descending, then alphabetically
      matches.sort((a, b) => {
        const popDiff = (b.popularity ?? 0) - (a.popularity ?? 0);
        if (popDiff !== 0) return popDiff;
        const nameA = a.brand ? `${a.brand} ${a.name}` : a.name;
        const nameB = b.brand ? `${b.brand} ${b.name}` : b.name;
        return nameA.localeCompare(nameB);
      });
      return matches.slice(0, limit);
    },
    [catalog]
  );

  return { catalog, searchCatalog: search, searchSmart: smartSearch, browseCategory, browseSubCategory, loading, isLive };
}
