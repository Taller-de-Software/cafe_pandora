import type { MesaCompleta } from '@modules/pedidos/data/pos'
import styles from './MesaCard.module.css'

interface MesaCardProps {
  mesa: MesaCompleta
  onClick: (mesa: MesaCompleta) => void
}

const estadoConfig: Record<string, { label: string; className: string }> = {
  vacia:           { label: 'VACÍA',       className: 'estadoVacia' },
  ocupada:         { label: 'OCUPADA',     className: 'estadoOcupada' },
  por_pagar:       { label: 'POR PAGAR',   className: 'estadoPorPagar' },
  reservada:       { label: 'RESERVADA',   className: 'estadoReservada' },
  fuera_de_servicio: { label: 'FUERA DE SERVICIO', className: 'estadoFDS' },
}

function MesaCard({ mesa, onClick }: MesaCardProps) {
  const cfg = estadoConfig[mesa.estado] || estadoConfig.vacia

  return (
    <div className={`${styles.card} ${styles[cfg.className]}`} onClick={() => onClick(mesa)}>
      <div className={styles.header}>
        <span className={styles.nombre}>{mesa.nombre}</span>
        <span className={styles.zona}>{mesa.ubicacion}</span>
      </div>
      <div className={styles.cuerpo}>
        <span className={`${styles.badge} ${styles[cfg.className + 'Badge']}`}>{cfg.label}</span>
        <span className={styles.capacidad}>Cap. {mesa.capacidad}</span>
      </div>
      {mesa.pedidoActivo && (
        <div className={styles.pedidoInfo}>
          <span>${(mesa.pedidoActivo.total ?? 0).toLocaleString()}</span>
          <span>{mesa.pedidoActivo.detalles?.length ?? 0} prod.</span>
        </div>
      )}
    </div>
  )
}

export default MesaCard
