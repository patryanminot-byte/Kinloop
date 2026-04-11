import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SectionList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Contacts from "expo-contacts";
import { Share } from "react-native";
import Button from "../../components/ui/Button";
import { colors, gradientColors } from "../../lib/colors";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useAppStore } from "../../stores/appStore";
import { triggerMatchEngine } from "../../lib/matchTrigger";

const SEGMENTS = 4;
const CURRENT_STEP = 3;

interface ContactEntry {
  id: string;
  name: string;
  phone: string;
  last4: string;
  watasuUserId?: string;
  watasuName?: string;
  watasuAvatar?: string;
}

export default function ContactsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const userName = useAppStore((s) => s.userName);

  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [addedFriends, setAddedFriends] = useState<Set<string>>(new Set());

  /** Normalize phone to digits-only with leading 1 for US. */
  const normalize = (raw: string): string => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 10) return "1" + digits;
    return digits;
  };

  const requestContacts = async () => {
    setLoading(true);
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      setLoading(false);
      return;
    }
    setPermissionGranted(true);

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
    });

    const entries: ContactEntry[] = [];
    const normalizedPhones: string[] = [];

    for (const c of data) {
      const phone = c.phoneNumbers?.[0]?.number;
      if (!phone) continue;
      const digits = normalize(phone);
      if (digits.length < 10) continue;
      entries.push({
        id: c.id ?? digits,
        name: c.name ?? "Unknown",
        phone,
        last4: digits.slice(-4),
      });
      normalizedPhones.push(digits);
    }

    // Check which contacts are already on Watasu
    if (normalizedPhones.length > 0) {
      const { data: matches } = await supabase.rpc("find_contacts_on_watasu", {
        phone_numbers: normalizedPhones,
      });

      if (matches) {
        const matchMap = new Map<string, any>(
          (matches as any[]).map((m) => [m.phone, m])
        );
        for (const entry of entries) {
          const normalized = normalize(entry.phone);
          const match = matchMap.get(normalized);
          if (match) {
            entry.watasuUserId = match.user_id;
            entry.watasuName = match.name;
            entry.watasuAvatar = match.avatar_initials;
          }
        }
      }
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));
    setContacts(entries);
    setLoading(false);
  };

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter((c) => c.name.toLowerCase().includes(q));
  }, [contacts, search]);

  const onWatasu = filteredContacts.filter((c) => c.watasuUserId);
  const inviteList = filteredContacts.filter((c) => !c.watasuUserId);

  const sections = [
    { title: "Already on Watasu", data: onWatasu },
    { title: "Invite to Watasu", data: inviteList },
  ];

  const toggleContact = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  /** Add a Watasu user as friend (instant, no invite needed). */
  const handleAddFriend = async (contact: ContactEntry) => {
    if (!contact.watasuUserId) return;
    await supabase.rpc("create_friendship", { friend_id: contact.watasuUserId });
    setAddedFriends((prev) => new Set(prev).add(contact.id));
    // Trigger matching — new friend means new potential matches
    if (session?.user?.id) {
      triggerMatchEngine({ user_id: session.user.id });
    }
  };

  /** Invite selected contacts via native share sheet. */
  const handleInviteSelected = async () => {
    // Get the user's invite token
    if (!session?.user?.id) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("invite_token")
      .eq("id", session.user.id)
      .single();

    const token = profile?.invite_token ?? "";
    const link = `https://watasu.app/invite/${token}`;
    const firstName = userName.split(" ")[0] || "A friend";

    await Share.share({
      message: `${firstName} invited you to Watasu — the easy way to pass along kids' stuff to friends. Join here: ${link}`,
    });
  };

  const handleNext = () => {
    router.push("/onboarding/inventory-suggest");
  };

  const handleSkip = () => {
    router.push("/onboarding/inventory-suggest");
  };

  const renderContact = ({ item }: { item: ContactEntry }) => {
    const isSelected = selected.has(item.id);
    const isOnWatasu = !!item.watasuUserId;
    const isAdded = addedFriends.has(item.id);
    const initial = item.watasuAvatar || item.name.charAt(0).toUpperCase();

    if (isOnWatasu) {
      return (
        <View style={styles.contactRow}>
          <View style={[styles.avatar, styles.avatarWatasu]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName} numberOfLines={1}>
              {item.watasuName || item.name}
            </Text>
            <Text style={styles.contactPhoneOnWatasu}>Already on Watasu</Text>
          </View>
          {isAdded ? (
            <Text style={styles.addedCheck}>{"\u2713"} Added</Text>
          ) : (
            <Pressable style={styles.addBtn} onPress={() => handleAddFriend(item)}>
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          )}
        </View>
      );
    }

    return (
      <Pressable style={styles.contactRow} onPress={() => toggleContact(item.id)}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.contactPhone}>***-{item.last4}</Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkmark}>{"\u2713"}</Text>}
        </View>
      </Pressable>
    );
  };

  const renderSectionHeader = ({
    section,
  }: {
    section: { title: string; data: ContactEntry[] };
  }) => {
    if (section.data.length === 0 && section.title === "Already on Watasu") {
      return null;
    }
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{section.title}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress bar */}
      <View style={styles.progressRow}>
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <View key={i} style={styles.segmentWrapper}>
            {i < CURRENT_STEP ? (
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

      {/* Back button */}
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>{"\u2190"} Back</Text>
      </Pressable>

      {!permissionGranted ? (
        /* Pre-permission state */
        <View style={styles.content}>
          <Text style={styles.title}>Who would you love to share with?</Text>
          <Text style={styles.subtitle}>
            We'll check which of your contacts are already on Watasu. We never
            store, share, or contact anyone without your permission.
          </Text>

          <View style={styles.privacyBox}>
            <Text style={styles.privacyText}>
              🔒 Your contacts stay on your device. We only match phone numbers
              — nothing is uploaded or stored.
            </Text>
            <Pressable
              onPress={() =>
                router.push("/legal/safety-and-privacy" as `/${string}`)
              }
              style={styles.learnMoreBtn}
            >
              <Text style={styles.learnMoreText}>
                Learn how we protect your data {"\u203A"}
              </Text>
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator
              color={colors.violet}
              style={{ marginTop: 32 }}
            />
          ) : (
            <Button
              variant="primary"
              size="lg"
              title="Check my contacts"
              onPress={requestContacts}
              style={styles.checkButton}
            />
          )}
        </View>
      ) : (
        /* Post-permission: contact list */
        <View style={styles.listContainer}>
          <Text style={styles.title}>Who would you love to share with?</Text>
          <Text style={styles.subtitle}>
            We'll check who's already here. For everyone else, you can send
            them an invite yourself.
          </Text>

          {/* Search */}
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            placeholderTextColor={colors.textLight}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Selected count */}
          {selected.size > 0 && (
            <Text style={styles.selectedCount}>
              Selected ({selected.size})
            </Text>
          )}

          {loading ? (
            <ActivityIndicator
              color={colors.violet}
              style={{ marginTop: 32 }}
            />
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id}
              renderItem={renderContact}
              renderSectionHeader={renderSectionHeader}
              stickySectionHeadersEnabled={false}
              contentContainerStyle={styles.listContent}
              style={styles.list}
            />
          )}
        </View>
      )}

      {/* Bottom buttons */}
      <View style={styles.bottom}>
        {selected.size > 0 && permissionGranted ? (
          <Button
            variant="primary"
            size="lg"
            title={`Invite ${selected.size} friend${selected.size > 1 ? "s" : ""}`}
            onPress={handleInviteSelected}
            style={styles.button}
          />
        ) : null}
        <Button
          variant={selected.size > 0 ? "ghost" : "primary"}
          size="lg"
          title="Next"
          onPress={handleNext}
          style={styles.button}
        />
        {!permissionGranted && (
          <Button
            variant="ghost"
            size="md"
            title="Skip for now"
            onPress={handleSkip}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    alignSelf: "flex-start",
  },
  backText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.violet,
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
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 32,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 8,
    marginBottom: 20,
  },
  learnMoreBtn: {
    marginTop: 8,
  },
  learnMoreText: {
    fontSize: 13,
    color: colors.violet,
    fontWeight: "600",
  },
  privacyBox: {
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 28,
  },
  privacyText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  checkButton: {
    alignSelf: "stretch",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.card,
    marginBottom: 12,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  sectionHeader: {
    paddingVertical: 8,
    backgroundColor: colors.bg,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8E8E4",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
  },
  contactPhone: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: colors.violet,
    borderColor: colors.violet,
  },
  checkmark: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  avatarWatasu: {
    backgroundColor: colors.violet + "20",
    borderWidth: 2,
    borderColor: colors.violet,
  },
  contactPhoneOnWatasu: {
    fontSize: 13,
    color: colors.violet,
    fontWeight: "500",
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: colors.violet,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  addedCheck: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.violet,
  },
  bottom: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: "center",
    gap: 8,
  },
  button: {
    width: "100%",
  },
});
