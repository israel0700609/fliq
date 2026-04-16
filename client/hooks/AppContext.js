import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(Appearance.getColorScheme());
  const [orientation, setOrientation] = useState(
    ScreenOrientation.Orientation.PORTRAIT_UP
  );

  /* 🌗 THEME */
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  /* 📱 ORIENTATION */
  useEffect(() => {
    ScreenOrientation.getOrientationAsync().then(setOrientation);

    const sub = ScreenOrientation.addOrientationChangeListener(e => {
      setOrientation(e.orientationInfo.orientation);
    });

    return () =>
      ScreenOrientation.removeOrientationChangeListener(sub);
  }, []);

  const isDark = theme === 'dark';

  const isLandscape = useMemo(() => {
    return (
      orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
      orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
    );
  }, [orientation]);

  return (
    <AppContext.Provider
      value={{ theme, isDark, orientation, isLandscape }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);