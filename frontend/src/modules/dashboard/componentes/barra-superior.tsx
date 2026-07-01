interface BarraSuperiorProps {
  onToggle: () => void
}

function BarraSuperior({ onToggle }: BarraSuperiorProps) {
  return (
    <header className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
      <button
        onClick={onToggle}
        className="text-gray-600 hover:text-amber-700 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        title="Toggle sidebar"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <h1 className="text-lg font-bold text-amber-900">Café Pandora</h1>

      <div className="flex items-center gap-2">
        <button
          className="text-gray-600 hover:text-amber-700 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          title="Perfil"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
        <button
          className="text-gray-600 hover:text-red-600 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          title="Cerrar sesión"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  )
}

export default BarraSuperior
