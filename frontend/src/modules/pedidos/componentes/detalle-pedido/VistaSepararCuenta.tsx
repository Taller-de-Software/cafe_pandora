import styles from './VistaSepararCuenta.module.css'
import type { ProductoRow } from '@/modules/pedidos/types/tipos-comanda'

interface VistaSepararCuentaProps {
  productosActuales: ProductoRow[]
  asignaciones: Record<string, number>
  maxCuenta: number
  columnaEnUso: number | null
  onAsignarCuenta: (nombre: string, cuenta: number) => void
  onAgregarCuenta: () => void
  onVolver: () => void
  hayMovimiento: boolean
  isPending: boolean
  onConfirmar: () => void
}

export default function VistaSepararCuenta({
  productosActuales,
  asignaciones,
  maxCuenta,
  columnaEnUso,
  onAsignarCuenta,
  onAgregarCuenta,
  onVolver,
  hayMovimiento,
  isPending,
  onConfirmar,
}: VistaSepararCuentaProps) {
  return (
    <>
      <div className={styles.editPanel}>
        <div className={styles.editHeader}>
          <span className={styles.editHeaderTitle}>SEPARAR CUENTAS</span>
          <button className={styles.editVolverBtn} onClick={onVolver}>VOLVER</button>
        </div>
        <p className={styles.separarInstruccion}>
          Asigna cada producto a una cuenta presionando el número deseado. Puedes agregar más cuentas con el botón +.
        </p>
        <div className={styles.separarList}>
          {productosActuales.map((item, i) => {
            const nombre = item.nombre
            if (!nombre) return null
            const cuentaActual = asignaciones[nombre] ?? 1
            return (
              <div key={i} className={styles.separarItem}>
                <span className={styles.separarItemName}>{nombre}</span>
                <span className={styles.separarBadge}>x{item.cantidad}</span>
                <div className={styles.separarBotones}>
                  {Array.from({ length: maxCuenta }, (_, j) => j + 1).map((num) => {
                    const isDisabled = num !== 1 && columnaEnUso !== null && columnaEnUso !== num
                    return (
                      <button
                        key={num}
                        className={`${styles.separarBtn} ${cuentaActual === num ? styles.separarBtnActivo : ''} ${isDisabled ? styles.separarBtnDisabled : ''}`}
                        onClick={() => !isDisabled && onAsignarCuenta(nombre, num)}
                        disabled={isDisabled}
                      >
                        {num}
                      </button>
                    )
                  })}
                  <button className={styles.separarBtnAdd} onClick={onAgregarCuenta}>+</button>
                </div>
              </div>
            )
          })}
          {productosActuales.length === 0 && <p className={styles.emptyText}>No hay productos en el pedido</p>}
        </div>
      </div>
    </>
  )
}