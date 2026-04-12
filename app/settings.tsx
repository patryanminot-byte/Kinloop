import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "../lib/colors";
import { useAuth } from "../hooks/useAuth";
import { useAppStore } from "../stores/appStore";
import { supabase } from "../lib/supabase";

// ── Warm palette ────────────────────────────────────────────────────

const warm = {
  textDark: "#1A1A1A",
  textMuted: "#8E8E93",
  screenBg: "#FAFAF8",
  cardBg: "#FFFFFF",
  divider: "#EAE7E3",
};

// ── Visibility toggle ───────────────────────────────────────────────

function VisibilityRow() {
  const visibility = useAppStore((s) => s.itemVisibility);
  const setVisibility = useAppStore((s) => s.setItemVisibility);
  const userId = useAuth().session?.user?.id;
  const isPublic = visibility === "public";

  const toggle = async () => {
    const next = isPublic ? "circle" : "public";
    setVisibility(next);
    if (userId) {
      await supabase
        .from("profiles")
        .update({ item_visibility: next })
        .eq("id", userId);
    }
  };

  return (
    <Pressable style={styles.settingsRow} onPress={toggle}>
      <Text style={styles.settingsIcon}>{isPublic ? "\u{1F3D8}\uFE0F" : "\u{1F465}"}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingsLabel}>
          {isPublic ? "Visible to everyone" : "Visible to friends"}
        </Text>
      </View>
      <View style={[styles.toggleTrack, isPublic && styles.toggleTrackOn]}>
        <View style={[styles.toggleThumb, isPublic && styles.toggleThumbOn]} />
      </View>
    </Pressable>
  );
}

// ── Settings rows ───────────────────────────────────────────────────

const SETTINGS_ROWS = [
  { label: "Notifications", icon: "\u{1F514}", route: null },
  { label: "Privacy Policy", icon: "\u{1F4DC}", route: "/legal/privacy" },
  { label: "Terms of Service", icon: "\u{1F4CB}", route: "/legal/terms" },
  { label: "Help & Support", icon: "\u{1F4AC}", route: null },
  { label: "About Watasu", icon: "\u{2728}", route: null },
];

// ── Screen ──────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try { await signOut(); } catch { Alert.alert("Error", "Failed to sign out"); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{"\u2039"} Profile</Text>
        </Pressable>

        {/* Title */}
        <Text style={styles.title}>Settings</Text>

        {/* Settings card */}
        <View style={styles.settingsCard}>
          <VisibilityRow />
          <View style={styles.divider} />
          {SETTINGS_ROWS.map((item, index) => (
            <React.Fragment key={item.label}>
              {index > 0 && <View style={styles.divider} />}
              <Pressable
                style={styles.settingsRow}
                onPress={() => item.route ? router.push(item.route as `/${string}`) : Alert.alert("Coming soon")}
              >
                <Text style={styles.settingsIcon}>{item.icon}</Text>
                <Text style={styles.settingsLabel}>{item.label}</Text>
                <Text style={styles.chevron}>{"\u203A"}</Text>
              </Pressable>
            </React.Fragment>
          ))}
        </View>

        {/* Sign Out */}
        <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

        <Text style={styles.version}>Watasu v3.0</Text>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: warm.screenBg },
  container: { flex: 1 },
  content: { padding: 20 },

  backBtn: { marginBottom: 16 },
  backText: { fontSize: 16, color: warm.textMuted, fontWeight: "500" },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: warm.textDark,
    marginBottom: 20,
  },

  // Settings card
  settingsCard: {
    backgroundColor: warm.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: warm.divider,
    overflow: "hidden",
    marginBottom: 24,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  settingsIcon: {
    fontSize: 18,
    width: 24,
    textAlign: "center" as const,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 16,
    color: warm.textDark,
  },
  chevron: {
    fontSize: 20,
    color: warm.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: warm.divider,
    marginHorizontal: 16,
  },

  // Toggle
  toggleTrack: {
    width: 40,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F0EDEA",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleTrackOn: {
    backgroundColor: colors.violet,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  toggleThumbOn: {
    alignSelf: "flex-end" as const,
  },

  // Sign out
  signOutBtn: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.coral,
    backgroundColor: colors.coralLight,
    marginBottom: 20,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.coral,
  },

  version: {
    fontSize: 12,
    color: warm.textMuted,
    textAlign: "center",
  },
});
