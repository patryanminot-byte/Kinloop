import { Tabs } from "expo-router";
import { Text, View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { colors } from "../../lib/colors";

function TabIcon({
  icon,
  label,
  focused,
}: {
  icon: string;
  label: string;
  focused: boolean;
}) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
        {icon}
      </Text>
      <Text
        style={[styles.tabLabel, focused && styles.tabLabelActive]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
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
            <TabIcon icon={"\u2302"} label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={"\u25CB"} label="Browse" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={"\u2661"} label="Friends" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={"\u25CB"} label="Profile" focused={focused} />
          ),
        }}
      />
      {/* Hidden tabs — still accessible via router.push but not in tab bar */}
      <Tabs.Screen name="add" options={{ href: null }} />
      <Tabs.Screen name="stuff" options={{ href: null }} />
      <Tabs.Screen name="impact" options={{ href: null }} />
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
});
