import { Stack } from 'expo-router';
import { AuthProvider } from '../hooks/useAuth';
import { AppProvider } from '../hooks/AppContext';
import Colors from '../constants/Colors';
export default function RootLayout() {
  return (
    <AppProvider>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
          }}
        >
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(auth)/register" />
          <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
        </Stack>
      </AuthProvider>
    </AppProvider>
  );
}