(() => {
  const DEFAULT_LANGUAGE = "en_US";
  let translations = {};
  let currentLanguage = DEFAULT_LANGUAGE;
  let availableLanguages = [];

  function getStoredLanguage() {
    const stored = localStorage.getItem("stormcode-language");
    return stored === "en" ? DEFAULT_LANGUAGE : stored || DEFAULT_LANGUAGE;
  }

  function translate(key, values = {}) {
    let text = translations[key] || key;
    Object.keys(values).forEach((name) => {
      text = text.replaceAll(`{{${name}}}`, String(values[name]));
    });
    return text;
  }

  function applyTranslations() {
    document.documentElement.lang = currentLanguage.replace("_", "-");
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.dataset.i18n;
      if (translations[key]) element.textContent = translate(key);
    });
    document.querySelectorAll("[data-i18n-title]").forEach((element) => {
      element.title = translate(element.dataset.i18nTitle);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      element.placeholder = translate(element.dataset.i18nPlaceholder);
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
      element.setAttribute("aria-label", translate(element.dataset.i18nAriaLabel));
    });
    if (document.titleKey) document.title = translate(document.titleKey);
  }

  async function loadLanguage(language) {
    const result = await window.electronAPI.getLanguage(language);
    if (!result.ok) throw new Error(result.error);
    currentLanguage = language;
    translations = result.translations;
    applyTranslations();
    window.dispatchEvent(new Event("app-language-changed"));
  }

  async function initializeLanguage() {
    const result = await window.electronAPI.listLanguages();
    if (!result.ok) throw new Error(result.error);
    availableLanguages = result.languages;
    const selected = getStoredLanguage();
    const language = availableLanguages.some((item) => item.code === selected)
      ? selected
      : DEFAULT_LANGUAGE;
    await loadLanguage(language);
    if (language !== selected) localStorage.setItem("stormcode-language", language);
  }

  document.titleKey = document.querySelector("title")?.dataset.i18n;
  window.t = translate;
  window.getAvailableLanguages = () => availableLanguages.slice();
  window.getCurrentLanguage = () => currentLanguage;
  window.applyLanguage = async (language) => {
    await loadLanguage(language);
    localStorage.setItem("stormcode-language", language);
  };
  window.languageReady = initializeLanguage().catch((error) => {
    console.error("Could not initialize application language:", error);
    translations = {};
  });
  window.electronAPI.onLanguageChanged((language) => {
    window.applyLanguage(language).catch((error) => {
      console.error("Could not apply application language:", error);
    });
  });
})();
