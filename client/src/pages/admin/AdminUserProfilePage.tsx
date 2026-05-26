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
  Network
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
  TableRow 
} from "@/components/ui/table"
import { toast } from "sonner"
import apiClient from "@/lib/axios"
import dayjs from "dayjs"
import { getImageUrl, cn } from "@/lib/utils"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"

const ReferralTreeNode = ({ user, level = 0 }: { user: any; level?: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const toggleOpen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && children.length === 0) {
      setLoading(true);
      try {
        const res = await apiClient.get(`/admin/users/${user._id}/referrals`);
        setChildren(res.data);
      } catch (err) {
        toast.error("Could not load referral list");
      } finally {
        setLoading(false);
      }
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="select-none w-max min-w-full">
      <div 
        className={cn(
          "flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-all cursor-pointer group border border-transparent min-w-[1100px]",
          isOpen && "bg-gray-50 border-gray-100 shadow-sm"
        )}
        style={{ paddingLeft: `${level * 28 + 16}px` }}
        onClick={toggleOpen}
      >
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 flex items-center justify-center">
            {loading ? (
              <Loader2 size={16} className="animate-spin text-emerald-600" />
            ) : (
              (user.totalSales > 0 || children.length > 0) ? (
                <div className={cn("transition-transform duration-200", isOpen && "rotate-90")}>
                   <ChevronRight size={20} className="text-gray-400 group-hover:text-[#276152]" />
                </div>
              ) : (
                <div className="size-2 rounded-full bg-gray-200" />
              )
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-[#276152]/10 flex items-center justify-center text-[#276152] font-bold text-xs uppercase">
              {user.username?.substring(0, 2)}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[16px] text-gray-900">@{user.username}</span>
                <span className="text-[14px] text-gray-500 font-semibold">{user.fullName}</span>
                <Badge variant="outline" className={cn(
                  "text-[10px] h-5 px-2 font-bold uppercase border-none",
                  user.kycStatus === 'verified' ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"
                )}>
                  {user.kycStatus}
                </Badge>
              </div>
              <span className="text-[11px] text-gray-400 font-mono">{user.email}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">Entire Network</p>
            <p className="text-[16px] font-bold text-amber-600">{user.totalNetwork || 0} <span className="text-[11px]">members</span></p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">Personal Deposit</p>
            <p className="text-[16px] font-bold text-blue-600">{user.personalPaid?.toLocaleString()} <span className="text-[11px]">USDT</span></p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">System Sales</p>
            <p className="text-[16px] font-bold text-emerald-700">{user.totalSales?.toLocaleString()} <span className="text-[11px]">USDT</span></p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-full bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-all text-gray-400 hover:text-[#276152]"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/users/${user._id}`);
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
              <div className="mt-1 border-l-2 border-emerald-50/50 ml-8">
                {children.map((child: any) => (
                  <ReferralTreeNode key={child._id} user={child} level={level + 1} />
                ))}
              </div>
            ) : !loading && (
              <div className="py-3 text-[12px] text-gray-400 italic ml-20">
                 No referrals
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function AdminUserProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  
  // Edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [updating, setUpdating] = useState(false)

  // Manual Deposit state
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false)
  const [depositData, setDepositData] = useState<any>({
    pledgeAmount: "",
    paidAmount: "",
    hash: ""
  })
  const [depositing, setDepositing] = useState(false)
  
  // Image preview state
  const [previewImage, setPreviewImage] = useState<string | null>(null)

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
      setDepositData({ pledgeAmount: "", paidAmount: "", hash: "" })
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not process manual deposit")
    } finally {
      setDepositing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-10 h-10 text-[#276152] animate-spin" />
      </div>
    )
  }

  if (!data) return null

  const { user, transactions, commissions, interestStats } = data

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20 font-['SVN-Gilroy',sans-serif]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            <h1 className="text-[28px] font-extrabold text-[#111827] tracking-tight">User Details</h1>
            <p className="text-[#6b7280] text-[14px]">ID: {user._id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <Badge className={cn(
             "h-11 px-6 rounded-full text-[13px] font-bold border-none capitalize flex items-center justify-center min-w-[120px]",
             user.kycStatus === 'verified' ? "bg-emerald-100 text-emerald-700" :
             user.kycStatus === 'pending' ? "bg-amber-100 text-amber-700" :
             user.kycStatus === 'rejected' ? "bg-rose-100 text-rose-700" : "bg-gray-100 text-gray-600"
           )}>
             KYC: {user.kycStatus}
           </Badge>
           <Badge className={cn(
             "h-11 px-6 rounded-full text-[13px] font-bold border-none flex items-center justify-center min-w-[120px]",
             user.isActive ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
           )}>
             {user.isActive ? "Active" : "Locked"}
           </Badge>
           <Button 
             className="h-11 bg-amber-600 hover:bg-amber-700 rounded-full px-6 font-bold shadow-lg shadow-amber-600/10"
             onClick={() => {
               setDepositData({
                 pledgeAmount: (user.pledgeUsdt || 0).toString(),
                 paidAmount: "",
                 hash: ""
               })
               setIsDepositDialogOpen(true)
             }}
           >
             Manual Deposit
           </Button>
           <Button 
             className="h-11 bg-[#276152] hover:bg-[#1e4d41] rounded-full px-8 font-bold shadow-lg shadow-[#276152]/10"
             onClick={() => {
               setEditingUser({...user})
               setIsEditDialogOpen(true)
             }}
           >
             Edit
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - User Summary */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-[24px] overflow-hidden border-gray-100 shadow-sm bg-white p-0">
            <div className="h-24 bg-[#276152] w-full" />
            <CardContent className="px-6 pb-8 -mt-12 text-center">
              <div className="inline-block relative">
                <div className="size-24 rounded-[32px] bg-white p-1.5 shadow-xl">
                  <div className="w-full h-full rounded-[24px] bg-[#d9ede8] flex items-center justify-center text-3xl font-bold text-[#276152] overflow-hidden uppercase">
                    {user.avatar ? (
                      <img src={getImageUrl(user.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{user.fullName?.charAt(0)}</span>
                    )}
                  </div>
                </div>
                {user.isTwoFactorEnabled && (
                  <div className="absolute bottom-0 right-0 size-7 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center text-white">
                    <ShieldCheck size={14} />
                  </div>
                )}
              </div>
              
              <div className="mt-4 space-y-1">
                <h2 className="text-[22px] font-bold text-[#111827]">{user.fullName}</h2>
                <p className="text-[#6b7280] font-medium">@{user.username}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-8">
                <div className="bg-[#f8faf9] p-4 rounded-[16px] text-left border border-gray-100">
                  <p className="text-[11px] text-[#868f9e] font-bold uppercase tracking-wider mb-1">USDT Balance</p>
                  <p className="text-[18px] font-extrabold text-[#276152]">{user.usdtBalance?.toLocaleString()} <span className="text-xs">USDT</span></p>
                </div>
                <div className="bg-[#f8faf9] p-4 rounded-[16px] text-left border border-gray-100">
                  <p className="text-[11px] text-[#868f9e] font-bold uppercase tracking-wider mb-1">AQE Balance</p>
                  <p className="text-[18px] font-extrabold text-amber-600">{user.aqeBalance?.toLocaleString()} <span className="text-xs">AQE</span></p>
                </div>
              </div>

              <div className="mt-3 bg-[#276152] p-4 rounded-[16px] text-left shadow-md shadow-[#276152]/10 border border-[#276152]/20">
                <p className="text-[11px] text-white/70 font-bold uppercase tracking-wider mb-1">System Sales (All Levels)</p>
                <div className="flex justify-between items-end">
                  <p className="text-[20px] font-black text-white">{data.totalSales?.toLocaleString() || 0} <span className="text-xs font-bold">USDT</span></p>
                  <TrendingUp className="text-white/40 w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[24px] border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[18px] font-bold">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-[#f3f4f6] flex items-center justify-center text-gray-500">
                  <Mail size={16} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[11px] text-gray-400 font-bold uppercase">Email</p>
                  <p className="text-[14px] font-medium text-gray-700 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-[#f3f4f6] flex items-center justify-center text-gray-500">
                  <Phone size={16} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[11px] text-gray-400 font-bold uppercase">Phone Number</p>
                  <p className="text-[14px] font-medium text-gray-700">{user.countryCode} {user.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-[#f3f4f6] flex items-center justify-center text-gray-500">
                  <Wallet size={16} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[11px] text-gray-400 font-bold uppercase">Web3 Wallet</p>
                  <p className="text-[12px] font-mono font-medium text-gray-700 truncate">{user.walletAddress || "Not connected"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="info" className="w-full space-y-6">
            <TabsList className="bg-white p-1 rounded-full border border-gray-100 h-14 shadow-sm">
              <TabsTrigger 
                value="info" 
                className="rounded-full px-8 py-2 data-[state=active]:bg-[#276152] data-[state=active]:text-white transition-all font-bold"
              >
                Information
              </TabsTrigger>
              <TabsTrigger 
                value="transactions" 
                className="rounded-full px-8 py-2 data-[state=active]:bg-[#276152] data-[state=active]:text-white transition-all font-bold"
              >
                Transactions
              </TabsTrigger>
              <TabsTrigger 
                value="commissions" 
                className="rounded-full px-8 py-2 data-[state=active]:bg-[#276152] data-[state=active]:text-white transition-all font-bold"
              >
                Commissions
              </TabsTrigger>
              <TabsTrigger 
                value="referrals" 
                className="rounded-full px-8 py-2 data-[state=active]:bg-[#276152] data-[state=active]:text-white transition-all font-bold"
              >
                Referral
              </TabsTrigger>
              <TabsTrigger 
                value="aqe" 
                className="rounded-full px-8 py-2 data-[state=active]:bg-[#276152] data-[state=active]:text-white transition-all font-bold"
              >
                AQE
              </TabsTrigger>
            </TabsList>

            {/* Tab: Information & Pledge History */}
            <TabsContent value="info" className="space-y-6 outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card className="rounded-[24px] border-gray-100 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-[18px] font-bold flex items-center gap-2">
                        <TrendingUp size={20} className="text-[#276152]" />
                        Current Funding Round
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                       <div className="flex justify-between items-end border-b border-gray-50 pb-4">
                          <div>
                             <p className="text-[12px] text-gray-400 font-bold uppercase mb-1">Registration Goal</p>
                             <p className="text-[22px] font-extrabold text-[#111827]">{user.pledgeUsdt?.toLocaleString()} USDT</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[12px] text-gray-400 font-bold uppercase mb-1">Paid</p>
                             <p className="text-[22px] font-extrabold text-[#276152]">{user.paidUsdtPreRegister?.toLocaleString()} USDT</p>
                          </div>
                       </div>

                       <div className="space-y-2">
                          <div className="flex justify-between text-[13px] font-bold">
                             <span className="text-gray-500">Current Round Progress</span>
                             <span className="text-[#276152]">
                               {user.pledgeUsdt > 0 ? Math.round((user.paidUsdtPreRegister / user.pledgeUsdt) * 100) : 0}%
                             </span>
                          </div>
                          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                             <div 
                               className="h-full bg-[#276152] transition-all duration-500" 
                               style={{ width: `${user.pledgeUsdt > 0 ? Math.min(100, (user.paidUsdtPreRegister / user.pledgeUsdt) * 100) : 0}%` }}
                             />
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-2 text-[13px] font-medium text-gray-500 bg-gray-50 p-3 rounded-[12px]">
                         <Clock size={16} />
                         <span>Status: <strong>{user.isPledgeCompleted ? "Completed" : "In Progress"}</strong></span>
                       </div>
                    </CardContent>
                 </Card>

                 <Card className="rounded-[24px] border-gray-100 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-[18px] font-bold flex items-center gap-2">
                        <User size={20} className="text-[#276152]" />
                        Personal Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-y-4">
                        <div>
                          <p className="text-[11px] text-gray-400 font-bold uppercase">Gender</p>
                          <p className="text-[14px] font-medium text-gray-700">{user.gender || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-400 font-bold uppercase">Date of Birth</p>
                          <p className="text-[14px] font-medium text-gray-700">{user.birthday ? dayjs(user.birthday).format("DD/MM/YYYY") : "—"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-400 font-bold uppercase">Nationality</p>
                          <div className="flex items-center gap-1.5">
                            <Flag size={14} className="text-gray-400" />
                            <p className="text-[14px] font-medium text-gray-700">
                              {user.countryCode === "+1" ? "United States (+1)" : user.countryCode === "+84" ? "Vietnam (+84)" : `${user.nation || "Other"} (${user.countryCode || ""})`}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-400 font-bold uppercase">Address</p>
                          <div className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-gray-400" />
                            <p className="text-[14px] font-medium text-gray-700 truncate max-w-[150px]">{user.address || "—"}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-400 font-bold uppercase">Registration Date</p>
                          <p className="text-[14px] font-medium text-gray-700">{dayjs(user.createdAt).format("DD/MM/YYYY")}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-400 font-bold uppercase">Referred By</p>
                          {user.referredBy ? (
                            <Link 
                              to={`/admin/users/${user.referredBy._id}`}
                              className="text-[14px] font-bold text-[#276152] hover:underline"
                            >
                              @{user.referredBy.username}
                            </Link>
                          ) : (
                            <p className="text-[14px] font-medium text-gray-400">None (Root)</p>
                          )}
                        </div>
                    </CardContent>
                 </Card>
              </div>

              {/* KYC Profile */}
              <Card className="rounded-[24px] border-gray-100 shadow-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-[18px] font-bold flex items-center gap-2">
                    <ShieldCheck size={20} className="text-[#276152]" />
                    KYC Profile & Identity Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <p className="text-[13px] font-bold text-gray-500 uppercase tracking-wider ml-1">ID Card/Passport Front</p>
                      <div className="group relative aspect-[3/2] rounded-[20px] overflow-hidden bg-gray-100 border border-gray-100 shadow-inner">
                        {user.idCardFront ? (
                          <>
                            <img src={getImageUrl(user.idCardFront)} alt="Front ID" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div 
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                              onClick={() => setPreviewImage(getImageUrl(user.idCardFront))}
                            >
                              <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white">
                                <Eye size={24} />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                            <ImageIcon size={32} strokeWidth={1} />
                            <span className="text-xs font-medium">Not updated</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[13px] font-bold text-gray-500 uppercase tracking-wider ml-1">ID Card/Passport Back</p>
                      <div className="group relative aspect-[3/2] rounded-[20px] overflow-hidden bg-gray-100 border border-gray-100 shadow-inner">
                        {user.idCardBack ? (
                          <>
                            <img src={getImageUrl(user.idCardBack)} alt="Back ID" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div 
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                              onClick={() => setPreviewImage(getImageUrl(user.idCardBack))}
                            >
                              <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white">
                                <Eye size={24} />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                            <ImageIcon size={32} strokeWidth={1} />
                            <span className="text-xs font-medium">Not updated</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[13px] font-bold text-gray-500 uppercase tracking-wider ml-1">Portrait Photo</p>
                      <div className="group relative aspect-[3/2] rounded-[20px] overflow-hidden bg-gray-100 border border-gray-100 shadow-inner">
                        {user.portraitPhoto ? (
                          <>
                            <img src={getImageUrl(user.portraitPhoto)} alt="Portrait" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div 
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                              onClick={() => setPreviewImage(getImageUrl(user.portraitPhoto))}
                            >
                              <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white">
                                <Eye size={24} />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                            <ImageIcon size={32} strokeWidth={1} />
                            <span className="text-xs font-medium">Not updated</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pre-registration History */}
              <Card className="rounded-[24px] border-gray-100 shadow-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-[18px] font-bold flex items-center gap-2">
                    <History size={20} className="text-[#276152]" />
                    Pre-registration History
                  </CardTitle>
                  <Badge variant="outline" className="rounded-full bg-blue-50 text-blue-600 border-none font-bold">
                    {user.pledgeRounds?.length || 0} Rounds
                  </Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow>
                        <TableHead className="pl-6 font-bold">Round</TableHead>
                        <TableHead className="font-bold">Completed At</TableHead>
                        <TableHead className="font-bold text-right">Pledged Amount</TableHead>
                        <TableHead className="font-bold text-right">Paid</TableHead>
                        <TableHead className="font-bold text-center">Bonus</TableHead>
                        <TableHead className="pr-6 font-bold text-right">Tokens Received</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.pledgeRounds?.length > 0 ? (
                        user.pledgeRounds.map((round: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="pl-6 font-bold">#{round.roundNumber || idx + 1}</TableCell>
                            <TableCell className="text-sm">{dayjs(round.completedAt).format("DD/MM/YYYY HH:mm")}</TableCell>
                            <TableCell className="text-right font-medium">{round.pledgeUsdt?.toLocaleString()} USDT</TableCell>
                            <TableCell className="text-right font-bold text-[#276152]">{round.paidUsdt?.toLocaleString()} USDT</TableCell>
                            <TableCell className="text-center">
                              {round.bonusPercent > 0 && (
                                <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold text-[10px]">
                                  +{Math.round(round.bonusPercent * 100)}%
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="pr-6 text-right font-bold text-amber-600">{round.tokensReceived?.toLocaleString()} AQE</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="py-12 text-center text-gray-400">
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
               <Card className="rounded-[24px] border-gray-100 shadow-sm overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-[18px] font-bold flex items-center gap-2">
                      <CreditCard size={20} className="text-[#276152]" />
                      Transaction History (Recent)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-gray-50/50">
                        <TableRow>
                          <TableHead className="pl-6 font-bold">Time</TableHead>
                          <TableHead className="font-bold">Type</TableHead>
                          <TableHead className="font-bold">Method</TableHead>
                          <TableHead className="font-bold text-right">Amount</TableHead>
                          <TableHead className="font-bold">Description</TableHead>
                          <TableHead className="pr-6 font-bold text-right">Hash</TableHead>
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
                                  <Badge className={cn(
                                    "w-fit rounded-full text-[10px] font-bold border-none",
                                    tx.type === 'PAYMENT' ? "bg-emerald-100 text-emerald-700" :
                                    tx.type === 'DEPOSIT' ? "bg-blue-100 text-blue-700" :
                                    tx.type === 'WITHDRAW' ? "bg-rose-100 text-rose-700" : "bg-gray-100 text-gray-600"
                                  )}>
                                    {tx.type}
                                  </Badge>
                                  {tx.metadata?.isManual && (
                                    <Badge className="w-fit bg-amber-100 text-amber-700 border-none text-[9px] font-black uppercase">
                                      Manual
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-[10px] font-bold">
                                  {tx.metadata?.method === 'QR' ? (
                                    <span className="text-purple-600">QR Code</span>
                                  ) : (
                                    <span className="text-blue-600">Wallet Transfer</span>
                                  )}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                {tx.amount?.toLocaleString()} {tx.symbol || 'USDT'}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">
                                {tx.description}
                              </TableCell>
                              <TableCell className="pr-6 text-right">
                                {tx.hash ? (
                                  <a href={`https://bscscan.com/tx/${tx.hash}`} target="_blank" className="text-xs font-mono text-gray-400 hover:text-[#276152] inline-flex items-center gap-1">
                                    {tx.hash.substring(0, 6)}... <ExternalLink size={12} />
                                  </a>
                                ) : "System"}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="py-12 text-center text-gray-400">
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
               <Card className="rounded-[24px] border-gray-100 shadow-sm overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-[18px] font-bold flex items-center gap-2">
                      <TrendingUp size={20} className="text-[#276152]" />
                      Commissions Received
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-gray-50/50">
                        <TableRow>
                          <TableHead className="pl-6 font-bold">Time</TableHead>
                          <TableHead className="font-bold">From Referree</TableHead>
                          <TableHead className="font-bold text-right">Sales</TableHead>
                          <TableHead className="font-bold text-right">Commission</TableHead>
                          <TableHead className="pr-6 font-bold text-right">Description</TableHead>
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
                            <TableCell colSpan={5} className="py-12 text-center text-gray-400">
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
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="rounded-[24px] border-none shadow-sm bg-gradient-to-br from-emerald-50/50 to-white">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="size-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-600">
                            <Users size={28} />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Direct (F1)</p>
                            <h3 className="text-2xl font-black text-[#111827]">{data.referrals?.length || 0}</h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-[24px] border-none shadow-sm bg-gradient-to-br from-blue-50/50 to-white">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="size-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600">
                            <Network size={28} />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Entire Network</p>
                            <h3 className="text-2xl font-black text-[#111827]">{data.totalNetwork || 0}</h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-[24px] border-none shadow-sm bg-gradient-to-br from-amber-50/50 to-white">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="size-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-amber-600">
                            <TrendingUp size={28} />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">System Sales</p>
                            <h3 className="text-2xl font-black text-[#111827]">{user.totalSales?.toLocaleString()} <span className="text-sm font-bold">USDT</span></h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                 </div>

                 <Card className="rounded-[32px] border-gray-100 shadow-sm overflow-hidden">
                    <CardHeader className="border-b bg-gray-50/30 p-6">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-[18px] font-bold flex items-center gap-2">
                          <Users size={20} className="text-[#276152]" />
                          Referral Network Tree
                        </CardTitle>
                        <Badge className="bg-[#276152] text-white border-none font-bold px-4 py-1.5 rounded-full">
                          {data.totalNetwork || 0} members
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 min-h-[400px] overflow-x-auto custom-scrollbar">
                      <div className="space-y-1 w-max min-w-full">
                        {data.referrals?.length > 0 ? (
                          data.referrals.map((ref: any) => (
                            <ReferralTreeNode key={ref._id} user={ref} />
                          ))
                        ) : (
                          <div className="py-20 text-center space-y-4">
                             <div className="size-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto text-gray-300">
                                <Users size={40} />
                             </div>
                             <p className="text-gray-400 font-medium italic">This user has not referred anyone yet</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                 </Card>
               </div>
            </TabsContent>
            {/* Tab: AQE Distribution */}
            <TabsContent value="aqe" className="space-y-6 outline-none">
               {/* AQE Interest Cards */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <Card className="rounded-[24px] border-none shadow-sm bg-gradient-to-br from-emerald-50/50 to-white">
                   <CardContent className="p-6 space-y-2">
                     <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Total Interest Expected</p>
                     <h3 className="text-2xl font-black text-[#276152]">
                       {interestStats?.totalExpected?.toFixed(5) || "0.00000"} <span className="text-sm font-bold">AQE</span>
                     </h3>
                     <p className="text-xs text-gray-400">Lifetime interest expected from all packages (6% APR)</p>
                   </CardContent>
                 </Card>

                 <Card className="rounded-[24px] border-none shadow-sm bg-gradient-to-br from-blue-50/50 to-white">
                   <CardContent className="p-6 space-y-2">
                     <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Claimed Interest</p>
                     <h3 className="text-2xl font-black text-blue-700">
                       {interestStats?.totalClaimed?.toFixed(5) || "0.00000"} <span className="text-sm font-bold">USDT</span>
                     </h3>
                     <p className="text-xs text-gray-400">Total interest successfully claimed to USDT</p>
                   </CardContent>
                 </Card>

                 <Card className="rounded-[24px] border-none shadow-sm bg-gradient-to-br from-amber-50/50 to-white">
                   <CardContent className="p-6 space-y-2">
                     <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Remaining Interest</p>
                     <h3 className="text-2xl font-black text-amber-600">
                       {interestStats?.totalRemaining?.toFixed(5) || "0.00000"} <span className="text-sm font-bold">AQE</span>
                     </h3>
                     <p className="text-xs text-gray-400">Expected future interest from today onwards</p>
                   </CardContent>
                 </Card>
               </div>

               {/* AQE Balances Summary */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card className="rounded-[24px] border-gray-100 shadow-sm bg-white p-6 flex justify-between items-center">
                   <div>
                     <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Claimable Interest</p>
                     <h3 className="text-xl font-bold text-gray-900">
                       {interestStats?.claimableAqeInterest?.toFixed(5) || "0.00000"} <span className="text-xs">AQE</span>
                     </h3>
                   </div>
                   <Badge className="bg-[#276152]/10 text-[#276152] border-none font-bold">Available to claim</Badge>
                 </Card>
                 <Card className="rounded-[24px] border-gray-100 shadow-sm bg-white p-6 flex justify-between items-center">
                   <div>
                     <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Provisional Interest</p>
                     <h3 className="text-xl font-bold text-gray-900">
                       {interestStats?.provisionalAqeInterest?.toFixed(5) || "0.00000"} <span className="text-xs">AQE</span>
                     </h3>
                   </div>
                   <Badge className="bg-amber-100 text-amber-700 border-none font-bold">Accumulated this month</Badge>
                 </Card>
               </div>

               <Card className="rounded-[24px] border-gray-100 shadow-sm overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-[18px] font-bold flex items-center gap-2">
                      <Building2 size={20} className="text-amber-600" />
                      AQE Distribution History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-gray-50/50">
                        <TableRow>
                          <TableHead className="pl-6 font-bold">Time</TableHead>
                          <TableHead className="font-bold">Type</TableHead>
                          <TableHead className="font-bold text-right">Quantity</TableHead>
                          <TableHead className="font-bold">Status</TableHead>
                          <TableHead className="pr-6 font-bold text-right">Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.tokenHistory?.filter((bh: any) => bh.symbol === 'AQE').length > 0 ? (
                          data.tokenHistory
                            .filter((bh: any) => bh.symbol === 'AQE')
                            .map((bh: any) => (
                              <TableRow key={bh._id}>
                              <TableCell className="pl-6 text-xs text-gray-500">
                                {dayjs(bh.createdAt).format("DD/MM/YYYY HH:mm")}
                              </TableCell>
                              <TableCell>
                                <Badge className={cn(
                                  "rounded-full text-[10px] font-bold border-none",
                                  bh.type === 'RECEIVE' ? "bg-emerald-100 text-emerald-700" :
                                  bh.type === 'REWARD' ? "bg-purple-100 text-purple-700" : 
                                  bh.type === 'COMMISSION' ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                                )}>
                                  {bh.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-bold text-amber-600">
                                {bh.amount?.toLocaleString()} AQE
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn(
                                  "text-[10px] font-bold border-none",
                                  bh.isOfficial ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                )}>
                                  {bh.isOfficial ? "Official" : "Recorded (Pending release)"}
                                </Badge>
                              </TableCell>
                              <TableCell className="pr-6 text-right text-sm text-gray-600">
                                {bh.description}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="py-12 text-center text-gray-400">
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
        <DialogContent className="sm:max-w-[700px] rounded-[24px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-bold text-[#111827]">Edit User</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 custom-scrollbar">
            <div className="grid gap-6 py-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-[13px] font-bold text-[#276152] uppercase tracking-wider">Personal Information</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Full Name</label>
                    <Input value={editingUser?.fullName || ""} onChange={(e) => setEditingUser({...editingUser, fullName: e.target.value})} className="h-11 rounded-[8px] border-gray-200" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Date of Birth</label>
                    <Input type="date" value={editingUser?.birthday ? new Date(editingUser.birthday).toISOString().split('T')[0] : ""} onChange={(e) => setEditingUser({...editingUser, birthday: e.target.value})} className="h-11 rounded-[8px] border-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Gender</label>
                    <Select value={editingUser?.gender} onValueChange={(v) => setEditingUser({...editingUser, gender: v})}>
                      <SelectTrigger className="!h-11 rounded-[8px] w-full border-gray-200"><SelectValue /></SelectTrigger>
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
                <h4 className="text-[13px] font-bold text-[#276152] uppercase tracking-wider">Contact & Address</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Email</label>
                    <Input value={editingUser?.email || ""} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} className="h-11 rounded-[8px] border-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Phone Number</label>
                    <Input value={editingUser?.phone || ""} onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})} className="h-11 rounded-[8px] border-gray-200" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">Telegram</label>
                  <Input value={editingUser?.telegram || ""} onChange={(e) => setEditingUser({...editingUser, telegram: e.target.value})} className="h-11 rounded-[8px] border-gray-200" placeholder="@username" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">Specific Address</label>
                  <Input value={editingUser?.address || ""} onChange={(e) => setEditingUser({...editingUser, address: e.target.value})} className="h-11 rounded-[8px] border-gray-200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Country</label>
                    <Input value={editingUser?.nation || ""} onChange={(e) => setEditingUser({...editingUser, nation: e.target.value})} className="h-11 rounded-[8px] border-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">KYC Status</label>
                    <Select value={editingUser?.kycStatus} onValueChange={(v) => setEditingUser({...editingUser, kycStatus: v})}>
                      <SelectTrigger className="!h-11 rounded-[8px] w-full border-gray-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unverified">Unverified</SelectItem>
                        <SelectItem value="pending">Pending Verification</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="rejected">Rejected (Request resubmission)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Finance */}
              <div className="space-y-4">
                <h4 className="text-[13px] font-bold text-[#276152] uppercase tracking-wider">Finance & Account</h4>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">Wallet Address (USDT BEP20)</label>
                  <Input value={editingUser?.walletAddress || ""} onChange={(e) => setEditingUser({...editingUser, walletAddress: e.target.value})} className="h-11 rounded-[8px] font-mono text-xs border-gray-200" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">Account Status</label>
                  <Select value={editingUser?.isActive ? "true" : "false"} onValueChange={(v) => setEditingUser({...editingUser, isActive: v === "true"})}>
                    <SelectTrigger className="!h-11 rounded-[8px] w-full border-gray-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activated (Active)</SelectItem>
                      <SelectItem value="false">Account Locked / Not activated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="p-6 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="rounded-[8px]">Cancel</Button>
            <Button onClick={handleUpdate} disabled={updating} className="bg-[#276152] rounded-[8px] px-8">
              {updating ? <Loader2 className="animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
 
      {/* Manual Deposit Dialog */}
      <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#111827]">Manual Deposit</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500">Pledge Amount (USDT)</label>
              <Input 
                type="number" 
                value={depositData.pledgeAmount} 
                onChange={(e) => setDepositData({...depositData, pledgeAmount: e.target.value})} 
                placeholder="Target registration amount"
                className="h-11 rounded-[8px] border-gray-200"
              />
              <p className="text-[11px] text-gray-400 italic">This will set or update the user's registration goal.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500">Paid Amount (USDT) *</label>
              <Input 
                type="number" 
                value={depositData.paidAmount} 
                onChange={(e) => setDepositData({...depositData, paidAmount: e.target.value})} 
                placeholder="Actual amount paid by user"
                className="h-11 rounded-[8px] border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500">Transaction Hash *</label>
              <Input 
                value={depositData.hash} 
                onChange={(e) => setDepositData({...depositData, hash: e.target.value})} 
                placeholder="Blockchain transaction hash"
                className="h-11 rounded-[8px] border-gray-200 font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsDepositDialogOpen(false)} className="rounded-[8px]">Cancel</Button>
            <Button onClick={handleManualDeposit} disabled={depositing} className="bg-amber-600 hover:bg-amber-700 rounded-[8px] px-8 font-bold">
              {depositing ? <Loader2 className="animate-spin" /> : "Confirm Deposit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Image Preview Overlay */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100000] bg-black/95 flex items-center justify-center p-4 cursor-pointer backdrop-blur-md transition-all duration-300"
          onClick={() => setPreviewImage(null)}
        >
          <button 
             className="absolute top-8 right-8 text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors z-[100001]"
             onClick={(e) => {
               e.stopPropagation();
               setPreviewImage(null);
             }}
          >
             <XCircle size={32} />
          </button>
          <img 
            src={previewImage} 
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-[16px] shadow-2xl relative z-[100001] animate-in zoom-in-95 duration-300" 
            alt="Preview" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
