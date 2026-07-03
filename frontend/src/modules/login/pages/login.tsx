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
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Café Pandora</h1>
        <p className={styles.subtitle}>
          {tab === 'login' ? 'Inicia sesión para continuar' : 'Registra un nuevo usuario'}
        </p>

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
              <label className={styles.label}>Rol</label>
              <select
                className={styles.input}
                value={rol}
                onChange={(e) => setRol(e.target.value as 'administrador' | 'mesero')}
              >
                <option value="administrador">administrador</option>
                <option value="mesero">mesero</option>
              </select>
            </div>
            {rol === 'administrador' && (
              <div className={styles.field}>
                <label className={styles.label}>PIN</label>
                <input
                  type="password"
                  className={styles.input}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            )}

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleRegister}>
            <div className={styles.field}>
              <label className={styles.label}>PIN (opcional)</label>
              <input
                type="password"
                className={styles.input}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••••••"
              />
              <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>
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
  )
}

export default Login
