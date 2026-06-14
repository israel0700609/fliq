import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useApp } from '../../hooks/AppContext';
import { getColors } from '../../constants/theme';
import { useMemo } from 'react';

export default function CreatorsScreen() {
  const { isDark } = useApp();
  const colors = getColors(isDark);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const creators = [
    {
      name: 'GAVRIEL FERNANDEZ',
      role: 'Co-Creator & Lead Developer',
      bio: 'Passionate about building innovative applications that bring people together through music and entertainment.',
      initials: 'GF',
    },
    {
      name: 'ISRAEL BAAL SHEM TOV CORD',
      role: 'Co-Creator & Product Lead',
      bio: 'Dedicated to creating seamless user experiences and fostering community engagement through collaborative features.',
      initials: 'IB',
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Meet the Creators
        </Text>
        <Text style={[styles.subtitle, { color: colors.description }]}>
          The brilliant minds behind FLIQ
        </Text>
      </View>

      <View style={styles.creatorsGrid}>
        {creators.map((creator, index) => (
          <View
            key={index}
            style={[
              styles.creatorCard,
              {
                backgroundColor: isDark ? colors.surface : '#f5f5f5',
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: colors.tint,
                },
              ]}
            >
              <Text style={styles.avatarText}>{creator.initials}</Text>
            </View>

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
          Built with ❤️ by the FLIQ team
        </Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors) =>yles = (colors) => StyleSheet.create({
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
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
