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
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import { useApp } from '../context/AppContext';
import { getColors } from '../theme/appTheme';


import {calculateAge,validate,checkValidation} from '../../lib/utils.js'

export default function RegisterScreen() {
  const { isDark, isLandscape } = useApp();
  const colors = getColors(isDark);

  const [showPassword, setShowPassword] = useState(true);
  const [showDate, setShowDate] = useState(false);
  const [birthday, setBirthday] = useState(null);

  const [values, setValues] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const updateField = (name, value) => {
const err = validate(name, value);
    setValues((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: err }));
  };

  const isFormValid = checkValidation(values);


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
          <Text style={styles.header}>Register</Text>

          <View style={styles.form}>
            {renderInput('First name', 'firstname')}
            {renderInput('Last name', 'lastname')}
            {renderInput('Email (optional)', 'email')}
            {renderInput('Phone (optional)', 'phone')}
            {renderInput('Password', 'password', showPassword)}

            {/* BIRTHDAY */}
            <Pressable style={styles.input} onPress={() => setShowDate(true)}>
              <Text style={{ color: birthday ? colors.text : '#9ca3af' }}>
                {birthday
                  ? `Birthday: ${birthday.toLocaleDateString()}`
                  : 'Select date of birth'}
              </Text>
            </Pressable>

            {birthday && calculateAge(birthday) < 21 && (
              <Text style={styles.error}>
                You must be at least 21 years old
              </Text>
            )}

            <DateTimePickerModal
              isVisible={showDate}
              mode="date"
              maximumDate={new Date()}
              isDarkModeEnabled={isDark}
              onConfirm={(d) => {
                setBirthday(d);
                setShowDate(false);
              }}
              onCancel={() => setShowDate(false)}
            />

            <Pressable onPress={() => setShowPassword((p) => !p)}>
              <Text style={styles.toggle}>
                {showPassword ? 'Show Password' : 'Hide Password'}
              </Text>
            </Pressable>

            <Pressable
              disabled={!isFormValid}
              style={[
                styles.button,
                !isFormValid && styles.disabled,
              ]}
            >
              <Text style={styles.buttonText}>Create account</Text>
            </Pressable>
          </View>

          <StatusBar style={isDark ? 'light' : 'dark'} />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );


  function renderInput(label, name, secure = false) {
    return (
      <>
        <TextInput
          placeholder={label}
          placeholderTextColor="#9ca3af"
          secureTextEntry={secure}
          style={[
            styles.input,
            errors[name] && styles.inputError,
          ]}
          onChangeText={(v) => updateField(name, v)}
        />
        {errors[name] && (
          <Text style={styles.error}>{errors[name]}</Text>
        )}
      </>
    );
  }
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
      gap: 8,
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