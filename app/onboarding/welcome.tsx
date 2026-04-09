import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import GradientText from "../../components/ui/GradientText";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { colors, gradientColors } from "../../lib/colors";

const SEGMENTS = 3;

export default function WelcomeScreen() {
  const router = useRouter();
  const { sendOtp, verifyOtp, isNewUser, createProfile } = useAuth();

  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const formatPhone = (raw: string): string => {
    // Ensure +1 prefix for US numbers
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
    if (digits.length === 10) return `+1${digits}`;
    if (raw.startsWith("+")) return raw;
    return `+1${digits}`;
  };

  const handleSendOtp = async () => {
    const trimmed = phone.trim();
    if (!trimmed) return;
    setError("");
    setLoading(true);
    try {
      await sendOtp(formatPhone(trimmed));
      setOtpSent(true);
    } catch (e: any) {
      setError(e.message ?? "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      const data = await verifyOtp(formatPhone(phone.trim()), code);
      const userId = data.user?.id ?? data.session?.user?.id;
      if (userId) {
        const newUser = await isNewUser(userId);
        if (newUser) {
          await createProfile(userId, formatPhone(phone.trim()));
          router.push("/onboarding/add-child");
        }
        // Existing users: root layout handles routing
      }
    } catch (e: any) {
      setError(e.message ?? "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setCode("");
    setLoading(true);
    try {
      await sendOtp(formatPhone(phone.trim()));
    } catch (e: any) {
      setError(e.message ?? "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
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
        <GradientText style={styles.title}>kinloop</GradientText>
        <Text style={styles.tagline}>Love it, then leave it.</Text>
        <Text style={styles.subtitle}>
          Your kids outgrow things. Your friends' kids grow into them. We handle
          the rest.
        </Text>
      </View>

      {/* Auth form */}
      <View style={styles.bottom}>
        {!otpSent ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="+1 (555) 123-4567"
              placeholderTextColor={colors.textLight}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              editable={!loading}
            />

            <Button
              variant="primary"
              size="lg"
              title={loading ? "Sending..." : "Get Started"}
              onPress={handleSendOtp}
              disabled={loading || !phone.trim()}
              style={styles.button}
            />

            <Text style={styles.accountHint}>
              Already have an account? Enter your number above.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.otpLabel}>
              Enter the 6-digit code sent to {phone}
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
              onPress={handleVerify}
              disabled={loading || code.length !== 6}
              style={styles.button}
            />
            <Button
              variant="ghost"
              size="md"
              title="Resend code"
              onPress={handleResend}
              disabled={loading}
            />
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.hint}>Takes 90 seconds</Text>
      </View>
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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
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
  accountHint: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 12,
    textAlign: "center",
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
});
