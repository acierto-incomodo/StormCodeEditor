!define APP_INSTALL_DIR "$LOCALAPPDATA\Programs\StormCodeEditor"

!macro customInit
  StrCpy $INSTDIR "${APP_INSTALL_DIR}"
!macroend
