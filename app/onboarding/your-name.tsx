import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Button from "../../components/ui/Button";
import Avatar from "../../components/ui/Avatar";
import { useAuth } from "../../hooks/useAuth";
import { useAppStore } from "../../stores/appStore";
import { supabase } from "../../lib/supabase";
import { colors, gradientColors } from "../../lib/colors";

const SEGMENTS = 4;
const CURRENT_STEP = 2;

const AVATAR_EMOJIS = [
  "\u{1F60A}", "\u{1F60E}", "\u{1F929}", "\u{1F970}",
  "\u{1F607}", "\u{1F973}", "\u{1F917}", "\u{1F331}",
  "\u{2728}", "\u{1F308}", "\u{1F43B}", "\u{1F98A}",
];

export default function YourNameScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const setUserProfile = useAppStore((s) => s.setUserProfile);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState("");

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
      setSelectedEmoji(""); // photo overrides emoji
    }
  };

  /** Normalize phone to digits-only, with leading 1 for US numbers. */
  const normalizePhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 10) return "1" + digits;
    return digits;
  };

  const handleNext = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return;

    const initials = trimmed
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const displayInitials = selectedEmoji || initials;
    setUserProfile({ name: trimmed, initials: displayInitials });

    if (session?.user?.id) {
      const updates: Record<string, string> = {
        name: trimmed,
        avatar_initials: displayInitials,
      };
      const phoneDigits = normalizePhone(phone);
      if (phoneDigits.length >= 10) {
        updates.phone = phoneDigits;
      }
      await supabase
        .from("profiles")
        .update(updates)
        .eq("id", session.user.id);
    }

    router.push("/onboarding/add-child");
  };

  const displayInitials = selectedEmoji || (name.trim().length > 0
    ? name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "");

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress bar */}
      <View style={styles.progressRow}>
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <View key={i} style={styles.segmentWrapper}>
            {i < CURRENT_STEP ? (
              <LinearGradient
                colors={gradientColors.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.segment}
              />
            ) : (
              <View style={[styles.segment, styles.segmentEmpty]} />
            )}
          </View>
        ))}
      </View>

      {/* Back button */}
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>{"\u2190"} Back</Text>
      </Pressable>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>About you</Text>
          <Text style={styles.subtitle}>
            So your friends know who's sharing with them.
          </Text>

          {/* Avatar preview + photo picker */}
          <View style={styles.avatarSection}>
            <Pressable onPress={handlePickPhoto} style={styles.avatarTap}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatarImage} />
              ) : displayInitials ? (
                <Avatar initials={displayInitials} size={80} gradient />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>{"\u{1F4F7}"}</Text>
                </View>
              )}
            </Pressable>
            <Text style={styles.photoHint}>Tap to add a photo</Text>
          </View>

          {/* Name */}
          <Text style={styles.label}>Your name</Text>
          <TextInput
            style={styles.input}
            placeholder="First and last name"
            placeholderTextColor={colors.textLight}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleNext}
          />

          {/* Phone number */}
          <Text style={styles.label}>Phone number</Text>
          <Text style={styles.optionalHint}>
            Optional — helps friends find you when they import contacts
          </Text>
          <TextInput
            style={styles.input}
            placeholder="(555) 123-4567"
            placeholderTextColor={colors.textLight}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            returnKeyType="done"
          />

          {/* Optional emoji avatar */}
          <Text style={styles.label}>Or pick an avatar</Text>
          <Text style={styles.optionalHint}>Optional — we'll use your initials otherwise</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.emojiRow}
          >
            {AVATAR_EMOJIS.map((e) => (
              <Pressable
                key={e}
                onPress={() => {
                  setSelectedEmoji(selectedEmoji === e ? "" : e);
                  setPhotoUri(null); // emoji overrides photo
                }}
                style={[
                  styles.emojiOption,
                  selectedEmoji === e && styles.emojiOptionSelected,
                ]}
              >
                <Text style={styles.emojiText}>{e}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </ScrollView>

        <View style={styles.bottom}>
          <Button
            variant="primary"
            size="lg"
            title="Next"
            onPress={handleNext}
            disabled={name.trim().length === 0}
            style={styles.button}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  backButton: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    alignSelf: "flex-start",
  },
  backText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.violet,
  },
  progressRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  segmentWrapper: { flex: 1 },
  segment: { height: 4, borderRadius: 2 },
  segmentEmpty: { backgroundColor: colors.surface },
  content: {
    padding: 20,
    paddingTop: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: 24,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarTap: {
    marginBottom: 8,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlaceholderText: {
    fontSize: 28,
  },
  photoHint: {
    fontSize: 12,
    color: colors.textMuted,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  optionalHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 10,
    marginTop: -4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: colors.text,
    backgroundColor: colors.card,
  },
  emojiRow: {
    gap: 8,
    paddingVertical: 4,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: "transparent",
  },
  emojiOptionSelected: {
    borderColor: colors.violet,
    backgroundColor: colors.violet + "15",
  },
  emojiText: {
    fontSize: 24,
  },
  bottom: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  button: { width: "100%" },
});
