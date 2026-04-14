import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DatePicker from "../../components/ui/DatePicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "../../lib/colors";
import { Child } from "../../lib/types";
import Avatar from "../../components/ui/Avatar";
import { useAuth } from "../../hooks/useAuth";
import { useAppStore } from "../../stores/appStore";
import { useInventory } from "../../hooks/useInventory";
import { useFriends } from "../../hooks/useFriends";
import { supabase } from "../../lib/supabase";

// ── Warm palette ────────────────────────────────────────────────────

const warm = {
  textDark: "#1A1A1A",
  textMuted: "#8E8E93",
  screenBg: "#FAFAF8",
  cardBg: "#FFFFFF",
  divider: "#EAE7E3",
};

// ── Helpers ──────────────────────────────────────────────────────────

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

// ── Kid emoji options ───────────────────────────────────────────────

const KID_EMOJIS = [
  "\u{1F476}", "\u{1F476}\u{1F3FB}", "\u{1F476}\u{1F3FC}",
  "\u{1F476}\u{1F3FD}", "\u{1F476}\u{1F3FE}", "\u{1F476}\u{1F3FF}",
  "\u{1F9D2}", "\u{1F9D2}\u{1F3FB}", "\u{1F9D2}\u{1F3FC}",
  "\u{1F9D2}\u{1F3FD}", "\u{1F9D2}\u{1F3FE}", "\u{1F9D2}\u{1F3FF}",
  "\u{1F466}", "\u{1F466}\u{1F3FC}", "\u{1F466}\u{1F3FE}",
  "\u{1F467}", "\u{1F467}\u{1F3FC}", "\u{1F467}\u{1F3FE}",
  "\u{1F9D1}", "\u{1F9D1}\u{1F3FB}", "\u{1F9D1}\u{1F3FC}",
  "\u{1F9D1}\u{1F3FD}", "\u{1F9D1}\u{1F3FE}", "\u{1F9D1}\u{1F3FF}",
  "\u{1F60A}", "\u{1F604}", "\u{1F970}", "\u{1F60E}",
  "\u{1F929}", "\u{1F607}", "\u{1F973}", "\u{1F60B}",
  "\u{1F917}", "\u{1F61C}", "\u{1F643}",
  "\u{1F43B}", "\u{1F98A}", "\u{1F430}", "\u{1F431}",
  "\u{1F981}", "\u{1F43C}", "\u{1F428}", "\u{1F984}",
  "\u{1F42C}", "\u{1F98B}", "\u{1F422}", "\u{1F41D}",
  "\u{1F31F}", "\u{1F308}", "\u{1F33B}", "\u{1F338}",
  "\u{1F340}", "\u{1F331}", "\u{1F30A}", "\u{2728}",
  "\u{1F680}", "\u{1F388}", "\u{1F3A8}", "\u{1F996}",
];

// ── Screen ──────────────────────────────────────────────────────────

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
  const [kidDobDraft, setKidDobDraft] = useState("");
  const [kidEmojiDraft, setKidEmojiDraft] = useState("");
  const [showKidDatePicker, setShowKidDatePicker] = useState(false);

  // Load avatar URL
  useEffect(() => {
    if (!userId) return;
    supabase.from("profiles").select("avatar_url").eq("id", userId).single()
      .then(({ data }) => { if (data?.avatar_url) setPhotoUri(data.avatar_url); });
  }, [userId]);

  // Load children
  useEffect(() => {
    if (!userId) return;
    supabase.from("children").select("*").eq("user_id", userId)
      .then(({ data }) => {
        if (data) setKids(data.map((k: any) => ({ id: k.id, name: k.name, dob: k.dob, emoji: k.emoji })));
      });
  }, [userId]);

  const hasRealUser = userName.length > 0;
  const displayUser = hasRealUser
    ? { name: userName, initials: userInitials, city: locationCity }
    : { name: "Pat Ryan", initials: "PR", city: "Madison, WI" };

  // Impact stats
  const impact = useMemo(() => {
    const given = items.filter((i) => i.status === "handed-off").length;
    const received = 0;
    const valueShared = items
      .filter((i) => i.status === "handed-off")
      .reduce((sum, i) => sum + (i.pricing?.amount ?? 85), 0);
    return { given, received, valueShared, lbsDiverted: given * 7 };
  }, [items]);

  const displayImpact = impact.given > 0
    ? impact
    : { given: 4, received: 2, valueShared: 340, lbsDiverted: 28 };
  const hasImpact = impact.given > 0 || true; // show for demo

  // ── Photo upload ──────────────────────────────────────────────────
  const uploadPhoto = async (uri: string) => {
    if (!userId) return;
    setPhotoUri(uri);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const ext = uri.split(".").pop() ?? "jpg";
      const path = `${userId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars").upload(path, blob, { upsert: true, contentType: `image/${ext}` });
      if (uploadError) { console.warn("Avatar upload failed:", uploadError.message); return; }
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      if (urlData?.publicUrl) {
        await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", userId);
      }
    } catch (err) { console.warn("Avatar upload error:", err); }
  };

  const handlePickPhoto = () => {
    Alert.alert("Profile Photo", "Choose an option", [
      {
        text: "Take Photo",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") { Alert.alert("Permission needed", "Camera access is required."); return; }
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
          if (!result.canceled && result.assets?.[0]) uploadPhoto(result.assets[0].uri);
        },
      },
      {
        text: "Choose from Library",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7,
          });
          if (!result.canceled && result.assets?.[0]) uploadPhoto(result.assets[0].uri);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // ── Name editing ──────────────────────────────────────────────────
  const handleEditName = () => { setNameDraft(displayUser.name); setEditingName(true); };
  const handleSaveName = async () => {
    if (userId && nameDraft.trim().length > 0) {
      await supabase.from("profiles").update({ name: nameDraft.trim() }).eq("id", userId);
      useAppStore.getState().setUserProfile({
        name: nameDraft.trim(),
        initials: nameDraft.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
        city: locationCity,
      });
    }
    setEditingName(false);
  };

  // ── Kid editing ───────────────────────────────────────────────────
  const handleEditKid = (kid: Child) => {
    setEditingKidId(kid.id); setKidNameDraft(kid.name); setKidDobDraft(kid.dob); setKidEmojiDraft(kid.emoji);
    setShowKidDatePicker(false);
  };

  const kidDobDate = kidDobDraft
    ? new Date(kidDobDraft + "T00:00:00")
    : new Date(new Date().getFullYear() - 1, new Date().getMonth(), new Date().getDate());

  const handleKidDateChange = (date: Date) => {
    setKidDobDraft(date.toISOString().split("T")[0]);
  };

  const formatKidDobLabel = (dob: string) => {
    const d = new Date(dob + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  const handleSaveKid = async () => {
    if (editingKidId && kidNameDraft.trim().length > 0) {
      const updates: Record<string, string> = { name: kidNameDraft.trim() };
      if (kidDobDraft) updates.dob = kidDobDraft;
      if (kidEmojiDraft) updates.emoji = kidEmojiDraft;
      await supabase.from("children").update(updates).eq("id", editingKidId);
      const childUpdates = {
        name: kidNameDraft.trim(),
        ...(kidDobDraft ? { dob: kidDobDraft } : {}),
        ...(kidEmojiDraft ? { emoji: kidEmojiDraft } : {}),
      };
      setKids((prev) => prev.map((k) =>
        k.id === editingKidId ? { ...k, ...childUpdates } : k,
      ));
      useAppStore.getState().updateChild(editingKidId, childUpdates);
    }
    setEditingKidId(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Header: Avatar + Name ── */}
        <View style={styles.headerSection}>
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

          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={nameDraft}
                onChangeText={setNameDraft}
                autoFocus autoCapitalize="words" returnKeyType="done"
                onSubmitEditing={handleSaveName}
              />
              <Pressable onPress={handleSaveName} style={styles.nameSaveBtn}>
                <Text style={styles.nameSaveBtnText}>Save</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={handleEditName} style={styles.nameRow}>
              <Text style={styles.userName}>{displayUser.name}</Text>
              <Text style={styles.nameEditPencil}>{"\u270F\uFE0F"}</Text>
            </Pressable>
          )}

          {displayUser.city ? (
            <Text style={styles.userCity}>{"\u{1F4CD}"} {displayUser.city}</Text>
          ) : null}
        </View>

        {/* ── 1. Family (first content section) ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Family</Text>
            <Pressable onPress={() => router.push("/onboarding/add-child" as `/${string}`)}>
              <Text style={styles.sectionAction}>+ Add</Text>
            </Pressable>
          </View>

          {kids.map((kid) =>
            editingKidId === kid.id ? (
              <View key={kid.id} style={styles.kidEditCard}>
                <View style={styles.kidEditSection}>
                  <Text style={styles.kidEditLabel}>Avatar</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll} contentContainerStyle={styles.emojiScrollContent}>
                    {KID_EMOJIS.map((e) => (
                      <Pressable key={e} onPress={() => setKidEmojiDraft(e)} style={[styles.emojiOption, kidEmojiDraft === e && styles.emojiOptionSelected]}>
                        <Text style={styles.emojiOptionText}>{e}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.kidEditSection}>
                  <Text style={styles.kidEditLabel}>Name</Text>
                  <TextInput style={styles.kidNameInput} value={kidNameDraft} onChangeText={setKidNameDraft} autoFocus autoCapitalize="words" returnKeyType="next" />
                </View>
                <View style={styles.kidEditSection}>
                  <Text style={styles.kidEditLabel}>Birthday</Text>
                  <Pressable style={styles.kidDateBtn} onPress={() => setShowKidDatePicker(true)}>
                    <Text style={styles.kidDateBtnText}>
                      {kidDobDraft ? `${formatKidDobLabel(kidDobDraft)}  \u00B7  ${childAge(kidDobDraft)} old` : "Select birthday"}
                    </Text>
                  </Pressable>
                  {showKidDatePicker && (
                    <DatePicker
                      value={kidDobDate}
                      maximumDate={new Date()}
                      minimumDate={new Date(new Date().getFullYear() - 18, 0, 1)}
                      onChange={handleKidDateChange}
                    />
                  )}
                </View>
                <Pressable onPress={handleSaveKid} style={styles.kidSaveBtn}>
                  <Text style={styles.kidSaveBtnText}>Save</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable key={kid.id} onPress={() => handleEditKid(kid)}>
                <View style={styles.kidCard}>
                  <Text style={styles.kidEmoji}>{kid.emoji}</Text>
                  <View style={styles.kidInfo}>
                    <Text style={styles.kidName}>{kid.name}</Text>
                    <Text style={styles.kidDetail}>{childAge(kid.dob)} {"\u00B7"} Born {formatDob(kid.dob)}</Text>
                  </View>
                  <Text style={styles.kidEditIcon}>{"\u270F\uFE0F"}</Text>
                </View>
              </Pressable>
            ),
          )}
        </View>

        <View style={styles.sectionDivider} />

        {/* ── 2. My Items ── */}
        <Pressable
          style={styles.navRow}
          onPress={() => router.push("/(tabs)/stuff" as `/${string}`)}
        >
          <Text style={styles.navLabel}>My Items</Text>
          <Text style={styles.navMeta}>{items.length || 12}</Text>
          <Text style={styles.chevron}>{"\u203A"}</Text>
        </Pressable>

        <View style={styles.sectionDivider} />

        {/* ── 3. Stats + Impact ── */}
        {hasImpact && (
          <>
            <View style={styles.statsBlock}>
              <Text style={styles.statsLine}>
                <Text style={styles.statsNumber}>{displayImpact.given}</Text> passed along
                {" \u00B7 "}
                <Text style={styles.statsNumber}>{displayImpact.received}</Text> received
              </Text>
              <Text style={styles.statsLine}>
                <Text style={styles.statsNumber}>${displayImpact.valueShared}</Text> saved
              </Text>
            </View>

            <Pressable
              style={styles.navRow}
              onPress={() => router.push("/(tabs)/impact" as `/${string}`)}
            >
              <Text style={styles.navLabel}>Your impact</Text>
              <Text style={styles.navMeta}>{displayImpact.lbsDiverted} lbs</Text>
              <Text style={styles.chevron}>{"\u203A"}</Text>
            </Pressable>

            <View style={styles.sectionDivider} />
          </>
        )}

        {/* ── 4. Settings ── */}
        <Pressable
          style={styles.navRow}
          onPress={() => router.push("/settings" as `/${string}`)}
        >
          <Text style={styles.navLabel}>Settings</Text>
          <Text style={styles.chevron}>{"\u203A"}</Text>
        </Pressable>

        <View style={styles.sectionDivider} />

        {/* ── 5. Sign Out + Version ── */}
        <Pressable
          style={styles.signOutBtn}
          onPress={async () => {
            try { await signOut(); } catch { Alert.alert("Error", "Failed to sign out"); }
          }}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

        <Text style={styles.version}>Watasu v3.0</Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: warm.screenBg },
  container: { flex: 1 },
  content: { padding: 20 },

  // Header
  headerSection: {
    alignItems: "center",
    marginBottom: 24,
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
  avatarEditIcon: { fontSize: 12 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: warm.textDark,
  },
  nameEditPencil: { fontSize: 14 },
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
    color: warm.textDark,
    borderBottomWidth: 2,
    borderBottomColor: colors.violet,
    paddingVertical: 6,
    textAlign: "center",
  },
  nameSaveBtn: {
    backgroundColor: colors.violet,
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
    color: warm.textMuted,
    marginTop: 6,
  },

  // Navigation rows
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 8,
  },
  navLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: warm.textDark,
  },
  navMeta: {
    fontSize: 14,
    color: warm.textMuted,
  },
  chevron: {
    fontSize: 20,
    color: warm.textMuted,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: warm.divider,
    marginVertical: 4,
  },

  // Stats
  statsBlock: {
    paddingVertical: 12,
  },
  statsLine: {
    fontSize: 15,
    color: warm.textMuted,
    lineHeight: 22,
  },
  statsNumber: {
    fontWeight: "600",
    color: warm.textDark,
  },

  // Sign out
  signOutBtn: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 16,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#E85D5D",
  },

  // Version
  version: {
    fontSize: 12,
    color: warm.textMuted,
    textAlign: "center",
    marginTop: 8,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: warm.textDark,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.violet,
  },

  // Kids
  kidCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: warm.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: warm.divider,
    padding: 14,
    marginBottom: 8,
  },
  kidEditCard: {
    backgroundColor: warm.cardBg,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.violet,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  kidEditSection: { gap: 4 },
  kidEditLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: warm.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emojiScroll: { marginHorizontal: -4 },
  emojiScrollContent: { gap: 6, paddingHorizontal: 4, paddingVertical: 4 },
  emojiOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: warm.screenBg,
    borderWidth: 2,
    borderColor: "transparent",
  },
  emojiOptionSelected: {
    borderColor: colors.violet,
    backgroundColor: colors.violetLight,
  },
  emojiOptionText: { fontSize: 22 },
  kidDateBtn: {
    backgroundColor: warm.screenBg,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: warm.divider,
  },
  kidDateBtnText: { fontSize: 15, color: warm.textDark, fontWeight: "500" },
  kidDateDoneBtn: { alignSelf: "flex-end", paddingVertical: 6, paddingHorizontal: 12 },
  kidDateDoneText: { fontSize: 15, fontWeight: "600", color: colors.violet },
  kidEmoji: { fontSize: 32 },
  kidInfo: { flex: 1 },
  kidName: { fontSize: 16, fontWeight: "700", color: warm.textDark },
  kidDetail: { fontSize: 13, color: warm.textMuted, marginTop: 2 },
  kidEditIcon: { fontSize: 14 },
  kidNameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: warm.textDark,
    borderBottomWidth: 2,
    borderBottomColor: colors.violet,
    paddingVertical: 4,
  },
  kidSaveBtn: {
    backgroundColor: colors.violet,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 4,
  },
  kidSaveBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
