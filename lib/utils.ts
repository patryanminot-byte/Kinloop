/**
 * Calculate age string from date of birth.
 * Returns e.g. "6 months", "2 years"
 */
export function ageFromDob(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());

  if (months < 1) return "Newborn";
  if (months < 24) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"}`;
}

/**
 * Convert distance in miles to a fuzzy drive-time label.
 * Uses zip centroid math — no GPS needed.
 */
export function distanceLabel(miles: number): string {
  if (miles < 0.5) return "About 2 min away";
  if (miles < 1.5) return "About 5 min away";
  if (miles < 3) return "About 10 min away";
  if (miles < 7) return "About 15 min away";
  return "About 20+ min away";
}

/**
 * Calculate the Kinloop flat fee for a given price.
 */
export function kinloopFee(price: number): number {
  if (price < 50) return 2;
  if (price <= 150) return 5;
  return 8;
}

/**
 * Get initials from a name string.
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Category emoji map.
 */
export const categoryEmojis: Record<string, string> = {
  Clothing: "👕",
  Gear: "🎪",
  Stroller: "🚼",
  "Car Seat": "🚗",
  Books: "📚",
  Toys: "🧸",
  Furniture: "🛏️",
  Other: "📦",
};
