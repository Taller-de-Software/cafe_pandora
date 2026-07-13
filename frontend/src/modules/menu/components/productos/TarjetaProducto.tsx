import { useState } from 'react'
import type { Producto } from '../../api/productos'
import { formatearNumero } from '@/utils/formatear'
import styles from './TarjetaProducto.module.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'
const BASE = API_URL.replace('/api', '')

function imagenUrlCompleta(imagenUrl?: string): string | null {
  if (!imagenUrl) return null
  if (imagenUrl.startsWith('http')) return imagenUrl
  return `${BASE}/${imagenUrl.replace(/^\//, '')}`
}

interface TarjetaProductoProps {
  producto: Producto
  onEditar: (producto: Producto) => void
  onEliminar: (id: number) => void
}

function TarjetaProducto({ producto, onEditar, onEliminar }: TarjetaProductoProps) {
  const [expandido, setExpandido] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [descExpandida, setDescExpandida] = useState(false)

  const imgUrl = imagenUrlCompleta(producto.imagenUrl)

  return (
    <div className={`${styles.card} ${expandido ? styles.cardExpandido : ''}`}>
      {imgUrl && (
        <img
          className={styles.imagen}
          src={imgUrl}
          alt={producto.nombre}
        />
      )}
      {!imgUrl && (
        <div className={styles.sinImagen}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2v5a3 3 0 006 0V2" />
            <path d="M18 2v5a3 3 0 01-6 0V2" />
            <path d="M3 16h18" />
            <path d="M5 16v3a2 2 0 002 2h10a2 2 0 002-2v-3" />
          </svg>
        </div>
      )}

      <div className={styles.cuerpo}>
        <div className={styles.encabezado}>
          <h4 className={styles.nombre}>{producto.nombre}</h4>
        </div>
        <div className={styles.badges}>
          {!producto.habilitado && (
            <span className={styles.badgeInhabilitado}>INHABILITADO</span>
          )}
          <span className={producto.requierePreparacion ? styles.badgePrep : styles.badgePrepNo}>
            {producto.requierePreparacion ? 'REQ PREPARACIÓN' : 'NO REQ PREPARACIÓN'}
          </span>
        </div>

        <p
          className={`${styles.descripcion} ${!expandido || !descExpandida ? styles.descripcionCorta : ''}`}
          onClick={expandido ? () => setDescExpandida((v) => !v) : undefined}
          style={expandido ? { cursor: 'pointer' } : undefined}
        >
          {expandido && descExpandida
            ? producto.descripcion || 'Sin descripción'
            : (producto.descripcion?.length ?? 0) > 60
              ? producto.descripcion?.slice(0, 60) + '...'
              : producto.descripcion || 'Sin descripción'}
        </p>

        <div className={styles.precioRow}>
          <span className={styles.precio}>${formatearNumero(producto.precio)}</span>
          {!expandido && (
            <button
              className={styles.linkAccion}
              onClick={() => setExpandido(true)}
            >
              Ver más →
            </button>
          )}
        </div>

        {expandido && (
          <div className={styles.acciones}>
            <button
              className={styles.btnEditar}
              onClick={() => onEditar(producto)}
            >
              Editar
            </button>
            {!confirmando ? (
              <button
                className={styles.btnBorrar}
                onClick={() => setConfirmando(true)}
              >
                Borrar
              </button>
            ) : (
              <div className={styles.confirmacion}>
                <span className={styles.confirmText}>¿Eliminar?</span>
                <button
                  className={styles.btnConfirmarSi}
                  onClick={() => onEliminar(producto.id)}
                >
                  Sí
                </button>
                <button
                  className={styles.btnConfirmarNo}
                  onClick={() => setConfirmando(false)}
                >
                  No
                </button>
              </div>
            )}
            <button
              className={styles.linkOcultar}
              onClick={() => { setExpandido(false); setConfirmando(false); setDescExpandida(false) }}
            >
              Ocultar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TarjetaProducto
