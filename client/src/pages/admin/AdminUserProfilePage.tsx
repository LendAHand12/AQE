import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { 
  User, 
  Mail, 
  Phone,
  ShieldCheck, 
  Wallet, 
  ArrowLeft,
  ArrowRight,
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
  Eye
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

export default function AdminUserProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  
  // Edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [updating, setUpdating] = useState(false)
  
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
      toast.error(err.response?.data?.message || "Không thể tải thông tin người dùng")
      navigate("/admin/users")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    setUpdating(true)
    try {
      await apiClient.put(`/admin/users/${id}`, editingUser)
      toast.success("Cập nhật thông tin thành công")
      setIsEditDialogOpen(false)
      fetchUserDetails() // Refresh data
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể cập nhật thông tin")
    } finally {
      setUpdating(false)
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

  const { user, transactions, commissions, referrals } = data

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
            <h1 className="text-[28px] font-extrabold text-[#111827] tracking-tight">Chi tiết người dùng</h1>
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
             {user.isActive ? "Hoạt động" : "Khóa"}
           </Badge>
           <Button 
             className="h-11 bg-[#276152] hover:bg-[#1e4d41] rounded-full px-8 font-bold shadow-lg shadow-[#276152]/10"
             onClick={() => {
               setEditingUser({...user})
               setIsEditDialogOpen(true)
             }}
           >
             Chỉnh sửa
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
                <div className="bg-[#f8faf9] p-4 rounded-[16px] text-left">
                  <p className="text-[11px] text-[#868f9e] font-bold uppercase tracking-wider mb-1">Số dư USDT</p>
                  <p className="text-[18px] font-extrabold text-[#276152]">{user.usdtBalance?.toLocaleString()} <span className="text-xs">USDT</span></p>
                </div>
                <div className="bg-[#f8faf9] p-4 rounded-[16px] text-left">
                  <p className="text-[11px] text-[#868f9e] font-bold uppercase tracking-wider mb-1">Số dư AQE</p>
                  <p className="text-[18px] font-extrabold text-amber-600">{user.aqeBalance?.toLocaleString()} <span className="text-xs">AQE</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[24px] border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[18px] font-bold">Thông tin liên hệ</CardTitle>
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
                  <p className="text-[11px] text-gray-400 font-bold uppercase">Số điện thoại</p>
                  <p className="text-[14px] font-medium text-gray-700">{user.countryCode} {user.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-[#f3f4f6] flex items-center justify-center text-gray-500">
                  <Wallet size={16} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[11px] text-gray-400 font-bold uppercase">Ví Web3</p>
                  <p className="text-[12px] font-mono font-medium text-gray-700 truncate">{user.walletAddress || "Chưa kết nối"}</p>
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
                Thông tin
              </TabsTrigger>
              <TabsTrigger 
                value="transactions" 
                className="rounded-full px-8 py-2 data-[state=active]:bg-[#276152] data-[state=active]:text-white transition-all font-bold"
              >
                Giao dịch
              </TabsTrigger>
              <TabsTrigger 
                value="commissions" 
                className="rounded-full px-8 py-2 data-[state=active]:bg-[#276152] data-[state=active]:text-white transition-all font-bold"
              >
                Hoa hồng
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

            {/* Tab: Thông tin bổ sung & Pledge History */}
            <TabsContent value="info" className="space-y-6 outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card className="rounded-[24px] border-gray-100 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-[18px] font-bold flex items-center gap-2">
                        <TrendingUp size={20} className="text-[#276152]" />
                        Đợt mua hiện tại
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                       <div className="flex justify-between items-end border-b border-gray-50 pb-4">
                          <div>
                             <p className="text-[12px] text-gray-400 font-bold uppercase mb-1">Mục tiêu đăng ký</p>
                             <p className="text-[22px] font-extrabold text-[#111827]">{user.pledgeUsdt?.toLocaleString()} USDT</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[12px] text-gray-400 font-bold uppercase mb-1">Đã thanh toán</p>
                             <p className="text-[22px] font-extrabold text-[#276152]">{user.paidUsdtPreRegister?.toLocaleString()} USDT</p>
                          </div>
                       </div>

                       <div className="space-y-2">
                          <div className="flex justify-between text-[13px] font-bold">
                             <span className="text-gray-500">Tiến độ đợt hiện tại</span>
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
                         <span>Trạng thái: <strong>{user.isPledgeCompleted ? "Đã hoàn thành" : "Đang thực hiện"}</strong></span>
                       </div>
                    </CardContent>
                 </Card>

                 <Card className="rounded-[24px] border-gray-100 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-[18px] font-bold flex items-center gap-2">
                        <User size={20} className="text-[#276152]" />
                        Chi tiết cá nhân
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-y-4">
                        <div>
                          <p className="text-[11px] text-gray-400 font-bold uppercase">Giới tính</p>
                          <p className="text-[14px] font-medium text-gray-700">{user.gender || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-400 font-bold uppercase">Ngày sinh</p>
                          <p className="text-[14px] font-medium text-gray-700">{user.birthday ? dayjs(user.birthday).format("DD/MM/YYYY") : "—"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-400 font-bold uppercase">Quốc tịch</p>
                          <div className="flex items-center gap-1.5">
                            <Flag size={14} className="text-gray-400" />
                            <p className="text-[14px] font-medium text-gray-700">{user.nation || "—"}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-400 font-bold uppercase">Địa chỉ</p>
                          <div className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-gray-400" />
                            <p className="text-[14px] font-medium text-gray-700 truncate max-w-[150px]">{user.address || "—"}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-400 font-bold uppercase">Ngày đăng ký</p>
                          <p className="text-[14px] font-medium text-gray-700">{dayjs(user.createdAt).format("DD/MM/YYYY")}</p>
                        </div>
                    </CardContent>
                 </Card>
              </div>

              {/* Hồ sơ KYC */}
              <Card className="rounded-[24px] border-gray-100 shadow-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-[18px] font-bold flex items-center gap-2">
                    <ShieldCheck size={20} className="text-[#276152]" />
                    Hồ sơ KYC & Giấy tờ tùy thân
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <p className="text-[13px] font-bold text-gray-500 uppercase tracking-wider ml-1">Mặt trước CCCD/Passport</p>
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
                            <span className="text-xs font-medium">Chưa cập nhật</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[13px] font-bold text-gray-500 uppercase tracking-wider ml-1">Mặt sau CCCD/Passport</p>
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
                            <span className="text-xs font-medium">Chưa cập nhật</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[13px] font-bold text-gray-500 uppercase tracking-wider ml-1">Ảnh chân dung</p>
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
                            <span className="text-xs font-medium">Chưa cập nhật</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lịch sử các đợt mua */}
              <Card className="rounded-[24px] border-gray-100 shadow-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-[18px] font-bold flex items-center gap-2">
                    <History size={20} className="text-[#276152]" />
                    Lịch sử các đợt đăng ký mua sớm
                  </CardTitle>
                  <Badge variant="outline" className="rounded-full bg-blue-50 text-blue-600 border-none font-bold">
                    {user.pledgeRounds?.length || 0} Đợt
                  </Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow>
                        <TableHead className="pl-6 font-bold">Đợt</TableHead>
                        <TableHead className="font-bold">Ngày hoàn tất</TableHead>
                        <TableHead className="font-bold text-right">Số tiền đăng ký</TableHead>
                        <TableHead className="font-bold text-right">Đã thanh toán</TableHead>
                        <TableHead className="font-bold text-center">Bonus</TableHead>
                        <TableHead className="pr-6 font-bold text-right">Token nhận</TableHead>
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
                             Chưa có lịch sử các đợt mua hoàn tất
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Giao dịch */}
            <TabsContent value="transactions" className="outline-none">
               <Card className="rounded-[24px] border-gray-100 shadow-sm overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-[18px] font-bold flex items-center gap-2">
                      <CreditCard size={20} className="text-[#276152]" />
                      Lịch sử giao dịch (Gần đây nhất)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-gray-50/50">
                        <TableRow>
                          <TableHead className="pl-6 font-bold">Thời gian</TableHead>
                          <TableHead className="font-bold">Loại</TableHead>
                          <TableHead className="font-bold text-right">Số tiền</TableHead>
                          <TableHead className="font-bold">Mô tả</TableHead>
                          <TableHead className="pr-6 font-bold text-right">Mã Hash</TableHead>
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
                                <Badge className={cn(
                                  "rounded-full text-[10px] font-bold border-none",
                                  tx.type === 'PAYMENT' ? "bg-emerald-100 text-emerald-700" :
                                  tx.type === 'DEPOSIT' ? "bg-blue-100 text-blue-700" :
                                  tx.type === 'WITHDRAW' ? "bg-rose-100 text-rose-700" : "bg-gray-100 text-gray-600"
                                )}>
                                  {tx.type}
                                </Badge>
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
                               Chưa có dữ liệu giao dịch
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
               </Card>
            </TabsContent>

            {/* Tab: Hoa hồng */}
            <TabsContent value="commissions" className="outline-none">
               <Card className="rounded-[24px] border-gray-100 shadow-sm overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-[18px] font-bold flex items-center gap-2">
                      <TrendingUp size={20} className="text-[#276152]" />
                      Hoa hồng nhận được
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-gray-50/50">
                        <TableRow>
                          <TableHead className="pl-6 font-bold">Thời gian</TableHead>
                          <TableHead className="font-bold">Từ F</TableHead>
                          <TableHead className="font-bold text-right">Doanh số</TableHead>
                          <TableHead className="font-bold text-right">Hoa hồng</TableHead>
                          <TableHead className="pr-6 font-bold text-right">Mô tả</TableHead>
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
                               Chưa nhận được hoa hồng nào
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
               <Card className="rounded-[24px] border-gray-100 shadow-sm overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-[18px] font-bold flex items-center gap-2">
                      <Users size={20} className="text-[#276152]" />
                      Danh sách người được giới thiệu
                    </CardTitle>
                    <Badge className="bg-[#d9ede8] text-[#276152] border-none font-bold">
                      Tổng: {referrals?.length || 0}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-gray-50/50">
                        <TableRow>
                          <TableHead className="pl-6 font-bold">Người dùng</TableHead>
                          <TableHead className="font-bold">Ngày đăng ký</TableHead>
                          <TableHead className="font-bold">KYC</TableHead>
                          <TableHead className="font-bold text-right">Số dư USDT</TableHead>
                          <TableHead className="pr-6 font-bold text-right">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {referrals?.length > 0 ? (
                          referrals.map((ref: any) => (
                            <TableRow key={ref._id}>
                              <TableCell className="pl-6">
                                <div className="flex flex-col">
                                   <span className="font-bold">@{ref.username}</span>
                                   <span className="text-[11px] text-gray-400">{ref.fullName}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                {dayjs(ref.createdAt).format("DD/MM/YYYY")}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn(
                                  "text-[10px] font-bold border-none uppercase",
                                  ref.kycStatus === 'verified' ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-400"
                                )}>
                                  {ref.kycStatus}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {ref.usdtBalance?.toLocaleString()} USDT
                              </TableCell>
                              <TableCell className="pr-6 text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-[#276152] font-bold text-xs"
                                  onClick={() => navigate(`/admin/users/${ref._id}`)}
                                >
                                  Chi tiết <ArrowRight size={14} className="ml-1" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="py-12 text-center text-gray-400">
                               Người dùng này chưa giới thiệu ai
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
               </Card>
            </TabsContent>
            {/* Tab: AQE Distribution */}
            <TabsContent value="aqe" className="outline-none">
               <Card className="rounded-[24px] border-gray-100 shadow-sm overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-[18px] font-bold flex items-center gap-2">
                      <Building2 size={20} className="text-amber-600" />
                      Lịch sử phân phối AQE
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-gray-50/50">
                        <TableRow>
                          <TableHead className="pl-6 font-bold">Thời gian</TableHead>
                          <TableHead className="font-bold">Loại</TableHead>
                          <TableHead className="font-bold text-right">Số lượng</TableHead>
                          <TableHead className="font-bold">Trạng thái</TableHead>
                          <TableHead className="pr-6 font-bold text-right">Mô tả</TableHead>
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
                                  {bh.isOfficial ? "Chính thức" : "Ghi nhận (Chờ release)"}
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
                               Chưa có lịch sử phân phối AQE
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
            <DialogTitle className="text-2xl font-bold text-[#111827]">Chỉnh sửa người dùng</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 custom-scrollbar">
            <div className="grid gap-6 py-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-[13px] font-bold text-[#276152] uppercase tracking-wider">Thông tin cá nhân</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Họ và Tên</label>
                    <Input value={editingUser?.fullName || ""} onChange={(e) => setEditingUser({...editingUser, fullName: e.target.value})} className="h-11 rounded-[8px] border-gray-200" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Ngày sinh</label>
                    <Input type="date" value={editingUser?.birthday ? new Date(editingUser.birthday).toISOString().split('T')[0] : ""} onChange={(e) => setEditingUser({...editingUser, birthday: e.target.value})} className="h-11 rounded-[8px] border-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Giới tính</label>
                    <Select value={editingUser?.gender} onValueChange={(v) => setEditingUser({...editingUser, gender: v})}>
                      <SelectTrigger className="!h-11 rounded-[8px] w-full border-gray-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nam">Nam</SelectItem>
                        <SelectItem value="Nữ">Nữ</SelectItem>
                        <SelectItem value="Khác">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact & Address */}
              <div className="space-y-4">
                <h4 className="text-[13px] font-bold text-[#276152] uppercase tracking-wider">Liên hệ & Địa chỉ</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Email</label>
                    <Input value={editingUser?.email || ""} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} className="h-11 rounded-[8px] border-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Số điện thoại</label>
                    <Input value={editingUser?.phone || ""} onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})} className="h-11 rounded-[8px] border-gray-200" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">Telegram</label>
                  <Input value={editingUser?.telegram || ""} onChange={(e) => setEditingUser({...editingUser, telegram: e.target.value})} className="h-11 rounded-[8px] border-gray-200" placeholder="@username" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">Địa chỉ cụ thể</label>
                  <Input value={editingUser?.address || ""} onChange={(e) => setEditingUser({...editingUser, address: e.target.value})} className="h-11 rounded-[8px] border-gray-200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Quốc gia</label>
                    <Input value={editingUser?.nation || ""} onChange={(e) => setEditingUser({...editingUser, nation: e.target.value})} className="h-11 rounded-[8px] border-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Trạng thái KYC</label>
                    <Select value={editingUser?.kycStatus} onValueChange={(v) => setEditingUser({...editingUser, kycStatus: v})}>
                      <SelectTrigger className="!h-11 rounded-[8px] w-full border-gray-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unverified">Chưa KYC</SelectItem>
                        <SelectItem value="pending">Chờ xác minh</SelectItem>
                        <SelectItem value="verified">Đã xác minh</SelectItem>
                        <SelectItem value="rejected">Từ chối (Yêu cầu làm lại)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Finance */}
              <div className="space-y-4">
                <h4 className="text-[13px] font-bold text-[#276152] uppercase tracking-wider">Tài chính & Tài khoản</h4>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">Địa chỉ ví (USDT BEP20)</label>
                  <Input value={editingUser?.walletAddress || ""} onChange={(e) => setEditingUser({...editingUser, walletAddress: e.target.value})} className="h-11 rounded-[8px] font-mono text-xs border-gray-200" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">Trạng thái hoạt động</label>
                  <Select value={editingUser?.isActive ? "true" : "false"} onValueChange={(v) => setEditingUser({...editingUser, isActive: v === "true"})}>
                    <SelectTrigger className="!h-11 rounded-[8px] w-full border-gray-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Đã kích hoạt (Active)</SelectItem>
                      <SelectItem value="false">Khóa tài khoản / Chưa kích hoạt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="p-6 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="rounded-[8px]">Hủy</Button>
            <Button onClick={handleUpdate} disabled={updating} className="bg-[#276152] rounded-[8px] px-8">
              {updating ? <Loader2 className="animate-spin" /> : "Lưu thay đổi"}
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
