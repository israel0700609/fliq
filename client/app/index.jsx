import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth'; // וודא שהנתיב נכון
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { user, isLoading } = useAuth();

  // בזמן שהאפליקציה בודקת אם יש משתמש שמור ב-Storage
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // אם אין משתמש, הפנה ללוגין. אם יש, הפנה לטאבים
  return user ? <Redirect href="/(tabs)/VibeInputScreen" /> : <Redirect href="/(auth)/login" />;
}