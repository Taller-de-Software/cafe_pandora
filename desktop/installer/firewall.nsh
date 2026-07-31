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

!endif
