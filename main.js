const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const log = require("electron-log");
const { autoUpdater } = require("electron-updater");
let pty = null;
try {
  pty = require("node-pty");
} catch (e1) {
  try {
    pty = require("node-pty-prebuilt-multiarch");
  } catch (e2) {
    // Don't throw — we'll fall back to a child_process-based terminal later.
    pty = null;
    console.info("node-pty not available, terminal will use fallback child_process.");
  }
}
const ptyAvailable = !!pty;
console.log("MAIN PROCESS STARTED");

let mainWindow = null;
let updateStatus = { state: "idle" };

function publishUpdateStatus(status) {
  updateStatus = status;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("updates:status", updateStatus);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true,
    },
  });

  mainWindow.loadFile("index.html");
}

ipcMain.handle("updates:get-status", () => updateStatus);
ipcMain.handle("updates:install", () => {
  if (!app.isPackaged || updateStatus.state !== "downloaded") {
    return { ok: false, error: "No downloaded update is ready to install." };
  }
  autoUpdater.quitAndInstall();
  return { ok: true };
});

ipcMain.handle("browser:open-window", async (_event, url) => {
  if (typeof url === "string" && /^https?:\/\//i.test(url)) {
    await shell.openExternal(url);
    return { ok: true };
  }
  return { ok: false, error: "Invalid external URL." };
});

ipcMain.handle("app:get-info", () => ({
  name: app.getName() || "StormCodeEditor IDE",
  version: app.getVersion(),
  author: "StormGamesStudios",
}));

ipcMain.handle("app:open-page", (_event, page) => {
  const allowedPages = ["settings.html", "info.html", "marketplace.html"];
  if (!allowedPages.includes(page)) {
    return { ok: false, error: "Page not allowed." };
  }

  const pageWindow = new BrowserWindow({
    width: 780,
    height: 620,
    minWidth: 620,
    minHeight: 500,
    parent: mainWindow,
    modal: false,
    autoHideMenuBar: true,
    title: page.replace(".html", ""),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  pageWindow.loadFile(page);
  return { ok: true };
});

app.whenReady().then(() => {
  createWindow();

  if (app.isPackaged) {
    autoUpdater.logger = log;
    autoUpdater.allowDowngrade = true;
    autoUpdater.on("checking-for-update", () => {
      publishUpdateStatus({ state: "checking" });
    });
    autoUpdater.on("update-available", (info) => {
      publishUpdateStatus({
        state: "downloading",
        version: info.version,
        percent: 0,
      });
    });
    autoUpdater.on("update-not-available", () => {
      publishUpdateStatus({ state: "idle" });
    });
    autoUpdater.on("download-progress", (progress) => {
      publishUpdateStatus({
        state: "downloading",
        version: updateStatus.version,
        percent: progress.percent,
        transferred: progress.transferred,
        total: progress.total,
        bytesPerSecond: progress.bytesPerSecond,
      });
    });
    autoUpdater.on("update-downloaded", (info) => {
      publishUpdateStatus({
        state: "downloaded",
        version: info.version,
        percent: 100,
      });
    });
    autoUpdater.on("error", (error) => {
      log.error("Error while checking for or installing updates:", error);
      publishUpdateStatus({
        state: "error",
        version: updateStatus.version,
        percent: updateStatus.percent || 0,
        message: error.message,
      });
    });
    autoUpdater.checkForUpdatesAndNotify().catch((error) => {
      log.error("Could not check for updates:", error);
    });
  }

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

ipcMain.handle("dialog:openFile", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
  });
  if (canceled) return { canceled: true };
  const filePath = filePaths[0];
  const content = fs.readFileSync(filePath, "utf8");
  return { canceled: false, filePath, content };
});

ipcMain.handle("dialog:openFolder", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (canceled) return { canceled: true };
  const folder = filePaths[0];

  function walk(dir, base) {
    const entries = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const it of items) {
      const full = path.join(dir, it.name);
      const rel = path.relative(base, full);
      if (it.isDirectory()) {
        entries.push({ path: full, name: it.name, isDirectory: true });
        // non-recursive by default to avoid huge trees; include immediate children
        const children = fs.readdirSync(full, { withFileTypes: true });
        for (const c of children) {
          const cfull = path.join(full, c.name);
          entries.push({
            path: cfull,
            name: path.join(it.name, c.name),
            isDirectory: c.isDirectory(),
          });
        }
      } else {
        entries.push({ path: full, name: rel, isDirectory: false });
      }
    }
    return entries;
  }

  const entries = walk(folder, folder);
  return { canceled: false, folder, entries };
});

ipcMain.handle("file:read", async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return { ok: true, content };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});

ipcMain.handle("file:write", async (event, { filePath, content }) => {
  try {
    fs.writeFileSync(filePath, content, "utf8");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});

ipcMain.handle("dir:read", async (event, dirPath) => {
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    const entries = items.map((it) => ({
      name: it.name,
      path: path.join(dirPath, it.name),
      isDirectory: it.isDirectory(),
    }));
    // sort: directories first then files, alphabetically
    entries.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    return { ok: true, entries };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});

// Terminal (PTY) management
const terminals = new Map();

ipcMain.handle("terminal:create", async (event, { cols = 80, rows = 24, shell, cwd } = {}) => {
  const shellCmd =
    shell ||
    (process.platform === "win32" ? "powershell.exe" : process.env.SHELL || "bash");
  const terminalCwd =
    typeof cwd === "string" && fs.existsSync(cwd) && fs.statSync(cwd).isDirectory()
      ? cwd
      : process.cwd();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  if (pty) {
    const term = pty.spawn(shellCmd, [], {
      name: "xterm-color",
      cols,
      rows,
      cwd: terminalCwd,
      env: process.env,
    });
    terminals.set(id, term);

    term.on("data", (data) => {
      try {
        event.sender.send("terminal:data", { id, data });
      } catch (e) { }
    });
    term.on("exit", (exitCode, signal) => {
      try {
        event.sender.send("terminal:exit", { id, exitCode, signal });
      } catch (e) { }
      terminals.delete(id);
    });
    return { ok: true, id, pty: true };
  }

  // Fallback when pty is not available: spawn a child process and pipe stdio (less featureful)
  try {
    const cp = require("child_process");
    const child = cp.spawn(shellCmd, [], {
      cwd: terminalCwd,
      env: process.env,
      shell: true,
    });
    // provide a minimal terminal-like wrapper
    const wrapper = {
      write: (d) => {
        try {
          child.stdin.write(d);
        } catch (e) { }
      },
      resize: (c, r) => {
        /* noop - no PTY */
      },
      kill: () => {
        try {
          child.kill();
        } catch (e) { }
      },
    };
    terminals.set(id, wrapper);

    child.stdout.on("data", (chunk) => {
      try {
        event.sender.send("terminal:data", { id, data: String(chunk) });
      } catch (e) { }
    });
    child.stderr.on("data", (chunk) => {
      try {
        event.sender.send("terminal:data", { id, data: String(chunk) });
      } catch (e) { }
    });
    child.on("close", (code) => {
      try {
        event.sender.send("terminal:exit", { id, exitCode: code });
      } catch (e) { }
      terminals.delete(id);
    });

    return { ok: true, id, pty: false, fallback: true };
  } catch (err) {
    return { ok: false, error: "PTY not available and fallback failed: " + String(err) };
  }
});

ipcMain.handle("terminal:write", (event, { id, data }) => {
  const t = terminals.get(id);
  if (!t) return { ok: false, error: "no such terminal" };
  t.write(data);
  return { ok: true };
});

ipcMain.handle("terminal:resize", (event, { id, cols, rows }) => {
  const t = terminals.get(id);
  if (!t) return { ok: false, error: "no such terminal" };
  t.resize(cols, rows);
  return { ok: true };
});

ipcMain.handle("terminal:kill", (event, id) => {
  const t = terminals.get(id);
  if (!t) return { ok: false, error: "no such terminal" };
  try {
    t.kill();
  } catch (e) { }
  terminals.delete(id);
  return { ok: true };
});

ipcMain.handle("dialog:saveFile", async (event, { filePath, content }) => {
  let target = filePath;
  if (!target) {
    const { canceled, filePath: savePath } = await dialog.showSaveDialog({});
    if (canceled) return { canceled: true };
    target = savePath;
  }
  fs.writeFileSync(target, content, "utf8");
  return { canceled: false, filePath: target };
});

ipcMain.handle("dialog:saveAs", async (event, content) => {
  const { canceled, filePath } = await dialog.showSaveDialog({});
  if (canceled) return { canceled: true };
  fs.writeFileSync(filePath, content, "utf8");
  return { canceled: false, filePath };
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
