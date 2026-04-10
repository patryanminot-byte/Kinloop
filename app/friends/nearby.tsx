import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { colors } from "../../lib/colors";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { triggerMatchEngine } from "../../lib/matchTrigger";
import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import GradientText from "../../components/ui/GradientText";

interface NearbyFamily {
  user_id: string;
  name: string;
  avatar_initials: string;
  distance_miles: number;
  kid_name: string;
  kid_age_months: number;
}

function ageLabel(months: number): string {
  if (months < 24) return `${months}mo`;
  return `${Math.floor(months / 12)}y`;
}

export default function NearbyFriendsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [families, setFamilies] = useState<NearbyFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNearby();
  }, []);

  async function loadNearby() {
    setLoading(true);
    setError(null);

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setError("Location permission needed to find nearby families.");
      setLoading(false);
      return;
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    // Save location to profile
    if (session?.user?.id) {
      await supabase
        .from("profiles")
        .update({
          location_lat: loc.coords.latitude,
          location_lng: loc.coords.longitude,
        })
        .eq("id", session.user.id);
    }

    const { data, error: rpcError } = await supabase.rpc(
      "find_nearby_families",
      {
        my_lat: loc.coords.latitude,
        my_lng: loc.coords.longitude,
        radius_miles: 5.0,
      }
    );

    if (rpcError) {
      setError("Couldn't load nearby families. Try again later.");
    } else {
      setFamilies(data ?? []);
    }
    setLoading(false);
  }

  async function handleConnect(family: NearbyFamily) {
    setConnecting(family.user_id);
    const { error } = await supabase.rpc("create_friendship", {
      friend_id: family.user_id,
    });
    if (!error) {
      setConnected((prev) => new Set([...prev, family.user_id]));
      if (session?.user?.id) triggerMatchEngine({ user_id: session.user.id });
    }
    setConnecting(null);
  }

  async function handleInvite() {
    const { data: profile } = await supabase
      .from("profiles")
      .select("invite_token")
      .eq("id", session?.user?.id)
      .single();

    const link = `https://watasu.app/invite/${profile?.invite_token ?? ""}`;
    Share.share({
      message: `Join me on Watasu! We share kids' stuff with friends nearby. ${link}`,
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.neonPurple} />
          <Text style={styles.loadingText}>Finding families nearby...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>{"\u2190"}</Text>
        </Pressable>
        <GradientText style={styles.title}>Families Nearby</GradientText>
        <View style={{ width: 24 }} />
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>{"\u{1F4CD}"}</Text>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : families.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>{"\u{1F331}"}</Text>
          <Text style={styles.emptyTitle}>No families nearby yet</Text>
          <Text style={styles.emptyText}>
            Be the first in your neighborhood! Invite friends to grow your
            circle.
          </Text>
          <Button
            variant="primary"
            title="Invite friends"
            onPress={handleInvite}
            style={styles.inviteButton}
          />
        </View>
      ) : (
        <FlatList
          data={families}
          keyExtractor={(item) => `${item.user_id}-${item.kid_name}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isConnected = connected.has(item.user_id);
            return (
              <Card style={styles.familyCard}>
                <View style={styles.familyRow}>
                  <Avatar
                    initials={item.avatar_initials ?? "??"}
                    size={44}
                  />
                  <View style={styles.familyInfo}>
                    <Text style={styles.familyName}>{item.name}</Text>
                    <Text style={styles.familyDetail}>
                      {item.kid_name} ({ageLabel(item.kid_age_months)}) {"\u2022"}{" "}
                      {item.distance_miles < 1
                        ? "< 1 mile away"
                        : `${item.distance_miles} mi away`}
                    </Text>
                  </View>
                  {isConnected ? (
                    <Text style={styles.connectedLabel}>Connected!</Text>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      title={
                        connecting === item.user_id
                          ? "..."
                          : "Connect"
                      }
                      onPress={() => handleConnect(item)}
                      disabled={connecting === item.user_id}
                    />
                  )}
                </View>
              </Card>
            );
          }}
          ListFooterComponent={
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Know someone who'd love this?
              </Text>
              <Button
                variant="secondary"
                title="Invite friends"
                onPress={handleInvite}
              />
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  back: { fontSize: 24, color: colors.text },
  title: { fontSize: 20 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.textMuted,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  inviteButton: { marginTop: 20 },
  list: { padding: 20 },
  familyCard: { marginBottom: 12 },
  familyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  familyInfo: { flex: 1, marginLeft: 12 },
  familyName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  familyDetail: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  connectedLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#34D399",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 12,
  },
  footerText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
