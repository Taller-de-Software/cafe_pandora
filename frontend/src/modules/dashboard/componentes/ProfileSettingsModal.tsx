import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '@modules/auth/context/useAuth'
import { useProfile, type ProfileSettings } from '../context/ProfileContext'
import styles from './ProfileSettingsModal.module.css'

interface ProfileSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
  const { user } = useAuth()
  const { profile, saveProfile } = useProfile()

  const [nombre, setNombre] = useState(profile.nombre)
  const [passwordActual, setPasswordActual] = useState('')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')

  function handleGuardar() {
    saveProfile({ nombre } as Partial<ProfileSettings>)
    onClose()
  }

  function handleCancelar() {
    setPasswordActual('')
    setNuevaPassword('')
    setConfirmarPassword('')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={styles.overlay}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.headerGradient}>
              <h3 className='uppercase'>Configuración de Perfil</h3>
              <button className={styles.closeBtn} onClick={onClose}>&times;</button>
            </div>

            <div className={styles.body}>
              {/* Datos de Cuenta */}
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}>Datos de Cuenta</h4>
                <div className={styles.field}>
                  <label>Nombre</label>
                  <input
                    className={styles.input}
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label>Rol</label>
                  <input
                    className={styles.input}
                    value={(user?.rol || '').toUpperCase()}
                    disabled
                  />
                </div>
                <div className={styles.passwordSection}>
                  <h5 className={styles.passwordTitle}>Cambiar Contraseña</h5>
                  <div className={styles.field}>
                    <label>Contraseña Actual</label>
                    <input
                      className={styles.input}
                      type='password'
                      value={passwordActual}
                      onChange={(e) => setPasswordActual(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Nueva Contraseña</label>
                    <input
                      className={styles.input}
                      type='password'
                      value={nuevaPassword}
                      onChange={(e) => setNuevaPassword(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Confirmar Nueva Contraseña</label>
                    <input
                      className={styles.input}
                      type='password'
                      value={confirmarPassword}
                      onChange={(e) => setConfirmarPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={`${styles.cancelBtn} uppercase`} onClick={handleCancelar}>Cancelar</button>
              <button className={`${styles.saveBtn} uppercase`} onClick={handleGuardar}>Guardar Cambios</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ProfileSettingsModal
