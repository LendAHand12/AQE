import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ChevronDown, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import apiClient from "@/lib/axios"

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
]

interface FormState {
  fullName: string
  phone: string
  countryCode: string
  email: string
  idCode: string
  outputToken: "QHEWE" | "AQE"
  amount: string
  fromWalletAddress: string
  txHash: string
}

export default function AdminCreateSwapRequestPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState<FormState>({
    fullName: "",
    phone: "",
    countryCode: "+84",
    email: "",
    idCode: "",
    outputToken: "QHEWE",
    amount: "",
    fromWalletAddress: "",
    txHash: "",
  })
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (
      !form.fullName ||
      !form.phone ||
      !form.email ||
      !form.idCode ||
      !form.amount ||
      !form.txHash
    ) {
      toast.error("Please fill in all required fields")
      return
    }
    if (isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setSubmitting(true)
    try {
      const res = await apiClient.post("/swap/admin/manual", {
        fullName: form.fullName,
        phone: form.phone,
        countryCode: form.countryCode,
        email: form.email,
        idCode: form.idCode,
        outputToken: form.outputToken,
        amount: Number(form.amount),
        fromWalletAddress: form.fromWalletAddress || undefined,
        txHash: form.txHash,
      })
      toast.success("Swap request created successfully")
      navigate(`/admin/swap-requests/${res.data._id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not create swap request")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-[700px] space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full border-gray-200"
          onClick={() => navigate("/admin/swap-requests")}
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="space-y-1">
          <h1 className="text-[24px] font-extrabold tracking-tight text-[#111827]">New Manual Swap Request</h1>
          <p className="text-[13px] text-[#6b7280]">
            For a user who already sent HEWE on-chain but couldn't submit the request in-app.
          </p>
        </div>
      </div>

      <Card className="rounded-[24px] border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[16px] font-bold">Recipient Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
            <Input
              value={form.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
              placeholder="Enter recipient's full name"
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
            <div className="relative group">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-0 z-20 text-[#111827]">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="flex items-center gap-1 px-2 py-1 bg-transparent hover:bg-gray-100 rounded-[4px] transition-colors"
                  >
                    <img
                      src={`https://flagcdn.com/w20/${COUNTRIES.find((c) => c.code === form.countryCode)?.iso}.png`}
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
                                updateField("countryCode", c.code)
                                setShowCountryDropdown(false)
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
                  let val = e.target.value.replace(/\D/g, "")
                  if (val.startsWith("0")) val = val.substring(1)
                  updateField("phone", val)
                }}
                placeholder="Enter phone number"
                className="w-full h-12 pl-[70px] pr-4 bg-white border border-input rounded-xl outline-none focus:border-[#276152] focus:ring-1 focus:ring-[#276152] transition-all text-[#111827] placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="Enter recipient's email address"
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">ID Code</label>
            <Input
              value={form.idCode}
              onChange={(e) => updateField("idCode", e.target.value)}
              placeholder="Enter recipient's ID code"
              className="h-12 rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[24px] border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[16px] font-bold">Conversion Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Convert To</label>
            <div className="grid grid-cols-2 gap-3">
              {(["QHEWE", "AQE"] as const).map((tokenOption) => (
                <button
                  key={tokenOption}
                  type="button"
                  onClick={() => updateField("outputToken", tokenOption)}
                  className={`h-12 rounded-xl border-2 font-bold transition-all ${
                    form.outputToken === tokenOption
                      ? "border-[#276152] bg-[#276152]/5 text-[#276152]"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {tokenOption}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Amount (HEWE)</label>
            <Input
              type="number"
              min="0"
              step="any"
              value={form.amount}
              onChange={(e) => updateField("amount", e.target.value)}
              placeholder="Enter the amount the user sent"
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Sender Wallet Address (AMC20)</label>
            <Input
              value={form.fromWalletAddress}
              onChange={(e) => updateField("fromWalletAddress", e.target.value)}
              placeholder="Wallet the user sent HEWE from (optional)"
              className="h-12 rounded-xl font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Transaction Hash</label>
            <Input
              value={form.txHash}
              onChange={(e) => updateField("txHash", e.target.value)}
              placeholder="Paste the on-chain HEWE transfer hash"
              className="h-12 rounded-xl font-mono"
            />
            <p className="text-[11px] text-gray-400 italic">
              Verify this transaction on the AMC20 explorer before creating the request.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="h-14 w-full rounded-2xl bg-[#276152] font-bold text-white hover:bg-[#1e4d41]"
      >
        {submitting ? <Loader2 className="mr-2 animate-spin" size={18} /> : <Save className="mr-2" size={18} />}
        Create Swap Request
      </Button>
    </div>
  )
}
