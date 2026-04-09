import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "../../lib/colors";

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>{"\u2190"} Back</Text>
      </Pressable>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.updated}>Last updated: April 9, 2026</Text>

        <Text style={styles.body}>
          Watasu ("we", "us", "our") operates the Watasu mobile application.
          This page informs you of our policies regarding the collection, use,
          and disclosure of personal information when you use our Service.
        </Text>

        <Text style={styles.heading}>Information We Collect</Text>
        <Text style={styles.body}>
          {"\u2022"} Account information: name, email address, and profile photo
          you provide during registration.{"\n"}
          {"\u2022"} Child information: first names and birthdays you add to
          personalize the experience.{"\n"}
          {"\u2022"} Item listings: descriptions, categories, photos, and
          pricing of items you share.{"\n"}
          {"\u2022"} Approximate location: if you grant permission, we collect
          your approximate location (rounded to ~1 km) to show nearby items.
          We never track your precise location.{"\n"}
          {"\u2022"} Contact hashes: if you grant permission, we compare
          one-way hashes of your contacts' phone numbers to find friends on
          Watasu. Your contacts are never uploaded, stored, or shared.
        </Text>

        <Text style={styles.heading}>How We Use Your Information</Text>
        <Text style={styles.body}>
          {"\u2022"} To match you with nearby families who have items your
          children can use.{"\n"}
          {"\u2022"} To display distance estimates between you and item
          listings.{"\n"}
          {"\u2022"} To send notifications about matches, messages, and
          handoffs.{"\n"}
          {"\u2022"} To improve the app experience and fix bugs.
        </Text>

        <Text style={styles.heading}>Data Sharing</Text>
        <Text style={styles.body}>
          We do not sell your personal information. We share data only:{"\n"}
          {"\u2022"} With other Watasu users as necessary to facilitate item
          exchanges (e.g., your name and approximate distance).{"\n"}
          {"\u2022"} With service providers (Supabase for data storage, Stripe
          for payments) under strict data processing agreements.{"\n"}
          {"\u2022"} When required by law.
        </Text>

        <Text style={styles.heading}>Data Storage and Security</Text>
        <Text style={styles.body}>
          Your data is stored securely using Supabase (hosted on AWS) with
          encryption at rest and in transit. Authentication tokens are stored
          in your device's secure keychain. We retain your data as long as
          your account is active.
        </Text>

        <Text style={styles.heading}>Your Rights</Text>
        <Text style={styles.body}>
          You may request to view, correct, or delete your personal data at
          any time by contacting us at privacy@watasu.app. You can delete your
          account from the app's Settings screen, which removes all your
          personal data within 30 days.
        </Text>

        <Text style={styles.heading}>Children's Privacy</Text>
        <Text style={styles.body}>
          Watasu is intended for parents and guardians. We do not knowingly
          collect information from children under 13. Child profiles (names
          and birthdays) are entered by parents and used solely to match
          age-appropriate items.
        </Text>

        <Text style={styles.heading}>Changes to This Policy</Text>
        <Text style={styles.body}>
          We may update this policy from time to time. We will notify you of
          any changes by posting the new policy in the app and updating the
          "Last updated" date above.
        </Text>

        <Text style={styles.heading}>Contact Us</Text>
        <Text style={styles.body}>
          If you have questions about this Privacy Policy, contact us at
          privacy@watasu.app.
        </Text>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  backBtn: { paddingHorizontal: 20, paddingVertical: 12 },
  backText: { fontSize: 16, color: colors.neonPurple, fontWeight: "600" },
  scroll: { flex: 1 },
  content: { padding: 20, paddingTop: 0 },
  title: { fontSize: 28, fontWeight: "700", color: colors.text, marginBottom: 4 },
  updated: { fontSize: 13, color: colors.textMuted, marginBottom: 24 },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  body: { fontSize: 16, color: colors.text, lineHeight: 24 },
  spacer: { height: 40 },
});
