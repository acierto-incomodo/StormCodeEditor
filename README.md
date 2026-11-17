# Storm Code Editor

Minimal Electron-based code editor using the Monaco editor (via CDN).

Quick start (Windows PowerShell):

```powershell
cd "d:/Editor-code/electron-code-editor"
npm install
npm start
```

Features in this scaffold:
- Monaco editor loaded from CDN
- New / Open / Save / Save As via native dialogs
- Preload + contextBridge for safe IPC

## Windows packaging and updates

Build the NSIS installer with:

```powershell
npm run build
```

The install location is set in `build/installer.nsh` using `APP_INSTALL_DIR`.
Change that value to the desired path before building if you want to use a
different location.

The packaged app checks GitHub Releases for updates at
`github.com/acierto-incomodo/StormCodeEditor`, including releases with a lower
version number. Publish a release build with:

```powershell
npm run release:win
```

Publishing requires GitHub release credentials (for example, `GH_TOKEN`) and a
GitHub Release containing the generated installer and update metadata.

