import { useState, useEffect, useCallback } from 'react'
import apiClient from '@/lib/axios'

const DEFAULT_MIN = 100

/**
 * Minimum purchase amount (USDT) for the current user, from admin config.
 * First purchase and repeat purchases can have different minimums.
 * `loaded` stays false until the server answered, so callers can avoid
 * validating against the fallback value.
 */
export function usePurchaseLimits() {
    const [minPurchase, setMinPurchase] = useState<number>(DEFAULT_MIN)
    const [isFirstPurchase, setIsFirstPurchase] = useState<boolean>(true)
    const [loaded, setLoaded] = useState<boolean>(false)

    const refresh = useCallback(async () => {
        try {
            const res = await apiClient.get('/payments/purchase-limits')
            const min = Number(res.data?.minPurchase)
            setMinPurchase(!isNaN(min) && min > 0 ? min : DEFAULT_MIN)
            setIsFirstPurchase(!!res.data?.isFirstPurchase)
            setLoaded(true)
        } catch (err) {
            console.error('Failed to load purchase limits:', err)
        }
    }, [])

    useEffect(() => {
        refresh()
    }, [refresh])

    return { minPurchase, isFirstPurchase, loaded, refresh }
}
