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

## Packaging

Build all configured targets, or choose a platform:

```powershell
npm run dist
npm run dist:win
npm run dist:linux
npm run dist:clean
```

`dist:win` builds NSIS and AppX packages; `dist:linux` builds DEB and AppImage
packages. `dist:clean` removes the generated `dist` folder. AppX is intended
for Microsoft Store submission; its Store identity and publisher must match the
values assigned to the app in Partner Center. The AppX identity values in
`package.json` are initial values: replace `appx.identityName`,
`appx.applicationId`, `appx.publisherDisplayName`, and `appx.publisher` with the
values assigned to the app before submitting. Building AppX requires Windows.

The NSIS install location is set in `build/installer.nsh` using
`APP_INSTALL_DIR`. Change that value to the desired path before building if you
want to use a different location.

Linux targets should be built on Linux, or with Docker configured for
cross-platform builds.

The packaged app checks GitHub Releases for updates at
`github.com/acierto-incomodo/StormCodeEditor`, including releases with a lower
version number. Publish a release build with:

```powershell
npm run release:win
```

Publishing requires GitHub release credentials (for example, `GH_TOKEN`) and a
GitHub Release containing the generated installer and update metadata.

