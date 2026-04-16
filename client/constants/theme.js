import { StyleSheet } from 'react-native';
import Colors from './Colors'; // וודא שהנתיב נכון (הם באותה תיקייה)

export const getColors = (isDark) => {
  if (isDark) {
    return {
      background: Colors.background,
      text: Colors.text,
      primary: Colors.primary,
      inputBg: Colors.surface,
      border: Colors.border,
      accent: Colors.accent,
      success: Colors.success,
      error: Colors.error,
      textMuted: Colors.textMuted,
    };
  }

  // A default light theme as a fallback
  return {
    background: '#F5F5F7',
    text: '#1A1A1A',
    primary: '#6366f1',
    inputBg: '#FFFFFF',
    border: '#D1D1D6',
    accent: '#f43f5e',
    success: '#10b981',
    error: '#ef4444',
    textMuted: '#6b7280',
  };
};

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