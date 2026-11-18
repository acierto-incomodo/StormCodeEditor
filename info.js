window.electronAPI.getAppInfo().then((info) => {
  if (!info) return;
  document.getElementById("appVersion").textContent = info.version;
  document.getElementById("appName").textContent = info.name;
});
