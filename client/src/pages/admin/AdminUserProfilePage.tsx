import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useParams, useNavigate, Link } from "react-router-dom"
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Wallet,
  ArrowLeft,
  Loader2,
  XCircle,
  Clock,
  History,
  TrendingUp,
  Users,
  CreditCard,
  Building2,
  ExternalLink,
  MapPin,
  Flag,
  Image as ImageIcon,
  Eye,
  ChevronRight,
  Network,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import apiClient from "@/lib/axios"
import dayjs from "dayjs"
import { getImageUrl, cn, formatTruncated } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ReferralTreeNode = ({
  user,
  level = 0,
}: {
  user: any
  level?: number
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [children, setChildren] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const toggleOpen = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isOpen && children.length === 0) {
      setLoading(true)
      try {
        const res = await apiClient.get(`/admin/users/${user._id}/referrals`)
        setChildren(res.data)
      } catch (err) {
        toast.error("Could not load referral list")
      } finally {
        setLoading(false)
      }
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className="w-max min-w-full select-none">
      <div
        className={cn(
          "group flex min-w-[1100px] cursor-pointer items-center justify-between rounded-2xl border border-transparent p-4 transition-all hover:bg-gray-50",
          isOpen && "border-gray-100 bg-gray-50 shadow-sm"
        )}
        style={{ paddingLeft: `${level * 28 + 16}px` }}
        onClick={toggleOpen}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-6 w-6 items-center justify-center">
            {loading ? (
              <Loader2 size={16} className="animate-spin text-emerald-600" />
            ) : user.totalSales > 0 || children.length > 0 ? (
              <div
                className={cn(
                  "transition-transform duration-200",
                  isOpen && "rotate-90"
                )}
              >
                <ChevronRight
                  size={20}
                  className="text-gray-400 group-hover:text-[#276152]"
                />
              </div>
            ) : (
              <div className="size-2 rounded-full bg-gray-200" />
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#276152]/10 text-xs font-bold text-[#276152] uppercase">
              {user.username?.substring(0, 2)}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-bold text-gray-900">
                  @{user.username}
                </span>
                <span className="text-[14px] font-semibold text-gray-500">
                  {user.fullName}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "h-5 border-none px-2 text-[10px] font-bold uppercase",
                    user.kycStatus === "verified"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-400"
                  )}
                >
                  {user.kycStatus}
                </Badge>
              </div>
              <span className="font-mono text-[11px] text-gray-400">
                {user.email}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="text-right">
            <p className="mb-0.5 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
              Entire Network
            </p>
            <p className="text-[16px] font-bold text-amber-600">
              {user.totalNetwork || 0}{" "}
              <span className="text-[11px]">members</span>
            </p>
          </div>
          <div className="text-right">
            <p className="mb-0.5 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
              Personal Deposit
            </p>
            <p className="text-[16px] font-bold text-blue-600">
              {user.personalPaid?.toLocaleString()}{" "}
              <span className="text-[11px]">USDT</span>
            </p>
          </div>
          <div className="text-right">
            <p className="mb-0.5 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
              System Sales
            </p>
            <p className="text-[16px] font-bold text-emerald-700">
              {user.totalSales?.toLocaleString()}{" "}
              <span className="text-[11px]">USDT</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-white text-gray-400 opacity-0 shadow-sm transition-all group-hover:opacity-100 hover:text-[#276152]"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/admin/users/${user._id}`)
            }}
          >
            <Eye size={16} />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-max min-w-full"
          >
            {children.length > 0 ? (
              <div className="mt-1 ml-8 border-l-2 border-emerald-50/50">
                {children.map((child: any) => (
                  <ReferralTreeNode
                    key={child._id}
                    user={child}
                    level={level + 1}
                  />
                ))}
              </div>
            ) : (
              !loading && (
                <div className="ml-20 py-3 text-[12px] text-gray-400 italic">
                  No referrals
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const COUNTRY_NAMES: Record<string, string> = {
  "+84": "Vietnam",
  "+1": "United States",
  "+44": "United Kingdom",
  "+49": "Germany",
  "+33": "France",
  "+81": "Japan",
  "+82": "South Korea",
  "+420": "Czech Republic",
  "+86": "China",
  "+886": "Taiwan",
  "+91": "India",
  "+234": "Nigeria",
  "+61": "Australia",
  "+60": "Malaysia",
  "+971": "UAE",
  "+66": "Thailand",
  "+65": "Singapore",
}

export default function AdminUserProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  // Edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [updating, setUpdating] = useState(false)
  const [isRejectReasonDialogOpen, setIsRejectReasonDialogOpen] =
    useState(false)
  const [rejectReason, setRejectReason] = useState("")

  // Manual Deposit state
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false)
  const [depositData, setDepositData] = useState<any>({
    paidAmount: "",
    hash: "",
  })
  const [depositing, setDepositing] = useState(false)

  // Image preview state
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [aqeTypeFilter, setAqeTypeFilter] = useState<string>("ALL")

  useEffect(() => {
    fetchUserDetails()
  }, [id])

  const fetchUserDetails = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get(`/admin/users/${id}`)
      setData(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not load user info")
      navigate("/admin/users")
    } finally {
      setLoading(false)
    }
  }

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      toast.error("Please enter a rejection reason")
      return
    }
    setEditingUser({
      ...editingUser,
      kycStatus: "rejected",
      kycRejectionReason: rejectReason,
    })
    setIsRejectReasonDialogOpen(false)
  }

  const handleRejectCancel = () => {
    setIsRejectReasonDialogOpen(false)
  }

  const handleUpdate = async () => {
    setUpdating(true)
    try {
      await apiClient.put(`/admin/users/${id}`, editingUser)
      toast.success("Information updated successfully")
      setIsEditDialogOpen(false)
      fetchUserDetails() // Refresh data
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not update information")
    } finally {
      setUpdating(false)
    }
  }

  const handleManualDeposit = async () => {
    if (!depositData.paidAmount || !depositData.hash) {
      toast.error("Please fill in all required fields (Amount and Hash)")
      return
    }
    setDepositing(true)
    try {
      await apiClient.post(`/admin/users/${id}/manual-deposit`, depositData)
      toast.success("Manual deposit processed successfully")
      setIsDepositDialogOpen(false)
      fetchUserDetails()
      setDepositData({ paidAmount: "", hash: "" })
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Could not process manual deposit"
      )
    } finally {
      setDepositing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#276152]" />
      </div>
    )
  }

  if (!data) return null

  const { user, transactions, commissions, bonusStats } = data

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 pb-20 font-['SVN-Gilroy',sans-serif]">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-gray-200"
            onClick={() => navigate("/admin/users")}
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="space-y-1">
            <h1 className="text-[28px] font-extrabold tracking-tight text-[#111827]">
              User Details
            </h1>
            <p className="text-[14px] text-[#6b7280]">ID: {user._id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            className={cn(
              "flex h-11 min-w-[120px] items-center justify-center rounded-full border-none px-6 text-[13px] font-bold capitalize",
              user.kycStatus === "verified"
                ? "bg-emerald-100 text-emerald-700"
                : user.kycStatus === "pending"
                  ? "bg-amber-100 text-amber-700"
                  : user.kycStatus === "rejected"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-gray-100 text-gray-600"
            )}
          >
            KYC: {user.kycStatus}
          </Badge>
          <Badge
            className={cn(
              "flex h-11 min-w-[120px] items-center justify-center rounded-full border-none px-6 text-[13px] font-bold",
              user.isActive
                ? "bg-emerald-500 text-white"
                : "bg-rose-500 text-white"
            )}
          >
            {user.isActive ? "Active" : "Locked"}
          </Badge>
          <Button
            className="h-11 rounded-full bg-amber-600 px-6 font-bold shadow-lg shadow-amber-600/10 hover:bg-amber-700"
            onClick={() => {
              setDepositData({
                paidAmount: "",
                hash: "",
              })
              setIsDepositDialogOpen(true)
            }}
          >
            Manual Deposit
          </Button>
          <Button
            className="h-11 rounded-full bg-[#276152] px-8 font-bold shadow-lg shadow-[#276152]/10 hover:bg-[#1e4d41]"
            onClick={() => {
              setEditingUser({ ...user })
              setIsEditDialogOpen(true)
            }}
          >
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column - User Summary */}
        <div className="space-y-6 lg:col-span-4">
          <Card className="overflow-hidden rounded-[24px] border-gray-100 bg-white p-0 shadow-sm">
            <div className="h-24 w-full bg-[#276152]" />
            <CardContent className="-mt-12 px-6 pb-8 text-center">
              <div className="relative inline-block">
                <div className="size-24 rounded-[32px] bg-white p-1.5 shadow-xl">
                  <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[24px] bg-[#d9ede8] text-3xl font-bold text-[#276152] uppercase">
                    {user.avatar ? (
                      <img
                        src={getImageUrl(user.avatar)}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{user.fullName?.charAt(0)}</span>
                    )}
                  </div>
                </div>
                {user.isTwoFactorEnabled && (
                  <div className="absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full border-4 border-white bg-emerald-500 text-white">
                    <ShieldCheck size={14} />
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-1">
                <h2 className="text-[22px] font-bold text-[#111827]">
                  {user.fullName}
                </h2>
                <p className="font-medium text-[#6b7280]">@{user.username}</p>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-[16px] border border-gray-100 bg-[#f8faf9] p-4 text-left">
                  <p className="mb-1 text-[11px] font-bold tracking-wider text-[#868f9e] uppercase">
                    USDT Balance
                  </p>
                  <p className="text-[18px] font-extrabold text-[#276152]">
                    {user.usdtBalance?.toLocaleString()}{" "}
                    <span className="text-xs">USDT</span>
                  </p>
                </div>
                <div className="rounded-[16px] border border-gray-100 bg-[#f8faf9] p-4 text-left">
                  <p className="mb-1 text-[11px] font-bold tracking-wider text-[#868f9e] uppercase">
                    AQE Balance
                  </p>
                  <p className="text-[18px] font-extrabold text-amber-600">
                    {user.aqeBalance?.toLocaleString()}{" "}
                    <span className="text-xs">AQE</span>
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-[16px] border border-[#276152]/20 bg-[#276152] p-4 text-left shadow-md shadow-[#276152]/10">
                <p className="mb-1 text-[11px] font-bold tracking-wider text-white/70 uppercase">
                  System Sales (All Levels)
                </p>
                <div className="flex items-end justify-between">
                  <p className="text-[20px] font-black text-white">
                    {data.totalSales?.toLocaleString() || 0}{" "}
                    <span className="text-xs font-bold">USDT</span>
                  </p>
                  <TrendingUp className="h-5 w-5 text-white/40" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[24px] border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[18px] font-bold">
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-[#f3f4f6] text-gray-500">
                  <Mail size={16} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[11px] font-bold text-gray-400 uppercase">
                    Email
                  </p>
                  <p className="truncate text-[14px] font-medium text-gray-700">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-[#f3f4f6] text-gray-500">
                  <Phone size={16} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[11px] font-bold text-gray-400 uppercase">
                    Phone Number
                  </p>
                  <p className="text-[14px] font-medium text-gray-700">
                    {user.countryCode} {user.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-[#f3f4f6] text-gray-500">
                  <Wallet size={16} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[11px] font-bold text-gray-400 uppercase">
                    Web3 Wallet
                  </p>
                  <p className="truncate font-mono text-[12px] font-medium text-gray-700">
                    {user.walletAddress || "Not connected"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="info" className="w-full space-y-6">
            <TabsList className="h-14 rounded-full border border-gray-100 bg-white p-1 shadow-sm">
              <TabsTrigger
                value="info"
                className="rounded-full px-8 py-2 font-bold transition-all data-[state=active]:bg-[#276152] data-[state=active]:text-white"
              >
                Information
              </TabsTrigger>
              <TabsTrigger
                value="transactions"
                className="rounded-full px-8 py-2 font-bold transition-all data-[state=active]:bg-[#276152] data-[state=active]:text-white"
              >
                Transactions
              </TabsTrigger>
              <TabsTrigger
                value="commissions"
                className="rounded-full px-8 py-2 font-bold transition-all data-[state=active]:bg-[#276152] data-[state=active]:text-white"
              >
                Commissions
              </TabsTrigger>
              <TabsTrigger
                value="referrals"
                className="rounded-full px-8 py-2 font-bold transition-all data-[state=active]:bg-[#276152] data-[state=active]:text-white"
              >
                Referral
              </TabsTrigger>
              <TabsTrigger
                value="aqe"
                className="rounded-full px-8 py-2 font-bold transition-all data-[state=active]:bg-[#276152] data-[state=active]:text-white"
              >
                AQE
              </TabsTrigger>
            </TabsList>

            {/* Tab: Information & Pledge History */}
            <TabsContent value="info" className="space-y-6 outline-none">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card className="rounded-[24px] border-gray-100 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[18px] font-bold">
                      <TrendingUp size={20} className="text-[#276152]" />
                      Current Funding Round
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-end justify-between border-b border-gray-50 pb-4">
                      <div>
                        <p className="mb-1 text-[12px] font-bold text-gray-400 uppercase">
                          Registration Goal
                        </p>
                        <p className="text-[22px] font-extrabold text-[#111827]">
                          {user.pledgeUsdt?.toLocaleString()} USDT
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="mb-1 text-[12px] font-bold text-gray-400 uppercase">
                          Paid
                        </p>
                        <p className="text-[22px] font-extrabold text-[#276152]">
                          {user.paidUsdtPreRegister?.toLocaleString()} USDT
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[13px] font-bold">
                        <span className="text-gray-500">
                          Current Round Progress
                        </span>
                        <span className="text-[#276152]">
                          {user.pledgeUsdt > 0
                            ? Math.round(
                                (user.paidUsdtPreRegister / user.pledgeUsdt) *
                                  100
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full bg-[#276152] transition-all duration-500"
                          style={{
                            width: `${user.pledgeUsdt > 0 ? Math.min(100, (user.paidUsdtPreRegister / user.pledgeUsdt) * 100) : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-[12px] bg-gray-50 p-3 text-[13px] font-medium text-gray-500">
                      <Clock size={16} />
                      <span>
                        Status:{" "}
                        <strong>
                          {user.isPledgeCompleted ? "Completed" : "In Progress"}
                        </strong>
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[24px] border-gray-100 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[18px] font-bold">
                      <User size={20} className="text-[#276152]" />
                      Personal Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-y-4">
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase">
                        Gender
                      </p>
                      <p className="text-[14px] font-medium text-gray-700">
                        {user.gender || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase">
                        Date of Birth
                      </p>
                      <p className="text-[14px] font-medium text-gray-700">
                        {user.birthday
                          ? dayjs(user.birthday).format("DD/MM/YYYY")
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase">
                        Nationality
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Flag size={14} className="text-gray-400" />
                        <p className="text-[14px] font-medium text-gray-700">
                          {user.countryCode &&
                          user.countryCode !== "+84" &&
                          (user.nation === "Việt Nam" ||
                            user.nation === "Vietnam" ||
                            !user.nation)
                            ? `${COUNTRY_NAMES[user.countryCode] || "Other"} (${user.countryCode})`
                            : `${user.nation || COUNTRY_NAMES[user.countryCode] || "Other"} (${user.countryCode || ""})`}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase">
                        Address
                      </p>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-gray-400" />
                        <p className="max-w-[150px] truncate text-[14px] font-medium text-gray-700">
                          {user.address || "—"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase">
                        Registration Date
                      </p>
                      <p className="text-[14px] font-medium text-gray-700">
                        {dayjs(user.createdAt).format("DD/MM/YYYY")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase">
                        Plinko Plays
                      </p>
                      <p className="text-[14px] font-bold text-emerald-600">
                        {user.plinkoPlays ?? 0} plays
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase">
                        Referred By
                      </p>
                      {user.referredBy ? (
                        <Link
                          to={`/admin/users/${user.referredBy._id}`}
                          className="text-[14px] font-bold text-[#276152] hover:underline"
                        >
                          @{user.referredBy.username}
                        </Link>
                      ) : (
                        <p className="text-[14px] font-medium text-gray-400">
                          None (Root)
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* KYC Profile */}
              <Card className="overflow-hidden rounded-[24px] border-gray-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[18px] font-bold">
                    <ShieldCheck size={20} className="text-[#276152]" />
                    KYC Profile & Identity Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-8">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="space-y-3">
                      <p className="ml-1 text-[13px] font-bold tracking-wider text-gray-500 uppercase">
                        ID Card/Passport Front
                      </p>
                      <div className="group relative aspect-[3/2] overflow-hidden rounded-[20px] border border-gray-100 bg-gray-100 shadow-inner">
                        {user.idCardFront ? (
                          <>
                            <img
                              src={getImageUrl(user.idCardFront)}
                              alt="Front ID"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div
                              className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={() =>
                                setPreviewImage(getImageUrl(user.idCardFront))
                              }
                            >
                              <div className="rounded-full bg-white/20 p-3 text-white backdrop-blur-md">
                                <Eye size={24} />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-400">
                            <ImageIcon size={32} strokeWidth={1} />
                            <span className="text-xs font-medium">
                              Not updated
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="ml-1 text-[13px] font-bold tracking-wider text-gray-500 uppercase">
                        ID Card/Passport Back
                      </p>
                      <div className="group relative aspect-[3/2] overflow-hidden rounded-[20px] border border-gray-100 bg-gray-100 shadow-inner">
                        {user.idCardBack ? (
                          <>
                            <img
                              src={getImageUrl(user.idCardBack)}
                              alt="Back ID"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div
                              className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={() =>
                                setPreviewImage(getImageUrl(user.idCardBack))
                              }
                            >
                              <div className="rounded-full bg-white/20 p-3 text-white backdrop-blur-md">
                                <Eye size={24} />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-400">
                            <ImageIcon size={32} strokeWidth={1} />
                            <span className="text-xs font-medium">
                              Not updated
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="ml-1 text-[13px] font-bold tracking-wider text-gray-500 uppercase">
                        Portrait Photo
                      </p>
                      <div className="group relative aspect-[3/2] overflow-hidden rounded-[20px] border border-gray-100 bg-gray-100 shadow-inner">
                        {user.portraitPhoto ? (
                          <>
                            <img
                              src={getImageUrl(user.portraitPhoto)}
                              alt="Portrait"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div
                              className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={() =>
                                setPreviewImage(getImageUrl(user.portraitPhoto))
                              }
                            >
                              <div className="rounded-full bg-white/20 p-3 text-white backdrop-blur-md">
                                <Eye size={24} />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-400">
                            <ImageIcon size={32} strokeWidth={1} />
                            <span className="text-xs font-medium">
                              Not updated
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pre-registration History */}
              <Card className="overflow-hidden rounded-[24px] border-gray-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-[18px] font-bold">
                    <History size={20} className="text-[#276152]" />
                    Pre-registration History
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="rounded-full border-none bg-blue-50 font-bold text-blue-600"
                  >
                    {user.pledgeRounds?.length || 0} Rounds
                  </Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow>
                        <TableHead className="pl-6 font-bold">Round</TableHead>
                        <TableHead className="font-bold">
                          Completed At
                        </TableHead>
                        <TableHead className="text-right font-bold">
                          Pledged Amount
                        </TableHead>
                        <TableHead className="text-right font-bold">
                          Paid
                        </TableHead>
                        <TableHead className="text-center font-bold">
                          Bonus
                        </TableHead>
                        <TableHead className="pr-6 text-right font-bold">
                          Tokens Received
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.pledgeRounds?.length > 0 ? (
                        user.pledgeRounds.map((round: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="pl-6 font-bold">
                              #{round.roundNumber || idx + 1}
                            </TableCell>
                            <TableCell className="text-sm">
                              {dayjs(round.completedAt).format(
                                "DD/MM/YYYY HH:mm"
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {round.pledgeUsdt?.toLocaleString()} USDT
                            </TableCell>
                            <TableCell className="text-right font-bold text-[#276152]">
                              {round.paidUsdt?.toLocaleString()} USDT
                            </TableCell>
                            <TableCell className="text-center">
                              {round.bonusPercent > 0 && (
                                <Badge className="border-none bg-emerald-100 text-[10px] font-bold text-emerald-700">
                                  +{Math.round(round.bonusPercent * 100)}%
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="pr-6 text-right font-bold text-amber-600">
                              {round.tokensReceived?.toLocaleString()} AQE
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="py-12 text-center text-gray-400"
                          >
                            No completed rounds history
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Transactions */}
            <TabsContent value="transactions" className="outline-none">
              <Card className="overflow-hidden rounded-[24px] border-gray-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-[18px] font-bold">
                    <CreditCard size={20} className="text-[#276152]" />
                    Transaction History (Recent)
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="rounded-full border-none bg-emerald-50 px-4 py-1.5 text-[12px] font-bold text-emerald-700"
                  >
                    Total Payments: {data.totalPayments?.toLocaleString() || 0}{" "}
                    USDT
                  </Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow>
                        <TableHead className="pl-6 font-bold">Time</TableHead>
                        <TableHead className="font-bold">Type</TableHead>
                        <TableHead className="font-bold">Method</TableHead>
                        <TableHead className="text-right font-bold">
                          Amount
                        </TableHead>
                        <TableHead className="font-bold">Description</TableHead>
                        <TableHead className="pr-6 text-right font-bold">
                          Hash
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions?.length > 0 ? (
                        transactions.map((tx: any) => (
                          <TableRow key={tx._id}>
                            <TableCell className="pl-6 text-xs text-gray-500">
                              {dayjs(tx.createdAt).format("DD/MM/YYYY HH:mm")}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge
                                  className={cn(
                                    "w-fit rounded-full border-none text-[10px] font-bold",
                                    tx.type === "PAYMENT"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : tx.type === "DEPOSIT"
                                        ? "bg-blue-100 text-blue-700"
                                        : tx.type === "WITHDRAW"
                                          ? "bg-rose-100 text-rose-700"
                                          : "bg-gray-100 text-gray-600"
                                  )}
                                >
                                  {tx.type}
                                </Badge>
                                {tx.metadata?.isManual && (
                                  <Badge className="w-fit border-none bg-amber-100 text-[9px] font-black text-amber-700 uppercase">
                                    Manual
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-[10px] font-bold">
                                {tx.metadata?.method === "QR" ? (
                                  <span className="text-purple-600">
                                    QR Code
                                  </span>
                                ) : (
                                  <span className="text-blue-600">
                                    Wallet Transfer
                                  </span>
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {tx.amount?.toLocaleString()}{" "}
                              {tx.symbol || "USDT"}
                            </TableCell>
                            <TableCell className="max-w-[200px] text-sm text-gray-600">
                              <div className="flex flex-col gap-0.5">
                                <span className="truncate">{tx.description}</span>
                                {tx.metadata?.packageTitle && (
                                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100 font-bold w-fit uppercase select-none leading-none mt-0.5">
                                    Pkg: {tx.metadata.packageTitle}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="pr-6 text-right">
                              {tx.hash ? (
                                <a
                                  href={`https://bscscan.com/tx/${tx.hash}`}
                                  target="_blank"
                                  className="inline-flex items-center gap-1 font-mono text-xs text-gray-400 hover:text-[#276152]"
                                >
                                  {tx.hash.substring(0, 6)}...{" "}
                                  <ExternalLink size={12} />
                                </a>
                              ) : (
                                "System"
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-12 text-center text-gray-400"
                          >
                            No transaction data
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Commissions */}
            <TabsContent value="commissions" className="outline-none">
              <Card className="overflow-hidden rounded-[24px] border-gray-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[18px] font-bold">
                    <TrendingUp size={20} className="text-[#276152]" />
                    Commissions Received
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow>
                        <TableHead className="pl-6 font-bold">Time</TableHead>
                        <TableHead className="font-bold">
                          From Referree
                        </TableHead>
                        <TableHead className="text-right font-bold">
                          Sales
                        </TableHead>
                        <TableHead className="text-right font-bold">
                          Commission
                        </TableHead>
                        <TableHead className="pr-6 text-right font-bold">
                          Description
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions?.length > 0 ? (
                        commissions.map((comm: any) => (
                          <TableRow key={comm._id}>
                            <TableCell className="pl-6 text-xs text-gray-500">
                              {dayjs(comm.createdAt).format("DD/MM/YYYY HH:mm")}
                            </TableCell>
                            <TableCell className="font-bold">
                              @{comm.fromUserId?.username}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {comm.salesAmount?.toLocaleString()} USDT
                            </TableCell>
                            <TableCell className="text-right font-bold text-emerald-600">
                              +{comm.amountUsdt?.toLocaleString()} USDT
                            </TableCell>
                            <TableCell className="pr-6 text-right text-xs text-gray-500 italic">
                              Level {comm.level} Commission ({comm.percentage}%)
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-12 text-center text-gray-400"
                          >
                            No commissions received yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Referral */}
            <TabsContent value="referrals" className="outline-none">
              <div className="space-y-6">
                {/* Referral Summary Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <Card className="rounded-[24px] border-none bg-gradient-to-br from-emerald-50/50 to-white shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                          <Users size={28} />
                        </div>
                        <div>
                          <p className="mb-1 text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                            Direct (F1)
                          </p>
                          <h3 className="text-2xl font-black text-[#111827]">
                            {data.referrals?.length || 0}
                          </h3>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[24px] border-none bg-gradient-to-br from-blue-50/50 to-white shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                          <Network size={28} />
                        </div>
                        <div>
                          <p className="mb-1 text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                            Entire Network
                          </p>
                          <h3 className="text-2xl font-black text-[#111827]">
                            {data.totalNetwork || 0}
                          </h3>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[24px] border-none bg-gradient-to-br from-amber-50/50 to-white shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
                          <TrendingUp size={28} />
                        </div>
                        <div>
                          <p className="mb-1 text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                            System Sales
                          </p>
                          <h3 className="text-2xl font-black text-[#111827]">
                            {data.totalSales?.toLocaleString() || 0}{" "}
                            <span className="text-sm font-bold">USDT</span>
                          </h3>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="overflow-hidden rounded-[32px] border-gray-100 shadow-sm">
                  <CardHeader className="border-b bg-gray-50/30 p-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-[18px] font-bold">
                        <Users size={20} className="text-[#276152]" />
                        Referral Network Tree
                      </CardTitle>
                      <Badge className="rounded-full border-none bg-[#276152] px-4 py-1.5 font-bold text-white">
                        {data.totalNetwork || 0} members
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="custom-scrollbar min-h-[400px] overflow-x-auto p-6">
                    <div className="w-max min-w-full space-y-1">
                      {data.referrals?.length > 0 ? (
                        data.referrals.map((ref: any) => (
                          <ReferralTreeNode key={ref._id} user={ref} />
                        ))
                      ) : (
                        <div className="space-y-4 py-20 text-center">
                          <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-gray-50 text-gray-300">
                            <Users size={40} />
                          </div>
                          <p className="font-medium text-gray-400 italic">
                            This user has not referred anyone yet
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            {/* Tab: AQE Distribution */}
            <TabsContent value="aqe" className="space-y-6 outline-none">
              {/* AQE Bonus Cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card className="rounded-[24px] border-none bg-gradient-to-br from-emerald-50/50 to-white shadow-sm">
                  <CardContent className="space-y-2 p-6">
                    <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                      Total Expected
                    </p>
                    <h3 className="text-2xl font-black text-[#276152]">
                      {formatTruncated(bonusStats?.totalExpected, 5)}{" "}
                      <span className="text-sm font-bold">AQE</span>
                    </h3>
                    <p className="text-xs text-gray-400">
                      Lifetime bonus expected from all packages (6% APR)
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-[24px] border-none bg-gradient-to-br from-blue-50/50 to-white shadow-sm">
                  <CardContent className="space-y-2 p-6">
                    <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                      Total Received
                    </p>
                    <h3 className="text-2xl font-black text-blue-700">
                      {formatTruncated(bonusStats?.totalBonusReceived, 5)}{" "}
                      <span className="text-sm font-bold">AQE</span>
                    </h3>
                    <p className="text-xs text-gray-400">
                      Total daily bonus received so far (yield)
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-[24px] border-none bg-gradient-to-br from-amber-50/50 to-white shadow-sm">
                  <CardContent className="space-y-2 p-6">
                    <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                      Remaining
                    </p>
                    <h3 className="text-2xl font-black text-amber-600">
                      {formatTruncated(bonusStats?.totalRemaining, 5)}{" "}
                      <span className="text-sm font-bold">AQE</span>
                    </h3>
                    <p className="text-xs text-gray-400">
                      Expected future bonus from today onwards
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* AQE Balances Summary */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card className="flex items-center justify-between rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
                  <div>
                    <p className="mb-1 text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                      Claimable Bonus
                    </p>
                    <h3 className="text-xl font-bold text-gray-900">
                      {formatTruncated(bonusStats?.claimableAqeBonus, 5)}{" "}
                      <span className="text-xs">AQE</span>
                    </h3>
                  </div>
                  <Badge className="border-none bg-[#276152]/10 font-bold text-[#276152]">
                    Available
                  </Badge>
                </Card>
                <Card className="flex items-center justify-between rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
                  <div>
                    <p className="mb-1 text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                      Provisional Bonus
                    </p>
                    <h3 className="text-xl font-bold text-gray-900">
                      {formatTruncated(bonusStats?.provisionalAqeBonus, 5)}{" "}
                      <span className="text-xs">AQE</span>
                    </h3>
                  </div>
                  <Badge className="border-none bg-amber-100 font-bold text-amber-700">
                    Accumulated
                  </Badge>
                </Card>
                <Card className="flex items-center justify-between rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
                  <div>
                    <p className="mb-1 text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                      Claimed to USDT
                    </p>
                    <h3 className="text-xl font-bold text-blue-700">
                      {formatTruncated(bonusStats?.totalClaimed, 5)}{" "}
                      <span className="text-xs">USDT</span>
                    </h3>
                  </div>
                  <Badge className="border-none bg-blue-100 font-bold text-blue-700">
                    Claimed
                  </Badge>
                </Card>
              </div>

              <Card className="overflow-hidden rounded-[24px] border-gray-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2 text-[18px] font-bold">
                    <Building2 size={20} className="text-amber-600" />
                    AQE Distribution History
                  </CardTitle>
                  <div className="w-[180px]">
                    <Select value={aqeTypeFilter} onValueChange={setAqeTypeFilter}>
                      <SelectTrigger className="h-9 rounded-full border-gray-200 bg-white px-4 text-xs font-bold text-gray-700">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                        <SelectItem value="ALL">All Types</SelectItem>
                        <SelectItem value="RECEIVE">RECEIVE</SelectItem>
                        <SelectItem value="SWAP">SWAP</SelectItem>
                        <SelectItem value="REWARD">REWARD</SelectItem>
                        <SelectItem value="WITHDRAW">WITHDRAW</SelectItem>
                        <SelectItem value="COMMISSION">COMMISSION</SelectItem>
                        <SelectItem value="BONUS">BONUS</SelectItem>
                        <SelectItem value="CLAIM_BONUS">CLAIM_BONUS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow>
                        <TableHead className="pl-6 font-bold">Time</TableHead>
                        <TableHead className="font-bold">Type</TableHead>
                        <TableHead className="text-right font-bold">
                          Quantity
                        </TableHead>
                        <TableHead className="font-bold">Status</TableHead>
                        <TableHead className="pr-6 text-right font-bold">
                          Description
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.tokenHistory?.filter(
                        (bh: any) => bh.symbol === "AQE" && (aqeTypeFilter === "ALL" || bh.type === aqeTypeFilter)
                      ).length > 0 ? (
                        data.tokenHistory
                          .filter((bh: any) => bh.symbol === "AQE" && (aqeTypeFilter === "ALL" || bh.type === aqeTypeFilter))
                          .map((bh: any) => (
                            <TableRow key={bh._id}>
                              <TableCell className="pl-6 text-xs text-gray-500">
                                {dayjs(bh.createdAt).format("DD/MM/YYYY HH:mm")}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={cn(
                                    "rounded-full border-none text-[10px] font-bold",
                                    bh.type === "RECEIVE"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : bh.type === "REWARD"
                                        ? "bg-purple-100 text-purple-700"
                                        : bh.type === "COMMISSION"
                                          ? "bg-blue-100 text-blue-700"
                                          : "bg-gray-100 text-gray-600"
                                  )}
                                >
                                  {bh.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-bold text-amber-600">
                                {bh.amount?.toLocaleString()} AQE
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "border-none text-[10px] font-bold",
                                    bh.isOfficial
                                      ? "bg-emerald-50 text-emerald-600"
                                      : "bg-amber-50 text-amber-600"
                                  )}
                                >
                                  {bh.isOfficial
                                    ? "Official"
                                    : "Recorded (Pending release)"}
                                </Badge>
                              </TableCell>
                              <TableCell className="pr-6 text-right text-sm text-gray-600">
                                {bh.description}
                              </TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-12 text-center text-gray-400"
                          >
                            No AQE distribution history
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden rounded-[24px] p-0 sm:max-w-[700px]">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-bold text-[#111827]">
              Edit User
            </DialogTitle>
          </DialogHeader>

          <div className="custom-scrollbar flex-1 overflow-y-auto px-6">
            <div className="grid gap-6 py-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-[13px] font-bold tracking-wider text-[#276152] uppercase">
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">
                      Full Name
                    </label>
                    <Input
                      value={editingUser?.fullName || ""}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          fullName: e.target.value,
                        })
                      }
                      className="h-11 rounded-[8px] border-gray-200"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">
                      Date of Birth
                    </label>
                    <Input
                      type="date"
                      value={
                        editingUser?.birthday
                          ? new Date(editingUser.birthday)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          birthday: e.target.value,
                        })
                      }
                      className="h-11 rounded-[8px] border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">
                      Gender
                    </label>
                    <Select
                      value={editingUser?.gender}
                      onValueChange={(v) =>
                        setEditingUser({ ...editingUser, gender: v })
                      }
                    >
                      <SelectTrigger className="!h-11 w-full rounded-[8px] border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nam">Male</SelectItem>
                        <SelectItem value="Nữ">Female</SelectItem>
                        <SelectItem value="Khác">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact & Address */}
              <div className="space-y-4">
                <h4 className="text-[13px] font-bold tracking-wider text-[#276152] uppercase">
                  Contact & Address
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">
                      Email
                    </label>
                    <Input
                      value={editingUser?.email || ""}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          email: e.target.value,
                        })
                      }
                      className="h-11 rounded-[8px] border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">
                      Phone Number
                    </label>
                    <Input
                      value={editingUser?.phone || ""}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          phone: e.target.value,
                        })
                      }
                      className="h-11 rounded-[8px] border-gray-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">
                    Telegram
                  </label>
                  <Input
                    value={editingUser?.telegram || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        telegram: e.target.value,
                      })
                    }
                    className="h-11 rounded-[8px] border-gray-200"
                    placeholder="@username"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">
                    Specific Address
                  </label>
                  <Input
                    value={editingUser?.address || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        address: e.target.value,
                      })
                    }
                    className="h-11 rounded-[8px] border-gray-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">
                      Country
                    </label>
                    <Input
                      value={editingUser?.nation || ""}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          nation: e.target.value,
                        })
                      }
                      className="h-11 rounded-[8px] border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">
                      KYC Status
                    </label>
                    <Select
                      value={editingUser?.kycStatus}
                      onValueChange={(v) => {
                        if (v === "rejected") {
                          setRejectReason(editingUser?.kycRejectionReason || "")
                          setIsRejectReasonDialogOpen(true)
                        } else {
                          setEditingUser({
                            ...editingUser,
                            kycStatus: v,
                            kycRejectionReason: null,
                          })
                        }
                      }}
                    >
                      <SelectTrigger className="!h-11 w-full rounded-[8px] border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unverified">Unverified</SelectItem>
                        <SelectItem value="pending">
                          Pending Verification
                        </SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="rejected">
                          Rejected (Request resubmission)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {editingUser?.kycStatus === "rejected" && (
                    <div className="col-span-2 space-y-2">
                      <label className="text-sm font-bold text-red-500">
                        Rejection Reason
                      </label>
                      <Input
                        value={editingUser?.kycRejectionReason || ""}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            kycRejectionReason: e.target.value,
                          })
                        }
                        className="h-11 rounded-[8px] border-red-200 focus:border-red-500"
                        placeholder="e.g., blurry documents, name mismatch..."
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Finance */}
              <div className="space-y-4">
                <h4 className="text-[13px] font-bold tracking-wider text-[#276152] uppercase">
                  Finance & Account
                </h4>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">
                    Wallet Address (USDT BEP20)
                  </label>
                  <Input
                    value={editingUser?.walletAddress || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        walletAddress: e.target.value,
                      })
                    }
                    className="h-11 rounded-[8px] border-gray-200 font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">
                    Plinko Plays
                  </label>
                  <Input
                    type="number"
                    value={editingUser?.plinkoPlays ?? 0}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        plinkoPlays: parseInt(e.target.value) || 0,
                      })
                    }
                    className="h-11 rounded-[8px] border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">
                    Account Status
                  </label>
                  <Select
                    value={editingUser?.isActive ? "true" : "false"}
                    onValueChange={(v) =>
                      setEditingUser({ ...editingUser, isActive: v === "true" })
                    }
                  >
                    <SelectTrigger className="!h-11 w-full rounded-[8px] border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activated (Active)</SelectItem>
                      <SelectItem value="false">
                        Account Locked / Not activated
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-gray-100 p-6 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="rounded-[8px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updating}
              className="rounded-[8px] bg-[#276152] px-8"
            >
              {updating ? <Loader2 className="animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Deposit Dialog */}
      <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
        <DialogContent className="rounded-[24px] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#111827]">
              Manual Deposit
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500">
                Payment Amount (USDT) *
              </label>
              <Input
                type="number"
                value={depositData.paidAmount}
                onChange={(e) =>
                  setDepositData({ ...depositData, paidAmount: e.target.value })
                }
                placeholder="Actual amount paid by user"
                className="h-11 rounded-[8px] border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500">
                Transaction Hash *
              </label>
              <Input
                value={depositData.hash}
                onChange={(e) =>
                  setDepositData({ ...depositData, hash: e.target.value })
                }
                placeholder="Blockchain transaction hash"
                className="h-11 rounded-[8px] border-gray-200 font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDepositDialogOpen(false)}
              className="rounded-[8px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleManualDeposit}
              disabled={depositing}
              className="rounded-[8px] bg-amber-600 px-8 font-bold hover:bg-amber-700"
            >
              {depositing ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Confirm Deposit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Overlay */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[100000] flex cursor-pointer items-center justify-center bg-black/95 p-4 backdrop-blur-md transition-all duration-300"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-8 right-8 z-[100001] rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation()
              setPreviewImage(null)
            }}
          >
            <XCircle size={32} />
          </button>
          <img
            src={previewImage}
            className="relative z-[100001] max-h-[90vh] max-w-[90vw] animate-in rounded-[16px] object-contain shadow-2xl duration-300 zoom-in-95"
            alt="Preview"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <Dialog
        open={isRejectReasonDialogOpen}
        onOpenChange={setIsRejectReasonDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-600">
              KYC Rejection Reason
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <label className="block text-sm font-semibold text-gray-700">
              Please enter the reason for rejecting this KYC:
            </label>
            <textarea
              className="h-24 w-full rounded-[8px] border border-gray-200 p-3 text-sm focus:ring-1 focus:ring-red-500 focus:outline-none"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Blurry documents, name mismatch..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleRejectCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleRejectConfirm}
              className="bg-red-600 font-bold text-white hover:bg-red-700"
            >
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
