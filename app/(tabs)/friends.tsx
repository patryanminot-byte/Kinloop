import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
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
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { colors, gradientColors } from "../../lib/colors";
import { Friend, Item } from "../../lib/types";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import GradientText from "../../components/ui/GradientText";
import SectionHeader from "../../components/ui/SectionHeader";
import { useAuth } from "../../hooks/useAuth";
import { useFriends } from "../../hooks/useFriends";
import { supabase } from "../../lib/supabase";

const { height: SCREEN_H } = Dimensions.get("window");

const MOCK_FRIENDS: Friend[] = [
  {
    id: "1",
    name: "Sarah Chen",
    kids: [{ name: "Oliver", age: "2 years" }],
    avatar: "SC",
    status: "active",
    itemsShared: 7,
  },
  {
    id: "2",
    name: "Mike Johnson",
    kids: [
      { name: "Emma", age: "8 months" },
      { name: "Liam", age: "3 years" },
    ],
    avatar: "MJ",
    status: "active",
    itemsShared: 3,
  },
  {
    id: "3",
    name: "Lisa Park",
    kids: [{ name: "Ava", age: "18 months" }],
    avatar: "LP",
    status: "active",
    itemsShared: 5,
  },
  {
    id: "4",
    name: "Jenny Torres",
    kids: [{ name: "Noah", age: "6 months" }],
    avatar: "JT",
    status: "invited",
    itemsShared: 0,
  },
  {
    id: "5",
    name: "Dave Kim",
    kids: [{ name: "Mia", age: "4 years" }],
    avatar: "DK",
    status: "invited",
    itemsShared: 0,
  },
];

// Mock available items per friend
const MOCK_FRIEND_ITEMS: Record<string, Item[]> = {
  "1": [
    {
      id: "fi1",
      name: "Rain boots",
      category: "Clothing",
      ageRange: "3-4y",
      status: "available",
      matchedTo: null,
      emoji: "\u{1F462}",
    },
    {
      id: "fi2",
      name: "Wooden blocks set",
      category: "Toys",
      ageRange: "2-4y",
      status: "available",
      matchedTo: null,
      emoji: "\u{1F9F1}",
    },
  ],
  "2": [
    {
      id: "fi3",
      name: "Baby monitor",
      category: "Gear",
      ageRange: "0-2y",
      status: "available",
      matchedTo: null,
      emoji: "\u{1F4F1}",
    },
  ],
  "3": [
    {
      id: "fi4",
      name: "Toddler bike",
      category: "Gear",
      ageRange: "2-3y",
      status: "available",
      matchedTo: null,
      emoji: "\u{1F6B2}",
    },
    {
      id: "fi5",
      name: "Winter coat",
      category: "Clothing",
      ageRange: "18mo-2y",
      status: "available",
      matchedTo: null,
      emoji: "\u{1F9E5}",
    },
    {
      id: "fi6",
      name: "Stacking cups",
      category: "Toys",
      ageRange: "1-2y",
      status: "available",
      matchedTo: null,
      emoji: "\u{1FAA3}",
    },
  ],
};

function formatKids(kids: { name: string; age: string }[]): string {
  return kids.map((k) => `${k.name} (${k.age})`).join(", ");
}

function passedAlongLabel(count: number): string {
  if (count === 0) return "";
  if (count === 1) return "1 item passed along";
  return `${count} items passed along`;
}

export default function FriendsScreen() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { friends: realFriends, loading } = useFriends(userId);

  const friends =
    realFriends.length > 0 || loading ? realFriends : MOCK_FRIENDS;

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  // Filter friends by search
  const filtered = friends.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeFriends = filtered.filter((f) => f.status === "active");
  const invitedFriends = filtered.filter((f) => f.status === "invited");

  const handleCopyLink = async () => {
    if (!userId) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("invite_token")
      .eq("id", userId)
      .single();

    const link = `https://watasu.app/invite/${profile?.invite_token ?? ""}`;
    await Clipboard.setStringAsync(link);
    Alert.alert("Link Copied", "Invite link copied to clipboard!");
  };

  const handleInvite = async () => {
    if (!userId) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("invite_token")
      .eq("id", userId)
      .single();

    const link = `https://watasu.app/invite/${profile?.invite_token ?? ""}`;
    Share.share({
      message: `Join me on Watasu! We share kids' stuff with friends nearby. ${link}`,
    });
  };

  const friendItems = selectedFriend
    ? MOCK_FRIEND_ITEMS[selectedFriend.id] ?? []
    : [];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Friends</Text>
          <Button
            variant="secondary"
            size="sm"
            title="+ Invite"
            onPress={handleInvite}
          />
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>{"\u{1F50D}"}</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search friends..."
            placeholderTextColor={colors.textLight}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              activeOpacity={0.6}
            >
              <Text style={styles.searchClear}>{"\u2715"}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Active friends */}
        {activeFriends.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title={`On Watasu (${activeFriends.length})`} />
            <View style={styles.listGap}>
              {activeFriends.map((friend) => (
                <Card
                  key={friend.id}
                  onPress={() => setSelectedFriend(friend)}
                >
                  <View style={styles.cardRow}>
                    <Avatar initials={friend.avatar} size={44} gradient />
                    <View style={styles.cardMiddle}>
                      <Text style={styles.friendName}>{friend.name}</Text>
                      <Text style={styles.friendSub}>
                        {formatKids(friend.kids)}
                      </Text>
                    </View>
                    {friend.itemsShared > 0 && (
                      <View style={styles.cardRight}>
                        <GradientText style={styles.sharedCount}>
                          {friend.itemsShared}
                        </GradientText>
                        <Text style={styles.sharedLabel}>passed{"\n"}along</Text>
                      </View>
                    )}
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* Invited friends */}
        {invitedFriends.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title={`Invited (${invitedFriends.length})`} />
            <View style={styles.listGap}>
              {invitedFriends.map((friend) => (
                <Card
                  key={friend.id}
                  onPress={() => setSelectedFriend(friend)}
                  style={{ opacity: 0.7 }}
                >
                  <View style={styles.cardRow}>
                    <Avatar initials={friend.avatar} size={44} gradient />
                    <View style={styles.cardMiddle}>
                      <Text style={styles.friendName}>{friend.name}</Text>
                      <Text style={styles.friendSub}>
                        {formatKids(friend.kids)}
                      </Text>
                    </View>
                    <Badge color={colors.neonPurple}>Invited</Badge>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* No results */}
        {filtered.length === 0 && searchQuery.length > 0 && (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>
              No friends matching "{searchQuery}"
            </Text>
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
              <Text style={styles.growEmoji}>{"\u{1F517}"}</Text>
              <Text style={styles.growTitle}>Grow your network</Text>
              <Text style={styles.growSub}>
                More friends = better matches for everyone
              </Text>
              <Button
                variant="secondary"
                title="Copy invite link"
                onPress={handleCopyLink}
              />
            </LinearGradient>
          </Card>
        </View>
      </ScrollView>

      {/* ---- Bottom Sheet Modal ---- */}
      <Modal
        visible={selectedFriend !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedFriend(null)}
      >
        <Pressable
          style={styles.sheetOverlay}
          onPress={() => setSelectedFriend(null)}
        >
          <Pressable
            style={styles.sheetContainer}
            onPress={() => {}}
          >
            {/* Drag handle */}
            <View style={styles.sheetHandle} />

            {selectedFriend && (
              <View style={styles.sheetContent}>
                {/* Friend header */}
                <View style={styles.sheetHeader}>
                  <Avatar
                    initials={selectedFriend.avatar}
                    size={56}
                    gradient
                  />
                  <View style={styles.sheetHeaderInfo}>
                    <Text style={styles.sheetName}>
                      {selectedFriend.name}
                    </Text>
                    {selectedFriend.itemsShared > 0 && (
                      <Text style={styles.sheetPassedAlong}>
                        {passedAlongLabel(selectedFriend.itemsShared)}
                      </Text>
                    )}
                    {selectedFriend.status === "invited" && (
                      <Badge color={colors.neonPurple}>Invited</Badge>
                    )}
                  </View>
                </View>

                {/* Kids */}
                <View style={styles.sheetSection}>
                  <Text style={styles.sheetSectionTitle}>Kids</Text>
                  <View style={styles.kidsRow}>
                    {selectedFriend.kids.map((kid, idx) => (
                      <View key={idx} style={styles.kidChip}>
                        <Text style={styles.kidName}>{kid.name}</Text>
                        <Text style={styles.kidAge}>{kid.age}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Available items */}
                {friendItems.length > 0 && (
                  <View style={styles.sheetSection}>
                    <Text style={styles.sheetSectionTitle}>
                      Available items
                    </Text>
                    <View style={styles.itemsList}>
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
                            <Text style={styles.itemMeta}>
                              {item.category} {"\u00B7"} {item.ageRange}
                            </Text>
                          </View>
                          <Text style={styles.itemChevron}>{"\u203A"}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {friendItems.length === 0 &&
                  selectedFriend.status === "active" && (
                    <View style={styles.sheetSection}>
                      <Text style={styles.sheetSectionTitle}>
                        Available items
                      </Text>
                      <Text style={styles.emptyItemsText}>
                        No items available right now
                      </Text>
                    </View>
                  )}

                {selectedFriend.status === "invited" && (
                  <View style={styles.sheetSection}>
                    <Text style={styles.invitedNote}>
                      {selectedFriend.name.split(" ")[0]} hasn't joined yet.
                      Send them a reminder!
                    </Text>
                    <Button
                      variant="primary"
                      size="md"
                      title="Resend invite"
                      onPress={async () => {
                        await handleInvite();
                        setSelectedFriend(null);
                      }}
                      style={styles.resendBtn}
                    />
                  </View>
                )}

                {/* Close button */}
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSelectedFriend(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
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
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    marginBottom: 20,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    height: 44,
  },
  searchClear: {
    fontSize: 16,
    color: colors.textLight,
    paddingLeft: 8,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  listGap: {
    gap: 12,
    marginTop: 12,
  },

  // Friend cards
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
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: "center",
    lineHeight: 13,
  },

  // Empty state
  emptySection: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
  },

  // Grow network
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

  // Sheet header
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  sheetHeaderInfo: {
    flex: 1,
    gap: 4,
  },
  sheetName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  sheetPassedAlong: {
    fontSize: 14,
    color: colors.neonPurple,
    fontWeight: "500",
  },

  // Sheet sections
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

  // Kids
  kidsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  kidChip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  kidName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  kidAge: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Items
  itemsList: {
    gap: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  itemEmoji: {
    fontSize: 28,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  itemMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemChevron: {
    fontSize: 22,
    color: colors.textLight,
    marginLeft: 4,
  },
  emptyItemsText: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: "italic",
  },

  // Invited
  invitedNote: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 20,
  },
  resendBtn: {
    alignSelf: "center",
  },

  // Close
  closeBtn: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 4,
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textMuted,
  },
});
