import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradientColors } from "../../lib/colors";

interface SafetyCardProps {
  emoji: string;
  title: string;
  bullets: string[];
}

function SafetyCard({ emoji, title, bullets }: SafetyCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>{emoji}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {bullets.map((b, i) => (
        <Text key={i} style={styles.cardBullet}>
          {b}
        </Text>
      ))}
    </View>
  );
}

export default function SafetyAndPrivacyScreen() {
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
        <LinearGradient
          colors={gradientColors.subtle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <Text style={styles.heroEmoji}>{"\u{1F6E1}\uFE0F"}</Text>
          <Text style={styles.title}>How Watasu keeps you safe</Text>
          <Text style={styles.subtitle}>
            We built Watasu for our own families. Here's how we protect yours.
          </Text>
        </LinearGradient>

        <SafetyCard
          emoji={"\u{1F512}"}
          title="Your contacts stay yours"
          bullets={[
            "When you import contacts, we check which phone numbers match existing Watasu users. That\u2019s it.",
            "Your contacts are never uploaded, stored, or shared. We use one-way encryption to compare numbers \u2014 even we can\u2019t see them.",
            "We will never message, email, or contact anyone on your behalf without you explicitly pressing send.",
          ]}
        />

        <SafetyCard
          emoji={"\u{1F4CD}"}
          title="Your location stays vague"
          bullets={[
            "We use your approximate location to show how far away nearby items are \u2014 like \u201CAbout 5 min away.\u201D",
            "We never show your address, your street, or a pin on a map. Other users see a fuzzy distance, nothing more.",
            "Your exact GPS coordinates are never stored. We round your location to the nearest kilometer and throw the rest away.",
            "Think of it like Strava\u2019s privacy zones \u2014 we keep a buffer so no one can pinpoint where you live.",
          ]}
        />

        <SafetyCard
          emoji={"\u{1F476}"}
          title="Your kids\u2019 info is minimal"
          bullets={[
            "We ask for your child\u2019s name, birthday, and an emoji \u2014 that\u2019s all. No photos of your kids are ever required.",
            "This info is used only to figure out what size your kid is outgrowing so we can match items to friends with younger kids.",
            "Only you can see your children\u2019s information. It\u2019s never shared with other users, advertisers, or anyone else.",
          ]}
        />

        <SafetyCard
          emoji={"\u{1F4B3}"}
          title="Payments are handled by Stripe"
          bullets={[
            "If you buy or sell something, payments go through Stripe \u2014 the same company trusted by Amazon, Shopify, and millions of businesses.",
            "We never see your credit card number. We never store financial information. Stripe handles everything.",
            "Our fees are flat and transparent: $2 under $50, $5 for $50\u2013150, $8 over $150. No hidden charges.",
          ]}
        />

        <SafetyCard
          emoji={"\u26A0\uFE0F"}
          title="We check for safety"
          bullets={[
            "When you list car seats, cribs, strollers, or high chairs, we show safety reminders and ask you to confirm the item hasn\u2019t been recalled or damaged.",
            "We link directly to the CPSC recall database so you can verify in seconds.",
            "Anyone can report an item they think is unsafe. We review every report.",
          ]}
        />

        <SafetyCard
          emoji={"\u{1F44B}"}
          title="Friends first, strangers never"
          bullets={[
            "Watasu is built on your real contacts \u2014 people you actually know.",
            "The Nearby feature shows items from verified Watasu parents in your area, but your address is never shared until YOU choose to share it in a private chat.",
            "Every user verifies their phone number or email. No anonymous accounts, no bots.",
          ]}
        />

        <SafetyCard
          emoji={"\u2728"}
          title="Your data, your choice"
          bullets={[
            "You can delete your account and all your data at any time.",
            "You can turn off location, contacts, or notifications whenever you want.",
            "We don\u2019t sell your data. We don\u2019t show ads. We never will.",
          ]}
        />

        {/* Legal links */}
        <View style={styles.legalLinks}>
          <Pressable
            onPress={() => router.push("/legal/privacy" as `/${string}`)}
          >
            <Text style={styles.legalLink}>
              Read our full Privacy Policy {"\u203A"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/legal/terms" as `/${string}`)}
          >
            <Text style={styles.legalLink}>
              Read our Terms of Service {"\u203A"}
            </Text>
          </Pressable>
        </View>

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
  content: { paddingHorizontal: 20, paddingTop: 0 },

  // Hero
  heroGradient: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  heroEmoji: { fontSize: 48, marginBottom: 12 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },

  // Cards
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  cardEmoji: { fontSize: 22 },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  cardBullet: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 10,
    paddingLeft: 4,
  },

  // Legal links
  legalLinks: {
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  legalLink: {
    fontSize: 15,
    color: colors.neonPurple,
    fontWeight: "600",
  },

  spacer: { height: 40 },
});
