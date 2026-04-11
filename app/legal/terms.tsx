import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "../../lib/colors";

export default function TermsOfServiceScreen() {
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
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.updated}>Last updated: April 9, 2026</Text>

        <Text style={styles.body}>
          Welcome to Watasu. By using our app, you agree to these Terms of
          Service. Please read them carefully.
        </Text>

        <Text style={styles.heading}>1. Acceptance of Terms</Text>
        <Text style={styles.body}>
          By creating an account or using Watasu, you agree to be bound by
          these Terms. If you do not agree, do not use the Service.
        </Text>

        <Text style={styles.heading}>2. Description of Service</Text>
        <Text style={styles.body}>
          Watasu is a platform that connects parents and guardians to share,
          give, and sell children's items within their communities. Watasu
          facilitates connections but is not a party to any transaction
          between users.
        </Text>

        <Text style={styles.heading}>3. User Accounts</Text>
        <Text style={styles.body}>
          You must provide accurate information when creating your account.
          You are responsible for maintaining the security of your account
          and for all activity under it. You must be at least 18 years old
          to use Watasu.
        </Text>

        <Text style={styles.heading}>4. Item Listings</Text>
        <Text style={styles.body}>
          When listing items, you represent that:{"\n"}
          {"\u2022"} You own the item or have the right to share/sell it.{"\n"}
          {"\u2022"} The item is accurately described.{"\n"}
          {"\u2022"} The item is safe for its intended use and has not been
          recalled.{"\n"}
          {"\u2022"} Car seats have not been in an accident, are not expired,
          and meet current safety standards.{"\n"}
          {"\u2022"} Cribs and bassinets meet current CPSC standards.
        </Text>

        <Text style={styles.heading}>5. Safety</Text>
        <Text style={styles.body}>
          WATASU IS NOT RESPONSIBLE FOR THE SAFETY, QUALITY, OR LEGALITY OF
          ITEMS LISTED ON THE PLATFORM. Users are solely responsible for
          verifying that items are safe, not recalled, and appropriate for
          their intended use. Always check cpsc.gov/recalls before accepting
          children's products.{"\n\n"}
          When meeting other users in person, use common sense: meet in
          public, well-lit locations and tell someone where you are going.
        </Text>

        <Text style={styles.heading}>6. Payments</Text>
        <Text style={styles.body}>
          Some transactions may involve payments processed through Stripe.
          Watasu is not responsible for payment disputes between users.
          Refund policies are between the buyer and seller.
        </Text>

        <Text style={styles.heading}>7. Prohibited Conduct</Text>
        <Text style={styles.body}>
          You may not:{"\n"}
          {"\u2022"} List recalled, counterfeit, or illegal items.{"\n"}
          {"\u2022"} Misrepresent the condition or safety of items.{"\n"}
          {"\u2022"} Harass, threaten, or defraud other users.{"\n"}
          {"\u2022"} Use the platform for any unlawful purpose.{"\n"}
          {"\u2022"} Scrape, bot, or otherwise abuse the Service.
        </Text>

        <Text style={styles.heading}>8. Content and Intellectual Property</Text>
        <Text style={styles.body}>
          You retain ownership of content you post. By posting, you grant
          Watasu a non-exclusive, royalty-free license to use, display, and
          distribute your content within the Service.
        </Text>

        <Text style={styles.heading}>9. Termination</Text>
        <Text style={styles.body}>
          We may suspend or terminate your account at any time for violation
          of these Terms. You may delete your account at any time through the
          app's Settings.
        </Text>

        <Text style={styles.heading}>10. Disclaimer of Warranties</Text>
        <Text style={styles.body}>
          THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
          WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WATASU DOES NOT WARRANT
          THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
        </Text>

        <Text style={styles.heading}>11. Limitation of Liability</Text>
        <Text style={styles.body}>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, WATASU SHALL NOT BE LIABLE
          FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
          DAMAGES ARISING FROM YOUR USE OF THE SERVICE, INCLUDING BUT NOT
          LIMITED TO PERSONAL INJURY, PROPERTY DAMAGE, OR LOSS ARISING FROM
          ITEMS EXCHANGED THROUGH THE PLATFORM.
        </Text>

        <Text style={styles.heading}>12. Indemnification</Text>
        <Text style={styles.body}>
          You agree to indemnify and hold harmless Watasu from any claims,
          damages, or expenses arising from your use of the Service, your
          content, or your violation of these Terms.
        </Text>

        <Text style={styles.heading}>13. Governing Law</Text>
        <Text style={styles.body}>
          These Terms are governed by the laws of the State of Wisconsin,
          without regard to conflict of law provisions.
        </Text>

        <Text style={styles.heading}>14. Changes to Terms</Text>
        <Text style={styles.body}>
          We may update these Terms from time to time. Continued use of the
          Service after changes constitutes acceptance of the updated Terms.
        </Text>

        <Text style={styles.heading}>Contact Us</Text>
        <Text style={styles.body}>
          Questions? Contact us at legal@watasu.app.
        </Text>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  backBtn: { paddingHorizontal: 20, paddingVertical: 12 },
  backText: { fontSize: 16, color: colors.violet, fontWeight: "600" },
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
