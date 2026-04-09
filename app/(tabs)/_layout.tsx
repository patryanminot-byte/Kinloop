import { Tabs } from "expo-router";
import { Text, View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { colors } from "../../lib/colors";

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
        {icon}
      </Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
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
        name="stuff"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="◎" label="Stuff" focused={focused} />
          ),
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
            <TabIcon icon="○" label="You" focused={focused} />
          ),
        }}
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
  },
  tabIcon: {
    fontSize: 22,
    color: colors.textLight,
  },
  tabIconActive: {
    color: colors.neonPurple,
  },
  tabLabel: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: "500",
  },
  tabLabelActive: {
    color: colors.neonPurple,
    fontWeight: "700",
  },
});
