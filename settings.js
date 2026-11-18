document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("languageSelect");
  select.value = "en";
  localStorage.setItem("stormcode-language", "en");
});
