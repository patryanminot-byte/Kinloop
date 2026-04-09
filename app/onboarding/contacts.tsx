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
import Button from "../../components/ui/Button";
import { colors, gradientColors } from "../../lib/colors";

const SEGMENTS = 3;

interface ContactEntry {
  id: string;
  name: string;
  phone: string;
  last4: string;
}

export default function ContactsScreen() {
  const router = useRouter();

  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

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
    for (const c of data) {
      const phone = c.phoneNumbers?.[0]?.number;
      if (!phone) continue;
      const digits = phone.replace(/\D/g, "");
      entries.push({
        id: c.id ?? digits,
        name: c.name ?? "Unknown",
        phone,
        last4: digits.slice(-4),
      });
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

  // For now, "Already on Kinloop" is always empty
  const onKinloop: ContactEntry[] = [];
  const inviteList = filteredContacts;

  const sections = [
    { title: "Already on Kinloop", data: onKinloop },
    { title: "Invite to Kinloop", data: inviteList },
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

  const handleNext = () => {
    router.push("/onboarding/inventory-suggest");
  };

  const handleSkip = () => {
    router.push("/onboarding/inventory-suggest");
  };

  const renderContact = ({ item }: { item: ContactEntry }) => {
    const isSelected = selected.has(item.id);
    const initial = item.name.charAt(0).toUpperCase();
    return (
      <Pressable style={styles.contactRow} onPress={() => toggleContact(item.id)}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.contactPhone}>***-{item.last4}</Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </Pressable>
    );
  };

  const renderSectionHeader = ({
    section,
  }: {
    section: { title: string; data: ContactEntry[] };
  }) => {
    if (section.data.length === 0 && section.title === "Already on Kinloop") {
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
            {i < 2 ? (
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

      {!permissionGranted ? (
        /* Pre-permission state */
        <View style={styles.content}>
          <Text style={styles.title}>Find your people</Text>
          <Text style={styles.subtitle}>
            We check which of your contacts are already on Kinloop. We never
            store, share, or contact anyone without your permission.
          </Text>

          <View style={styles.privacyBox}>
            <Text style={styles.privacyText}>
              🔒 Your contacts stay on your device. We only match phone numbers
              — nothing is uploaded or stored.
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator
              color={colors.neonPurple}
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
          <Text style={styles.title}>Find your people</Text>
          <Text style={styles.subtitle}>
            We check which of your contacts are already on Kinloop. We never
            store, share, or contact anyone without your permission.
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
              color={colors.neonPurple}
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
        <Button
          variant="primary"
          size="lg"
          title="Next"
          onPress={handleNext}
          style={styles.button}
        />
        <Button
          variant="ghost"
          size="md"
          title="Skip for now"
          onPress={handleSkip}
        />
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
    backgroundColor: colors.neonPurple,
    borderColor: colors.neonPurple,
  },
  checkmark: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
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
