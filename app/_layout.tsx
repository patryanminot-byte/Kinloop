import { useEffect, useRef } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StripeProvider } from "@stripe/stripe-react-native";
import * as SplashScreen from "expo-splash-screen";
import { colors } from "../lib/colors";
import { STRIPE_PUBLISHABLE_KEY } from "../lib/stripe";
import { useNotifications } from "../hooks/useNotifications";
import { useAuth } from "../hooks/useAuth";
import { useAppStore } from "../stores/appStore";
import { supabase } from "../lib/supabase";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useNotifications();
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const setUserId = useAppStore((s) => s.setUserId);
  const setUserProfile = useAppStore((s) => s.setUserProfile);
  const setOnboardingComplete = useAppStore((s) => s.setOnboardingComplete);
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);

  // Guard against rapid-fire redirects
  const lastRedirectTime = useRef(0);
  const isNavigating = useRef(false);

  // Sync auth state to store
  useEffect(() => {
    if (session?.user) {
      setUserId(session.user.id);
      // Load profile
      supabase
        .from("profiles")
        .select("name, avatar_initials, location_city, location_zip")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setUserProfile({
              name: data.name,
              initials: data.avatar_initials ?? "",
              city: data.location_city ?? "",
              zip: data.location_zip ?? "",
            });
          }
        });
      // Check if they have children (proxy for onboarding complete)
      supabase
        .from("children")
        .select("id")
        .eq("user_id", session.user.id)
        .limit(1)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setOnboardingComplete();
          }
        });
    } else {
      setUserId(null);
    }
  }, [session]);

  // Route protection
  useEffect(() => {
    if (loading) return;

    // Prevent rapid-fire redirects (debounce 500ms)
    const now = Date.now();
    if (now - lastRedirectTime.current < 500) return;
    if (isNavigating.current) return;

    const inOnboarding = segments[0] === "onboarding";

    if (!session) {
      // Not signed in -- go to welcome
      if (!inOnboarding) {
        isNavigating.current = true;
        lastRedirectTime.current = now;
        router.replace("/onboarding/welcome");
        setTimeout(() => {
          isNavigating.current = false;
        }, 600);
      }
    } else if (hasCompletedOnboarding) {
      // Signed in + onboarded -- go to tabs if still in onboarding
      if (inOnboarding) {
        isNavigating.current = true;
        lastRedirectTime.current = now;
        router.replace("/(tabs)");
        setTimeout(() => {
          isNavigating.current = false;
        }, 600);
      }
    }
    // If signed in but NOT completed onboarding:
    // Let the user stay wherever they are in onboarding.
    // Do NOT redirect them -- they may be on welcome, add-child, contacts, etc.
    // The onboarding screens themselves handle forward navigation.
  }, [session, loading, hasCompletedOnboarding, segments]);

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="onboarding/welcome"
          options={{ animation: "fade" }}
        />
        <Stack.Screen name="onboarding/add-child" />
        <Stack.Screen name="onboarding/contacts" />
        <Stack.Screen name="onboarding/inventory-suggest" />
        <Stack.Screen
          name="match/[id]"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="shop/[id]" />
      </Stack>
    </StripeProvider>
  );
}
