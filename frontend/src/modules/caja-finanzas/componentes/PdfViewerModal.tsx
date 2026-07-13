import { useState, useEffect, useRef } from 'react'
import styles from './PdfViewerModal.module.css'

interface PdfViewerModalProps {
  pdfUrl: string
  onClose: () => void
}

function PdfViewerModal({ pdfUrl, onClose }: PdfViewerModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  function handleLoad() {
    setLoading(false)
  }

  function handleError() {
    setLoading(false)
    setError(true)
  }

  function handlePrint() {
    const iframe = iframeRef.current
    if (iframe?.contentWindow) {
      iframe.contentWindow.print()
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>Comprobante</h3>
          <div className={styles.headerActions}>
            {!loading && !error && (
              <button className={styles.btnPrint} onClick={handlePrint}>
                Imprimir
              </button>
            )}
            <button className={styles.btnClose} onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
        {loading && <div className={styles.loading}>Cargando comprobante...</div>}
        {error && <div className={styles.error}>No se pudo cargar el comprobante</div>}
        <iframe
          ref={iframeRef}
          className={styles.pdfFrame}
          src={pdfUrl}
          onLoad={handleLoad}
          onError={handleError}
          style={{ display: loading || error ? 'none' : 'block' }}
        />
      </div>
    </div>
  )
}

export default PdfViewerModal
