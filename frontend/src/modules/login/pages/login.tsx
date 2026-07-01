import { Link } from 'react-router-dom'

function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-800 to-amber-950">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-amber-900 mb-6">
          Café Pandora
        </h1>
        <p className="text-gray-500 text-center mb-6">Inicia sesión para continuar</p>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              placeholder="usuario"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors cursor-pointer"
          >
            Ingresar
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Demo: <Link to="/dashboard" className="text-amber-600 hover:underline">ir al dashboard</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
