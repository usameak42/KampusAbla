import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import tr from "./locales/tr.json";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

const resources = {
  tr: { translation: tr },
  en: { translation: en },
  ar: { translation: ar },
};

// Get saved language or detect from browser
const getSavedLanguage = (): string => {
  const saved = localStorage.getItem("kampusabla-language");
  if (saved && ["tr", "en", "ar"].includes(saved)) {
    return saved;
  }

  // Detect from browser
  const browserLang = navigator.language.split("-")[0];
  if (["tr", "en", "ar"].includes(browserLang)) {
    return browserLang;
  }

  return "tr"; // Default to Turkish
};

i18n.use(initReactI18next).init({
  resources,
  lng: getSavedLanguage(),
  fallbackLng: "tr",
  interpolation: {
    escapeValue: false,
  },
});

// Update document direction for RTL languages
i18n.on("languageChanged", (lng) => {
  localStorage.setItem("kampusabla-language", lng);
  document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lng;
});

// Set initial direction
document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
document.documentElement.lang = i18n.language;

export default i18n;
