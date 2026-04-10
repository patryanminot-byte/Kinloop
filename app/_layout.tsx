import { useEffect, useRef } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import Constants from "expo-constants";
import { colors } from "../lib/colors";
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
            // Derive initials from name if avatar_initials is empty
            const initials =
              data.avatar_initials ||
              (data.name
                ? data.name
                    .split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "");
            setUserProfile({
              name: data.name,
              initials,
              city: data.location_city ?? "",
              zip: data.location_zip ?? "",
            });
          }
        });
      // Check if they have a profile with a name (onboarding complete)
      supabase
        .from("profiles")
        .select("name")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.name && data.name.length > 0) {
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

  const isExpoGo = Constants.appOwnership === "expo";

  const content = (
    <>
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
        <Stack.Screen name="onboarding/your-name" />
        <Stack.Screen name="onboarding/add-child" />
        <Stack.Screen name="onboarding/contacts" />
        <Stack.Screen name="onboarding/inventory-suggest" />
        <Stack.Screen
          name="match/[id]"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="shop/[id]" />
        <Stack.Screen name="legal/privacy" />
        <Stack.Screen name="legal/terms" />
        <Stack.Screen name="legal/safety-and-privacy" />
        <Stack.Screen name="onboarding/consent" />
      </Stack>
    </>
  );

  if (isExpoGo) {
    return content;
  }

  const { STRIPE_PUBLISHABLE_KEY } = require("../lib/stripe");

  // Skip StripeProvider if key isn't configured yet — avoids crash
  if (!STRIPE_PUBLISHABLE_KEY) {
    return content;
  }

  const { StripeProvider } = require("@stripe/stripe-react-native");

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      {content}
    </StripeProvider>
  );
}
