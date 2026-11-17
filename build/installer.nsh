!define APP_INSTALL_DIR "$APPDATA\StormGamesStudios\Programs\StormCodeEditor"

!macro customInit
  StrCpy $INSTDIR "${APP_INSTALL_DIR}"
!macroend
