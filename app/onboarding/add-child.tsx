import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
// Lazy-loaded to avoid native module crash at startup (expo-router imports all routes)
const DateTimePicker = React.lazy(() =>
  import("@react-native-community/datetimepicker").then((m) => ({ default: m.default }))
);
type DateTimePickerEvent = { type: string; nativeEvent: { timestamp: number } };
import Button from "../../components/ui/Button";
import EmojiPicker from "../../components/ui/EmojiPicker";
import { useAppStore } from "../../stores/appStore";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { colors, gradientColors } from "../../lib/colors";

const SEGMENTS = 4;
const CURRENT_STEP = 3;

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export default function AddChildScreen() {
  const router = useRouter();
  const addChild = useAppStore((s) => s.addChild);
  const setOnboardingComplete = useAppStore((s) => s.setOnboardingComplete);
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);
  const { session } = useAuth();

  const childCount = useAppStore((s) => s.children).length;
  const [addedThisSession, setAddedThisSession] = useState(0);
  const [name, setName] = useState("");
  const [dob, setDob] = useState<Date>(new Date(new Date().getFullYear() - 1, new Date().getMonth(), new Date().getDate()));
  const [dobSelected, setDobSelected] = useState(false);
  const [emoji, setEmoji] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (date) {
      setDob(date);
      setDobSelected(true);
    }
  };

  const canProceed = name.trim().length > 0 && dobSelected && emoji.length > 0;

  const saveChild = async () => {
    const trimmedName = name.trim();
    const dobISO = dob.toISOString();
    let childId = generateId();

    if (session?.user?.id) {
      const { data } = await supabase
        .from("children")
        .insert({
          user_id: session.user.id,
          name: trimmedName,
          dob: dobISO.split("T")[0],
          emoji,
        })
        .select("id")
        .single();

      if (data?.id) {
        childId = data.id;
      }
    }

    addChild({
      id: childId,
      name: trimmedName,
      dob: dobISO,
      emoji,
    });
  };

  const isPostOnboarding = hasCompletedOnboarding;

  const handleNext = async () => {
    if (!canProceed) return;
    await saveChild();
    if (isPostOnboarding) {
      router.back();
    } else {
      router.push("/onboarding/contacts");
    }
  };

  const handleSkip = () => {
    if (isPostOnboarding) {
      router.back();
    } else {
      // Continue onboarding — don't mark complete yet (that happens in inventory-suggest)
      router.push("/onboarding/contacts");
    }
  };

  const handleAddAnother = async () => {
    if (!canProceed) return;
    await saveChild();
    setAddedThisSession((n) => n + 1);
    setName("");
    setDob(new Date(new Date().getFullYear() - 1, new Date().getMonth(), new Date().getDate()));
    setDobSelected(false);
    setEmoji("");
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Add a child</Text>
        <Text style={styles.subtitle}>
          Tell us about your kiddo so we can find the right matches.
        </Text>

        {/* Name input */}
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder={(childCount + addedThisSession) % 2 === 0 ? "e.g., Ana" : "e.g., George"}
          placeholderTextColor={colors.textLight}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        {/* Birthday */}
        <Text style={styles.label}>Birthday</Text>
        <Button
          variant="secondary"
          size="md"
          title={dobSelected ? formatDate(dob) : "Select birthday"}
          onPress={() => { Keyboard.dismiss(); setShowDatePicker(true); }}
          style={styles.dateButton}
        />
        {showDatePicker && (
          <React.Suspense fallback={<View />}>
            <DateTimePicker
              value={dob}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={new Date()}
              minimumDate={new Date(new Date().getFullYear() - 6, new Date().getMonth(), new Date().getDate())}
              onChange={handleDateChange}
            />
          </React.Suspense>
        )}
        {Platform.OS === "ios" && showDatePicker && (
          <Button
            variant="ghost"
            size="sm"
            title="Done"
            onPress={() => setShowDatePicker(false)}
          />
        )}

        {/* Emoji picker */}
        <Text style={styles.label}>
          Pick an emoji for {name.trim() || "your child"}
        </Text>
        {emoji ? (
          <Text style={styles.emojiPreview}>{emoji}</Text>
        ) : null}
        <EmojiPicker selected={emoji} onSelect={setEmoji} />
      </ScrollView>

      {/* Bottom buttons */}
      <View style={styles.bottom}>
        <Button
          variant="primary"
          size="lg"
          title="Next"
          onPress={handleNext}
          disabled={!canProceed}
          style={styles.button}
        />
        <Button
          variant="ghost"
          size="md"
          title="+ Add another child"
          onPress={handleAddAnother}
          disabled={!canProceed}
        />
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
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
  segmentWrapper: {
    flex: 1,
  },
  segment: {
    height: 4,
    borderRadius: 2,
  },
  segmentEmpty: {
    backgroundColor: colors.surface,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 8,
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
  },
  dateButton: {
    alignSelf: "flex-start",
  },
  emojiPreview: {
    fontSize: 48,
    textAlign: "center",
    marginBottom: 12,
  },
  bottom: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: "center",
    gap: 8,
  },
  button: {
    width: "100%",
  },
  skipButton: {
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    color: colors.textMuted,
    fontWeight: "500",
  },
});
