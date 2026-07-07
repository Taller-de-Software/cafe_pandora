import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@modules/auth/context/useAuth'
import { useError } from '@/context/ErrorContext'
import { usePedidosSocket } from '@/hooks/usePedidosSocket'
import EstadoCaja from '../componentes/EstadoCaja'
import FormularioApertura from '../componentes/FormularioApertura'
import ListaRetiros from '../componentes/ListaRetiros'
import FormularioRetiro from '../componentes/FormularioRetiro'
import VentasPanel from '../componentes/VentasPanel'
import FacturacionPanel from '../componentes/FacturacionPanel'
import ResumenCierre from '../componentes/ResumenCierre'
import { obtenerSesionActiva, apertura, cierre, listarRetiros, crearRetiro } from '../data/caja'

import styles from './caja-finanzas.module.css'

type PeriodoVentas = 'dia' | 'semana' | 'mes'

function CajaFinanzas() {
  usePedidosSocket()

  const { user } = useAuth()
  const isAdmin = user?.rol === 'administrador'
  const [tab, setTab] = useState<'caja' | 'ventas' | 'facturacion'>('caja')
  const { showError } = useError()
  const queryClient = useQueryClient()

  const [periodo, setPeriodo] = useState<PeriodoVentas>('dia')
  const [showApertura, setShowApertura] = useState(false)
  const [showRetiro, setShowRetiro] = useState(false)
  const [showResumen, setShowResumen] = useState(false)

  const { data: sesion = null, isLoading: sesionCargando, isError: sesionError } = useQuery({
    queryKey: ['caja', 'activa'],
    queryFn: obtenerSesionActiva,
    enabled: isAdmin && (tab === 'caja' || tab === 'facturacion'),
    refetchInterval: tab === 'caja' || tab === 'facturacion' ? 15_000 : false,
  })

  const { data: retiros = [], isLoading: retirosCargando, isError: retirosError } = useQuery({
    queryKey: ['caja', sesion?.id, 'retiros'],
    queryFn: () => listarRetiros(sesion!.id),
    enabled: !!sesion && !sesion.cierre && tab === 'caja',
  })

  const aperturaMut = useMutation({
    mutationFn: apertura,
    onSuccess: () => {
      setShowApertura(false)
      queryClient.invalidateQueries({ queryKey: ['caja', 'activa'] })
    },
    onError: showError,
  })

  const cierreMut = useMutation({
    mutationFn: () => cierre(sesion!.id),
    onSuccess: () => {
      setShowResumen(false)
      queryClient.invalidateQueries({ queryKey: ['caja', 'activa'] })
    },
    onError: showError,
  })

  const retiroMut = useMutation({
    mutationFn: (data: { tipo: 'entrada' | 'salida'; monto: number }) =>
      crearRetiro(sesion!.id, data),
    onSuccess: () => {
      setShowRetiro(false)
      queryClient.invalidateQueries({ queryKey: ['caja', sesion?.id, 'retiros'] })
      queryClient.invalidateQueries({ queryKey: ['caja', 'activa'] })
    },
    onError: showError,
  })

  const tabs: { id: string; label: string }[] = isAdmin
    ? [
      { id: 'caja', label: 'Caja' },
      { id: 'ventas', label: 'Ventas' },
      { id: 'facturacion', label: 'Facturación' },
    ]
    : [
      { id: 'caja', label: 'Caja' },
    ]

  function renderContent() {
    switch (tab) {
      case 'caja':
        return (
          <>
            {sesionCargando && <p>Cargando sesión de caja...</p>}
            {sesionError && <p>Error al cargar sesión de caja</p>}
            {!sesionCargando && !sesionError && (
              <EstadoCaja
                sesion={sesion}
                onCierre={() => setShowResumen(true)}
                onShowApertura={() => setShowApertura(true)}
              />
            )}

            {sesion && !sesion.cierre && (
              <>
                {retirosCargando && <p>Cargando movimientos...</p>}
                {retirosError && <p>Error al cargar movimientos</p>}
                {!retirosCargando && !retirosError && (
                  <ListaRetiros retiros={retiros} onAdd={() => setShowRetiro(true)} />
                )}
              </>
            )}

            {showResumen && sesion && (
              <ResumenCierre
                sesionId={sesion.id}
                onCerrar={() => cierreMut.mutate()}
                onCancelar={() => setShowResumen(false)}
              />
            )}

            {showApertura && (
              <FormularioApertura
                onSave={async (base) => { await aperturaMut.mutateAsync(base) }}
                onCancel={() => setShowApertura(false)}
              />
            )}
            {showRetiro && sesion && (
              <FormularioRetiro
                onSave={async (data) => { await retiroMut.mutateAsync(data) }}
                onCancel={() => setShowRetiro(false)}
              />
            )}
          </>
        )
      case 'ventas':
        return (
          <>
            <div className={styles.subtabs}>
              <button
                className={`${styles.subtab} ${periodo === 'dia' ? styles.subtabActive : ''}`}
                onClick={() => setPeriodo('dia')}
              >
                Ventas del Día
              </button>
              <button
                className={`${styles.subtab} ${periodo === 'semana' ? styles.subtabActive : ''}`}
                onClick={() => setPeriodo('semana')}
              >
                Ventas Semanales
              </button>
              <button
                className={`${styles.subtab} ${periodo === 'mes' ? styles.subtabActive : ''}`}
                onClick={() => setPeriodo('mes')}
              >
                Ventas Mensuales
              </button>
            </div>
            <VentasPanel periodo={periodo} />
          </>
        )
      case 'facturacion':
        return <FacturacionPanel sesion={sesion} />
      default:
        return null
    }
  }

  return (
    <div className={styles.layout}>
      <div className={styles.tabs}>
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
            onClick={() => setTab(t.id as 'caja' | 'ventas' | 'facturacion')}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {renderContent()}
      </div>
    </div>
  )
}

export default CajaFinanzas
