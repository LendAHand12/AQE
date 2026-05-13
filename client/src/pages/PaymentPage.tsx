import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  CheckCircle2, 
  Loader2, 
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Copy,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { useTranslation } from "react-i18next";
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { writeContract, waitForTransactionReceipt, readContract } from '@wagmi/core';
import { config } from '@/config/wagmi.config';
import { parseUnits } from 'viem';
import BEP20USDT_ABI from "@/abis/BEP20USDT.json";
import ZelleQR from "@/assets/zelle.jpeg";

const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const ADMIN_ADDRESS = import.meta.env.VITE_ADMIN_WALLET_ADDRESS;

interface Payment {
  amount: number;
  paymentId: number;
  from: {
    username: string;
  };
  status: string;
  hash: string;
}

export default function PaymentPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentId = searchParams.get('pid');

  const { open: openAppKit } = useAppKit();
  const { address: account, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Sync wallet address with backend profile
  useEffect(() => {
    if (isConnected && account) {
      apiClient.put('/auth/profile', { walletAddress: account })
        .catch(err => console.error("Failed to sync wallet address:", err));
    }
  }, [isConnected, account]);

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [status, setStatus] = useState('idle'); // idle, connecting, checking_balance, paying, success, error, awaiting
  const [txHash, setTxHash] = useState('');
  const [method, setMethod] = useState<'wallet' | 'zelle'>(searchParams.get('method') === 'zelle' ? 'zelle' : 'wallet');

  useEffect(() => {
    if (!paymentId) {
      toast.error(t("payments.page.errors.invalid_id"));
      navigate('/');
      return;
    }
    fetchPaymentDetails();
  }, [paymentId]);

  const fetchPaymentDetails = async () => {
    try {
      const res = await apiClient.get(`/payments/${paymentId}`);
      setPayment(res.data);
      if (res.data.status === 'SUCCESS') {
        setStatus('success');
        setTxHash(res.data.hash);
      } else if (res.data.status === 'AWAITING_APPROVAL') {
        setStatus('awaiting');
      }
    } catch (error) {
      toast.error(t("payments.page.errors.not_found"));
    } finally {
      setLoading(false);
    }
  };

  // Start polling status when successful
  useEffect(() => {
    let interval: any;
    if (status === 'paying' || (status === 'success' && !txHash)) {
      interval = setInterval(async () => {
        try {
          const res = await apiClient.get(`/payments/${paymentId}`);
          if (res.data.status === 'SUCCESS') {
            setStatus('success');
            setTxHash(res.data.hash);
            clearInterval(interval);
          }
        } catch (e) {}
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [status, paymentId, txHash]);

  const connectWallet = async () => {
    try {
      await openAppKit();
    } catch (error) {
      console.error(error);
      toast.error(t("payments.page.errors.connect_failed"));
    }
  };

  const disconnectWallet = () => {
    disconnect();
    toast.success(t("payments.page.wallet_disconnected"));
  };

  const handlePayment = async () => {
    if (!isConnected || !account || !payment) {
        await connectWallet();
        return;
    }

    try {
      const amountWei = parseUnits(payment.amount.toString(), 18);

      // 1. Check Balance
      setStatus('checking_balance');
      const balance = await readContract(config, {
        address: USDT_ADDRESS as `0x${string}`,
        abi: BEP20USDT_ABI as any,
        functionName: 'balanceOf',
        args: [account],
      });

      if ((balance as bigint) < amountWei) {
        toast.error(t("assets.withdraw_dialog.insufficient_balance"));
        setStatus('idle');
        return;
      }

      // 2. Direct Transfer
      setStatus('paying');
      toast.info(t("payments.page.paying"));
      
      const hash = await writeContract(config, {
        address: USDT_ADDRESS as `0x${string}`,
        abi: BEP20USDT_ABI as any,
        functionName: 'transfer',
        args: [ADMIN_ADDRESS as `0x${string}`, amountWei],
      });
      
      // CHỦ ĐỘNG GỬI HASH VỀ BACKEND NGAY LẬP TỨC
      setStatus('verifying');
      await waitForTransactionReceipt(config, { hash });

      // Gửi hash lên backend và ĐỢI backend xử lý xong xuôi (cộng token, hoa hồng...)
      const res = await apiClient.post('/payments/confirm-hash', {
        paymentId: payment.paymentId,
        hash: hash
      });

      if (res.data.status === 'SUCCESS') {
        setTxHash(hash);
        setStatus('success');
        toast.success(t("payments.page.success_msg"));
      } else {
        throw new Error("Backend verification failed");
      }
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      const msg = error.response?.data?.message || error.shortMessage || error.message || t("pre_register.pay_failed");
      toast.error(msg);
    }
  };

  const handleManualConfirm = async () => {
    try {
      setStatus('verifying');
      await apiClient.post('/payments/confirm-manual', { paymentId });
      setStatus('awaiting');
      toast.success(t("payments.page.manual_confirm_success"));
    } catch (error: any) {
      console.error(error);
      setStatus('idle');
      toast.error(error.response?.data?.message || error.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-emerald-500" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center p-6 pb-12">
      <div className="w-full max-w-md space-y-8 mt-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-black text-[#0d1f1d]">{t("payments.page.title")}</h1>
          <div className="w-10"></div>
        </div>

        {/* Payment Card */}
        <div className="bg-white rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Wallet size={120} />
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t("payments.page.total_label")}</p>
            <h2 className="text-5xl font-black text-[#0d1f1d]">
              {payment?.amount.toLocaleString()} <span className="text-xl">USDT</span>
            </h2>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-50">
              <span className="text-gray-400 font-medium">{t("payments.page.tx_id")}</span>
              <span className="font-mono font-bold text-emerald-600">#{payment?.paymentId}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-50">
              <span className="text-gray-400 font-medium">{t("payments.page.sender")}</span>
              <span className="font-bold text-[#0d1f1d]">{payment?.from?.username}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-400 font-medium">{t("payments.page.status")}</span>
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-bold uppercase",
                status === 'success' ? "bg-emerald-50 text-emerald-600" : 
                status === 'awaiting' ? "bg-amber-50 text-amber-600" :
                "bg-gray-50 text-gray-500"
              )}>
                {status === 'success' ? t("payments.page.status_success") : 
                 status === 'awaiting' ? t("payments.page.status_awaiting") :
                 t("payments.page.status_pending")}
              </span>
            </div>
          </div>

          {status === 'success' ? (
            <div className="text-center space-y-6 pt-4">
               <div className="flex justify-center">
                  <div className="size-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-[0_10px_30px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 size={40} />
                  </div>
               </div>
               <div className="space-y-2">
                 <h3 className="text-2xl font-black text-[#0d1f1d]">{t("payments.page.success_msg")}</h3>
                 <p className="text-sm text-gray-400">{t("payments.page.success_hint")}</p>
               </div>
               {txHash && (
                 <a 
                   href={`https://bscscan.com/tx/${txHash}`} 
                   target="_blank" 
                   className="inline-flex items-center gap-2 text-emerald-600 font-bold text-sm hover:underline"
                 >
                   {t("payments.page.view_bscscan")} <ExternalLink size={14} />
                 </a>
               )}
               <Button onClick={() => navigate('/pre-register')} className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold">
                 {t("payments.page.back_home")}
               </Button>
            </div>
          ) : status === 'awaiting' ? (
            <div className="text-center space-y-6 pt-4">
               <div className="flex justify-center">
                  <div className="size-20 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-[0_10px_30px_rgba(245,158,11,0.3)]">
                    <Clock size={40} />
                  </div>
               </div>
               <div className="space-y-2">
                 <h3 className="text-2xl font-black text-[#0d1f1d]">{t("payments.page.status_awaiting")}</h3>
                 <p className="text-sm text-gray-400">{t("payments.page.manual_success_hint")}</p>
               </div>
               <Button onClick={() => navigate('/pre-register')} className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold">
                 {t("payments.page.back_home")}
               </Button>
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              {method === 'wallet' ? (
                <div className="space-y-4">
                  {!account ? (
                    <Button 
                      onClick={connectWallet} 
                      disabled={status === 'connecting'}
                      className="w-full h-14 bg-[#276152] hover:bg-[#1e4d41] text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(39,97,82,0.2)] transition-all active:scale-95"
                    >
                      {status === 'connecting' ? <Loader2 className="animate-spin" /> : <Wallet size={20} />}
                      {t("payments.page.connect_wallet")}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                            <Wallet size={16} />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{t("payments.page.wallet_connected")}</p>
                            <p className="text-sm font-mono font-bold text-[#0d1f1d]">
                              {account.substring(0, 6)}...{account.substring(account.length - 4)}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={disconnectWallet}
                          className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors px-3 py-1.5 hover:bg-rose-50 rounded-lg"
                        >
                          {t("payments.page.disconnect")}
                        </button>
                      </div>

                      <Button 
                        onClick={handlePayment} 
                        disabled={status === 'checking_balance' || status === 'paying' || status === 'verifying'}
                        className="w-full h-14 bg-[#276152] hover:bg-[#1e4d41] text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(39,97,82,0.2)] transition-all active:scale-95"
                      >
                        { (status === 'checking_balance' || status === 'paying' || status === 'verifying') ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} /> }
                        {status === 'checking_balance' ? t("auth.processing") : status === 'paying' ? t("payments.page.paying") : status === 'verifying' ? t("payments.page.verifying") : t("payments.page.pay_now")}
                      </Button>
                    </div>
                  )}
                  
                  <div className="p-4 bg-gray-50 rounded-2xl flex gap-3 border border-gray-100">
                    <ShieldCheck className="text-emerald-500 shrink-0" size={20} />
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      {t("payments.page.security_note")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex flex-col items-center space-y-4">
                    <div className="size-48 bg-white rounded-2xl border-2 border-emerald-500/20 flex items-center justify-center overflow-hidden">
                       {/* Placeholder for Zelle QR */}
                       <img 
                          src={ZelleQR} 
                          alt="Zelle QR"
                          className="size-40"
                       />
                    </div>
                    <div className="text-center space-y-1">
                       <p className="text-xs font-medium text-gray-400">{t("payments.page.zelle_info")}</p>
                       <p className="text-lg font-black text-[#0d1f1d]">aqeholding@gmail.com</p>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{t("payments.page.zelle_memo")}</span>
                       <button 
                         onClick={() => {
                           navigator.clipboard.writeText(paymentId?.toString() || '');
                           toast.success(t("common.copied"));
                         }}
                         className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:underline"
                       >
                         <Copy size={10} /> Copy
                       </button>
                    </div>
                    <p className="text-xl font-black text-emerald-700 font-mono tracking-tighter">#{paymentId}</p>
                  </div>

                  <Button 
                    onClick={handleManualConfirm}
                    disabled={status === 'verifying'}
                    className="w-full h-14 bg-[#276152] hover:bg-[#1e4d41] text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(39,97,82,0.2)] transition-all active:scale-95"
                  >
                    {status === 'verifying' ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
                    {t("payments.page.confirm_manual_btn")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <p className="text-center text-xs text-gray-400">
          Powered by AQE Estate
        </p>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
