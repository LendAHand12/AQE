import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import apiClient from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SwapInfo {
  fullName: string;
  outputToken: string;
  amount: number;
}

export default function SwapWalletPage() {
  const { t } = useTranslation();
  const { token } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<'loading' | 'form' | 'submitting' | 'success' | 'error'>('loading');
  const [swapInfo, setSwapInfo] = useState<SwapInfo | null>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const hasFetched = React.useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchInfo = async () => {
      try {
        const res = await apiClient.get(`/swap/wallet/${token}`);
        setSwapInfo(res.data);
        setStatus('form');
      } catch (error) {
        setStatus('error');
      }
    };

    if (token) fetchInfo();
  }, [token]);

  const handleSubmit = async () => {
    if (!walletAddress.trim()) {
      toast.error(t('swap.wallet_page.errors.required'));
      return;
    }
    setStatus('submitting');
    try {
      await apiClient.post(`/swap/wallet/${token}`, { quantumWalletAddress: walletAddress.trim() });
      setStatus('success');
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('swap.wallet_page.errors.submit_failed'));
      setStatus('form');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-[#f8faf9] overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[480px]"
      >
        <div className="bg-white rounded-[32px] shadow-2xl shadow-gray-200/50 border border-white p-8 md:p-12 text-center space-y-8">
          <AnimatePresence mode="wait">
            {status === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="space-y-6"
              >
                <div className="relative size-20 mx-auto">
                  <div className="absolute inset-0 bg-[#276152]/10 rounded-full animate-pulse" />
                  <Loader2 className="relative size-full text-[#276152] animate-spin p-4" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-[#111827]">{t('swap.wallet_page.verifying_title')}</h1>
                  <p className="text-[#6b7280]">{t('swap.wallet_page.verifying_desc')}</p>
                </div>
              </motion.div>
            )}

            {status === 'form' && swapInfo && (
              <motion.div
                key="form"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="space-y-6 text-left"
              >
                <div className="space-y-2 text-center">
                  <h1 className="text-2xl font-bold text-[#111827]">{t('swap.wallet_page.form_title')}</h1>
                  <p className="text-[#6b7280]">
                    {t('swap.wallet_page.form_desc', { outputToken: swapInfo.outputToken })}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#276152]/5 border border-[#276152]/10 p-4 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">{swapInfo.fullName}</span>
                  <span className="font-mono font-bold text-[#276152]">
                    {swapInfo.amount} HEWE → {swapInfo.outputToken}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    {t('swap.wallet_page.wallet_label')}
                  </label>
                  <Input
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder={t('swap.wallet_page.wallet_placeholder') as string}
                    className="h-12 rounded-xl"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  className="w-full h-14 bg-[#276152] hover:bg-[#1e4d41] rounded-2xl text-lg font-bold shadow-xl shadow-[#276152]/10 transition-all"
                >
                  {t('swap.wallet_page.submit_btn')}
                </Button>
              </motion.div>
            )}

            {status === 'submitting' && (
              <motion.div
                key="submitting"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="space-y-6"
              >
                <div className="relative size-20 mx-auto">
                  <div className="absolute inset-0 bg-[#276152]/10 rounded-full animate-pulse" />
                  <Loader2 className="relative size-full text-[#276152] animate-spin p-4" />
                </div>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <div className="relative size-24 mx-auto">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                    className="absolute inset-0 bg-[#276152] rounded-full shadow-lg shadow-[#276152]/20"
                  />
                  <CheckCircle2 className="relative size-full text-white p-6" />
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl font-bold text-[#111827]">{t('swap.wallet_page.success_title')}</h1>
                  <p className="text-lg text-[#6b7280] leading-relaxed">{t('swap.wallet_page.success_desc')}</p>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={() => navigate('/')}
                    className="w-full h-14 bg-[#276152] hover:bg-[#1e4d41] rounded-2xl text-lg font-bold shadow-xl shadow-[#276152]/10 transition-all"
                  >
                    {t('swap.wallet_page.back_home')}
                  </Button>
                </div>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <div className="relative size-24 mx-auto">
                  <div className="absolute inset-0 bg-red-50 rounded-full" />
                  <XCircle className="relative size-full text-red-500 p-6" />
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl font-bold text-[#111827]">{t('swap.wallet_page.error_title')}</h1>
                  <p className="text-lg text-[#6b7280] leading-relaxed">{t('swap.wallet_page.error_desc')}</p>
                </div>

                <div className="pt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/')}
                    className="w-full h-14 border-2 border-[#efefef] hover:bg-gray-50 rounded-2xl text-lg font-bold transition-all"
                  >
                    {t('swap.wallet_page.back_home')}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-6 border-t border-gray-50 flex items-center justify-center gap-2 text-sm text-[#9ca3af]">
            <ShieldCheck className="h-4 w-4" />
            <span>Secure Verification by AQ Estate</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
