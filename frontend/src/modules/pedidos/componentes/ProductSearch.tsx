import styles from './ProductSearch.module.css'

interface ProductSearchProps {
  value: string
  onChange: (value: string) => void
}

function ProductSearch({ value, onChange }: ProductSearchProps) {
  return (
    <input
      className={styles.search}
      type="text"
      placeholder="Buscar producto..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoFocus
    />
  )
}

export default ProductSearch
