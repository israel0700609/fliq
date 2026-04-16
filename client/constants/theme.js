import { StyleSheet } from 'react-native';

export const getColors = (isDark) => ({
  background: isDark ? '#121212' : '#ffffff',
  text: isDark ? '#e5e7eb' : '#1f2937',
  primary: isDark ? '#818cf8' : '#5858b9',
  inputBg: isDark ? '#1e1e1e' : '#ffffff',
  border: isDark ? '#374151' : '#000000',
});

export const getLayoutStyle = (isLandscape, bg) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg,
      flexDirection: isLandscape ? 'row' : 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    },
}).container;