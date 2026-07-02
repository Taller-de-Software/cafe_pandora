import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useError } from '@/context/ErrorContext'
import EstadoCaja from '../componentes/EstadoCaja'
import FormularioApertura from '../componentes/FormularioApertura'
import ListaRetiros from '../componentes/ListaRetiros'
import FormularioRetiro from '../componentes/FormularioRetiro'
import VentasDia from '../componentes/VentasDia'
import VentasSemana from '../componentes/VentasSemana'
import VentasMes from '../componentes/VentasMes'
import { obtenerSesionActiva, apertura, cierre, listarRetiros, crearRetiro } from '../data/caja'
import styles from './caja-finanzas.module.css'

type Seccion = 'ventas' | 'caja'
type PeriodoVentas = 'dia' | 'semana' | 'mes'

function CajaFinanzas() {
  const { showError } = useError()
  const [seccion, setSeccion] = useState<Seccion>('ventas')
  const [periodo, setPeriodo] = useState<PeriodoVentas>('dia')
  const [showApertura, setShowApertura] = useState(false)
  const [showRetiro, setShowRetiro] = useState(false)
  const queryClient = useQueryClient()

  const { data: sesion = null } = useQuery({
    queryKey: ['caja', 'activa'],
    queryFn: obtenerSesionActiva,
  })

  const { data: retiros = [] } = useQuery({
    queryKey: ['caja', sesion?.id, 'retiros'],
    queryFn: () => listarRetiros(sesion!.id),
    enabled: !!sesion && !sesion.cierre,
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['caja', 'activa'] }),
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

  return (
    <div className={styles.layout}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${seccion === 'ventas' ? styles.tabActive : ''}`}
          onClick={() => setSeccion('ventas')}
        >
          Ventas
        </button>
        <button
          className={`${styles.tab} ${seccion === 'caja' ? styles.tabActive : ''}`}
          onClick={() => setSeccion('caja')}
        >
          Caja
        </button>
      </div>

      {seccion === 'ventas' && (
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

          {periodo === 'dia' && <VentasDia />}
          {periodo === 'semana' && <VentasSemana />}
          {periodo === 'mes' && <VentasMes />}
        </>
      )}

      {seccion === 'caja' && (
        <>
          <EstadoCaja
            sesion={sesion}
            onCierre={() => cierreMut.mutate()}
            onShowApertura={() => setShowApertura(true)}
          />

          {sesion && !sesion.cierre && (
            <ListaRetiros retiros={retiros} onAdd={() => setShowRetiro(true)} />
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
      )}
    </div>
  )
}

export default CajaFinanzas
