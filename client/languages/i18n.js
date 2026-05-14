import { getLocales } from "expo-localization";
import { I18n } from "i18n-js";
import en from "./en.json";
import he from "./he.json";

const translations = {
  en,
  he,
  iw: he,
};

const i18n = new I18n(translations);

const locales = getLocales();
i18n.locale = locales.length > 0 ? locales[0].languageCode : "en";

i18n.enableFallback = true;
i18n.defaultLocale = "en";

export default i18n;
