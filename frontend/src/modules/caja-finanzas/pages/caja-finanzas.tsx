import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import EstadoCaja from '../componentes/EstadoCaja'
import FormularioApertura from '../componentes/FormularioApertura'
import ListaRetiros from '../componentes/ListaRetiros'
import FormularioRetiro from '../componentes/FormularioRetiro'
import { obtenerSesionActiva, apertura, cierre, listarRetiros, crearRetiro } from '../data/caja'
import styles from './caja-finanzas.module.css'

function CajaFinanzas() {
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
  })

  const cierreMut = useMutation({
    mutationFn: () => cierre(sesion!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['caja', 'activa'] }),
  })

  const retiroMut = useMutation({
    mutationFn: (data: { tipo: 'entrada' | 'salida'; monto: number }) =>
      crearRetiro(sesion!.id, data),
    onSuccess: () => {
      setShowRetiro(false)
      queryClient.invalidateQueries({ queryKey: ['caja', sesion?.id, 'retiros'] })
      queryClient.invalidateQueries({ queryKey: ['caja', 'activa'] })
    },
  })

  return (
    <div className={styles.layout}>
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
    </div>
  )
}

export default CajaFinanzas
