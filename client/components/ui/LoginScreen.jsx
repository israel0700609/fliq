import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  StyleSheet,
} from 'react-native';

import { useApp } from '../context/AppContext';
import { getColors } from '../theme/appTheme';
import {calculateAge,validate,checkValidation} from '../../lib/utils.js'


export default function LoginScreen() {
  const { isDark, isLandscape } = useApp();
  const colors = getColors(isDark);

  const [showPassword, setShowPassword] = useState(true);

  const [values, setValues] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});



  const updateField = (name, value) => {
    const err = validate(name, value);
    setValues((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: err }));
  };

  const isFormValid = checkValidationLogin(values);

  const styles = useMemo(
    () => createStyles(colors, isLandscape),
    [colors, isLandscape]
  );


  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={styles.header}>Login</Text>

          <View style={styles.form}>
            {/* EMAIL */}
            <TextInput
              placeholder="Email"
              placeholderTextColor="#9ca3af"
              inputMode="email"
              autoCapitalize="none"
              style={[
                styles.input,
                errors.email && styles.inputError,
              ]}
              onChangeText={(v) => updateField('email', v)}
            />
            {errors.email && (
              <Text style={styles.error}>{errors.email}</Text>
            )}

            {/* PASSWORD */}
            <TextInput
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={showPassword}
              style={[
                styles.input,
                errors.password && styles.inputError,
              ]}
              onChangeText={(v) => updateField('password', v)}
            />
            {errors.password && (
              <Text style={styles.error}>{errors.password}</Text>
            )}

            {/* TOGGLE PASSWORD */}
            <Pressable onPress={() => setShowPassword((p) => !p)}>
              <Text style={styles.toggle}>
                {showPassword ? 'Show Password' : 'Hide Password'}
              </Text>
            </Pressable>

            {/* LOGIN BUTTON */}
            <Pressable
              disabled={!isFormValid}
              style={[
                styles.button,
                !isFormValid && styles.disabled,
              ]}
              onPress={() => {
                // 🔥 כאן תחבר ל-Supabase
                // signInWithPassword(values.email, values.password)
                console.log('LOGIN:', values);
              }}
            >
              <Text style={styles.buttonText}>Login</Text>
            </Pressable>
          </View>

          <StatusBar style={isDark ? 'light' : 'dark'} />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}


const createStyles = (c, landscape) =>
  StyleSheet.create({
    keyboard: { flex: 1 },

    container: {
      flex: 1,
      backgroundColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    },

    header: {
      fontSize: 30,
      fontWeight: '700',
      color: c.primary,
      marginBottom: 12,
    },

    form: {
      width: landscape ? 320 : '100%',
      gap: 10,
    },

    input: {
      backgroundColor: c.inputBg,
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 8,
      padding: 12,
      color: c.text,
    },

    inputError: {
      borderColor: 'red',
    },

    error: {
      color: 'red',
      fontSize: 12,
    },

    toggle: {
      color: c.primary,
      textAlign: 'center',
      marginVertical: 6,
    },

    button: {
      marginTop: 10,
      backgroundColor: c.primary,
      padding: 14,
      borderRadius: 10,
      alignItems: 'center',
    },

    disabled: {
      backgroundColor: '#9ca3af',
    },

    buttonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
    },
  });