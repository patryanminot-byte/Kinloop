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
import GradientText from "../../components/ui/GradientText";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useAppStore } from "../../stores/appStore";
import { colors } from "../../lib/colors";

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
      // Defensive: ensure onboarding flag is set even if AsyncStorage was cleared
      useAppStore.getState().setOnboardingComplete();
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
      const data = await signInWithGoogle();
      // User deliberately closed the browser — silently stop
      if (!data || ("cancelled" in data && data.cancelled)) {
        return;
      }
      const sessionData = data as { user?: any; session?: any };
      const user = sessionData.user ?? sessionData.session?.user;
      if (!user?.id) {
        setError("Sign in failed. Please try again.");
        return;
      }
      const googleName = user.user_metadata?.full_name;
      const googleEmail = user.email ?? "";
      await handleNewUser(user.id, googleEmail, googleName);
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
    if (code.length !== 6) return;
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

      {loading && (
        <ActivityIndicator
          size="small"
          color={colors.violet}
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
        placeholder="000000"
        placeholderTextColor={colors.textLight}
        value={code}
        onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
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
        disabled={loading || code.length !== 6}
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
        <Text style={styles.linkText}>{"\u2190"} Back</Text>
      </TouchableOpacity>
    </>
  );

  const renderMagicLink = () => (
    <>
      <View style={styles.magicLinkSent}>
        <Text style={styles.magicEmoji}>{"\u2709\uFE0F"}</Text>
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
        <Text style={styles.linkText}>{"\u2190"} Back</Text>
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
          {/* Center content — brand + tagline */}
          <View style={styles.center}>
            <GradientText style={styles.title}>Watasu</GradientText>
            <Text style={styles.japanese}>{"\u6E21\u3059"} to pass along</Text>
            <Text style={styles.tagline}>Love it, then Watasu.</Text>
          </View>

          {/* Auth form */}
          <View style={styles.bottom}>
            {authMode === "main" && renderMainAuth()}
            {authMode === "email-otp" && renderEmailOtp()}
            {authMode === "magic-link" && renderMagicLink()}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={styles.hint}>You'll be sharing in under 2 minutes</Text>

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
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 32,
  },
  title: {
    fontSize: 38,
    fontWeight: "700",
  },
  japanese: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
    fontStyle: "italic",
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
    textAlign: "center",
  },
  bottom: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: "center",
  },

  // Social buttons — light style
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  appleIcon: {
    fontSize: 20,
    fontWeight: "700",
    marginRight: 10,
    color: colors.text,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: "700",
    marginRight: 10,
    color: colors.text,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  socialText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
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
    borderRadius: 14,
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
    borderRadius: 14,
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
    color: colors.violet,
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
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 14,
  },
  legalText: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 16,
    textAlign: "center",
    lineHeight: 16,
  },
  legalLink: {
    color: colors.violet,
    fontWeight: "500",
  },
});
