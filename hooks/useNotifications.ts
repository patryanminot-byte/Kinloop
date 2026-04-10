import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import type { EventSubscription } from "expo-modules-core";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

/** Configure how notifications are presented when the app is foregrounded. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Sets up push notifications: requests permission, retrieves the Expo push
 * token, saves it to the user's profile, and registers a response handler
 * that deep-links into the app.
 *
 * Call once in RootLayout.
 */
export function useNotifications(userId?: string | null) {
  const router = useRouter();
  const responseListener = useRef<EventSubscription | null>(null);

  useEffect(() => {
    // Request permission & get token, save to Supabase
    if (userId) {
      registerForPushNotificationsAsync(userId);
    }

    // When user taps a notification, navigate to the relevant screen
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as
          | Record<string, string>
          | undefined;

        if (data?.matchId) {
          router.push(`/match/${data.matchId}`);
        } else if (data?.screen) {
          router.push(data.screen as any);
        }
      });

    return () => {
      responseListener.current?.remove();
    };
  }, [router, userId]);
}

/** Request permission, retrieve the Expo push token, and save to profile. */
async function registerForPushNotificationsAsync(
  userId: string
): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  // Android requires a notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Save push token to user's profile
    await supabase
      .from("profiles")
      .update({ push_token: token })
      .eq("id", userId);

    return token;
  } catch {
    return null;
  }
}

/**
 * Fire a local notification -- handy for testing or in-app events.
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, string>
) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: null, // immediately
  });
}
