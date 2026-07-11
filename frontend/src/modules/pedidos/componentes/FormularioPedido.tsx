import { useState, useEffect, type FormEvent } from 'react'
import { useError } from '@/context/ErrorContext'
import type { Mesa } from '../data/pedidos'
import { listarMesas, listarProductos, crearPedido } from '../data/pedidos'
import { formatearNumero } from '@/utils/formatear'
import styles from './FormularioPedido.module.css'

interface FormularioPedidoProps {
  onSave: () => void
  onCancel: () => void
}

interface ItemForm {
  productoId: number
  cantidad: number
  notas: string
}

function FormularioPedido({ onSave, onCancel }: FormularioPedidoProps) {
  const { showError } = useError()
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [productos, setProductos] = useState<{ id: number; nombre: string; precio: number }[]>([])
  const [mesaId, setMesaId] = useState<number | ''>('')
  const [turno, setTurno] = useState(1)
  const [items, setItems] = useState<ItemForm[]>([{ productoId: 0, cantidad: 1, notas: '' }])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    listarMesas().then(setMesas).catch(showError)
    listarProductos().then(setProductos).catch(showError)
  }, [showError])

  function addItem() {
    setItems([...items, { productoId: 0, cantidad: 1, notas: '' }])
  }

  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i))
  }

  function updateItem(i: number, field: keyof ItemForm, value: unknown) {
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!mesaId || items.some((i) => !i.productoId)) return
    setSaving(true)
    try {
      await crearPedido({
        mesaId: Number(mesaId),
        turno,
        items: items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad, notas: i.notas || undefined })),
      })
      onSave()
    } catch (err) {
      showError(err)
    } finally { setSaving(false) }
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Nuevo Pedido</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Mesa</label>
            <select className={styles.select} value={mesaId} onChange={(e) => setMesaId(Number(e.target.value) || '')}>
              <option value="">Seleccionar mesa</option>
              {mesas.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label>Turno</label>
            <input className={styles.select} type="text" inputMode="numeric" value={turno} onChange={(e) => setTurno(Math.max(1, parseInt(e.target.value.replace(/\D/g, ''), 10) || 1))} maxLength={2} />
          </div>

          <div className={styles.itemsHeader}>
            <h4>Productos</h4>
            <button type="button" className={styles.addItemBtn} onClick={addItem}>+ Agregar</button>
          </div>

          {items.map((item, i) => (
            <div key={i} className={styles.itemRow}>
              <select value={item.productoId} onChange={(e) => updateItem(i, 'productoId', Number(e.target.value))}>
                <option value={0}>Seleccionar</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre} (${formatearNumero(p.precio)})</option>
                ))}
              </select>
              <input
                type="text"
                inputMode="numeric"
                maxLength={3}
                value={item.cantidad}
                onChange={(e) => updateItem(i, 'cantidad', Math.max(1, parseInt(e.target.value.replace(/\D/g, ''), 10) || 1))}
              />
              <button type="button" className={styles.removeBtn} onClick={() => removeItem(i)}>X</button>
            </div>
          ))}

          {items.length === 0 && <p className={styles.emptyItems}>Agrega al menos un producto</p>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onCancel}>Cancelar</button>
            <button type="submit" className={styles.saveBtn} disabled={saving || !mesaId || items.some((i) => !i.productoId)}>
              {saving ? 'Creando...' : 'Crear Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FormularioPedido
