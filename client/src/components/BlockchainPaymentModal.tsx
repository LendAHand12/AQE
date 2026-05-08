import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Wallet, 
  Copy, 
  CheckCircle2, 
  Loader2, 
  QrCode, 
  ChevronRight, 
  AlertCircle,
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
}

interface PaymentData {
  qrUrl: string;
  address: string;
  amount: number;
  paymentId: number;
}

export function BlockchainPaymentModal({ 
  isOpen, 
  onClose, 
  amount, 
  pledgeAmount,
  status: externalStatus // 'idle' | 'success'
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
        method 
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

  const handlePayDirect = async () => {
    const data = await initPayment('DIRECT');
    if (data) {
      window.location.href = `/pay?pid=${data.paymentId}`;
    }
  };

  const handleShowQR = async () => {
    const data = await initPayment('QR');
    if (data) {
      setStep('qr');
    }
  };

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
                onClick={handlePayDirect}
                disabled={loading}
                className="group flex items-center justify-between p-5 rounded-2xl bg-white border-2 border-gray-100 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Wallet size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-[#0d1f1d]">{t("payments.modal.pay_this_device")}</p>
                    <p className="text-xs text-gray-500">{t("payments.modal.pay_this_device_desc")}</p>
                  </div>
                </div>
                {loading ? <Loader2 className="animate-spin text-gray-400" /> : <ChevronRight className="text-gray-300" />}
              </button>

              {/* <button 
                onClick={handleShowQR}
                disabled={loading}
                className="group flex items-center justify-between p-5 rounded-2xl bg-white border-2 border-gray-100 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <QrCode size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-[#0d1f1d]">{t("payments.modal.scan_qr")}</p>
                    <p className="text-xs text-gray-500">{t("payments.modal.scan_qr_desc")}</p>
                  </div>
                </div>
                {loading ? <Loader2 className="animate-spin text-gray-400" /> : <ChevronRight className="text-gray-300" />}
              </button> */}
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
