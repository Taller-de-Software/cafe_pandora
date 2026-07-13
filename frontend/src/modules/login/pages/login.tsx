import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@modules/auth/context/useAuth'
import { useError } from '@/context/ErrorContext'
import ServerConfigModal from '@modules/configuracion/componentes/ServerConfigModal'
import { getApiUrl } from '@/services/server-config'
import styles from './login.module.css'

const BASE = getApiUrl().replace('/api', '')
const LOGO_URL = `${BASE}/uploads/productos/logo%20cafepandora%20sin%20fondo.png`

type Tab = 'login' | 'register'

function Login() {
  const { login, register: registerUser } = useAuth()
  const navigate = useNavigate()
  const { showError } = useError()
  const [tab, setTab] = useState<Tab>('login')
  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState<'administrador' | 'mesero'>('administrador')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [showConfig, setShowConfig] = useState(false)

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) {
      showError('Ingrese su nombre de usuario')
      return
    }
    setLoading(true)
    try {
      await login({ nombre: nombre.trim(), rol, pin: rol === 'administrador' ? pin : undefined })
      navigate('/dashboard')
    } catch (err) {
      showError(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) {
      showError('Ingrese un nombre de usuario')
      return
    }
    setLoading(true)
    try {
      await registerUser({ nombre: nombre.trim(), pin: pin || undefined })
      navigate('/dashboard')
    } catch (err) {
      showError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <button className={styles.configBtn} onClick={() => setShowConfig(true)} title="Configurar servidor">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      <div className={styles.card}>
        <div className={styles.leftCol}>
          <img className={styles.logoImage} src={LOGO_URL} alt="Café Pandora" />
        </div>

        <div className={styles.rightCol}>
          <div className={styles.formContainer}>
            <h1 className={styles.title}>Acceso Administrativo</h1>
            <p className={styles.subtitle}>Ingrese sus credenciales para acceder</p>

            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${tab === 'login' ? styles.tabActive : ''}`}
                onClick={() => setTab('login')}
              >
                Iniciar sesión
              </button>
              <button
                className={`${styles.tab} ${tab === 'register' ? styles.tabActive : ''}`}
                onClick={() => setTab('register')}
              >
                Registrarse
              </button>
            </div>

            {tab === 'login' ? (
              <form className={styles.form} onSubmit={handleLogin}>
                <div className={styles.field}>
                  <label className={styles.label}>Nombre de Usuario</label>
                  <div className={styles.inputGroup}>
                    <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6E6A65" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <input
                      type="text"
                      className={styles.input}
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Nombre del usuario"
                      required
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Rol de Empleado</label>
                  <select
                    className={styles.select}
                    value={rol}
                    onChange={(e) => setRol(e.target.value as 'administrador' | 'mesero')}
                  >
                    <option value="administrador">Administrador</option>
                    <option value="mesero">Mesero</option>
                  </select>
                </div>

                {rol === 'administrador' && (
                  <div className={styles.field}>
                    <label className={styles.label}>Contraseña (PIN)</label>
                    <div className={styles.inputGroup}>
                      <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6E6A65" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <input
                        type="password"
                        className={styles.input}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="PIN Numérico"
                      />
                    </div>
                  </div>
                )}

                <button type="submit" className={styles.btn} disabled={loading}>
                  {loading ? 'Ingresando...' : 'Ingresar al Sistema'}
                </button>
              </form>
            ) : (
              <form className={styles.form} onSubmit={handleRegister}>
                <div className={styles.field}>
                  <label className={styles.label}>Nombre de Usuario</label>
                  <div className={styles.inputGroup}>
                    <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6E6A65" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <input
                      type="text"
                      className={styles.input}
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Nombre del usuario"
                      required
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>PIN (opcional)</label>
                  <div className={styles.inputGroup}>
                    <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6E6A65" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      type="password"
                      className={styles.input}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="PIN Numérico"
                    />
                  </div>
                  <small className={styles.hint}>
                    Solo necesario si deseas establecer un PIN para este usuario
                  </small>
                </div>

                <button type="submit" className={styles.btn} disabled={loading}>
                  {loading ? 'Registrando...' : 'Registrarse'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {showConfig && (
        <ServerConfigModal onClose={() => setShowConfig(false)} />
      )}
    </div>
  )
}

export default Login
