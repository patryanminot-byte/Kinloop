import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradientColors } from "../../lib/colors";
import { Child } from "../../lib/types";
import Avatar from "../../components/ui/Avatar";
import Card from "../../components/ui/Card";
import GradientBar from "../../components/ui/GradientBar";
import GradientText from "../../components/ui/GradientText";
import SectionHeader from "../../components/ui/SectionHeader";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useAppStore } from "../../stores/appStore";
import { useInventory } from "../../hooks/useInventory";
import { supabase } from "../../lib/supabase";

const MOCK_USER = {
  name: "Pat Ryan",
  initials: "PR",
  city: "Madison, WI",
};

const MOCK_KIDS: Child[] = [
  { id: "1", name: "Maya", dob: "2023-03-15", emoji: "👧🏽" },
  { id: "2", name: "Leo", dob: "2024-11-02", emoji: "👶🏼" },
];

const MOCK_IMPACT = {
  given: 4,
  received: 2,
  valueShared: 340,
};

function formatDob(dob: string): string {
  const date = new Date(dob + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const SETTINGS_ROWS = [
  "Notifications",
  "Privacy",
  "Help & Support",
  "About Watasu",
];

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const userId = session?.user?.id;
  const { userName, userInitials, locationCity } = useAppStore();
  const { items: inventoryItems } = useInventory(userId);

  const [kids, setKids] = useState<Child[]>([]);
  useEffect(() => {
    if (!userId) return;
    supabase.from("children").select("*").eq("user_id", userId).then(({ data }) => {
      if (data) setKids(data.map((k: any) => ({ id: k.id, name: k.name, dob: k.dob, emoji: k.emoji })));
    });
  }, [userId]);

  // Compute impact from real inventory
  const impact = useMemo(() => {
    const given = inventoryItems.filter((i) => i.status === "handed-off").length;
    const received = 0; // would need received-items tracking
    const valueShared = inventoryItems
      .filter((i) => i.status === "handed-off")
      .reduce((sum, i) => sum + (i.pricing?.amount ?? 0), 0);
    return { given, received, valueShared };
  }, [inventoryItems]);

  const hasRealUser = userName.length > 0;
  const displayUser = hasRealUser
    ? { name: userName, initials: userInitials, city: locationCity }
    : MOCK_USER;

  const displayKids = kids.length > 0 ? kids : MOCK_KIDS;

  const displayImpact = impact.given > 0 || impact.received > 0
    ? impact
    : MOCK_IMPACT;

  const comingSoon = () => Alert.alert("Coming soon");

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      Alert.alert("Error", "Failed to sign out");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <Text style={styles.header}>You</Text>

        {/* User card */}
        <Card style={styles.userCard}>
          <View style={styles.userRow}>
            <Avatar initials={displayUser.initials} size={56} gradient />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{displayUser.name}</Text>
              <Text style={styles.userCity}>{displayUser.city}</Text>
            </View>
          </View>
          <GradientBar height={3} style={styles.gradientBar} />
        </Card>

        {/* Your kids */}
        <SectionHeader
          title="Your kids"
          actionLabel="+ Add"
          onAction={comingSoon}
        />
        <View style={styles.kidsSection}>
          {displayKids.map((kid) => (
            <Card key={kid.id} style={styles.kidCard}>
              <View style={styles.kidRow}>
                <Text style={styles.kidEmoji}>{kid.emoji}</Text>
                <Text style={styles.kidName}>{kid.name}</Text>
                <Text style={styles.kidDob}>Born {formatDob(kid.dob)}</Text>
              </View>
            </Card>
          ))}
        </View>

        {/* Impact card */}
        <Card style={styles.impactCard}>
          <LinearGradient
            colors={gradientColors.subtle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.impactGradient}
          >
            <View style={styles.impactRow}>
              <View style={styles.impactCol}>
                <GradientText style={styles.impactNumber}>
                  {displayImpact.given}
                </GradientText>
                <Text style={styles.impactLabel}>given</Text>
              </View>
              <View style={styles.impactCol}>
                <GradientText style={styles.impactNumber}>
                  {displayImpact.received}
                </GradientText>
                <Text style={styles.impactLabel}>received</Text>
              </View>
              <View style={styles.impactCol}>
                <GradientText style={styles.impactNumber}>
                  ${displayImpact.valueShared}
                </GradientText>
                <Text style={styles.impactLabel}>shared</Text>
              </View>
            </View>
            <Button
              variant="ghost"
              size="sm"
              title="Share your impact ↗"
              onPress={comingSoon}
              style={styles.shareButton}
            />
          </LinearGradient>
        </Card>

        {/* Settings menu */}
        <Card style={styles.settingsCard}>
          {SETTINGS_ROWS.map((label, index) => (
            <React.Fragment key={label}>
              {index > 0 && <View style={styles.divider} />}
              <Pressable style={styles.settingsRow} onPress={comingSoon}>
                <Text style={styles.settingsLabel}>{label}</Text>
                <Text style={styles.settingsChevron}>›</Text>
              </Pressable>
            </React.Fragment>
          ))}
          <View style={styles.divider} />
          <Pressable style={styles.settingsRow} onPress={handleSignOut}>
            <Text style={[styles.settingsLabel, { color: "#EF4444" }]}>Sign Out</Text>
            <Text style={styles.settingsChevron}>›</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  content: { padding: 20, gap: 16 },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  userCard: {
    padding: 16,
    overflow: "hidden",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  userCity: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  gradientBar: {
    marginTop: 16,
  },
  kidsSection: {
    gap: 8,
  },
  kidCard: {
    padding: 14,
  },
  kidRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  kidEmoji: {
    fontSize: 28,
  },
  kidName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  kidDob: {
    fontSize: 14,
    color: colors.textMuted,
  },
  impactCard: {
    padding: 0,
    overflow: "hidden",
  },
  impactGradient: {
    padding: 20,
    borderRadius: 15,
  },
  impactRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  impactCol: {
    alignItems: "center",
  },
  impactNumber: {
    fontSize: 28,
    fontWeight: "700",
  },
  impactLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  shareButton: {
    alignSelf: "center",
    marginTop: 16,
  },
  settingsCard: {
    padding: 0,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingsLabel: {
    fontSize: 16,
    color: colors.text,
  },
  settingsChevron: {
    fontSize: 16,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0ED",
    marginHorizontal: 16,
  },
});
