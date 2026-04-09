import { create } from "zustand";
import type { Child, Item, Friend, Match } from "../lib/types";

interface AppState {
  // Auth
  userId: string | null;
  setUserId: (id: string | null) => void;

  // User
  userName: string;
  userInitials: string;
  locationCity: string;
  locationZip: string;
  setUserProfile: (profile: {
    name: string;
    initials: string;
    city?: string;
    zip?: string;
  }) => void;

  // Children
  children: Child[];
  setChildren: (children: Child[]) => void;
  addChild: (child: Child) => void;

  // Inventory
  items: Item[];
  setItems: (items: Item[]) => void;
  addItem: (item: Item) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;

  // Friends
  friends: Friend[];
  setFriends: (friends: Friend[]) => void;

  // Matches
  matches: Match[];
  setMatches: (matches: Match[]) => void;

  // Onboarding
  hasCompletedOnboarding: boolean;
  setOnboardingComplete: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  userId: null,
  setUserId: (id) => set({ userId: id }),

  userName: "",
  userInitials: "",
  locationCity: "",
  locationZip: "",
  setUserProfile: (profile) =>
    set({
      userName: profile.name,
      userInitials: profile.initials,
      locationCity: profile.city ?? "",
      locationZip: profile.zip ?? "",
    }),

  children: [],
  setChildren: (children) => set({ children }),
  addChild: (child) => set((s) => ({ children: [...s.children, child] })),

  items: [],
  setItems: (items) => set({ items }),
  addItem: (item) => set((s) => ({ items: [item, ...s.items] })),
  updateItem: (id, updates) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    })),

  friends: [],
  setFriends: (friends) => set({ friends }),

  matches: [],
  setMatches: (matches) => set({ matches }),

  hasCompletedOnboarding: false,
  setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
}));
