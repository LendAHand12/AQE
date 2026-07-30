import { useState, useEffect } from 'react'
import apiClient from '@/lib/axios'

const DEFAULT_RATE = 1.02

// Module-level cache để tránh gọi API nhiều lần khi nhiều component mount
let _cachedRate: number | null = null
let _fetchPromise: Promise<number> | null = null

async function fetchRate(): Promise<number> {
    if (_cachedRate !== null) return _cachedRate
    if (_fetchPromise) return _fetchPromise

    _fetchPromise = apiClient
        .get('/config/exchange-rate')
        .then((res) => {
            const rate = parseFloat(res.data?.aqeToUsdtRate)
            _cachedRate = isNaN(rate) || rate <= 0 ? DEFAULT_RATE : rate
            return _cachedRate
        })
        .catch(() => {
            return DEFAULT_RATE
        })
        .finally(() => {
            _fetchPromise = null
        })

    return _fetchPromise
}

/**
 * Hook trả về tỷ giá AQE/USDT (1 AQE = X USDT) từ admin config.
 * Fallback về 1.02 nếu API lỗi hoặc chưa load xong.
 *
 * @example
 *   const { rate, loading } = useExchangeRate()
 *   const expectedAqe = purchaseAmount / rate
 */
export function useExchangeRate() {
    const [rate, setRate] = useState<number>(_cachedRate ?? DEFAULT_RATE)
    const [loading, setLoading] = useState<boolean>(_cachedRate === null)

    useEffect(() => {
        if (_cachedRate !== null) {
            setRate(_cachedRate)
            setLoading(false)
            return
        }

        setLoading(true)
        fetchRate().then((r) => {
            setRate(r)
            setLoading(false)
        })
    }, [])

    return { rate, loading }
}

/**
 * Invalidate cache khi admin cập nhật tỷ giá (gọi sau khi save thành công)
 */
export function invalidateExchangeRateCache() {
    _cachedRate = null
}
