document.getElementById("extensionSearch").addEventListener("input", (event) => {
  const query = event.target.value.trim().toLowerCase();
  document.querySelectorAll(".extension-card").forEach((card) => {
    card.style.display = card.dataset.name.includes(query) ? "" : "none";
  });
});
