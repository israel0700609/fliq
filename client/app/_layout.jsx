import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { AppProvider } from '../hooks/AppContext';
import Colors from '../constants/Colors';
import { useEffect } from 'react';

const InitialLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  
  // מוודא שעץ הניווט של Expo באמת סיים להיטען לפני שמנסים לנווט
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // עוצרים פה אם הנתונים בטעינה או אם הניווט עדיין לא מוכן
    if (loading || !rootNavigationState?.key) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // לא מחובר ומנסה להיכנס פנימה -> זרוק ללוגין
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // מחובר ומנסה להיות במסכי ההתחברות -> זרוק פנימה
      router.replace('/(tabs)/WatchParty'); // או כל מסך בית שיש לך
    }
  }, [isAuthenticated, loading, segments, rootNavigationState?.key]);

  // ❌ הסרנו את מסך הטעינה שעצר את ה-Stack!
  // ✅ מחזירים את ה-Stack באופן קבוע כדי ש-Expo Router יהיה שמח

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(auth)/register" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <AppProvider>
      <AuthProvider>
        <InitialLayout />
      </AuthProvider>
    </AppProvider>
  );
}