Visual Studio Build Tools 2022:
- Bibliotecas con mitigaciones de Spectre de MSVC v143 - VS 2022 C++ x64/x86 (más recientes)
- Herramientas de compilación de Node.js

Consola:
npm.cmd exec electron-rebuild -- --force --only node-pty
npm.cmd run start

si no funciona de normal:
$env:npm_config_msvs_version = "2022"
npm.cmd exec electron-rebuild -- --force --only node-pty
Remove-Item Env:npm_config_msvs_version