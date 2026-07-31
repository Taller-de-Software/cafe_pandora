; Cafe Pandora - regla de firewall para el puerto del servidor local.
; Se requiere elevacion (perMachine) para que netsh funcione en la instalacion.

!ifndef CAFE_PANDORA_FIREWALL_NSH
!define CAFE_PANDORA_FIREWALL_NSH

!define FIREWALL_RULE_NAME "Cafe Pandora POS (puerto 3001)"

!macro customInstall
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="${FIREWALL_RULE_NAME}" dir=in action=allow protocol=TCP localport=3001 profile=any'
  Pop $0
  ${if} $0 != 0
    DetailPrint "No se pudo crear la regla de firewall (posiblemente faltan permisos). El POS seguira funcionando en la red local tras el primer prompt de Windows."
  ${endif}
!macroend

!macro customUnInstall
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="${FIREWALL_RULE_NAME}"'
  Pop $0
!macroend

; Deteccion/cierre de instancia activa de Cafe Pandora sin PowerShell.
; electron-builder usa por defecto powershell.exe (Get-CimInstance) para
; comprobar si la aplicacion esta en ejecucion durante install/update/uninstall.
; Wine implementa powershell.exe como un stub que siempre sale con codigo 0,
; por lo que el instalador creia falsamente que habia una instancia activa.
; Este hook reemplaza esa logica por el fallback nativo de electron-builder
; (tasklist | findstr + taskkill), que funciona en Windows real y bajo Wine.
; NOTA: se omite el filtro "/FI IMAGENAME eq ..." de la plantilla porque el
; tasklist de Wine no lo aplica cuando el nombre del ejecutable contiene
; espacios ("Cafe Pandora.exe") y la deteccion fallaria en pruebas con Wine.

!macro customCheckAppRunning
  !ifdef INSTALL_MODE_PER_ALL_USERS
    nsExec::Exec `"$SYSDIR\cmd.exe" /C tasklist /FO CSV /NH | "$SYSDIR\findstr.exe" /B /I /C:"\"${APP_EXECUTABLE_FILENAME}\""`
  !else
    nsExec::Exec `"$SYSDIR\cmd.exe" /C tasklist /FI "USERNAME eq %USERNAME%" /FO CSV /NH | "$SYSDIR\findstr.exe" /B /I /C:"\"${APP_EXECUTABLE_FILENAME}\""`
  !endif
  Pop $R0

  ${if} $R0 == 0
    ${if} ${isUpdated}
      Sleep 1000
    ${else}
      MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION "$(appRunning)" /SD IDOK IDOK doStopProcess
      Quit
      doStopProcess:
    ${endIf}
    DetailPrint "$(appClosing)"
    !ifdef INSTALL_MODE_PER_ALL_USERS
      nsExec::Exec `taskkill /F /IM "${APP_EXECUTABLE_FILENAME}"`
    !else
      nsExec::Exec `"$SYSDIR\cmd.exe" /C taskkill /F /IM "${APP_EXECUTABLE_FILENAME}" /FI "USERNAME eq %USERNAME%"`
    !endif
    Pop $0
    Sleep 300
  ${endIf}
!macroend

!endif
