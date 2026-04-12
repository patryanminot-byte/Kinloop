export interface Child {
  id: string;
  name: string;
  dob: string; // ISO date
  emoji: string; // skin-toned emoji like 👶🏽
}

export interface Friend {
  id: string;
  name: string;
  kids: { name: string; age: string }[];
  avatar: string; // initials
  status: "active" | "invited";
  itemsShared: number;
}

export interface Item {
  id: string;
  userId?: string;
  name: string;
  category: string;
  ageRange: string;
  status: "available" | "aging-out" | "matched" | "handed-off";
  matchedTo: string | null;
  emoji: string;
  daysLeft?: number;
  isBundle?: boolean;
  count?: number;
  bundleItems?: { name: string; emoji: string }[];
  hasPhoto?: boolean;
  photoUri?: string;
  pricing?: Pricing | null;
  ring?: "friend" | "nearby";
  distance?: string | null; // "About 5 min away"
  distanceMinutes?: number | null; // numeric minutes for sorting/grouping
  postedAgo?: string;
  condition?: string;
  from?: string;
  fromAvatar?: string;
  description?: string;
}

export interface Pricing {
  type: "free" | "give-what-you-can" | "set-price";
  amount?: number | null;
}

export interface ToGoItem {
  localId: string;
  name: string;
  emoji: string;
  category: string;
  ageRange: string;
  condition: string;
  wantsBundle: boolean;
  description?: string;
  photoUri?: string;
  pricingType?: "free" | "give-what-you-can" | "set-price";
  pricingAmount?: number;
}

export type HandoffMethod = "porch" | "meetup" | "school" | "ship";

export interface HandoffPlan {
  method: HandoffMethod;
  details: string; // e.g., "Saturday at Garner Park"
  scheduledDate?: string; // ISO date
}

export interface Match {
  id: string;
  item: string;
  itemEmoji: string;
  isBundle?: boolean;
  count?: number;
  from: string;
  to: string;
  toAvatar: string;
  toKid: string;
  toKidAge: string;
  status: "ready" | "offered" | "accepted" | "scheduled" | "completed" | "handed-off" | "declined";
  message: string;
  personalLine: string;
  pricing: Pricing | null;
  daysAgo: number;
  sentAt?: string;
  handoff?: HandoffPlan | null;
  rating?: "up" | "down" | null;
  ring?: "friend" | "nearby";
  role?: "giver" | "receiver";
  fromAvatar?: string;
}
