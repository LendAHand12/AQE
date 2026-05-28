import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Wallet,
  Copy, 
  CheckCircle2, 
  Loader2, 
  // QrCode, 
  ChevronRight, 
  AlertCircle,
  Smartphone,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  pledgeAmount: number;
  status: 'idle' | 'success';
  countryCode?: string;
  isDirectPurchase?: boolean;
  userEmail?: string;
}

interface PaymentData {
  qrUrl: string;
  address: string;
  amount: number;
  paymentId: number;
  transakUrl?: string;
}

export function BlockchainPaymentModal({ 
  isOpen, 
  onClose,
  amount, 
  pledgeAmount,
  status: externalStatus, // 'idle' | 'success'
  countryCode,
  isDirectPurchase = false,
  userEmail
}: PaymentModalProps) {
  const { t } = useTranslation();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('choice'); // 'choice', 'qr', 'success'

  // Sync external status to internal step
  useEffect(() => {
    if (externalStatus === 'success') {
      setStep('success');
    }
  }, [externalStatus]);

  const initPayment = async (method = 'DIRECT') => {
    setLoading(true);
    try {
      const res = await apiClient.post('/payments/create', { 
        amount,
        pledgeAmount,
        method,
        isDirectPurchase,
        email: userEmail
      });
      setPaymentData(res.data);
      return res.data;
    } catch (error) {
      toast.error(t("pre_register.pay_failed"));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const openTransakPopup = (paymentId: number, transakUrl?: string) => {
    let url = transakUrl;
    if (!url) {
      const apiKey = import.meta.env.VITE_TRANSAK_API_KEY || '';
      const env = import.meta.env.VITE_TRANSAK_ENV || 'STAGING';
      const walletAddress = import.meta.env.VITE_ADMIN_WALLET_ADDRESS || '';
      const baseUrl = env === 'PRODUCTION' ? 'https://global.transak.com' : 'https://global-stg.transak.com';
      
      const params = new URLSearchParams({
        apiKey,
        cryptoCurrencyCode: 'USDT',
        network: 'bsc',
        walletAddress,
        disableWalletAddressForm: 'true',
        defaultCryptoAmount: amount.toString(),
        partnerOrderId: paymentId.toString(),
      });
      
      if (userEmail) {
        params.append('email', userEmail);
      }
      
      url = `${baseUrl}?${params.toString()}`;
    }
    
    const width = 500;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    window.open(
      url,
      'TransakPayment',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    );
    
    window.location.href = `/pay?pid=${paymentId}&method=transak`;
  };

  const handleSelectMethod = async (method: 'wallet' | 'zelle' | 'qr' | 'transak') => {
    const backendMethod = method === 'zelle' ? 'ZELLE' : (method === 'transak' ? 'TRANSAK' : 'WALLET');
    const data = await initPayment(backendMethod);
    if (data) {
      if (method === 'qr') {
        window.location.href = `/pay?pid=${data.paymentId}&method=wallet&connect=qr`;
      } else if (method === 'transak') {
        openTransakPopup(data.paymentId, data.transakUrl);
      } else {
        window.location.href = `/pay?pid=${data.paymentId}&method=${method}`;
      }
    }
  };

  // const handleShowQR = async () => {
  //   const data = await initPayment('QR');
  //   if (data) {
  //     setStep('qr');
  //   }
  // };

  const resetAndClose = () => {
    setStep('choice');
    setPaymentData(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-white rounded-3xl border-none">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="text-2xl font-black text-[#0d1f1d]">
            {step === 'success' ? t("payments.modal.success_title") : t("payments.modal.title")}
          </DialogTitle>
          <DialogDescription>
            {step === 'success' 
              ? t("payments.modal.success_desc") 
              : t("payments.modal.desc", { amount: amount.toLocaleString() })}
          </DialogDescription>
        </DialogHeader>

        <div className="px-8 pb-8 space-y-6">
          {step === 'choice' && (
            <div className="grid gap-3">
              <button 
                onClick={() => handleSelectMethod('wallet')}
                disabled={loading}
                className="group flex items-center justify-between p-5 rounded-2xl bg-white border-2 border-gray-100 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Wallet size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-[#0d1f1d]">{t("payments.page.method_wallet") || "Ví Crypto"}</p>
                    <p className="text-xs text-gray-500">{t("payments.modal.pay_this_device_desc") || "Kết nối ví và thanh toán trực tiếp"}</p>
                  </div>
                </div>
                {loading ? <Loader2 className="animate-spin text-gray-400" /> : <ChevronRight className="text-gray-300" />}
              </button>

              <button 
                onClick={() => handleSelectMethod('qr')}
                disabled={loading}
                className="group flex items-center justify-between p-5 rounded-2xl bg-white border-2 border-gray-100 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Smartphone size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-[#0d1f1d]">{t("payments.modal.scan_qr") || "Quét mã QR (Mobile)"}</p>
                    <p className="text-xs text-gray-500">{t("payments.modal.scan_qr_desc") || "Quét bằng Camera hoặc Ví Web3 (Trust, SafePal...)"}</p>
                  </div>
                </div>
                {loading ? <Loader2 className="animate-spin text-gray-400" /> : <ChevronRight className="text-gray-300" />}
              </button>

              <button 
                onClick={() => handleSelectMethod('transak')}
                disabled={loading}
                className="group flex items-center justify-between p-5 rounded-2xl bg-white border-2 border-gray-100 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-[#0d1f1d]">{t("payments.page.method_transak") || "Visa / Mastercard / Bank Transfer"}</p>
                    <p className="text-xs text-gray-500">{t("payments.modal.pay_transak_desc") || "Thanh toán bằng thẻ ngân hàng hoặc tài khoản qua Transak"}</p>
                  </div>
                </div>
                {loading ? <Loader2 className="animate-spin text-gray-400" /> : <ChevronRight className="text-gray-300" />}
              </button>

              {countryCode === '+1' && (
                <button 
                  onClick={() => handleSelectMethod('zelle')}
                  disabled={loading}
                  className="group flex items-center justify-between p-5 rounded-2xl bg-white border-2 border-gray-100 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Smartphone size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-[#0d1f1d]">{t("payments.page.method_zelle") || "Ví Zelle (USA)"}</p>
                      <p className="text-xs text-gray-500">{t("payments.modal.pay_zelle_desc") || "Thanh toán thủ công qua Zelle QR"}</p>
                    </div>
                  </div>
                  {loading ? <Loader2 className="animate-spin text-gray-400" /> : <ChevronRight className="text-gray-300" />}
                </button>
              )}
            </div>
          )}

          {step === 'qr' && paymentData && (
            <div className="space-y-6">
              <div className="flex justify-center p-6 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                <QRCodeSVG 
                  value={paymentData.qrUrl}
                  size={240}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
                <AlertCircle className="text-blue-600 shrink-0" size={20} />
                <p className="text-xs text-blue-700 leading-relaxed">
                  {t("payments.modal.qr_instruction")}
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">{t("payments.modal.copy_link")}</p>
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <input 
                    readOnly 
                    value={paymentData.qrUrl} 
                    className="bg-transparent text-[10px] flex-1 outline-none font-mono text-gray-500"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(paymentData.qrUrl);
                      toast.success(t("pre_register.copied"));
                    }}
                    className="text-emerald-600 p-1 hover:bg-emerald-50 rounded"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-8 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
              <div className="size-24 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-[0_15px_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 size={48} />
              </div>
              <Button 
                onClick={resetAndClose}
                className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold"
              >
                {t("payments.modal.close_btn")}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
