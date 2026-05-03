import React, { useState, useEffect, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import { 
  User, 
  CheckCircle2, 
  Plus, 
  ShieldCheck, 
  ShieldAlert, 
  HelpCircle,
  Loader2,
  Camera,
  Trash,
  Wallet
} from "lucide-react"
import Cropper from 'react-easy-crop'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { 
  Card, 
  CardContent 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { toast } from "sonner"
import apiClient from "@/lib/axios"
import KYCSection from "@/components/profile/KYCSection"
import { getImageUrl } from "@/lib/utils"

// Helper function to create the cropped image
const getCroppedImg = async (imageSrc: string, pixelCrop: any) => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', (error) => reject(error))
    img.setAttribute('crossOrigin', 'anonymous')
    img.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'))
        return
      }
      resolve(blob)
    }, 'image/jpeg')
  })
}

export default function SettingsPage() {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Tab State handled by URL
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "personal")

  useEffect(() => {
    const tParam = searchParams.get('tab')
    if (tParam && tParam !== activeTab) {
      setActiveTab(tParam)
    }
  }, [searchParams])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Optional: update URL when tab changes manually to maintain deep link
    setSearchParams({ tab: value }, { replace: true })
  }
  
  // Profile State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    birthday: "",
    gender: "Nam",
    telegram: "",
    address: "",
    nation: "Việt Nam",
    kycStatus: "unverified",
    avatar: null,
    walletAddress: "",
    bankAccounts: [] as any[],
    isTwoFactorEnabled: false
  })

  // Crop State
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [isCropModalOpen, setIsCropModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Bank Modal State
  const [isBankModalOpen, setIsBankModalOpen] = useState(false)
  const [newBank, setNewBank] = useState({ bankName: "", accountNumber: "", accountName: "", isDefault: false })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/auth/profile")
        const data = response.data
        setFormData({
          ...data,
          birthday: data.birthday ? new Date(data.birthday).toISOString().split('T')[0] : "",
          bankAccounts: data.bankAccounts || [],
          isTwoFactorEnabled: data.isTwoFactorEnabled || false
        })
      } catch (err: any) {
        toast.error(t("settings.fetch_failed"))
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleGenderChange = (value: string) => {
    setFormData({ ...formData, gender: value })
  }

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImageToCrop(reader.result as string)
        setIsCropModalOpen(true)
      })
      reader.readAsDataURL(file)
    }
  }

  const handleApplyCrop = async () => {
    if (!imageToCrop || !croppedAreaPixels) return

    setUploading(true)
    try {
      const croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels)
      if (!croppedImageBlob) return

      const uploadData = new FormData()
      uploadData.append("image", croppedImageBlob, "avatar.jpg")

      const response = await apiClient.post("/auth/upload", uploadData)
      const imageUrl = response.data.imageUrl

      // Update form data
      const updatedFormData = { ...formData, avatar: imageUrl }
      setFormData(updatedFormData)
      
      // Automatically Save to DB
      await apiClient.put("/auth/profile", updatedFormData)
      
      toast.success(t("settings.avatar.update_success"))
      localStorage.setItem("user", JSON.stringify(updatedFormData))
      window.dispatchEvent(new Event("profileUpdate"))
      setIsCropModalOpen(false)
      setImageToCrop(null)
    } catch (err: any) {
      toast.error(t("settings.avatar.process_error"))
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    const usernameRegex = /^[a-z0-9]+$/;
    if (formData.username && !usernameRegex.test(formData.username)) {
      toast.error(t("auth.errors.invalid_username_format"));
      return;
    }

    setSaving(true)
    try {
      const response = await apiClient.put("/auth/profile", formData)
      toast.success(t("settings.save_success"))
      localStorage.setItem("user", JSON.stringify(response.data))
      window.dispatchEvent(new Event("profileUpdate"))
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("errors.update_failed"))
    } finally {
      setSaving(false)
    }
  }

  const handleAddBank = () => {
    if (!newBank.bankName || !newBank.accountNumber || !newBank.accountName) {
      toast.error(t("settings.bank.fill_all"))
      return
    }
    let updatedBanks = [...formData.bankAccounts]
    if (newBank.isDefault) updatedBanks = updatedBanks.map(b => ({ ...b, isDefault: false }))
    
    setFormData({ ...formData, bankAccounts: [...updatedBanks, newBank] })
    setNewBank({ bankName: "", accountNumber: "", accountName: "", isDefault: false })
    setIsBankModalOpen(false)
    toast.info(t("settings.bank.added_note"))
  }

  const handleRemoveBank = (index: number) => {
    const newBanks = formData.bankAccounts.filter((_, i) => i !== index)
    setFormData({ ...formData, bankAccounts: newBanks })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-10 h-10 text-[#276152] animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-[900px] mx-auto py-8 px-4 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[#111827]">{t("settings.title")}</h1>
          <p className="text-sm text-[#6b7280]">{t("settings.subtitle")}</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-[#276152] hover:bg-[#1e4d41] rounded-[8px] font-bold px-8 h-11 w-full sm:w-auto"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("settings.save_changes")}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="bg-transparent h-auto flex w-full justify-start gap-4 sm:gap-8 mb-10 border-b border-[#d5d7db] overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden px-1 rounded-none p-0">
          {[
            { id: "personal", label: t("settings.tabs.personal"), icon: User },
            { id: "kyc", label: t("settings.tabs.kyc"), icon: ShieldAlert },
            { id: "support", label: t("settings.tabs.support"), icon: HelpCircle },
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="px-2 sm:px-4 py-3 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[#276152] data-[state=active]:font-bold data-[state=active]:border-b-2 data-[state=active]:border-[#276152] border-0 border-b-2 border-transparent transition-all duration-300 flex items-center justify-center gap-2 text-[#868f9e] font-medium text-[14px] sm:text-[16px] !shadow-none data-[state=active]:!shadow-none outline-none focus:ring-0"
            >
              <tab.icon className="w-6 h-6" />
              <span>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="personal" className="mt-8 space-y-8">
          {/* Avatar Section */}
          <Card className="border border-gray-100 shadow-none rounded-[16px]">
            <CardContent className="py-10 flex flex-col items-center justify-center">
              <Avatar className="w-24 h-24 bg-[#1e4d40] text-white overflow-hidden">
                {formData.avatar && <AvatarImage src={getImageUrl(formData.avatar)} className="object-cover" />}
                <AvatarFallback className="text-3xl font-bold bg-[#1e4d40]">
                  {formData.fullName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="mt-6 flex items-center gap-6">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[13px] font-medium px-4 py-1.5 border border-gray-200 rounded-[4px] hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                  <Camera size={14} /> {t("settings.avatar.change")}
                </button>
                <button onClick={() => setFormData({...formData, avatar: null})} className="text-[13px] font-medium text-red-500 hover:underline">{t("settings.avatar.delete")}</button>
              </div>
            </CardContent>
          </Card>

          {/* Form Content Card */}
          <Card className="border border-gray-100 shadow-none rounded-[16px]">
            <CardContent className="p-8 space-y-12">
              {/* Basic Info */}
              <div className="space-y-6">
                <h3 className="text-[16px] font-bold text-[#111827] border-b border-gray-100 pb-3">{t("settings.basic_info.title")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-gray-500">{t("settings.basic_info.full_name")}</Label>
                    <Input name="fullName" value={formData.fullName} onChange={handleChange} className="h-11 border-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-gray-500">{t("settings.basic_info.username")}</Label>
                    <Input name="username" value={formData.username} onChange={handleChange} className="h-11 border-gray-200" />
                    <p className="text-[10px] text-amber-600 font-medium">{t("settings.basic_info.username_note")}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-gray-500">{t("settings.basic_info.birthday")}</Label>
                    <Input type="date" name="birthday" value={formData.birthday} onChange={handleChange} className="h-11 border-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-gray-500">{t("settings.basic_info.gender")}</Label>
                    <Select value={formData.gender} onValueChange={handleGenderChange}>
                      <SelectTrigger className="!h-11 w-full border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nam">{t("settings.basic_info.genders.male")}</SelectItem>
                        <SelectItem value="Nữ">{t("settings.basic_info.genders.female")}</SelectItem>
                        <SelectItem value="Khác">{t("settings.basic_info.genders.other")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-6">
                <h3 className="text-[16px] font-bold text-[#111827] border-b border-gray-100 pb-3">{t("settings.contact.title")}</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-gray-500">{t("settings.contact.email")}</Label>
                    <div className="relative">
                      <Input value={formData.email} disabled className="h-11 pr-24 bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed" />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#d9ede8] text-[#1e4d40] text-[11px] font-bold rounded">
                          <CheckCircle2 size={12} /> {t("settings.contact.verified")}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-gray-500">{t("settings.contact.phone")}</Label>
                    <Input 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleChange} 
                      placeholder="0912345678"
                      className="h-11 border-gray-200 focus:ring-1 focus:ring-[#276152]" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-gray-500">{t("settings.contact.telegram")}</Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</div>
                      <Input name="telegram" value={formData.telegram} onChange={handleChange} className="h-11 border-gray-200 pl-7" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-6">
                <h3 className="text-[16px] font-bold text-[#111827] border-b border-gray-100 pb-3">{t("settings.address.title")}</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-gray-500">{t("settings.address.street")}</Label>
                    <Input name="address" value={formData.address} onChange={handleChange} className="h-11 border-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-gray-500">{t("settings.address.country")}</Label>
                    <Select value={formData.nation} onValueChange={(v) => setFormData({...formData, nation: v})}>
                      <SelectTrigger className="!h-11 w-full border-gray-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Việt Nam">{t("settings.address.countries.vietnam")}</SelectItem>
                        <SelectItem value="USA">{t("settings.address.countries.usa")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Wallet Address */}
              <div className="space-y-6">
                <h3 className="text-[16px] font-bold text-[#111827] border-b border-gray-100 pb-3">{t("settings.wallet.title")}</h3>
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-gray-500">{t("settings.wallet.address")}</Label>
                  <div className="relative">
                    <Input 
                      name="walletAddress" 
                      value={formData.walletAddress || ""} 
                      onChange={handleChange} 
                      placeholder="0x..."
                      className="h-11 border-gray-200 pl-10 focus:ring-1 focus:ring-[#276152]" 
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Wallet className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-[11px] text-[#6b7280]">{t("settings.wallet.note")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Accounts */}
          <Card className="border border-gray-100 shadow-none rounded-[16px]">
            <CardContent className="p-8 space-y-6">
              <h3 className="text-[16px] font-bold text-[#111827]">{t("settings.bank.title")}</h3>
              <div className="space-y-3">
                {formData.bankAccounts.map((bank, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-[#f8faf9] border border-gray-100 rounded-[12px]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center font-bold text-gray-400 text-xs">{(bank.bankName || 'XX').substring(0,2).toUpperCase()}</div>
                      <div>
                        <p className="text-[14px] font-bold text-[#111827]">{bank.bankName}</p>
                        <p className="text-[13px] text-gray-500 font-mono">**** **** {bank.accountNumber?.slice(-4)}</p>
                        <p className="text-[11px] text-gray-400 font-medium uppercase">{bank.accountName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {bank.isDefault && <Badge className="bg-[#d9ede8] text-[#1e4d40]">{t("settings.bank.default")}</Badge>}
                      <button onClick={() => handleRemoveBank(index)} className="text-red-500 hover:underline transition-all"><Trash size={16} /></button>
                    </div>
                  </div>
                ))}
                <Dialog open={isBankModalOpen} onOpenChange={setIsBankModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full border-2 border-dashed border-[#d9ede8] text-[#276152] font-bold h-12 rounded-[12px] hover:bg-[#276152]/5">
                      <Plus size={18} className="mr-2" /> {t("settings.bank.add_account")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader><DialogTitle>{t("settings.bank.dialog_title")}</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="flex flex-col sm:grid sm:grid-cols-4 sm:items-center gap-2 sm:gap-4">
                        <Label className="sm:text-right">{t("settings.bank.bank_name")}</Label>
                        <Input value={newBank.bankName} onChange={(e) => setNewBank({...newBank, bankName: e.target.value})} className="col-span-3 h-10" />
                      </div>
                      <div className="flex flex-col sm:grid sm:grid-cols-4 sm:items-center gap-2 sm:gap-4">
                        <Label className="sm:text-right">{t("settings.bank.account_holder")}</Label>
                        <Input value={newBank.accountName} onChange={(e) => setNewBank({...newBank, accountName: e.target.value.toUpperCase()})} className="col-span-3 h-10 uppercase" placeholder="NGUYEN VAN A" />
                      </div>
                      <div className="flex flex-col sm:grid sm:grid-cols-4 sm:items-center gap-2 sm:gap-4">
                        <Label className="sm:text-right">{t("settings.bank.account_number")}</Label>
                        <Input value={newBank.accountNumber} onChange={(e) => setNewBank({...newBank, accountNumber: e.target.value})} className="col-span-3 h-10" />
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        <input type="checkbox" id="default-bank" checked={newBank.isDefault} onChange={(e) => setNewBank({...newBank, isDefault: e.target.checked})} />
                        <Label htmlFor="default-bank">{t("settings.bank.set_default")}</Label>
                      </div>
                    </div>
                    <DialogFooter><Button onClick={handleAddBank} className="bg-[#276152]">{t("settings.bank.confirm")}</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kyc" className="mt-8">
          <KYCSection initialData={formData} />
        </TabsContent>

        <TabsContent value="support" className="mt-8">
            <Card className="border border-gray-100 shadow-none rounded-[16px]">
                <CardContent className="p-8">
                    <p className="text-sm text-gray-500 text-center py-10">{t("settings.support_tab.dev")}</p>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      {/* Image Crop Modal */}
      <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
        <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col">
          <DialogHeader><DialogTitle>{t("settings.avatar.crop_title")}</DialogTitle></DialogHeader>
          <div className="flex-1 relative bg-gray-900 rounded-lg overflow-hidden mt-4">
            {imageToCrop && (
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">{t("settings.avatar.zoom")}</span>
              <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-[#276152]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCropModalOpen(false)}>{t("settings.avatar.cancel")}</Button>
            <Button onClick={handleApplyCrop} disabled={uploading} className="bg-[#276152]">
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t("settings.avatar.apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

