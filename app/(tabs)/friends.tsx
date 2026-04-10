import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  Dimensions,
  TouchableOpacity,
  Modal,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { colors } from "../../lib/colors";
import { Friend, Item } from "../../lib/types";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useFriends } from "../../hooks/useFriends";
import { supabase } from "../../lib/supabase";

const { height: SCREEN_H } = Dimensions.get("window");

const MOCK_FRIENDS: Friend[] = [
  { id: "1", name: "Sarah Chen", kids: [{ name: "Oliver", age: "2 years" }], avatar: "SC", status: "active", itemsShared: 7 },
  { id: "2", name: "Mike Johnson", kids: [{ name: "Emma", age: "8 months" }, { name: "Liam", age: "3 years" }], avatar: "MJ", status: "active", itemsShared: 3 },
  { id: "3", name: "Lisa Park", kids: [{ name: "Ava", age: "18 months" }], avatar: "LP", status: "active", itemsShared: 5 },
  { id: "4", name: "Jenny Torres", kids: [{ name: "Noah", age: "6 months" }], avatar: "JT", status: "invited", itemsShared: 0 },
  { id: "5", name: "Dave Kim", kids: [{ name: "Mia", age: "4 years" }], avatar: "DK", status: "invited", itemsShared: 0 },
];

const MOCK_FRIEND_ITEMS: Record<string, Item[]> = {
  "1": [
    { id: "fi1", name: "Rain boots", category: "Clothing", ageRange: "3-4y", status: "available", matchedTo: null, emoji: "\u{1F462}" },
    { id: "fi2", name: "Wooden blocks set", category: "Toys", ageRange: "2-4y", status: "available", matchedTo: null, emoji: "\u{1F9F1}" },
  ],
  "2": [
    { id: "fi3", name: "Baby monitor", category: "Gear", ageRange: "0-2y", status: "available", matchedTo: null, emoji: "\u{1F4F1}" },
  ],
  "3": [
    { id: "fi4", name: "Toddler bike", category: "Gear", ageRange: "2-3y", status: "available", matchedTo: null, emoji: "\u{1F6B2}" },
    { id: "fi5", name: "Winter coat", category: "Clothing", ageRange: "18mo-2y", status: "available", matchedTo: null, emoji: "\u{1F9E5}" },
    { id: "fi6", name: "Stacking cups", category: "Toys", ageRange: "1-2y", status: "available", matchedTo: null, emoji: "\u{1FAA3}" },
  ],
};

function formatKids(kids: { name: string; age: string }[]): string {
  return kids.map((k) => `${k.name} (${k.age})`).join(", ");
}

export default function FriendsScreen() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { friends: realFriends, loading } = useFriends(userId);
  const friends = realFriends.length > 0 || loading ? realFriends : MOCK_FRIENDS;
  const router = useRouter();
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  const handleInvite = async () => {
    if (!userId) return;
    const { data: profile } = await supabase
      .from("profiles").select("invite_token").eq("id", userId).single();
    const link = `https://watasu.app/invite/${profile?.invite_token ?? ""}`;
    Share.share({ message: `Join me on Watasu! We share kids' stuff with friends nearby. ${link}` });
  };

  const friendItems = selectedFriend ? MOCK_FRIEND_ITEMS[selectedFriend.id] ?? [] : [];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Friends</Text>
          <Button variant="secondary" size="sm" title="+ Invite" onPress={handleInvite} />
        </View>

        {/* Friend list — single list, active + invited together */}
        <View style={styles.list}>
          {friends.map((friend) => {
            const isInvited = friend.status === "invited";
            return (
              <Pressable
                key={friend.id}
                style={[styles.friendRow, isInvited && { opacity: 0.6 }]}
                onPress={() => setSelectedFriend(friend)}
              >
                <Avatar initials={friend.avatar} size={40} gradient={!isInvited} />
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{friend.name}</Text>
                  <Text style={styles.friendSub}>
                    {formatKids(friend.kids)}
                    {friend.itemsShared > 0 && ` \u00B7 ${friend.itemsShared} shared`}
                  </Text>
                </View>
                {isInvited && <Badge color={colors.coral}>Invited</Badge>}
              </Pressable>
            );
          })}
        </View>

        {/* No friends */}
        {friends.length === 0 && !loading && (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No friends yet. Invite someone!</Text>
          </View>
        )}

        {/* Invite banner */}
        <Pressable style={styles.inviteBanner} onPress={handleInvite}>
          <Text style={styles.inviteBannerIcon}>{"\u{1F517}"}</Text>
          <Text style={styles.inviteBannerText}>Invite friends to Watasu</Text>
          <Text style={styles.chevron}>{"\u203A"}</Text>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Friend Detail Bottom Sheet ── */}
      <Modal visible={selectedFriend !== null} transparent animationType="slide" onRequestClose={() => setSelectedFriend(null)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setSelectedFriend(null)}>
          <Pressable style={styles.sheetContainer} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            {selectedFriend && (
              <View style={styles.sheetContent}>
                {/* Header */}
                <View style={styles.sheetHeader}>
                  <Avatar initials={selectedFriend.avatar} size={56} gradient />
                  <View style={styles.sheetHeaderInfo}>
                    <Text style={styles.sheetName}>{selectedFriend.name}</Text>
                    <Text style={styles.sheetKids}>{formatKids(selectedFriend.kids)}</Text>
                    {selectedFriend.itemsShared > 0 && (
                      <Text style={styles.sheetShared}>{selectedFriend.itemsShared} items shared</Text>
                    )}
                    {selectedFriend.status === "invited" && (
                      <Badge color={colors.coral}>Invited</Badge>
                    )}
                  </View>
                </View>

                {/* Available items */}
                {friendItems.length > 0 && (
                  <View style={styles.sheetSection}>
                    <Text style={styles.sheetSectionTitle}>Available items</Text>
                    {friendItems.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.itemRow}
                        activeOpacity={0.7}
                        onPress={() => {
                          setSelectedFriend(null);
                          router.push(`/item/${item.id}` as `/${string}`);
                        }}
                      >
                        <Text style={styles.itemEmoji}>{item.emoji}</Text>
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemMeta}>{item.category} {"\u00B7"} {item.ageRange}</Text>
                        </View>
                        <Text style={styles.chevron}>{"\u203A"}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {friendItems.length === 0 && selectedFriend.status === "active" && (
                  <View style={styles.sheetSection}>
                    <Text style={styles.emptyItemsText}>No items available right now</Text>
                  </View>
                )}

                {selectedFriend.status === "invited" && (
                  <View style={styles.sheetSection}>
                    <Text style={styles.invitedNote}>
                      {selectedFriend.name.split(" ")[0]} hasn't joined yet.
                    </Text>
                    <Button
                      variant="primary" size="md" title="Resend invite"
                      onPress={async () => { await handleInvite(); setSelectedFriend(null); }}
                      style={{ alignSelf: "center" }}
                    />
                  </View>
                )}
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 120 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },

  // Friend list
  list: {
    gap: 2,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 12,
  },
  friendInfo: { flex: 1 },
  friendName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  friendSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 1,
  },

  // Empty
  emptySection: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
  },

  // Invite banner
  inviteBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 20,
    gap: 12,
  },
  inviteBannerIcon: { fontSize: 18 },
  inviteBannerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  chevron: {
    fontSize: 20,
    color: colors.textLight,
  },

  // Bottom sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_H * 0.75,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  sheetHeaderInfo: { flex: 1, gap: 3 },
  sheetName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  sheetKids: {
    fontSize: 14,
    color: colors.textMuted,
  },
  sheetShared: {
    fontSize: 13,
    color: colors.eucalyptus,
    fontWeight: "600",
  },
  sheetSection: {
    marginBottom: 20,
  },
  sheetSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemEmoji: { fontSize: 24 },
  itemInfo: { flex: 1 },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  itemMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 1,
  },
  emptyItemsText: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 12,
  },
  invitedNote: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 20,
  },
});
