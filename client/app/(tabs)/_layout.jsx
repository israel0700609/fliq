import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; 
import Colors from '../../constants/Colors';
export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      headerShown: true, 
      tabBarActiveTintColor: '#007AFF', 
    }}>
      <Tabs.Screen
        name="VibeInputScreen"
        options={{
          title: 'Vibe',
          tabBarIcon: ({ color }) => <Ionicons name="musical-notes" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="MovieSwipeScreen"
        options={{
          title: 'Swipe',
          tabBarIcon: ({ color }) => <Ionicons name="film" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="FavoritesScreen"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color }) => <Ionicons name="heart" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}