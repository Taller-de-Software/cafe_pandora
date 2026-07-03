import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@modules/auth/context/useAuth'
import CocinaKanban from '@modules/pedidos/componentes/CocinaKanban'
import PagoPedido from '@modules/pedidos/componentes/PagoPedido'
import { listarPedidos } from '@modules/pedidos/data/pedidos'
import type { Pedido } from '@modules/pedidos/data/pedidos'
import { formatearNumero } from '@/utils/formatear'
import styles from './inicio.module.css'

function Inicio() {
  const { user } = useAuth()
  const [pagoPedido, setPagoPedido] = useState<Pedido | null>(null)

  const { data: hechos = [] } = useQuery({
    queryKey: ['pedidos-por-pagar-hecho'],
    queryFn: () => listarPedidos({ estado: 'hecho' }),
    refetchInterval: 15_000,
  })

  const { data: finalizados = [] } = useQuery({
    queryKey: ['pedidos-por-pagar-finalizado'],
    queryFn: () => listarPedidos({ estado: 'finalizado' }),
    refetchInterval: 15_000,
  })

  const porCobrar = useMemo(() => [...hechos, ...finalizados], [hechos, finalizados])

  return (
    <div>
      <div className={styles.welcome}>
        <h2>Bienvenido, {user?.rol ?? 'Usuario'}</h2>
        <p>Pedidos en cocina y pagos pendientes</p>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Cocina</h3>
        <CocinaKanban />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Por Cobrar</h3>
        {porCobrar.length === 0 ? (
          <p className={styles.empty}>Sin pedidos pendientes de cobro</p>
        ) : (
          <div className={styles.cobroGrid}>
            {porCobrar.map((pedido) => (
              <div key={pedido.id} className={styles.cobroCard}>
                <div className={styles.cobroHeader}>
                  <strong>{pedido.mesa.nombre}</strong>
                  <span>Turno #{pedido.turno}</span>
                  <span className={styles.estadoBadge}>{pedido.estado}</span>
                </div>
                <div className={styles.cobroTotal}>
                  ${formatearNumero(pedido.total ?? 0)}
                </div>
                <button
                  className={styles.cobrarBtn}
                  onClick={() => setPagoPedido(pedido)}
                >
                  Cobrar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {pagoPedido && (
        <PagoPedido
          pedido={pagoPedido}
          onClose={() => setPagoPedido(null)}
          onPagoExitoso={() => setPagoPedido(null)}
        />
      )}
    </div>
  )
}

export default Inicio
