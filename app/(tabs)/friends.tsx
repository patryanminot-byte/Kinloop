import React from "react";
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradientColors } from "../../lib/colors";
import { Friend } from "../../lib/types";
import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import GradientText from "../../components/ui/GradientText";
import SectionHeader from "../../components/ui/SectionHeader";
import { useAuth } from "../../hooks/useAuth";
import { useFriends } from "../../hooks/useFriends";

const MOCK_FRIENDS: Friend[] = [
  { id: "1", name: "Sarah Chen", kids: [{ name: "Oliver", age: "2 years" }], avatar: "SC", status: "active", itemsShared: 7 },
  { id: "2", name: "Mike Johnson", kids: [{ name: "Emma", age: "8 months" }, { name: "Liam", age: "3 years" }], avatar: "MJ", status: "active", itemsShared: 3 },
  { id: "3", name: "Lisa Park", kids: [{ name: "Ava", age: "18 months" }], avatar: "LP", status: "active", itemsShared: 5 },
  { id: "4", name: "Jenny Torres", kids: [{ name: "Noah", age: "6 months" }], avatar: "JT", status: "invited", itemsShared: 0 },
  { id: "5", name: "Dave Kim", kids: [{ name: "Mia", age: "4 years" }], avatar: "DK", status: "invited", itemsShared: 0 },
];

function formatKids(kids: { name: string; age: string }[]): string {
  return kids.map((k) => `${k.name} (${k.age})`).join(", ");
}

export default function FriendsScreen() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { friends: realFriends, loading } = useFriends(userId);

  const friends = realFriends.length > 0 || loading ? realFriends : MOCK_FRIENDS;

  const activeFriends = friends.filter((f) => f.status === "active");
  const invitedFriends = friends.filter((f) => f.status === "invited");

  const handleCopyLink = () => {
    Alert.alert("Link Copied", "Invite link copied to clipboard!");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Friends</Text>
          <Button variant="secondary" size="sm" title="+ Invite" onPress={() => {}} />
        </View>

        {/* Active friends */}
        <View style={styles.section}>
          <SectionHeader title={`On Kinloop (${activeFriends.length})`} />
          <View style={styles.listGap}>
            {activeFriends.map((friend) => (
              <Card key={friend.id} onPress={() => {}}>
                <View style={styles.cardRow}>
                  <Avatar initials={friend.avatar} size={44} gradient />
                  <View style={styles.cardMiddle}>
                    <Text style={styles.friendName}>{friend.name}</Text>
                    <Text style={styles.friendSub}>{formatKids(friend.kids)}</Text>
                  </View>
                  <View style={styles.cardRight}>
                    <GradientText style={styles.sharedCount}>
                      {friend.itemsShared}
                    </GradientText>
                    <Text style={styles.sharedLabel}>shared</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* Invited friends */}
        {invitedFriends.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title={`Invited (${invitedFriends.length})`} />
            <View style={styles.listGap}>
              {invitedFriends.map((friend) => (
                <Card key={friend.id} onPress={() => {}} style={{ opacity: 0.7 }}>
                  <View style={styles.cardRow}>
                    <Avatar initials={friend.avatar} size={44} gradient />
                    <View style={styles.cardMiddle}>
                      <Text style={styles.friendName}>{friend.name}</Text>
                      <Text style={styles.friendSub}>{formatKids(friend.kids)}</Text>
                    </View>
                    <Button variant="secondary" size="sm" title="Resend" onPress={() => {}} />
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* Grow your network */}
        <View style={styles.section}>
          <Card>
            <LinearGradient
              colors={gradientColors.subtle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.growGradient}
            >
              <Text style={styles.growEmoji}>🔗</Text>
              <Text style={styles.growTitle}>Grow your network</Text>
              <Text style={styles.growSub}>
                More friends = better matches for everyone
              </Text>
              <Button variant="secondary" title="Copy invite link" onPress={handleCopyLink} />
            </LinearGradient>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  section: {
    marginBottom: 24,
  },
  listGap: {
    gap: 12,
    marginTop: 12,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardMiddle: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  friendSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  cardRight: {
    alignItems: "center",
    marginLeft: 12,
  },
  sharedCount: {
    fontSize: 20,
  },
  sharedLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  growGradient: {
    alignItems: "center",
    padding: 8,
    borderRadius: 12,
    margin: -16,
    paddingVertical: 24,
  },
  growEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  growTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  growSub: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
    textAlign: "center",
  },
});
