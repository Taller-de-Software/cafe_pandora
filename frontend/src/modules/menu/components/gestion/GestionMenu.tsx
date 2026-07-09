import { useState } from 'react'
import type { Categoria } from '../../api/categorias'
import type { Subcategoria } from '../../api/subcategorias'
import FormularioCategoria from '../categorias/FormularioCategoria'
import FormularioSubcategoria from '../subcategorias/FormularioSubcategoria'
import FormularioProducto from '../productos/FormularioProducto'
import styles from './GestionMenu.module.css'

type Vista = 'menu' | 'categorias' | 'subcategorias' | 'producto'

interface GestionMenuProps {
  categorias: Categoria[]
  subcategorias: Subcategoria[]
  subcategoriasCargando?: boolean
  onCrearCat: (nombre: string) => Promise<void>
  onActualizarCat: (id: number, nombre: string) => Promise<void>
  onEliminarCat: (id: number) => Promise<void>
  onCrearSub: (nombre: string, categoriaId: number) => Promise<void>
  onActualizarSub: (id: number, nombre: string) => Promise<void>
  onEliminarSub: (id: number) => Promise<void>
  onCambiarCatSub: (id: number, categoriaId: number) => Promise<void>
  onCrearProd: (formData: FormData) => Promise<void>
  onCerrar: () => void
}

function GestionMenu({
  categorias,
  subcategorias,
  subcategoriasCargando,
  onCrearCat,
  onActualizarCat,
  onEliminarCat,
  onCrearSub,
  onActualizarSub,
  onEliminarSub,
  onCambiarCatSub,
  onCrearProd,
  onCerrar,
}: GestionMenuProps) {
  const [vista, setVista] = useState<Vista>('menu')

  return (
    <div className={styles.overlay} onClick={onCerrar}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          {vista !== 'menu' && (
            <button className={styles.btnVolver} onClick={() => setVista('menu')}>
              ← Volver
            </button>
          )}
          <h3>Gestión del Menú</h3>
          <button className={styles.btnCerrar} onClick={onCerrar}>&times;</button>
        </div>

        <div className={styles.contenido}>
          {vista === 'menu' && (
            <div className={styles.opciones}>
              <div className={styles.opcionCard} onClick={() => setVista('categorias')}>
                <div className={styles.icono}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                </div>
                <div className={styles.texto}>
                  <h4>Editar Categorías</h4>
                  <p>Crear, renombrar o eliminar categorías</p>
                </div>
              </div>

              <div className={styles.opcionCard} onClick={() => setVista('subcategorias')}>
                <div className={styles.icono}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </div>
                <div className={styles.texto}>
                  <h4>Editar Subcategorías</h4>
                  <p>Crear, renombrar, mover o eliminar subcategorías</p>
                </div>
              </div>

              <div className={styles.opcionCard} onClick={() => setVista('producto')}>
                <div className={styles.icono}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                </div>
                <div className={styles.texto}>
                  <h4>Agregar Producto</h4>
                  <p>Añadir un nuevo producto al menú</p>
                </div>
              </div>
            </div>
          )}

          {vista === 'categorias' && (
            <FormularioCategoria
              embedded
              categorias={categorias}
              onCrear={onCrearCat}
              onActualizar={onActualizarCat}
              onEliminar={onEliminarCat}
              onCerrar={() => setVista('menu')}
            />
          )}

          {vista === 'subcategorias' && (
            <FormularioSubcategoria
              embedded
              subcategorias={subcategorias}
              categorias={categorias}
              onCrear={onCrearSub}
              onActualizar={onActualizarSub}
              onEliminar={onEliminarSub}
              onCambiarCategoria={onCambiarCatSub}
              onCerrar={() => setVista('menu')}
            />
          )}

          {vista === 'producto' && (
            <FormularioProducto
              embedded
              categorias={categorias}
              subcategorias={subcategorias}
              subcategoriasCargando={subcategoriasCargando}
              onGuardar={async (formData) => {
                await onCrearProd(formData)
                onCerrar()
              }}
              onCerrar={() => setVista('menu')}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default GestionMenu
