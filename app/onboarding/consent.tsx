import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradientColors } from "../../lib/colors";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import GradientText from "../../components/ui/GradientText";

export default function ConsentScreen() {
  const router = useRouter();
  const { session } = useAuth();

  const handleAgree = async () => {
    if (session?.user?.id) {
      await supabase
        .from("profiles")
        .update({ consented_at: new Date().toISOString() })
        .eq("id", session.user.id);
    }
    router.push("/onboarding/your-name");
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress bar — step 1 of 4 */}
      <View style={styles.progressRow}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={styles.segmentWrapper}>
            {i < 1 ? (
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

      <View style={styles.center}>
        <Text style={styles.emoji}>{"\u{1F91D}"}</Text>
        <GradientText style={styles.title}>Welcome to Watasu</GradientText>

        <Text style={styles.body}>
          By using Watasu, you agree to our Terms of Service and Privacy
          Policy.
        </Text>

        <View style={styles.links}>
          <Pressable
            onPress={() => router.push("/legal/terms" as `/${string}`)}
          >
            <Text style={styles.link}>Read Terms of Service</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/legal/privacy" as `/${string}`)}
          >
            <Text style={styles.link}>Read Privacy Policy</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.bottom}>
        <Pressable onPress={handleAgree}>
          <LinearGradient
            colors={gradientColors.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.agreeBtn}
          >
            <Text style={styles.agreeBtnText}>I Agree</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  progressRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  segmentWrapper: { flex: 1 },
  segment: { height: 4, borderRadius: 2 },
  segmentEmpty: { backgroundColor: colors.surface },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 20 },
  body: {
    fontSize: 16,
    color: colors.text,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  links: { gap: 12 },
  link: {
    fontSize: 15,
    color: colors.violet,
    fontWeight: "600",
    textAlign: "center",
  },
  bottom: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  agreeBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  agreeBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
