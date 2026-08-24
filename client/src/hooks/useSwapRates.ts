import { useState, useEffect } from 'react'
import apiClient from '@/lib/axios'

const DEFAULT_RATES = { heweToQhewRate: 1, heweToAqeRate: 1 }

// Module-level cache để tránh gọi API nhiều lần khi nhiều component mount
let _cachedRates: typeof DEFAULT_RATES | null = null
let _fetchPromise: Promise<typeof DEFAULT_RATES> | null = null

async function fetchRates(): Promise<typeof DEFAULT_RATES> {
    if (_cachedRates !== null) return _cachedRates
    if (_fetchPromise) return _fetchPromise

    _fetchPromise = apiClient
        .get('/config/exchange-rate')
        .then((res) => {
            const heweToQhewRate = parseFloat(res.data?.heweToQhewRate)
            const heweToAqeRate = parseFloat(res.data?.heweToAqeRate)
            _cachedRates = {
                heweToQhewRate: isNaN(heweToQhewRate) || heweToQhewRate <= 0 ? DEFAULT_RATES.heweToQhewRate : heweToQhewRate,
                heweToAqeRate: isNaN(heweToAqeRate) || heweToAqeRate <= 0 ? DEFAULT_RATES.heweToAqeRate : heweToAqeRate,
            }
            return _cachedRates
        })
        .catch(() => DEFAULT_RATES)
        .finally(() => {
            _fetchPromise = null
        })

    return _fetchPromise
}

/**
 * Hook trả về tỷ giá quy đổi HEWE -> QHEWE / AQE từ admin config.
 * Fallback về 1:1 nếu API lỗi hoặc chưa load xong.
 *
 * @example
 *   const { heweToQhewRate, heweToAqeRate, loading } = useSwapRates()
 *   const estimatedReceive = amount * (outputToken === 'QHEWE' ? heweToQhewRate : heweToAqeRate)
 */
export function useSwapRates() {
    const [rates, setRates] = useState(_cachedRates ?? DEFAULT_RATES)
    const [loading, setLoading] = useState(_cachedRates === null)

    useEffect(() => {
        if (_cachedRates !== null) {
            setRates(_cachedRates)
            setLoading(false)
            return
        }

        setLoading(true)
        fetchRates().then((r) => {
            setRates(r)
            setLoading(false)
        })
    }, [])

    return { ...rates, loading }
}
