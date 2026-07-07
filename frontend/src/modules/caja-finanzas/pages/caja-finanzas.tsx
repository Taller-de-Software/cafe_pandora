import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@modules/auth/context/useAuth'
import { useError } from '@/context/ErrorContext'
<<<<<<< HEAD
=======
import { usePedidosSocket } from '@/hooks/usePedidosSocket'
>>>>>>> 851c78be1872df1fd6718c45d83774748d0663a5
import EstadoCaja from '../componentes/EstadoCaja'
import FormularioApertura from '../componentes/FormularioApertura'
import ListaRetiros from '../componentes/ListaRetiros'
import FormularioRetiro from '../componentes/FormularioRetiro'
import VentasPanel from '../componentes/VentasPanel'
<<<<<<< HEAD
=======
import FacturacionPanel from '../componentes/FacturacionPanel'
>>>>>>> 851c78be1872df1fd6718c45d83774748d0663a5
import ResumenCierre from '../componentes/ResumenCierre'
import { obtenerSesionActiva, apertura, cierre, listarRetiros, crearRetiro } from '../data/caja'

import styles from './caja-finanzas.module.css'

type PeriodoVentas = 'dia' | 'semana' | 'mes'

function CajaFinanzas() {
<<<<<<< HEAD
  const { user } = useAuth()
  const isAdmin = user?.rol === 'administrador'
  const [tab, setTab] = useState<'caja' | 'ventas'>('caja')
=======
  usePedidosSocket()

  const { user } = useAuth()
  const isAdmin = user?.rol === 'administrador'
  const [tab, setTab] = useState<'caja' | 'ventas' | 'facturacion'>('caja')
>>>>>>> 851c78be1872df1fd6718c45d83774748d0663a5
  const { showError } = useError()
  const queryClient = useQueryClient()

  const [periodo, setPeriodo] = useState<PeriodoVentas>('dia')
  const [showApertura, setShowApertura] = useState(false)
  const [showRetiro, setShowRetiro] = useState(false)
  const [showResumen, setShowResumen] = useState(false)

  const { data: sesion = null, isLoading: sesionCargando, isError: sesionError } = useQuery({
    queryKey: ['caja', 'activa'],
    queryFn: obtenerSesionActiva,
<<<<<<< HEAD
    enabled: isAdmin && tab === 'caja',
=======
    enabled: isAdmin && (tab === 'caja' || tab === 'facturacion'),
    refetchInterval: tab === 'caja' || tab === 'facturacion' ? 15_000 : false,
>>>>>>> 851c78be1872df1fd6718c45d83774748d0663a5
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
<<<<<<< HEAD
=======
      { id: 'facturacion', label: 'Facturación' },
>>>>>>> 851c78be1872df1fd6718c45d83774748d0663a5
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
<<<<<<< HEAD
=======
      case 'facturacion':
        return <FacturacionPanel sesion={sesion} />
>>>>>>> 851c78be1872df1fd6718c45d83774748d0663a5
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
<<<<<<< HEAD
            onClick={() => setTab(t.id as 'caja' | 'ventas')}
=======
            onClick={() => setTab(t.id as 'caja' | 'ventas' | 'facturacion')}
>>>>>>> 851c78be1872df1fd6718c45d83774748d0663a5
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
