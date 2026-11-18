document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("languageSelect");
  const folderButton = document.getElementById("openLanguagesFolderBtn");

  window.languageReady.then(() => {
    const languages = window.getAvailableLanguages();
    select.replaceChildren(...languages.map(({ code, name }) => {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = name;
      return option;
    }));
    select.value = window.getCurrentLanguage();
    select.disabled = false;
  });

  select.addEventListener("change", async () => {
    try {
      await window.applyLanguage(select.value);
      const result = await window.electronAPI.setLanguage(select.value);
      if (!result.ok) throw new Error(result.error);
    } catch (error) {
      console.error("Could not change application language:", error);
      select.value = window.getCurrentLanguage();
    }
  });

  folderButton.addEventListener("click", async () => {
    const result = await window.electronAPI.openLanguagesFolder();
    if (!result.ok) console.error("Could not open languages folder:", result.error);
  });
});
