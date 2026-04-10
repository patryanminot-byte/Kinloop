import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import GradientText from "../../components/ui/GradientText";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { colors, gradientColors } from "../../lib/colors";

const SEGMENTS = 3;

type AuthMode = "main" | "email-otp" | "magic-link";

export default function WelcomeScreen() {
  const router = useRouter();
  const {
    sendEmailOtp,
    verifyEmailOtp,
    sendMagicLink,
    signInWithApple,
    signInWithGoogle,
    isNewUser,
    createProfile,
  } = useAuth();

  const [authMode, setAuthMode] = useState<AuthMode>("main");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNewUser = async (
    userId: string,
    identifier: string,
    name?: string,
  ) => {
    const newUser = await isNewUser(userId);
    if (newUser) {
      await createProfile(userId, identifier, name);
      router.push("/onboarding/consent");
    } else {
      // Returning user — go straight to tabs
      router.replace("/(tabs)");
    }
  };

  // ── Apple Sign In ───────────────────────────────────────────────────
  const handleApple = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await signInWithApple();
      const userId = data.user?.id ?? data.session?.user?.id;
      if (userId) {
        const appleName = data.user?.user_metadata?.full_name;
        const appleEmail = data.user?.email ?? "";
        await handleNewUser(userId, appleEmail, appleName);
      }
    } catch (e: any) {
      if (e.code !== "ERR_REQUEST_CANCELED" && e.code !== "ERR_CANCELED") {
        setError(e.message ?? "Apple sign in failed");
        Alert.alert("Apple Sign In", e.message ?? "Failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Google Sign In ──────────────────────────────────────────────────
  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e.message ?? "Google sign in failed");
      Alert.alert("Google Sign In", e.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Email OTP ───────────────────────────────────────────────────────
  const handleSendEmailOtp = async () => {
    if (!email.trim()) return;
    setError("");
    setLoading(true);
    try {
      await sendEmailOtp(email.trim());
      setAuthMode("email-otp");
      Alert.alert("Code Sent", `Check your inbox at ${email.trim()}`);
    } catch (e: any) {
      setError(e.message ?? "Failed to send code");
      Alert.alert("Error", e.message ?? "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (code.length !== 8) return;
    setError("");
    setLoading(true);
    try {
      const data = await verifyEmailOtp(email.trim(), code);
      const userId = data.user?.id ?? data.session?.user?.id;
      if (userId) {
        await handleNewUser(userId, email.trim());
      }
    } catch (e: any) {
      setError(e.message ?? "Verification failed");
      Alert.alert("Error", e.message ?? "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Magic Link ──────────────────────────────────────────────────────
  const handleSendMagicLink = async () => {
    if (!email.trim()) return;
    setError("");
    setLoading(true);
    try {
      await sendMagicLink(email.trim());
      setAuthMode("magic-link");
    } catch (e: any) {
      setError(e.message ?? "Failed to send link");
      Alert.alert("Error", e.message ?? "Failed to send link");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────
  const renderMainAuth = () => (
    <>
      {/* Apple */}
      <TouchableOpacity
        style={styles.socialButton}
        onPress={handleApple}
        disabled={loading}
        activeOpacity={0.7}
      >
        <Text style={styles.appleIcon}>{"\uF8FF"}</Text>
        <Text style={styles.socialText}>Continue with Apple</Text>
      </TouchableOpacity>

      {/* Google */}
      <TouchableOpacity
        style={styles.socialButton}
        onPress={handleGoogle}
        disabled={loading}
        activeOpacity={0.7}
      >
        <Text style={styles.googleIcon}>G</Text>
        <Text style={styles.socialText}>Continue with Google</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Email input */}
      <TextInput
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor={colors.textLight}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        textContentType="emailAddress"
        editable={!loading}
      />

      {/* Email OTP button */}
      <Button
        variant="primary"
        size="lg"
        title={loading ? "Sending..." : "Continue with Email Code"}
        onPress={handleSendEmailOtp}
        disabled={loading || !email.trim()}
        style={styles.button}
      />

      {/* Magic link option */}
      <TouchableOpacity
        onPress={handleSendMagicLink}
        disabled={loading || !email.trim()}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.linkText,
            (!email.trim() || loading) && { opacity: 0.4 },
          ]}
        >
          Or send me a magic link instead
        </Text>
      </TouchableOpacity>

      {loading && (
        <ActivityIndicator
          size="small"
          color={colors.neonPurple}
          style={{ marginTop: 12 }}
        />
      )}
    </>
  );

  const renderEmailOtp = () => (
    <>
      <Text style={styles.otpLabel}>
        Enter the code sent to {email}
      </Text>
      <TextInput
        style={styles.codeInput}
        placeholder="00000000"
        placeholderTextColor={colors.textLight}
        value={code}
        onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 8))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoFocus
        editable={!loading}
      />
      <Button
        variant="primary"
        size="lg"
        title={loading ? "Verifying..." : "Verify"}
        onPress={handleVerifyEmailOtp}
        disabled={loading || code.length !== 8}
        style={styles.button}
      />
      <TouchableOpacity
        onPress={() => {
          setAuthMode("main");
          setCode("");
          setError("");
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.linkText}>← Back</Text>
      </TouchableOpacity>
    </>
  );

  const renderMagicLink = () => (
    <>
      <View style={styles.magicLinkSent}>
        <Text style={styles.magicEmoji}>✉️</Text>
        <Text style={styles.magicTitle}>Check your email</Text>
        <Text style={styles.magicSubtitle}>
          We sent a sign-in link to {email}. Tap the link to continue.
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => {
          setAuthMode("main");
          setError("");
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.linkText}>← Back</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress bar */}
          <View style={styles.progressRow}>
            {Array.from({ length: SEGMENTS }).map((_, i) => (
              <View key={i} style={styles.segmentWrapper}>
                {i === 0 ? (
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

          {/* Center content */}
          <View style={styles.center}>
            <Text style={styles.emoji}>🔄</Text>
            <GradientText style={styles.title}>Watasu</GradientText>
            <Text style={styles.tagline}>Love it, then pass it on.</Text>
            <Text style={styles.subtitle}>
              Your kids outgrow things. Your friends' kids grow into them.{"\n"}
              Sign in or create an account to get started.
            </Text>
          </View>

          {/* Auth form */}
          <View style={styles.bottom}>
            {authMode === "main" && renderMainAuth()}
            {authMode === "email-otp" && renderEmailOtp()}
            {authMode === "magic-link" && renderMagicLink()}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={styles.hint}>Takes 90 seconds</Text>

            <Text style={styles.legalText}>
              By continuing, you agree to our{" "}
              <Text
                style={styles.legalLink}
                onPress={() => router.push("/legal/terms" as `/${string}`)}
              >
                Terms of Service
              </Text>
              {" "}and{" "}
              <Text
                style={styles.legalLink}
                onPress={() => router.push("/legal/privacy" as `/${string}`)}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
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
    backgroundColor: "#F0F0ED",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
  },
  tagline: {
    fontSize: 18,
    color: "#8E8E93",
    marginTop: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#AEAEB2",
    marginTop: 10,
    textAlign: "center",
    lineHeight: 20,
  },
  bottom: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: "center",
  },

  // Social buttons
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#000",
    marginBottom: 10,
  },
  appleIcon: {
    fontSize: 20,
    fontWeight: "700",
    marginRight: 10,
    color: "#FFF",
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: "700",
    marginRight: 10,
    color: "#FFF",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  socialText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },

  // Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: colors.textMuted,
  },

  // Inputs
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
    marginBottom: 12,
  },
  codeInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    backgroundColor: colors.card,
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 12,
  },
  otpLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 12,
    textAlign: "center",
  },
  button: {
    width: "100%",
  },
  linkText: {
    fontSize: 14,
    color: colors.neonPurple,
    fontWeight: "600",
    marginTop: 14,
    textAlign: "center",
  },

  // Magic link sent
  magicLinkSent: {
    alignItems: "center",
    paddingVertical: 20,
  },
  magicEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  magicTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  magicSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },

  error: {
    color: "#FF3B30",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  hint: {
    fontSize: 12,
    color: "#AEAEB2",
    marginTop: 10,
  },
  legalText: {
    fontSize: 11,
    color: "#AEAEB2",
    marginTop: 16,
    textAlign: "center",
    lineHeight: 16,
  },
  legalLink: {
    color: colors.neonPurple,
    fontWeight: "500",
  },
});
