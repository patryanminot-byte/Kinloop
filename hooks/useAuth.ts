import { useEffect, useState } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Email OTP ───────────────────────────────────────────────────────
  const sendEmailOtp = async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
    return data;
  };

  const verifyEmailOtp = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) throw error;
    return data;
  };

  // ── Magic Link ──────────────────────────────────────────────────────
  const sendMagicLink = async (email: string) => {
    const redirectTo = makeRedirectUri({ scheme: "watasu" });
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    if (error) throw error;
    return data;
  };

  // ── Apple Sign In ───────────────────────────────────────────────────
  const signInWithApple = async () => {
    const nonce = Math.random().toString(36).substring(2, 18);
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      nonce,
    );

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      throw new Error("No identity token from Apple");
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
      nonce,
    });
    if (error) throw error;
    return data;
  };

  // ── Google Sign In ──────────────────────────────────────────────────
  const signInWithGoogle = async () => {
    const isExpoGo = Constants.appOwnership === "expo";
    const redirectTo = isExpoGo
      ? makeRedirectUri({ scheme: "exp" })
      : makeRedirectUri({ native: "watasu://google-auth" });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });
    if (error) throw error;
    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
      );
      if (result.type === "success" && result.url) {
        // Extract tokens from the redirect URL
        const url = result.url;
        // Supabase puts tokens in the fragment
        const hashIndex = url.indexOf("#");
        if (hashIndex !== -1) {
          const fragment = url.substring(hashIndex + 1);
          const params = new URLSearchParams(fragment);
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");
          if (accessToken && refreshToken) {
            const { data: sessionData } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            return sessionData;
          }
        }
      }
    }
    return null;
  };

  // ── Phone OTP (requires Twilio) ─────────────────────────────────────
  const sendPhoneOtp = async (phone: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
    return data;
  };

  const verifyPhoneOtp = async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });
    if (error) throw error;
    return data;
  };

  // ── Profile helpers ─────────────────────────────────────────────────
  const isNewUser = async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();
    if (error || !data) return true;
    return false;
  };

  const createProfile = async (
    userId: string,
    identifier: string,
    name?: string,
  ) => {
    const initials = name
      ? name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : identifier.slice(0, 2).toUpperCase();

    const { error } = await supabase.from("profiles").insert({
      id: userId,
      name: name || identifier,
      avatar_initials: initials,
      phone: identifier.includes("@") ? null : identifier,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    session,
    loading,
    // Email
    sendEmailOtp,
    verifyEmailOtp,
    // Magic link
    sendMagicLink,
    // Apple
    signInWithApple,
    // Google
    signInWithGoogle,
    // Phone (future)
    sendPhoneOtp,
    verifyPhoneOtp,
    // Profile
    isNewUser,
    createProfile,
    signOut,
  };
}
