import { memo } from 'react'
import styles from './EncabezadoGrupo.module.css'

interface EncabezadoGrupoProps {
  nombre: string
  total: number
}

const EncabezadoGrupo = memo(function EncabezadoGrupo({ nombre, total }: EncabezadoGrupoProps) {
  return (
    <div className={styles.header}>
      <span className={styles.nombre}>{nombre}</span>
      <span className={styles.contador}>· {total} producto(s)</span>
    </div>
  )
})

export default EncabezadoGrupo
