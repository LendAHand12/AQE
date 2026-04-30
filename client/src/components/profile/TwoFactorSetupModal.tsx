import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeUrl: string;
  secret: string;
  onVerify: (code: string) => Promise<void>;
  processing: boolean;
}

export default function TwoFactorSetupModal({
  isOpen,
  onClose,
  qrCodeUrl,
  secret,
  onVerify,
  processing
}: TwoFactorSetupModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [code, setCode] = useState("");

  const handleCopy = () => {
    navigator.clipboard.writeText(secret);
    toast.success(t("settings.security_tab.modal.copied_secret"));
  };

  const handleNext = () => {
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setCode("");
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error(t("settings.security_tab.modal.error_6_digits"));
      return;
    }
    await onVerify(code);
    // If successful, the parent should close this modal.
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[90vw] max-w-[600px] p-0 border-none rounded-[16px] overflow-hidden bg-transparent [&>button]:hidden max-h-[90vh] flex flex-col">
        <div className="bg-white flex flex-col items-start relative size-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pt-6 px-6 relative w-full">
            <p className="font-bold leading-[30px] text-[#111827] text-[20px]">
              {t("settings.security_tab.modal.title")}
            </p>
            <button
              onClick={onClose}
              className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-[12px] size-[36px] transition-colors"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          {step === 1 ? (
            <div className="flex flex-col gap-3 items-start p-6 relative w-full">
              <p className="font-bold leading-[20px] text-[#0d1f1d] text-[16px] tracking-[0.48px]">
                {t("settings.security_tab.modal.step_1")}
              </p>
              
              <div className="bg-[#efefef]/50 flex flex-col items-center px-4 sm:px-10 py-6 sm:py-8 relative rounded-[16px] w-full">
                <div className="flex flex-col gap-3 items-center relative w-full sm:w-[335px] max-w-full">
                  <div className="bg-white flex flex-col items-center justify-center p-4 relative rounded-[16px] w-[200px] h-[200px] sm:w-[256px] sm:h-[256px] shrink-0">
                    <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col gap-2 items-center justify-center relative w-full mt-2">
                    <p className="font-semibold leading-[22.5px] text-[#111827] text-[15px] text-center">
                      {t("settings.security_tab.modal.instruction_qr")}
                    </p>
                    <div className="bg-[#efefef] flex gap-2 items-center px-4 py-2 relative rounded-full cursor-pointer hover:bg-gray-200 transition-colors w-full justify-center max-w-[280px] sm:max-w-none" onClick={handleCopy}>
                      <p className="font-medium text-[#276152] text-[12px] sm:text-[14px] text-center tracking-wider break-all">
                        {secret}
                      </p>
                      <Copy size={16} className="text-[#276152]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#d9ede8]/50 flex flex-col items-start p-4 relative rounded-[12px] w-full mt-2">
                <div className="flex flex-col gap-1 items-start text-[#0d1f1d] text-[15px] w-full">
                  <p className="font-bold leading-[20px] tracking-[0.48px] mb-1">
                    {t("settings.security_tab.modal.instruction_title")}
                  </p>
                  <ol className="list-decimal pl-5 space-y-1 text-sm">
                    <li>{t("settings.security_tab.modal.step_1_guide_1")}</li>
                    <li>{t("settings.security_tab.modal.step_1_guide_2")}</li>
                    <li>{t("settings.security_tab.modal.step_1_guide_3")}</li>
                    <li>{t("settings.security_tab.modal.step_1_guide_4")}</li>
                  </ol>
                </div>
              </div>

              <Button
                onClick={handleNext}
                className="bg-[#276152] hover:bg-[#1e4d41] font-medium text-[16px] text-white w-full h-[48px] rounded-[12px] mt-2"
              >
                {t("settings.security_tab.modal.next_btn")}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-5 items-start p-6 relative w-full">
              <p className="font-bold leading-[20px] text-[#0d1f1d] text-[16px] tracking-[0.48px]">
                {t("settings.security_tab.modal.step_2")}
              </p>
              
              <div className="bg-[#efefef]/50 flex flex-col gap-4 items-center justify-center py-6 sm:py-10 relative rounded-[16px] w-full">
                <div className="flex flex-col items-center relative w-full max-w-[320px]">
                  <div className="flex flex-col gap-4 items-center justify-center relative w-full">
                    <p className="font-semibold leading-[22.5px] text-[#111827] text-[15px] text-center">
                      {t("settings.security_tab.modal.instruction_code")}
                    </p>
                    <div className="flex justify-center">
                        <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus>
                            <InputOTPGroup>
                                <InputOTPSlot index={0} className="w-10 h-12 sm:w-14 sm:h-16 text-lg sm:text-2xl bg-white" />
                                <InputOTPSlot index={1} className="w-10 h-12 sm:w-14 sm:h-16 text-lg sm:text-2xl bg-white" />
                                <InputOTPSlot index={2} className="w-10 h-12 sm:w-14 sm:h-16 text-lg sm:text-2xl bg-white" />
                                <InputOTPSlot index={3} className="w-10 h-12 sm:w-14 sm:h-16 text-lg sm:text-2xl bg-white" />
                                <InputOTPSlot index={4} className="w-10 h-12 sm:w-14 sm:h-16 text-lg sm:text-2xl bg-white" />
                                <InputOTPSlot index={5} className="w-10 h-12 sm:w-14 sm:h-16 text-lg sm:text-2xl bg-white" />
                            </InputOTPGroup>
                        </InputOTP>
                    </div>
                  </div>
                </div>
                <p className="text-[#6b7280] text-[13px] text-center mt-2">
                  {t("settings.security_tab.modal.code_change_note")} <span className="font-bold">{t("settings.security_tab.modal.seconds_30")}</span>
                </p>
              </div>

              <div className="flex gap-4 items-center relative w-full mt-4">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 bg-[#efefef]/50 border-none font-medium text-[#868f9e] hover:bg-gray-200 h-[48px] rounded-[12px]"
                  disabled={processing}
                >
                  {t("settings.security_tab.modal.back_btn")}
                </Button>
                <Button
                  onClick={handleVerify}
                  disabled={processing}
                  className="flex-1 bg-[#276152] hover:bg-[#1e4d41] font-medium text-white h-[48px] rounded-[12px]"
                >
                  {processing ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
                  {t("settings.security_tab.modal.verify_btn")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
