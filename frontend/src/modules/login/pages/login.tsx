import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@modules/auth/context/useAuth'
import styles from './login.module.css'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [rol, setRol] = useState<'administrador' | 'mesero'>('administrador')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login({ rol, pin: rol === 'administrador' ? pin : undefined })
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Café Pandora</h1>
        <p className={styles.subtitle}>Inicia sesión para continuar</p>

        <form className={styles.form} onSubmit={handleSubmit}>
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

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
