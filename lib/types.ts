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
  name: string;
  category: string;
  ageRange: string;
  status: "available" | "aging-out" | "matched" | "handed-off";
  matchedTo: string | null;
  emoji: string;
  daysLeft?: number;
  isBundle?: boolean;
  count?: number;
  hasPhoto?: boolean;
  photoUri?: string;
  pricing?: Pricing | null;
  ring?: "friend" | "nearby";
  distance?: string | null; // "About 5 min away"
  postedAgo?: string;
  condition?: string;
  from?: string;
  fromAvatar?: string;
}

export interface Pricing {
  type: "free" | "give-what-you-can" | "set-price";
  amount?: number | null;
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
  status: "ready" | "offered" | "accepted" | "completed";
  message: string;
  personalLine: string;
  pricing: Pricing | null;
  daysAgo: number;
}
