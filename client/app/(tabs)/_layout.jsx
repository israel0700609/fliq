import i18n from "../../languages/i18n";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import { getColors } from "../../constants";
import { useApp } from "../../hooks/AppContext";

function TabIcon({ name, color, focused, colors }) {
  return (
    <View
      style={[
        styles.iconWrapper,
        focused && { backgroundColor: colors.border },
      ]}
    >
      <Ionicons
        name={name}
        size={22}
        color={focused ? colors.primary : color}
      />
    </View>
  );
}

export default function TabLayout() {
  const { isDark } = useApp();
  const colors = getColors(isDark);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.5,
          textTransform: "uppercase",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="JoinRoom"
        options={{
          title: i18n.t("mapTabHome"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "home" : "home-outline"}
              color={color}
              focused={focused}
              colors={colors}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="WatchParty"
        options={{
          title: i18n.t("mapTabParty"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "musical-notes" : "musical-notes-outline"}
              color={color}
              focused={focused}
              colors={colors}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="AccountPage"
        options={{
          title: i18n.t("mapTabAccount"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "person" : "person-outline"}
              color={color}
              focused={focused}
              colors={colors}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Creators"
        options={{
          title: "היוצרים",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "people" : "people-outline"}
              color={color}
              focused={focused}
              colors={colors}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    width: 36,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
});
