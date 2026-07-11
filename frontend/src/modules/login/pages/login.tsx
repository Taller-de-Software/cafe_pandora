import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@modules/auth/context/useAuth'
import { useError } from '@/context/ErrorContext'
import styles from './login.module.css'

type Tab = 'login' | 'register'

function Login() {
  const { login, register: registerUser } = useAuth()
  const navigate = useNavigate()
  const { showError } = useError()
  const [tab, setTab] = useState<Tab>('login')
  const [rol, setRol] = useState<'administrador' | 'mesero'>('administrador')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await login({ rol, pin: rol === 'administrador' ? pin : undefined })
      navigate('/dashboard')
    } catch (err) {
      showError(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await registerUser(pin || undefined)
      navigate('/dashboard')
    } catch (err) {
      showError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.leftCol} />

        <div className={styles.rightCol}>
          <div className={styles.formContainer}>
            <h1 className={styles.title}>Acceso Administrativo</h1>
            <p className={styles.subtitle}>Seleccione su rol e ingrese su PIN</p>

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
                        onChange={(e) => setPin(e.target.value)}
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
                      onChange={(e) => setPin(e.target.value)}
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
    </div>
  )
}

export default Login
