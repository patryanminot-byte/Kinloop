import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Child, Item, Friend, Match, ToGoItem } from "../lib/types";

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

  // Location
  locationLat: number | null;
  locationLng: number | null;
  setLocation: (lat: number, lng: number) => void;

  // Item visibility: "circle" = friends (default), "public" = everyone
  itemVisibility: string;
  setItemVisibility: (v: string) => void;

  // Onboarding
  hasCompletedOnboarding: boolean;
  setOnboardingComplete: () => void;

  // To-Go session (persisted)
  toGoItems: ToGoItem[];
  addToGoItem: (item: ToGoItem) => void;
  removeToGoItem: (localId: string) => void;
  updateToGoItem: (localId: string, updates: Partial<ToGoItem>) => void;
  clearToGo: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
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

      locationLat: null,
      locationLng: null,
      setLocation: (lat, lng) => set({ locationLat: lat, locationLng: lng }),

      itemVisibility: "circle" as string,
      setItemVisibility: (v: string) => set({ itemVisibility: v }),

      hasCompletedOnboarding: false,
      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),

      // To-Go session
      toGoItems: [],
      addToGoItem: (item) =>
        set((s) => ({ toGoItems: [...s.toGoItems, item] })),
      removeToGoItem: (localId) =>
        set((s) => ({
          toGoItems: s.toGoItems.filter((i) => i.localId !== localId),
        })),
      updateToGoItem: (localId, updates) =>
        set((s) => ({
          toGoItems: s.toGoItems.map((i) =>
            i.localId === localId ? { ...i, ...updates } : i
          ),
        })),
      clearToGo: () => set({ toGoItems: [] }),
    }),
    {
      name: "watasu-app-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ toGoItems: state.toGoItems }),
    }
  )
);
