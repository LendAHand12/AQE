import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  ArrowLeft,
  ArrowLeftRight,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { writeContract, waitForTransactionReceipt, readContract, switchChain } from '@wagmi/core';
import { config, amc20 } from '@/config/wagmi.config';
import { parseUnits } from 'viem';
import HEWE_ABI from '@/abis/BEP20USDT.json';
import { useSwapRates } from '@/hooks/useSwapRates';

const HEWE_TOKEN_ADDRESS = import.meta.env.VITE_HEWE_TOKEN_ADDRESS;
const AMC20_ADMIN_ADDRESS = import.meta.env.VITE_AMC20_ADMIN_WALLET_ADDRESS;
const AMC20_EXPLORER_URL = import.meta.env.VITE_AMC20_EXPLORER_URL;

const COUNTRIES = [
  { code: "+84", iso: "vn" },
  { code: "+1", iso: "us" },
  { code: "+44", iso: "gb" },
  { code: "+49", iso: "de" },
  { code: "+33", iso: "fr" },
  { code: "+81", iso: "jp" },
  { code: "+82", iso: "kr" },
  { code: "+420", iso: "cz" },
  { code: "+86", iso: "cn" },
  { code: "+886", iso: "tw" },
  { code: "+91", iso: "in" },
  { code: "+234", iso: "ng" },
  { code: "+61", iso: "au" },
  { code: "+60", iso: "my" },
  { code: "+1", iso: "ca" },
  { code: "+971", iso: "ae" },
  { code: "+66", iso: "th" },
  { code: "+65", iso: "sg" },
];

type Step = 'form' | 'connect' | 'switching' | 'sending' | 'verifying' | 'success' | 'error';

interface FormState {
  fullName: string;
  phone: string;
  countryCode: string;
  email: string;
  idCode: string;
  outputToken: 'QHEWE' | 'AQE';
  amount: string;
}

export default function SwapPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { open: openAppKit } = useAppKit();
  const { address: account, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { heweToQhewRate, heweToAqeRate } = useSwapRates();

  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState<FormState>({
    fullName: '',
    phone: '',
    countryCode: '+1',
    email: '',
    idCode: '',
    outputToken: 'QHEWE',
    amount: '',
  });
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const activeRate = form.outputToken === 'QHEWE' ? heweToQhewRate : heweToAqeRate;
  const estimatedReceive = Number(form.amount) > 0 ? Number(form.amount) * activeRate : 0;

  const handleContinue = () => {
    if (!form.fullName || !form.phone || !form.email || !form.idCode || !form.amount) {
      toast.error(t('swap.form.errors.required_fields'));
      return;
    }
    if (isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      toast.error(t('swap.form.errors.invalid_amount'));
      return;
    }
    setStep('connect');
  };

  const connectWallet = async () => {
    try {
      await openAppKit();
    } catch (error) {
      console.error(error);
      toast.error(t('swap.errors.connect_failed'));
    }
  };

  const disconnectWallet = () => {
    disconnect();
    toast.success(t('payments.page.wallet_disconnected'));
  };

  const handleSwitchNetwork = async () => {
    setStep('switching');
    try {
      await switchChain(config, { chainId: amc20.id });
      setStep('connect');
    } catch (error) {
      console.error(error);
      toast.error(t('swap.errors.switch_failed'));
      setStep('connect');
    }
  };

  const handleSend = async () => {
    if (!isConnected || !account) {
      await connectWallet();
      return;
    }
    if (chainId !== amc20.id) {
      await handleSwitchNetwork();
      return;
    }

    try {
      const amountWei = parseUnits(form.amount, 18);

      setStep('sending');
      const balance = await readContract(config, {
        address: HEWE_TOKEN_ADDRESS as `0x${string}`,
        abi: HEWE_ABI as any,
        functionName: 'balanceOf',
        args: [account],
      });

      if ((balance as bigint) < amountWei) {
        toast.error(t('swap.errors.insufficient_balance'));
        setStep('connect');
        return;
      }

      const hash = await writeContract(config, {
        address: HEWE_TOKEN_ADDRESS as `0x${string}`,
        abi: HEWE_ABI as any,
        functionName: 'transfer',
        args: [AMC20_ADMIN_ADDRESS as `0x${string}`, amountWei],
      });

      setStep('verifying');
      await waitForTransactionReceipt(config, { hash, chainId: amc20.id });

      await apiClient.post('/swap', {
        fullName: form.fullName,
        phone: form.phone,
        countryCode: form.countryCode,
        email: form.email,
        idCode: form.idCode,
        outputToken: form.outputToken,
        amount: Number(form.amount),
        fromWalletAddress: account,
        txHash: hash,
      });

      setTxHash(hash);
      setStep('success');
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || error.shortMessage || error.message || t('swap.errors.submit_failed');
      setErrorMsg(msg);
      toast.error(msg);
      setStep('connect');
    }
  };

  const isBusy = step === 'switching' || step === 'sending' || step === 'verifying';

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center p-6 pb-12">
      <div className="w-full max-w-md space-y-8 mt-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-black text-[#0d1f1d]">{t('swap.page_title')}</h1>
          <div className="w-10"></div>
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <ArrowLeftRight size={120} />
          </div>

          {step === 'success' ? (
            <div className="text-center space-y-6 pt-4">
              <div className="flex justify-center">
                <div className="size-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-[0_10px_30px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 size={40} />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-[#0d1f1d]">{t('swap.success.title')}</h3>
                <p className="text-sm text-gray-400">{t('swap.success.hint')}</p>
              </div>
              {txHash && (
                <a
                  href={AMC20_EXPLORER_URL ? `${AMC20_EXPLORER_URL}/transactions_detail/${txHash}` : '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-emerald-600 font-bold text-sm hover:underline"
                >
                  {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)} <ExternalLink size={14} />
                </a>
              )}
              <Button
                onClick={() => navigate('/')}
                className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold"
              >
                {t('swap.success.back_home')}
              </Button>
            </div>
          ) : step === 'form' ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-[#0d1f1d]">{t('swap.form.title')}</h2>
                <p className="text-sm text-gray-400">{t('swap.form.subtitle')}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">{t('swap.form.full_name')}</label>
                  <Input
                    value={form.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    placeholder={t('swap.form.full_name_placeholder') as string}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">{t('swap.form.phone')}</label>
                  <div className="relative group">
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-0 z-20 text-[#111827]">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          className="flex items-center gap-1 px-2 py-1 bg-transparent hover:bg-gray-100 rounded-[4px] transition-colors"
                        >
                          <img
                            src={`https://flagcdn.com/w20/${COUNTRIES.find(c => c.code === form.countryCode)?.iso}.png`}
                            alt="flag"
                            className="w-5 h-auto rounded-[2px]"
                          />
                          <ChevronDown size={14} className="text-[#9ca3af]" />
                        </button>

                        {showCountryDropdown && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowCountryDropdown(false)} />
                            <div className="absolute top-full left-0 mt-1 w-[120px] bg-white border border-[#efefef] shadow-lg rounded-[8px] overflow-hidden z-50">
                              <div className="max-h-[200px] overflow-y-auto">
                                {COUNTRIES.map((c) => (
                                  <button
                                    key={c.iso}
                                    type="button"
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#f8faf9] transition-colors text-left"
                                    onClick={() => {
                                      updateField('countryCode', c.code);
                                      setShowCountryDropdown(false);
                                    }}
                                  >
                                    <img src={`https://flagcdn.com/w20/${c.iso}.png`} alt={c.iso} className="w-5 h-auto rounded-[2px]" />
                                    <span className="font-medium text-[14px]">{c.code}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="w-[1px] h-5 bg-[#d5d7db] mx-1"></div>
                    </div>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.startsWith('0')) {
                          val = val.substring(1);
                        }
                        updateField('phone', val);
                      }}
                      placeholder={t('swap.form.phone_placeholder') as string}
                      className="w-full h-12 pl-[70px] pr-4 bg-white border border-input rounded-xl outline-none focus:border-[#276152] focus:ring-1 focus:ring-[#276152] transition-all text-[#111827] placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">{t('swap.form.email')}</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder={t('swap.form.email_placeholder') as string}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">{t('swap.form.id_code')}</label>
                  <Input
                    value={form.idCode}
                    onChange={(e) => updateField('idCode', e.target.value)}
                    placeholder={t('swap.form.id_code_placeholder') as string}
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">{t('swap.form.output_token')}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['QHEWE', 'AQE'] as const).map((tokenOption) => (
                      <button
                        key={tokenOption}
                        type="button"
                        onClick={() => updateField('outputToken', tokenOption)}
                        className={`h-12 rounded-xl border-2 font-bold transition-all ${
                          form.outputToken === tokenOption
                            ? 'border-[#276152] bg-[#276152]/5 text-[#276152]'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {tokenOption}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">{t('swap.form.amount')}</label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={form.amount}
                    onChange={(e) => updateField('amount', e.target.value)}
                    placeholder={t('swap.form.amount_placeholder') as string}
                    className="h-12 rounded-xl"
                  />
                  {estimatedReceive > 0 && (
                    <div className="flex justify-between items-center px-1 pt-1">
                      <span className="text-xs text-gray-400">{t('swap.form.estimated_receive')}</span>
                      <span className="text-sm font-bold text-emerald-600">
                        {estimatedReceive.toLocaleString(undefined, { maximumFractionDigits: 6 })} {form.outputToken}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleContinue}
                className="w-full h-14 bg-[#276152] hover:bg-[#1e4d41] text-white rounded-2xl font-bold shadow-[0_10px_30px_rgba(39,97,82,0.2)] transition-all active:scale-95"
              >
                {t('swap.form.continue_btn')}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-[#0d1f1d]">{t('swap.connect.title')}</h2>
                <p className="text-sm text-gray-400">{t('swap.connect.hint')}</p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                  <span className="text-gray-400 font-medium">{t('swap.form.amount')}</span>
                  <span className="font-mono font-bold text-emerald-600">{form.amount} HEWE</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                  <span className="text-gray-400 font-medium">{t('swap.form.output_token')}</span>
                  <span className="font-bold text-[#0d1f1d]">{form.outputToken}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-400 font-medium">{t('swap.form.estimated_receive')}</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {estimatedReceive.toLocaleString(undefined, { maximumFractionDigits: 6 })} {form.outputToken}
                  </span>
                </div>
              </div>

              {!account ? (
                <Button
                  onClick={connectWallet}
                  disabled={isBusy}
                  className="w-full h-14 bg-[#276152] hover:bg-[#1e4d41] text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(39,97,82,0.2)] transition-all active:scale-95"
                >
                  <Wallet size={20} />
                  {t('swap.connect.connect_wallet')}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                        <Wallet size={16} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                          {t('swap.connect.wallet_connected')}
                        </p>
                        <p className="text-sm font-mono font-bold text-[#0d1f1d]">
                          {account.substring(0, 6)}...{account.substring(account.length - 4)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={disconnectWallet}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors px-3 py-1.5 hover:bg-rose-50 rounded-lg"
                    >
                      {t('swap.connect.disconnect')}
                    </button>
                  </div>

                  {chainId !== amc20.id ? (
                    <Button
                      onClick={handleSwitchNetwork}
                      disabled={isBusy}
                      className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95"
                    >
                      {step === 'switching' ? <Loader2 className="animate-spin" /> : null}
                      {t('swap.connect.switch_network')}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSend}
                      disabled={isBusy}
                      className="w-full h-14 bg-[#276152] hover:bg-[#1e4d41] text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(39,97,82,0.2)] transition-all active:scale-95"
                    >
                      {isBusy ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />}
                      {step === 'sending'
                        ? t('swap.connect.sending')
                        : step === 'verifying'
                          ? t('swap.connect.verifying')
                          : t('swap.connect.send_btn')}
                    </Button>
                  )}
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-2xl flex gap-3 border border-gray-100">
                <ShieldCheck className="text-emerald-500 shrink-0" size={20} />
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  {errorMsg || t('payments.page.security_note')}
                </p>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setStep('form')}
                  disabled={isBusy}
                  className="text-sm font-bold text-gray-500 hover:text-gray-700 hover:underline disabled:opacity-50"
                >
                  {t('swap.connect.back_btn')}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400">Powered by AQE Estate</p>
      </div>
    </div>
  );
}
