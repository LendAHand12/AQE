import React, { useState, useEffect } from "react"
import {
  ShieldCheck,
  ScanFace,
  Key,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  Upload,
  Copy,
  Check,
  Lock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import apiClient from "@/lib/axios"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/providers/AuthProvider"
import { cn } from "@/lib/utils"

const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file)
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1600
        const MAX_HEIGHT = 1600
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              resolve(file)
            }
          },
          'image/jpeg',
          0.8
        )
      }
      img.onerror = () => {
        resolve(file)
      }
    }
    reader.onerror = () => {
      resolve(file)
    }
  })
}

export default function KYCSection({ initialData }: { initialData?: any }) {
  const { t } = useTranslation()
  const { syncProfile } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<any>(initialData || null)
  const [idPhotos, setIdPhotos] = useState({
    front: initialData?.idCardFront || "",
    back: initialData?.idCardBack || "",
    portrait: initialData?.portraitPhoto || ""
  })
  const [isUploading, setIsUploading] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [twoFactorData, setTwoFactorData] = useState<{ secret: string; qrCodeUrl: string } | null>(null)
  const [twofaCode, setTwofaCode] = useState("")

  useEffect(() => {
    if (!initialData) {
      fetchProfile()
    } else {
      setUserData(initialData)
      setIdPhotos({
        front: initialData.idCardFront || "",
        back: initialData.idCardBack || "",
        portrait: initialData.portraitPhoto || ""
      })
      updateStep(initialData)
    }
  }, [initialData])

  useEffect(() => {
    if (step === 3 && userData && !userData.isTwoFactorEnabled && !twoFactorData) {
      generate2FA()
    }
  }, [step, userData])

  const updateStep = (data: any) => {
    // Determine current step based on sequential logic
    if (data.kycStatus === 'verified') {
      if (data.faceTecTid) {
        setStep(3)
      } else {
        setStep(2)
      }
    } else {
      setStep(1)
    }
  }

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get("/auth/profile")
      setUserData(res.data)
      setIdPhotos({
        front: res.data.idCardFront || "",
        back: res.data.idCardBack || "",
        portrait: res.data.portraitPhoto || ""
      })

      updateStep(res.data)
    } catch (err) {
      toast.error(t("kyc.fetch_error"))
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back' | 'portrait') => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(type)

    try {
      const compressedBlob = await compressImage(file)
      const formData = new FormData()
      
      // Force filename to use .jpg extension
      const filename = file.name.replace(/\.[^/.]+$/, "") + ".jpg"
      formData.append("image", compressedBlob, filename)

      const res = await apiClient.post("/auth/upload", formData)
      setIdPhotos(prev => ({ ...prev, [type]: res.data.imageUrl }))
      toast.success(t(`kyc.id_verification.upload_${type}`) + " " + t("settings.save_success"))
    } catch (err: any) {
      const errMsg = err.response?.data?.message;
      if (errMsg) {
        toast.error(t(errMsg));
      } else {
        toast.error(t("auth.errors.upload_failed"));
      }
    } finally {
      setIsUploading(null)
    }
  }

  const handleSubmitID = async () => {
    if (!idPhotos.front || !idPhotos.back || !idPhotos.portrait) {
      toast.error(t("kyc.errors.upload_required"))
      return
    }

    setLoading(true)
    try {
      await apiClient.post("/auth/verify-id", {
        idCardFront: idPhotos.front,
        idCardBack: idPhotos.back,
        portraitPhoto: idPhotos.portrait
      })
      toast.success(t("kyc.status.pending_title"))
      await syncProfile()
      fetchProfile()
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("kyc.errors.submit_failed"))
    } finally {
      setLoading(false)
    }
  }

  const handleFaceScan = async () => {
    setLoading(true)
    try {
      const res = await apiClient.post("/kyc/start-face-scan")
      if (res.data.url) {
        window.location.href = res.data.url
      } else {
        toast.error("Không nhận được URL đăng ký từ hệ thống")
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("kyc.facescan.failed"))
    } finally {
      setLoading(false)
    }
  }

  const generate2FA = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get("/auth/2fa/generate")
      setTwoFactorData(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể tạo mã QR 2FA")
    } finally {
      setLoading(false)
    }
  }

  const handleEnable2FA = async () => {
    if (twofaCode.length !== 6) {
      toast.error(t("auth.errors.invalid_2fa", { defaultValue: "Mã 2FA phải đủ 6 chữ số" }))
      return
    }

    setLoading(true)
    try {
      await apiClient.post("/auth/2fa/enable", { code: twofaCode })
      toast.success(t("kyc.google_auth.enable_success") || t("kyc.google_auth.setup") + " " + t("settings.save_success"))
      await syncProfile()
      fetchProfile()
    } catch (err: any) {
      const errMsg = err.response?.data?.message;
      if (errMsg) {
        toast.error(t(errMsg));
      } else {
        toast.error(t("kyc.errors.submit_failed"));
      }
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success(t("kyc.google_auth.copy") + " " + t("settings.save_success"))
  }

  const renderStepIcon = (s: number, icon: any) => {
    const isCompleted = (s === 1 && userData?.kycStatus === 'verified') ||
      (s === 2 && userData?.faceTecTid) ||
      (s === 3 && userData?.isTwoFactorEnabled)
    const isActive = step === s

    return (
      <div className={cn(
        "size-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
        isCompleted ? "bg-green-500 text-white" : isActive ? "bg-[#276152] text-white scale-110 shadow-md" : "bg-gray-100 text-gray-400"
      )}>
        {isCompleted ? <CheckCircle2 size={20} /> : React.createElement(icon, { size: 20 })}
      </div>
    )
  }

  if (!userData) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#276152]" /></div>

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-[#111827]">{t("kyc.title")}</h3>
        <p className="text-sm text-gray-500 max-w-[600px]">{t("kyc.subtitle")}</p>
      </div>

      {/* Sequential Stepper */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { id: 1, key: "step_1", icon: ShieldCheck },
          { id: 2, key: "step_2", icon: ScanFace },
          { id: 3, key: "step_3", icon: Key }
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setStep(s.id)}
            className={cn(
              "p-4 rounded-2xl border transition-all flex items-center gap-4 text-left",
              step === s.id ? "bg-white border-[#276152] shadow-sm" : "bg-gray-50/50 border-transparent hover:bg-gray-50"
            )}
          >
            {renderStepIcon(s.id, s.icon)}
            <div className="flex-1">
              <p className={cn("text-[13px] font-bold", step === s.id ? "text-[#276152]" : "text-gray-500")}>
                {t(`kyc.steps.${s.key}`)}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] text-gray-400 lowercase">{t(`kyc.steps.${s.key}_desc`).substring(0, 20)}...</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="pt-2">
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "front", preview: idPhotos.front },
                { label: "back", preview: idPhotos.back },
                { label: "portrait", preview: idPhotos.portrait }
              ].map((item) => (
                <div key={item.label} className="space-y-3">
                  <label className="text-[13px] font-bold text-gray-600 block px-1">
                    {t(`kyc.id_verification.${item.label}`)}
                  </label>
                  <div className="relative group aspect-[4/3] rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-[#276152]/30">
                    {item.preview ? (
                      <img src={item.preview.startsWith('http') ? item.preview : `${import.meta.env.VITE_API_URL.replace('/api', '')}${item.preview}`} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        {isUploading === item.label ? <Loader2 className="animate-spin" /> : <Upload size={24} />}
                        <span className="text-[11px] font-medium">{t(`kyc.id_verification.upload_${item.label}`)}</span>
                      </div>
                    )}

                    {(userData.kycStatus === 'unverified' || userData.kycStatus === 'rejected') && (
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => handleFileUpload(e, item.label as any)}
                        disabled={isUploading !== null}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-gray-800">{t("kyc.id_verification.status_verified")}</h4>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    userData.kycStatus === 'verified' ? "bg-green-100 text-green-600" :
                      userData.kycStatus === 'pending' ? "bg-amber-100 text-amber-600" :
                        userData.kycStatus === 'rejected' ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-400"
                  )}>
                    {t(`kyc.id_verification.status_${userData.kycStatus}`)}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{t("kyc.id_verification.note")}</p>
                {userData.kycStatus === 'rejected' && userData.kycRejectionReason && (
                  <p className="text-xs font-semibold text-red-600 mt-2 bg-red-50 border border-red-100 p-2.5 rounded-xl max-w-[600px] leading-relaxed">
                    {t("kyc.id_verification.rejection_reason")} <span className="font-normal">{userData.kycRejectionReason}</span>
                  </p>
                )}
                <p className="text-xs font-semibold text-emerald-600 mt-2 bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-xl max-w-[600px] leading-relaxed">
                  {t("kyc.id_verification.pending_payment_note")}
                </p>
              </div>

              <Button
                onClick={handleSubmitID}
                disabled={loading || (userData.kycStatus !== 'unverified' && userData.kycStatus !== 'rejected')}
                className="w-full md:w-auto px-10 h-12 rounded-xl bg-[#276152] font-bold text-sm shadow-lg shadow-[#276152]/20"
              >
                {loading ? <Loader2 className="animate-spin" /> : t("kyc.id_verification.submit")}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <Card className="border border-gray-100 overflow-hidden rounded-[24px] p-0 py-0">
              <CardContent className="p-0 flex flex-col md:flex-row items-stretch">
                <div className="md:flex-1 p-10 space-y-6 flex flex-col justify-center">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-800">{t("kyc.facescan.title")}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{t("kyc.facescan.standard")}</p>
                  </div>

                  {userData.kycStatus !== 'verified' ? (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                      <Lock className="size-5 text-amber-500 mt-0.5" />
                      <p className="text-xs text-amber-800 font-medium">{t("kyc.facescan.desc")}</p>
                    </div>
                  ) : userData.faceTecTid ? (
                    <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-green-800 font-bold">{t("kyc.status.verified_title")}</p>
                        <p className="text-[10px] text-green-700 mt-0.5">TID: {userData.faceTecTid}</p>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={handleFaceScan}
                      disabled={loading}
                      className="w-full h-12 rounded-xl bg-[#276152] font-bold"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : t("kyc.facescan.start")}
                    </Button>
                  )}
                </div>
                <div className="md:flex-1 bg-[#276152] flex items-center justify-center p-12 text-white/10">
                  <ScanFace size={240} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <Card className="border border-gray-100 overflow-hidden rounded-[24px] p-0 py-0">
              <CardContent className="p-0 flex flex-col md:flex-row items-stretch">
                <div className="md:w-[40%] bg-gray-50 flex flex-col items-center justify-center p-10 gap-6">
                  <div className="bg-white p-4 rounded-3xl shadow-xl shadow-gray-200/50">
                    {twoFactorData?.qrCodeUrl ? (
                      <img
                        src={twoFactorData.qrCodeUrl}
                        alt="2FA QR Code"
                        className="size-[180px] object-contain"
                      />
                    ) : (
                      <div className="size-[180px] flex items-center justify-center text-gray-400 font-medium text-xs">
                        Generating QR Code...
                      </div>
                    )}
                  </div>
                  <div className="w-full space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block text-center">
                      {t("kyc.google_auth.secret_key")}
                    </label>
                    <div className="bg-white border border-gray-200 px-4 py-3 rounded-xl flex items-center justify-between gap-4 font-mono text-sm tracking-widest text-[#276152] select-all">
                      {twoFactorData?.secret ? twoFactorData.secret.match(/.{1,4}/g)?.join(' ') : "Generating..."}
                      <button 
                        onClick={() => copyToClipboard(twoFactorData?.secret || "")} 
                        disabled={!twoFactorData}
                        className="text-gray-400 hover:text-[#276152] transition-colors shrink-0"
                      >
                        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="md:w-[60%] p-10 space-y-8">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold text-gray-800">{t("kyc.google_auth.title")}</h3>
                      <p className="text-sm text-gray-500">{t("kyc.google_auth.desc")}</p>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed bg-gray-50 p-4 rounded-xl italic">
                      {t("kyc.google_auth.instructions")}
                    </p>
                  </div>

                  {!userData.faceTecTid ? (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                      <Lock className="size-5 text-amber-500 mt-0.5" />
                      <p className="text-xs text-amber-800 font-medium">{t("kyc.errors.step_locked")}</p>
                    </div>
                  ) : userData.isTwoFactorEnabled ? (
                    <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3">
                      <ShieldCheck className="size-6 text-green-500" />
                      <p className="text-sm text-green-800 font-bold">{t("kyc.steps.twofa_enabled")}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[13px] font-bold text-gray-600 block px-1">
                          {t("kyc.google_auth.enter_code", { defaultValue: "Nhập mã 6 chữ số từ ứng dụng:" })}
                        </label>
                        <Input
                          type="text"
                          maxLength={6}
                          placeholder="000000"
                          value={twofaCode}
                          onChange={(e) => setTwofaCode(e.target.value.replace(/\D/g, ''))}
                          className="h-12 text-center text-lg font-bold font-mono tracking-[0.5em] focus:border-[#276152] focus:ring-[#276152] border-[#d5d7db] rounded-xl"
                        />
                      </div>
                      <Button
                        onClick={handleEnable2FA}
                        disabled={loading || twofaCode.length !== 6}
                        className="w-full h-12 rounded-xl bg-[#276152] font-bold shadow-lg shadow-[#276152]/20"
                      >
                        {loading ? <Loader2 className="animate-spin" /> : t("kyc.google_auth.setup")}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Global Security Footer */}
      <div className="bg-[#276152]/5 p-6 rounded-[24px] border border-[#276152]/10 flex items-start gap-4">
        <div className="size-10 rounded-xl bg-[#276152] flex items-center justify-center text-white shrink-0">
          <ShieldAlert size={20} />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-[#276152] text-sm">{t("kyc.security_note")}</p>
          <p className="text-[#276152]/70 text-xs leading-relaxed max-w-[800px]">
            {t("kyc.security_note_desc")}
          </p>
        </div>
      </div>
    </div>
  )
}
