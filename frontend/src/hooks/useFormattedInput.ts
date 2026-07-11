import { useState, useCallback } from 'react'

function formatMoney(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('es-CO')
}

function formatPhone(raw: string): string {
  return raw.replace(/\D/g, '')
}

function formatPin(raw: string): string {
  return raw.replace(/\D/g, '')
}

function formatNumber(raw: string): string {
  return raw.replace(/\D/g, '')
}

interface UseFormattedInputOptions {
  type: 'money' | 'phone' | 'pin' | 'number'
  initialValue?: string
  maxValue?: number
  maxLength?: number
}

export function useFormattedInput(options: UseFormattedInputOptions) {
  const { type, initialValue = '', maxValue, maxLength } = options

  const [raw, setRaw] = useState(() => {
    if (type === 'money' && initialValue) {
      return String(initialValue).replace(/\D/g, '')
    }
    return initialValue
  })

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value

    switch (type) {
      case 'money':
        val = val.replace(/\D/g, '')
        break
      case 'phone':
      case 'pin':
      case 'number':
        val = val.replace(/\D/g, '')
        break
    }

    if (maxLength && val.length > maxLength) {
      val = val.slice(0, maxLength)
    }

    if (maxValue) {
      const num = parseInt(val, 10)
      if (!isNaN(num) && num > maxValue) {
        val = String(maxValue)
      }
    }

    setRaw(val)
  }, [type, maxValue, maxLength])

  const formatted = (() => {
    switch (type) {
      case 'money':
        return formatMoney(raw)
      case 'phone':
      case 'pin':
      case 'number':
        return raw
    }
  })()

  const numericValue = type === 'money' ? parseInt(raw || '0', 10) || 0 : parseInt(raw || '0', 10) || 0

  const inputProps = {
    type: 'text' as const,
    inputMode: (type === 'money' || type === 'pin' || type === 'number') ? 'numeric' as const : 'tel' as const,
    value: formatted,
    onChange: handleChange,
    maxLength: maxLength ?? (type === 'phone' ? 10 : type === 'pin' ? 6 : undefined),
  }

  return {
    value: formatted,
    raw,
    numericValue,
    onChange: handleChange,
    inputProps,
    setRaw,
  }
}
