import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '@modules/auth/context/useAuth'
import { useError } from '@/context/ErrorContext'
import { usePedidosSocket } from '@/hooks/usePedidosSocket'
import {
  DollarSign,
  Wallet,
  Clock,
  TrendingDown,
  CircleDot,
} from 'lucide-react'
import EstadoCaja from '../componentes/EstadoCaja'
import FormularioApertura from '../componentes/FormularioApertura'
import ListaMovimientos from '../componentes/ListaMovimientos'
import FormularioRetiro from '../componentes/FormularioRetiro'
import FacturaDetalle from '../componentes/FacturaDetalle'
import VentasPanel from '../componentes/VentasPanel'
import FacturacionPanel from '../componentes/FacturacionPanel'
import ResumenCierre from '../componentes/ResumenCierre'
import { obtenerSesionActiva, apertura, cierre, listarRetiros, crearRetiro, obtenerResumenCaja } from '../data/caja'
import type { ResumenFactura } from '../data/caja'
import { formatearNumero } from '@/utils/formatear'

import styles from './caja-finanzas.module.css'

type PeriodoVentas = 'dia' | 'semana' | 'mes'

function CajaFinanzas() {
  usePedidosSocket()

  const { user } = useAuth()
  const isAdmin = user?.rol === 'administrador'
  const [tab, setTab] = useState<'caja' | 'ventas' | 'facturacion'>('caja')
  const { showError, showSuccess } = useError()
  const queryClient = useQueryClient()

  const [periodo, setPeriodo] = useState<PeriodoVentas>('dia')
  const [showApertura, setShowApertura] = useState(false)
  const [showRetiro, setShowRetiro] = useState(false)
  const [showResumen, setShowResumen] = useState(false)
  const [selectedFactura, setSelectedFactura] = useState<ResumenFactura | null>(null)

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
    refetchInterval: 15_000,
  })

  const { data: resumenCaja } = useQuery({
    queryKey: ['caja', sesion?.id, 'resumen'],
    queryFn: () => obtenerResumenCaja(sesion!.id),
    enabled: !!sesion && !sesion.cierre && tab === 'caja',
    refetchInterval: 15_000,
  })

  const aperturaMut = useMutation({
    mutationFn: apertura,
    onSuccess: () => {
      setShowApertura(false)
      queryClient.invalidateQueries({ queryKey: ['caja', 'activa'] })
      showSuccess('Caja abierta exitosamente')
    },
    onError: showError,
  })

  const cierreMut = useMutation({
    mutationFn: () => cierre(sesion!.id),
    onSuccess: () => {
      setShowResumen(false)
      queryClient.invalidateQueries({ queryKey: ['caja', 'activa'] })
      showSuccess('Caja cerrada exitosamente')
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
      showSuccess('Movimiento registrado exitosamente')
    },
    onError: showError,
  })

  const metrics = useMemo(() => {
    const ventasHoy = resumenCaja?.resumen?.sumaTotal ?? 0
    const cajaActual = sesion?.totalEnCaja ?? 0
    const pendientes = resumenCaja?.facturas?.length ?? 0
    const egresosHoy = resumenCaja?.resumen?.totalSalidasRetiros ?? 0
    const abierta = sesion ? !sesion.cierre : false
    return { ventasHoy, cajaActual, pendientes, egresosHoy, abierta }
  }, [resumenCaja, sesion])

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
            {sesionCargando && <p className={styles.loadingText}>Cargando sesión de caja...</p>}
            {sesionError && <p className={styles.errorText}>Error al cargar sesión de caja</p>}
            {!sesionCargando && !sesionError && (
              <EstadoCaja
                sesion={sesion}
                onCierre={() => setShowResumen(true)}
                onShowApertura={() => setShowApertura(true)}
              />
            )}

            {sesion && !sesion.cierre && (
              <>
                {retirosCargando && <p className={styles.loadingText}>Cargando movimientos...</p>}
                {retirosError && <p className={styles.errorText}>Error al cargar movimientos</p>}
                {!retirosCargando && !retirosError && (
                  <ListaMovimientos
                    facturas={resumenCaja?.facturas ?? []}
                    retiros={retiros}
                    onAdd={() => setShowRetiro(true)}
                    onSelectFactura={(f) => setSelectedFactura(f)}
                  />
                )}
              </>
            )}

            {selectedFactura && (
              <FacturaDetalle
                factura={selectedFactura}
                onClose={() => setSelectedFactura(null)}
              />
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
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <DollarSign size={24} />
        </div>
        <div className={styles.headerInfo}>
          <h2 className={styles.title}>Caja y Finanzas</h2>
          <p className={styles.subtitle}>Gestión de caja, ventas y facturación</p>
        </div>
      </div>

      {isAdmin && (
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconExito}`}>
              <DollarSign size={18} />
            </div>
            <span className={styles.kpiValueExito}>${formatearNumero(metrics.ventasHoy)}</span>
            <span className={styles.kpiLabel}>Ventas Hoy</span>
          </div>
          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconOro}`}>
              <Wallet size={18} />
            </div>
            <span className={styles.kpiValueOro}>${formatearNumero(metrics.cajaActual)}</span>
            <span className={styles.kpiLabel}>Caja Actual</span>
          </div>
          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconOro}`}>
              <Clock size={18} />
            </div>
            <span className={styles.kpiValueOro}>{metrics.pendientes}</span>
            <span className={styles.kpiLabel}>Pendientes</span>
          </div>
          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconPeligro}`}>
              <TrendingDown size={18} />
            </div>
            <span className={styles.kpiValuePeligro}>${formatearNumero(metrics.egresosHoy)}</span>
            <span className={styles.kpiLabel}>Egresos Hoy</span>
          </div>
          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconNeutro}`}>
              <CircleDot size={18} />
            </div>
            <span className={metrics.abierta ? styles.kpiValueExito : styles.kpiValuePeligro}>
              {metrics.abierta ? 'Abierta' : 'Cerrada'}
            </span>
            <span className={styles.kpiLabel}>Caja Estado</span>
          </div>

        </div>
      )}

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

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className={styles.content}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default CajaFinanzas
