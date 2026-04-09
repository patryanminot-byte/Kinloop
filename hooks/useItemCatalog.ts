import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ITEM_CATALOG,
  SUB_CATEGORIES,
  type CatalogEntry,
  type Category,
  type SubCategory,
} from "../lib/itemCatalog";
import { supabase } from "../lib/supabase";

// ─── Constants ───────────────────────────────────────────────────────────────

const CACHE_KEY = "catalog_cache";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Types ───────────────────────────────────────────────────────────────────

interface CatalogCache {
  entries: CatalogEntry[];
  fetchedAt: number;
}

interface UseItemCatalogResult {
  catalog: CatalogEntry[];
  searchCatalog: (query: string) => CatalogEntry[];
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

function mapRowToEntry(row: CatalogRow): CatalogEntry {
  return {
    brand: row.brand ?? undefined,
    name: row.name,
    category: row.category as CatalogEntry["category"],
    emoji: row.emoji,
    sizeSystem: row.size_system as CatalogEntry["sizeSystem"],
    keywords: row.keywords ?? [],
    popularity: row.popularity ?? 0,
  };
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
        if (!cancelled) {
          setCatalog(cache.entries);
          setIsLive(true);
          setLoading(false);
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

  return { catalog, searchCatalog: search, browseCategory, browseSubCategory, loading, isLive };
}
