import { useEffect, useState } from 'react'
import { getShippingSettings } from '../api/shippingApi'

export default function useShippingSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    getShippingSettings()
      .then((d) => alive && setSettings(d))
      .catch(() => alive && setError('Could not load shipping rates.'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  return { settings, loading, error }
}