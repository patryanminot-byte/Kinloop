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
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradientColors } from "../lib/colors";
import { Child } from "../lib/types";
import Avatar from "../components/ui/Avatar";
import Card from "../components/ui/Card";
import GradientText from "../components/ui/GradientText";
import GradientBar from "../components/ui/GradientBar";
import Button from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { useAppStore } from "../stores/appStore";
import { useInventory } from "../hooks/useInventory";
import { useFriends } from "../hooks/useFriends";
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
  const { items } = useInventory(userId);
  const { friends } = useFriends(userId);

  const [kids, setKids] = useState<Child[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [editingKidId, setEditingKidId] = useState<string | null>(null);
  const [kidNameDraft, setKidNameDraft] = useState("");

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

  // Real impact stats
  const handedOff = items.filter((i) => i.status === "handed-off").length;
  const available = items.filter((i) => i.status === "available").length;
  const totalItems = items.length;
  const friendCount = friends.length > 0 ? friends.length : 4;
  const estimatedSaved = handedOff > 0 ? handedOff * 85 : 340;
  const lbsDiverted = handedOff > 0 ? handedOff * 7 : 28;

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

  const handleSaveName = async () => {
    if (userId && nameDraft.trim().length > 0) {
      await supabase
        .from("profiles")
        .update({ name: nameDraft.trim() })
        .eq("id", userId);
      useAppStore.getState().setUserProfile({
        name: nameDraft.trim(),
        initials: nameDraft
          .trim()
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
        city: locationCity,
      });
    }
    setEditingName(false);
  };

  const handleEditKid = (kid: Child) => {
    setEditingKidId(kid.id);
    setKidNameDraft(kid.name);
  };

  const handleSaveKid = async () => {
    if (editingKidId && kidNameDraft.trim().length > 0) {
      await supabase
        .from("children")
        .update({ name: kidNameDraft.trim() })
        .eq("id", editingKidId);
      setKids((prev) =>
        prev.map((k) =>
          k.id === editingKidId ? { ...k, name: kidNameDraft.trim() } : k,
        ),
      );
    }
    setEditingKidId(null);
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
        <View style={styles.userCard}>
          {/* Avatar — tappable to add/change photo */}
          <Pressable onPress={handlePickPhoto} style={styles.avatarContainer}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} />
            ) : (
              <Avatar initials={displayUser.initials} size={72} gradient />
            )}
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditIcon}>{"\u{1F4F7}"}</Text>
            </View>
          </Pressable>

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
              <Pressable onPress={handleSaveName} style={styles.nameSaveBtn}>
                <Text style={styles.nameSaveBtnText}>Save</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={handleEditName} style={styles.nameRow}>
              <Text style={styles.userName}>{displayUser.name}</Text>
              <Text style={styles.nameEditIcon}>{"\u270F\uFE0F"}</Text>
            </Pressable>
          )}

          {/* Location */}
          <Text style={styles.userCity}>
            {"\u{1F4CD}"} {displayUser.city || "Add your location"}
          </Text>

          <GradientBar height={3} style={styles.gradientBar} />
        </View>

        {/* ── Impact Stats — tappable to go to impact page ── */}
        <Pressable
          onPress={() => router.push("/(tabs)/impact" as `/${string}`)}
        >
          <View style={styles.impactCard}>
            <LinearGradient
              colors={gradientColors.subtle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.impactGradient}
            >
              <View style={styles.impactStatsRow}>
                <View style={styles.impactStatBox}>
                  <GradientText style={styles.impactStatNumber}>
                    {totalItems}
                  </GradientText>
                  <Text style={styles.impactStatLabel}>items{"\n"}tracked</Text>
                </View>
                <View style={styles.impactStatDivider} />
                <View style={styles.impactStatBox}>
                  <GradientText style={styles.impactStatNumber}>
                    {handedOff || 4}
                  </GradientText>
                  <Text style={styles.impactStatLabel}>passed{"\n"}along</Text>
                </View>
                <View style={styles.impactStatDivider} />
                <View style={styles.impactStatBox}>
                  <GradientText style={styles.impactStatNumber}>
                    ${estimatedSaved}
                  </GradientText>
                  <Text style={styles.impactStatLabel}>saved</Text>
                </View>
                <View style={styles.impactStatDivider} />
                <View style={styles.impactStatBox}>
                  <GradientText style={styles.impactStatNumber}>
                    {lbsDiverted}
                  </GradientText>
                  <Text style={styles.impactStatLabel}>lbs from{"\n"}landfill</Text>
                </View>
              </View>

              <View style={styles.impactFooter}>
                <Text style={styles.impactFooterText}>
                  {friendCount} friends in your circle {"\u00B7"} See full
                  impact {"\u203A"}
                </Text>
              </View>
            </LinearGradient>
          </View>
        </Pressable>

        {/* ── Your Kids — each tappable to edit ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your kids</Text>
          <Pressable
            onPress={() =>
              router.push("/onboarding/welcome" as `/${string}`)
            }
          >
            <Text style={styles.sectionAction}>+ Add</Text>
          </Pressable>
        </View>

        {displayKids.map((kid) =>
          editingKidId === kid.id ? (
            <View key={kid.id} style={styles.kidEditCard}>
              <Text style={styles.kidEmoji}>{kid.emoji}</Text>
              <TextInput
                style={styles.kidNameInput}
                value={kidNameDraft}
                onChangeText={setKidNameDraft}
                autoFocus
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleSaveKid}
              />
              <Pressable onPress={handleSaveKid} style={styles.kidSaveBtn}>
                <Text style={styles.kidSaveBtnText}>Save</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              key={kid.id}
              onPress={() => handleEditKid(kid)}
            >
              <View style={styles.kidCard}>
                <Text style={styles.kidEmoji}>{kid.emoji}</Text>
                <View style={styles.kidInfo}>
                  <Text style={styles.kidName}>{kid.name}</Text>
                  <Text style={styles.kidDetail}>
                    {childAge(kid.dob)} {"\u00B7"} Born {formatDob(kid.dob)}
                  </Text>
                </View>
                <Text style={styles.kidEditIcon}>{"\u270F\uFE0F"}</Text>
              </View>
            </Pressable>
          ),
        )}

        {/* ── Settings ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Settings</Text>
        </View>

        <View style={styles.settingsCard}>
          {SETTINGS_ROWS.map((item, index) => (
            <React.Fragment key={item.label}>
              {index > 0 && <View style={styles.divider} />}
              <Pressable
                style={styles.settingsRow}
                onPress={() => Alert.alert("Coming soon")}
              >
                <Text style={styles.settingsIcon}>{item.icon}</Text>
                <Text style={styles.settingsLabel}>{item.label}</Text>
                <Text style={styles.settingsChevron}>{"\u203A"}</Text>
              </Pressable>
            </React.Fragment>
          ))}
        </View>

        {/* ── Sign Out ── */}
        <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

        <Text style={styles.version}>Watasu v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 160 },
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
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    overflow: "hidden",
    marginBottom: 16,
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
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  nameEditIcon: {
    fontSize: 14,
  },
  nameEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
    width: "100%",
    paddingHorizontal: 20,
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
    backgroundColor: colors.neonPurple,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  nameSaveBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  userCity: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: "center",
  },
  gradientBar: {
    marginTop: 16,
    marginHorizontal: -20,
  },

  // Impact stats
  impactCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  impactGradient: {
    padding: 20,
    borderRadius: 15,
  },
  impactStatsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  impactStatBox: {
    flex: 1,
    alignItems: "center",
  },
  impactStatNumber: {
    fontSize: 22,
    fontWeight: "700",
  },
  impactStatLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 3,
    textAlign: "center",
    lineHeight: 13,
  },
  impactStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  impactFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 16,
    alignItems: "center",
  },
  impactFooterText: {
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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
  },
  kidEditCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.neonPurple,
    padding: 14,
    marginBottom: 8,
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
  kidEditIcon: {
    fontSize: 14,
  },
  kidNameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    borderBottomWidth: 2,
    borderBottomColor: colors.neonPurple,
    paddingVertical: 4,
  },
  kidSaveBtn: {
    backgroundColor: colors.neonPurple,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  kidSaveBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Settings
  settingsCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: 20,
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
    marginBottom: 20,
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
    marginBottom: 40,
  },
});
