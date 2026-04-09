// milestones.ts — Age-based outgrown item predictions
// Used for onboarding seed prompts, push nudges, and contextual suggestions.

import type { Category } from "./itemCatalog";

export interface MilestoneItem {
  name: string;
  emoji: string;
  category: Category;
}

export interface Milestone {
  /** Age in months when kids typically outgrow these items */
  ageMonths: number;
  /** Friendly label */
  label: string;
  /** Prompt text for notifications/screens */
  prompt: string;
  /** Items commonly outgrown at this age */
  items: MilestoneItem[];
}

export const MILESTONES: Milestone[] = [
  {
    ageMonths: 6,
    label: "6 months",
    prompt: "is almost 6 months! Most families are done with these by now.",
    items: [
      { name: "NB & 0-3mo clothes", emoji: "👶", category: "Clothing" },
      { name: "Swaddles", emoji: "🌙", category: "Sleep" },
      { name: "Infant car seat", emoji: "🚗", category: "Car Seats" },
      { name: "Newborn diapers & supplies", emoji: "🧷", category: "Gear" },
      { name: "Bassinet", emoji: "🛏️", category: "Sleep" },
      { name: "Baby swing", emoji: "🪑", category: "Gear" },
      { name: "Infant bath tub", emoji: "🛁", category: "Bath" },
      { name: "Bottles (small)", emoji: "🍼", category: "Feeding" },
    ],
  },
  {
    ageMonths: 12,
    label: "1 year",
    prompt: "is turning 1! 🎂 Time to pass along some baby gear?",
    items: [
      { name: "6-12mo clothes", emoji: "👕", category: "Clothing" },
      { name: "Infant toys & rattles", emoji: "🧸", category: "Toys" },
      { name: "Baby bottles", emoji: "🍼", category: "Feeding" },
      { name: "Sleep sacks (small)", emoji: "🌙", category: "Sleep" },
      { name: "Bouncer or rocker", emoji: "🪑", category: "Gear" },
      { name: "Baby carrier (infant insert)", emoji: "🤱", category: "Gear" },
      { name: "Play mat / activity gym", emoji: "🎪", category: "Gear" },
      { name: "Board books (baby)", emoji: "📚", category: "Books" },
      { name: "Infant shoes", emoji: "👟", category: "Shoes" },
    ],
  },
  {
    ageMonths: 18,
    label: "18 months",
    prompt: "is 18 months! Outgrowing the baby phase fast.",
    items: [
      { name: "12-18mo clothes", emoji: "👕", category: "Clothing" },
      { name: "Stroller bassinet attachment", emoji: "🍼", category: "Strollers" },
      { name: "High chair (infant)", emoji: "🪑", category: "Feeding" },
      { name: "Baby monitor", emoji: "📹", category: "Gear" },
      { name: "Stacking toys", emoji: "🧸", category: "Toys" },
      { name: "Push walker", emoji: "🧸", category: "Toys" },
      { name: "Baby gate", emoji: "🔒", category: "Safety" },
      { name: "Toddler shoes (first walkers)", emoji: "👣", category: "Shoes" },
    ],
  },
  {
    ageMonths: 24,
    label: "2 years",
    prompt: "is turning 2! A lot of baby stuff is probably gathering dust.",
    items: [
      { name: "18-24mo clothes", emoji: "👕", category: "Clothing" },
      { name: "Crib (converting to toddler bed?)", emoji: "🛏️", category: "Furniture" },
      { name: "Sleep sacks", emoji: "🌙", category: "Sleep" },
      { name: "Sound machine", emoji: "🌊", category: "Gear" },
      { name: "Sippy cups", emoji: "🥤", category: "Feeding" },
      { name: "Baby-proofing gear", emoji: "🔒", category: "Safety" },
      { name: "Toddler toys", emoji: "🧸", category: "Toys" },
      { name: "Board books", emoji: "📚", category: "Books" },
      { name: "Potty training seat", emoji: "🚽", category: "Gear" },
    ],
  },
  {
    ageMonths: 36,
    label: "3 years",
    prompt: "is 3! They're basically a big kid now. Anything to clear out?",
    items: [
      { name: "2T-3T clothes", emoji: "👕", category: "Clothing" },
      { name: "Convertible car seat", emoji: "🚗", category: "Car Seats" },
      { name: "Toddler shoes", emoji: "👟", category: "Shoes" },
      { name: "Stroller (upgrading or done?)", emoji: "🍼", category: "Strollers" },
      { name: "Potty seat / step stool", emoji: "🪜", category: "Gear" },
      { name: "Duplo / toddler building toys", emoji: "🧱", category: "Toys" },
      { name: "Tricycle", emoji: "🚲", category: "Toys" },
      { name: "Toddler puzzles", emoji: "🧩", category: "Toys" },
      { name: "Play kitchen accessories", emoji: "🍳", category: "Toys" },
    ],
  },
  {
    ageMonths: 48,
    label: "4 years",
    prompt: "is 4! Preschool era — lots of stuff to cycle through.",
    items: [
      { name: "4T clothes", emoji: "👕", category: "Clothing" },
      { name: "Winter outerwear (old sizes)", emoji: "🧥", category: "Outerwear" },
      { name: "Rain boots (old sizes)", emoji: "🥾", category: "Shoes" },
      { name: "Training wheels bike", emoji: "🚲", category: "Outdoor" },
      { name: "Preschool toys", emoji: "🧸", category: "Toys" },
      { name: "Costumes & dress-up", emoji: "🎭", category: "Toys" },
      { name: "Art supplies", emoji: "🎨", category: "Toys" },
    ],
  },
  {
    ageMonths: 60,
    label: "5 years",
    prompt: "is starting kindergarten! Big kid stuff now.",
    items: [
      { name: "5T clothes", emoji: "👕", category: "Clothing" },
      { name: "Booster car seat", emoji: "🚗", category: "Car Seats" },
      { name: "Kid sneakers (old sizes)", emoji: "👟", category: "Shoes" },
      { name: "Balance bike", emoji: "🚲", category: "Outdoor" },
      { name: "Early reader books", emoji: "📚", category: "Books" },
      { name: "Outdoor play equipment", emoji: "🌳", category: "Outdoor" },
      { name: "Magna-Tiles / building sets", emoji: "🧱", category: "Toys" },
    ],
  },
];

// ─── Seasonal prompts ─────────────────────────────────────────────────────────

export interface SeasonalPrompt {
  /** Month (1-12) when this prompt is relevant */
  month: number;
  title: string;
  message: string;
  emoji: string;
  suggestedCategories: Category[];
}

export const SEASONAL_PROMPTS: SeasonalPrompt[] = [
  {
    month: 1,
    title: "Post-holiday cleanout",
    message: "New toys in, old toys out? Make space and make someone's day.",
    emoji: "🎄",
    suggestedCategories: ["Toys", "Books", "Clothing"],
  },
  {
    month: 3,
    title: "Spring cleaning",
    message: "Winter gear gathering dust? Someone in your circle might need it next year.",
    emoji: "🌷",
    suggestedCategories: ["Outerwear", "Shoes", "Clothing"],
  },
  {
    month: 6,
    title: "Summer swap",
    message: "School's out! Any gear, clothes, or toys to pass along for summer?",
    emoji: "☀️",
    suggestedCategories: ["Outdoor", "Clothing", "Toys", "Shoes"],
  },
  {
    month: 9,
    title: "Back to school",
    message: "Summer stuff going into storage? Someone might need it now.",
    emoji: "🎒",
    suggestedCategories: ["Outdoor", "Clothing", "Shoes"],
  },
  {
    month: 11,
    title: "Pre-holiday declutter",
    message: "Making room before the holidays? Clear some space and spread some joy.",
    emoji: "🧹",
    suggestedCategories: ["Toys", "Books", "Gear", "Clothing"],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Get the child's age in months from their DOB string (YYYY-MM-DD). */
export function childAgeInMonths(dob: string): number {
  const born = new Date(dob + "T00:00:00");
  const now = new Date();
  return (
    (now.getFullYear() - born.getFullYear()) * 12 +
    (now.getMonth() - born.getMonth())
  );
}

/**
 * Get the most relevant milestone for a child's current age.
 * Returns the milestone they've most recently passed or are about to hit.
 * We trigger ~1 month before the milestone age.
 */
export function getRelevantMilestone(dob: string): Milestone | null {
  const ageMonths = childAgeInMonths(dob);

  // Find the most recent milestone they've passed (or are within 1 month of)
  let best: Milestone | null = null;
  for (const m of MILESTONES) {
    if (ageMonths >= m.ageMonths - 1) {
      best = m;
    }
  }
  return best;
}

/**
 * Get ALL milestones a child has passed (for comprehensive suggestions).
 * Useful for onboarding — "here's everything you might have outgrown."
 */
export function getAllPassedMilestones(dob: string): Milestone[] {
  const ageMonths = childAgeInMonths(dob);
  return MILESTONES.filter((m) => ageMonths >= m.ageMonths - 1);
}

/**
 * Get the next upcoming milestone for nudge scheduling.
 * Returns null if the child is past all milestones.
 */
export function getNextMilestone(dob: string): Milestone | null {
  const ageMonths = childAgeInMonths(dob);
  return MILESTONES.find((m) => m.ageMonths > ageMonths) ?? null;
}

/**
 * Get unique suggested items across all passed milestones for a child.
 * Deduplicates by name.
 */
export function getSuggestedItems(dob: string): MilestoneItem[] {
  const passed = getAllPassedMilestones(dob);
  const seen = new Set<string>();
  const items: MilestoneItem[] = [];
  for (const m of passed) {
    for (const item of m.items) {
      if (!seen.has(item.name)) {
        seen.add(item.name);
        items.push(item);
      }
    }
  }
  return items;
}

/**
 * Get the current seasonal prompt (if any).
 * Returns the prompt for the current month, or null.
 */
export function getCurrentSeasonalPrompt(): SeasonalPrompt | null {
  const month = new Date().getMonth() + 1;
  return SEASONAL_PROMPTS.find((p) => p.month === month) ?? null;
}
