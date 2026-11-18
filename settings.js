document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("languageSelect");
  select.value = localStorage.getItem("stormcode-language") || "es";
  select.addEventListener("change", () => {
    localStorage.setItem("stormcode-language", select.value);
    applyStoredLanguage();
  });
});
