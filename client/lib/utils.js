import i18n from "../languages/i18n";

const REGEX = {
  EMAIL: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  PHONE: /^[0-9]{10}$/,
  NAME: /^[a-zA-Z0-9]+$/,
};

export const calculateAge = (dob) => {
  if (!dob) return 0;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
};

export const validate = (name, value) => {
  if (!value) return "";
  switch (name) {
    case "email":
      return REGEX.EMAIL.test(value) ? "" : i18n.t("invalidEmail");
    case "phone":
      return REGEX.PHONE.test(value) ? "" : i18n.t("invalidPhone");
    case "lastname":
    case "lastName":
      return REGEX.NAME.test(value) ? "" : i18n.t("invalidLastName");
    case "firstname":
      return value.trim().length >= 2 ? "" : i18n.t("invalidFirstName");
    case "password":
      return value.length >= 8 ? "" : i18n.t("invalidPassword");
    default:
      return "";
  }
};

export const checkValidation = (values, errors, birthday) => {
  return (
    values.firstname.length >= 2 &&
    REGEX.NAME.test(values.lastname) &&
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

export const checkValidationUpdate = (values, errors) => {
  const hasValues =
    values.firstname.trim().length >= 2 && REGEX.NAME.test(values.lastname);
  const hasNoErrors = !errors.firstname && !errors.lastname && !errors.phone;
  return hasValues && hasNoErrors;
};

export const generateCode = (length = 6) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
};

export const getBase64Image = (imageFile) => {
  return new Promise((resolve, reject) => {
    if (!imageFile) {
      reject(new Error("No file provided"));
      return;
    }

    if (imageFile.type !== "image/jpeg") {
      reject(new Error("Image must be a JPEG format"));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const fullBase64 = reader.result;

      const cleanBase64 = fullBase64.split(",")[1];

      resolve(cleanBase64);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(imageFile);
  });
};
