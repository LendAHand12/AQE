import { create } from 'zustand'
import apiClient from '@/lib/axios'
import { toast } from 'sonner'

interface Wallet {
  balance: number
}

interface PlayResult {
  rewardAmount: number
  slotIndex: number
  newPlays: number
}

interface State {
  wallet: Wallet
  isAuth: boolean
  isWalletLoading: boolean
  nextPlayResult: PlayResult | null
  setBalance: (balance: number) => void
  decrementBalance: (amount: number) => Promise<void>
  incrementBalance: (amount: number) => Promise<void>
}

export const useAuthStore = create<State>((setState) => ({
  wallet: { balance: 0 },
  isAuth: true,
  isWalletLoading: false,
  nextPlayResult: null,

  setBalance: (balance: number) => {
    setState({ wallet: { balance } })
  },

  incrementBalance: async (amount: number) => {
    setState(state => ({ wallet: { balance: state.wallet.balance + amount } }))
  },

  decrementBalance: async (_amount: number) => {
    setState({ isWalletLoading: true })
    try {
      const res = await apiClient.post('/plinko/play')
      if (res.data.success) {
        const { rewardAmount, slotIndex, newPlays, newBalance } = res.data
        setState({
          nextPlayResult: { rewardAmount, slotIndex, newPlays },
          wallet: { balance: newBalance - rewardAmount }, // Show post-bet balance
          isWalletLoading: false
        })
      } else {
        setState({ isWalletLoading: false })
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Có lỗi xảy ra khi đặt cược'
      toast.error(errMsg)
      setState({ isWalletLoading: false })
      throw error
    }
  }
}))
