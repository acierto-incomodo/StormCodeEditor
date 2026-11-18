const translations = {
  es: {
    settingsTitle: "Ajustes",
    settingsSubtitle: "Personaliza StormCodeEditor",
    language: "Idioma",
    languageDescription: "Idioma de la interfaz",
  },
  en: {
    settingsTitle: "Settings",
    settingsSubtitle: "Customize StormCodeEditor",
    language: "Language",
    languageDescription: "Interface language",
  },
};

function getLanguage() {
  return localStorage.getItem("stormcode-language") || "es";
}

function applyStoredLanguage() {
  const language = getLanguage();
  document.documentElement.lang = language;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (translations[language] && translations[language][key]) {
      element.textContent = translations[language][key];
    }
  });
}

document.addEventListener("DOMContentLoaded", applyStoredLanguage);
