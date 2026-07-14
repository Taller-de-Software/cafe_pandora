import styles from './VistaCambiarMesa.module.css'

interface VistaCambiarMesaProps {
  mesasDisponibles: { id: number; nombre: string; ubicacion: string; estado: string }[]
  mesaSeleccionada: string | null
  onSeleccionarMesa: (nombre: string) => void
  onVolver: () => void
  mesaNombre: string
  isPending: boolean
  onConfirmar: () => void
}

export default function VistaCambiarMesa({
  mesasDisponibles,
  mesaSeleccionada,
  onSeleccionarMesa,
  onVolver,
  mesaNombre,
  isPending,
  onConfirmar,
}: VistaCambiarMesaProps) {
  const mesasValidas = mesasDisponibles.filter((m) => m.nombre !== mesaNombre && m.estado !== 'fuera_de_servicio')

  return (
    <>
      <div className={styles.editPanel}>
        <div className={styles.editHeader}>
          <span className={styles.editHeaderTitle}>CAMBIAR MESA</span>
          <button className={styles.editVolverBtn} onClick={onVolver}>VOLVER</button>
        </div>
        <p className={styles.unirDescripcion}>
          Seleccione la mesa a la que desea reasignar este pedido.
        </p>
        <div className={styles.unirGrid}>
          {mesasValidas.length === 0 ? (
            <p className={styles.emptyText}>No hay mesas libres disponibles</p>
          ) : (
            mesasValidas.map((mesa) => (
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
        {isPending ? 'Cambiando...' : 'CAMBIAR MESA'}
      </button>
    </>
  )
}