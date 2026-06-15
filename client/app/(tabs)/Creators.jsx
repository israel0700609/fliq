import { StyleSheet, View, Text, ScrollView, Image } from 'react-native';
import { useApp } from '../../hooks/AppContext';
import { getColors } from '../../constants/theme';
import { useMemo } from 'react';

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    contentContainer: {
      padding: 20,
      paddingBottom: 40,
    },
    header: {
      marginBottom: 30,
      alignItems: 'center',
      backgroundColor: '#0f172a',
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 12,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      fontWeight: '500',
    },
    creatorsGrid: {
      gap: 20,
      marginBottom: 30,
    },
    creatorCard: {
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      borderWidth: 1,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      marginBottom: 16,
      borderWidth: 2,
      borderColor: '#ffffff',
    },
    creatorName: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 6,
      textAlign: 'center',
    },
    role: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 12,
      textAlign: 'center',
    },
    bio: {
      fontSize: 13,
      lineHeight: 20,
      textAlign: 'center',
    },
    footer: {
      borderTopWidth: 1,
      paddingTop: 20,
      alignItems: 'center',
      marginTop: 4,
    },
    footerText: {
      fontSize: 12,
      fontWeight: '500',
    },
  });

export default function CreatorsScreen() {
  const { isDark } = useApp();
  const colors = getColors(isDark);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const creators = [
    {
      name: 'GAVRIEL FERNANDEZ',
      role: 'יוצר-שותף ומפתח מוביל',
      bio: 'בונה חוויות דיגיטליות חדשניות שמחברות אנשים דרך מוזיקה ובידור.',
      image: require('../../assets/images/gavriel.jpeg'),
    },
    {
      name: 'ISRAEL BAAL SHEM TOV CORD',
      role: 'יוצר-שותף ומוביל מוצר',
      bio: 'מתמקד ביצירת חוויית משתמש חלקה ובבניית קהילה פעילה באמצעות פיצ’רים שיתופיים.',
      image: require('../../assets/images/israel.jpeg'),
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: '#f8fafc' }]}>
          היוצרים
        </Text>
        <Text style={[styles.subtitle, { color: '#cbd5e1' }]}>
          האנשים שמאחורי FLIQ
        </Text>
      </View>

      <View style={styles.creatorsGrid}>
        {creators.map((creator, index) => (
          <View
            key={index}
            style={[
              styles.creatorCard,
              {
                backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                borderColor: isDark ? '#334155' : '#cbd5e1',
              },
            ]}
          >
            <Image source={creator.image} style={styles.avatar} />

            <Text style={[styles.creatorName, { color: colors.text }]}>
              {creator.name}
            </Text>

            <Text style={[styles.role, { color: colors.description }]}>
              {creator.role}
            </Text>

            <Text style={[styles.bio, { color: colors.text }]}>
              {creator.bio}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.footerText, { color: colors.description }]}>
          נבנה באהבה על ידי צוות FLIQ
        </Text>
      </View>
    </ScrollView>
  );
}
