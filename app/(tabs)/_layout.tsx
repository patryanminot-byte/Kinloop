import { Tabs, useRouter } from "expo-router";
import { Text, View, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { colors } from "../../lib/colors";

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
        {icon}
      </Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function AddButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push("/add-item")}
      style={styles.addButton}
    >
      <View style={styles.addButtonInner}>
        <Text style={styles.addButtonIcon}>+</Text>
      </View>
    </Pressable>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        ),
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="⌂" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="✦" label="Shop" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          tabBarButton: () => <AddButton />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
          },
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="♡" label="Friends" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="○" label="Profile" focused={focused} />
          ),
        }}
      />
      {/* Hidden tabs — still accessible via router.push but not in tab bar */}
      <Tabs.Screen
        name="stuff"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="impact"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    borderTopWidth: 0,
    elevation: 0,
    height: 85,
    paddingTop: 8,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    minWidth: 50,
  },
  tabIcon: {
    fontSize: 22,
    color: colors.textLight,
  },
  tabIconActive: {
    color: colors.violet,
  },
  tabLabel: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: "500",
  },
  tabLabelActive: {
    color: colors.violet,
    fontWeight: "700",
  },
  // Center (+) button
  addButton: {
    alignItems: "center",
    justifyContent: "center",
    top: -8,
  },
  addButtonInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.violet,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.violet,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonIcon: {
    fontSize: 28,
    fontWeight: "300",
    color: "#FFFFFF",
    marginTop: -1,
  },
});
