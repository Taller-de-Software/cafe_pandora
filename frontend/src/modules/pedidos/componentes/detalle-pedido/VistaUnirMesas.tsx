import styles from './VistaUnirMesas.module.css'

interface VistaUnirMesasProps {
  otrasMesas: { id: number; nombre: string; ubicacion: string; estado: string }[]
  mesaSeleccionada: string | null
  onSeleccionarMesa: (nombre: string) => void
  onVolver: () => void
  mesaNombre: string
  isPending: boolean
  onConfirmar: () => void
}

export default function VistaUnirMesas({
  otrasMesas,
  mesaSeleccionada,
  onSeleccionarMesa,
  onVolver,
  mesaNombre,
  isPending,
  onConfirmar,
}: VistaUnirMesasProps) {
  return (
    <>
      <div className={styles.editPanel}>
        <div className={styles.editHeader}>
          <span className={styles.editHeaderTitle}>UNIR MESAS</span>
          <button className={styles.editVolverBtn} onClick={onVolver}>VOLVER</button>
        </div>
        <p className={styles.unirDescripcion}>
          Seleccione una mesa para fusionar su pedido con la {mesaNombre}.
        </p>
        <div className={styles.unirGrid}>
          {otrasMesas.length === 0 ? (
            <p className={styles.emptyText}>No hay otras mesas disponibles</p>
          ) : (
            otrasMesas.map((mesa) => (
              <div
                key={mesa.id}
                className={`${styles.unirCard} ${mesaSeleccionada === mesa.nombre ? styles.unirCardSel : ''}`}
                onClick={() => onSeleccionarMesa(mesa.nombre)}
              >
                <span className={styles.unirCardName}>{mesa.nombre}</span>
                <div className={styles.unirCardInfo}>
                  <span className={styles.unirCardEstado}>{mesa.ubicacion}</span>
                  <span className={styles.unirCardEstado}>{mesa.estado}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={styles.footerLeft}>
        <button className={styles.btnVolverFooter} onClick={onVolver}>VOLVER</button>
      </div>
      <button className={styles.btnConfirmar} disabled={!mesaSeleccionada || isPending} onClick={onConfirmar}>
        {isPending ? 'Fusionando...' : 'FUSIONAR MESAS'}
      </button>
    </>
  )
}