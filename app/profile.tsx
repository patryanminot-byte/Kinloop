import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "../lib/colors";
import { Child } from "../lib/types";
import Avatar from "../components/ui/Avatar";
import Card from "../components/ui/Card";
import GradientBar from "../components/ui/GradientBar";
import Button from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { useAppStore } from "../stores/appStore";
import { supabase } from "../lib/supabase";

const MOCK_USER = {
  name: "Pat Ryan",
  initials: "PR",
  city: "Madison, WI",
};

const MOCK_KIDS: Child[] = [
  { id: "1", name: "Maya", dob: "2023-03-15", emoji: "\u{1F467}\u{1F3FD}" },
  { id: "2", name: "Leo", dob: "2024-11-02", emoji: "\u{1F476}\u{1F3FC}" },
];

function formatDob(dob: string): string {
  const date = new Date(dob + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function childAge(dob: string): string {
  const born = new Date(dob + "T00:00:00");
  const now = new Date();
  const months =
    (now.getFullYear() - born.getFullYear()) * 12 +
    (now.getMonth() - born.getMonth());
  if (months < 24) return `${months}mo`;
  const years = Math.floor(months / 12);
  return `${years}y`;
}

const SETTINGS_ROWS = [
  { label: "Notifications", icon: "\u{1F514}" },
  { label: "Privacy", icon: "\u{1F512}" },
  { label: "Help & Support", icon: "\u{1F4AC}" },
  { label: "About Watasu", icon: "\u{2728}" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const userId = session?.user?.id;
  const { userName, userInitials, locationCity } = useAppStore();

  const [kids, setKids] = useState<Child[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("children")
      .select("*")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (data)
          setKids(
            data.map((k: any) => ({
              id: k.id,
              name: k.name,
              dob: k.dob,
              emoji: k.emoji,
            })),
          );
      });
  }, [userId]);

  const hasRealUser = userName.length > 0;
  const displayUser = hasRealUser
    ? { name: userName, initials: userInitials, city: locationCity }
    : MOCK_USER;

  const displayKids = kids.length > 0 ? kids : MOCK_KIDS;

  // Mock stats (will wire to real data)
  const stats = {
    passedAlong: 12,
    received: 8,
    saved: 340,
    friendsInCircle: 6,
  };

  const comingSoon = () => Alert.alert("Coming soon");

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleEditName = () => {
    setNameDraft(displayUser.name);
    setEditingName(true);
  };

  const handleSaveName = () => {
    // TODO: persist to Supabase
    setEditingName(false);
    Alert.alert("Saved", `Name updated to "${nameDraft}"`);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      Alert.alert("Error", "Failed to sign out");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{"\u2190"} Back</Text>
        </Pressable>

        {/* ── User Card ── */}
        <Card style={styles.userCard}>
          {/* Avatar — tappable to add/change photo */}
          <TouchableOpacity
            onPress={handlePickPhoto}
            style={styles.avatarContainer}
            activeOpacity={0.7}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} />
            ) : (
              <Avatar initials={displayUser.initials} size={72} gradient />
            )}
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditIcon}>{"\u{1F4F7}"}</Text>
            </View>
          </TouchableOpacity>

          {/* Name — tappable to edit */}
          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={nameDraft}
                onChangeText={setNameDraft}
                autoFocus
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
              />
              <TouchableOpacity onPress={handleSaveName}>
                <Text style={styles.nameSaveBtn}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={handleEditName} activeOpacity={0.7}>
              <Text style={styles.userName}>{displayUser.name}</Text>
              <Text style={styles.editHint}>Tap to edit name</Text>
            </TouchableOpacity>
          )}

          {/* Location */}
          <TouchableOpacity onPress={comingSoon} activeOpacity={0.7}>
            <Text style={styles.userCity}>
              {"\u{1F4CD}"} {displayUser.city || "Add your location"}
            </Text>
          </TouchableOpacity>

          <GradientBar height={3} style={styles.gradientBar} />
        </Card>

        {/* ── Impact Stats — tappable to go to impact page ── */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/(tabs)/impact")}
        >
          <Card style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{stats.passedAlong}</Text>
                <Text style={styles.statLabel}>Passed along</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{stats.received}</Text>
                <Text style={styles.statLabel}>Received</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>${stats.saved}</Text>
                <Text style={styles.statLabel}>Saved</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{stats.friendsInCircle}</Text>
                <Text style={styles.statLabel}>Friends</Text>
              </View>
            </View>
            <View style={styles.statsFooter}>
              <Text style={styles.statsFooterText}>
                View your full impact {"\u203A"}
              </Text>
            </View>
          </Card>
        </TouchableOpacity>

        {/* ── Your Kids — each tappable ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your kids</Text>
          <TouchableOpacity onPress={comingSoon}>
            <Text style={styles.sectionAction}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {displayKids.map((kid) => (
          <TouchableOpacity
            key={kid.id}
            activeOpacity={0.7}
            onPress={comingSoon}
          >
            <Card style={styles.kidCard}>
              <View style={styles.kidRow}>
                <Text style={styles.kidEmoji}>{kid.emoji}</Text>
                <View style={styles.kidInfo}>
                  <Text style={styles.kidName}>{kid.name}</Text>
                  <Text style={styles.kidDetail}>
                    {childAge(kid.dob)} {"\u00B7"} Born {formatDob(kid.dob)}
                  </Text>
                </View>
                <Text style={styles.kidChevron}>{"\u203A"}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        {/* ── Settings ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Settings</Text>
        </View>

        <Card style={styles.settingsCard}>
          {SETTINGS_ROWS.map((item, index) => (
            <React.Fragment key={item.label}>
              {index > 0 && <View style={styles.divider} />}
              <Pressable style={styles.settingsRow} onPress={comingSoon}>
                <Text style={styles.settingsIcon}>{item.icon}</Text>
                <Text style={styles.settingsLabel}>{item.label}</Text>
                <Text style={styles.settingsChevron}>{"\u203A"}</Text>
              </Pressable>
            </React.Fragment>
          ))}
        </Card>

        {/* ── Sign Out ── */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Watasu v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    color: colors.neonPurple,
    fontWeight: "600",
  },

  // User card
  userCard: {
    alignItems: "center",
    padding: 20,
    overflow: "hidden",
    marginBottom: 12,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarEditIcon: {
    fontSize: 12,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  editHint: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: "center",
    marginTop: 2,
  },
  nameEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  nameInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    borderBottomWidth: 2,
    borderBottomColor: colors.neonPurple,
    paddingVertical: 6,
    textAlign: "center",
  },
  nameSaveBtn: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.neonPurple,
  },
  userCity: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: "center",
  },
  gradientBar: {
    marginTop: 16,
  },

  // Stats
  statsCard: {
    padding: 0,
    overflow: "hidden",
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  statsFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 10,
    alignItems: "center",
  },
  statsFooterText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.neonPurple,
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neonPurple,
  },

  // Kids
  kidCard: {
    padding: 14,
    marginBottom: 8,
  },
  kidRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  kidEmoji: {
    fontSize: 32,
  },
  kidInfo: {
    flex: 1,
  },
  kidName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  kidDetail: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  kidChevron: {
    fontSize: 22,
    color: colors.textLight,
  },

  // Settings
  settingsCard: {
    padding: 0,
    marginBottom: 16,
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
    textAlign: "center",
  },
  settingsLabel: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  settingsChevron: {
    fontSize: 20,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0ED",
    marginHorizontal: 16,
  },

  // Sign out
  signOutBtn: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
    marginBottom: 16,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },

  // Version
  version: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: "center",
    marginBottom: 20,
  },
});
