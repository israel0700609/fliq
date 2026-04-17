const REGEX = {
  EMAIL: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  PHONE: /^[0-9]{10}$/,
  LAST_NAME: /^[a-zA-Z0-9]+$/,
};

export const calculateAge = (dob) => {
  if (!dob) return 0;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

export const validate = (name, value) => {
  if (!value) return '';
  switch (name) {
    case 'email':
      return REGEX.EMAIL.test(value) ? '' : 'כתובת אימייל לא תקינה';
    case 'phone':
      return REGEX.PHONE.test(value) ? '' : 'מספר טלפון לא תקין';
    case 'lastName':
        return REGEX.LAST_NAME.test(value) ? '' : 'שם משפחה לא תקין';
    default:
      return '';
  }
};

export const checkValidation = (values, errors, birthday) => {
  return (
    values.firstname.length >= 2 &&
    REGEX.LAST_NAME.test(values.lastname) &&
    REGEX.EMAIL.test(values.email) &&
    REGEX.PHONE.test(values.phone) &&
    values.password.length >= 8 &&
    birthday &&
    calculateAge(birthday) >= 21 &&
    Object.values(errors).every((e) => !e)
  );
};

export const checkValidationLogin = (values, errors) => {
  const hasValues = values.email.length > 0 && values.password.length > 0;
  const hasNoErrors = !errors.email && !errors.password;
  
  return hasValues && hasNoErrors && REGEX.EMAIL.test(values.email);
};

