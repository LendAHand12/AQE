import { useState, useEffect } from "react"
import { 
  Users, 
  UserPlus, 
  ChevronRight, 
  Mail, 
  Calendar, 
  TrendingUp,
  Loader2
} from "lucide-react"
import { useTranslation } from "react-i18next"
import apiClient from "@/lib/axios"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"

interface ReferralUser {
  _id: string
  fullName: string
  username: string
  email: string
  personalPaid: number
  totalSales: number
  createdAt: string
  kycStatus?: string
}

interface ReferralStats {
  totalF1: number
  totalNetwork: number
  totalSales: number
}

const ReferralTreeNode = ({ user, level = 0 }: { user: ReferralUser; level?: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<ReferralUser[]>([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const toggleOpen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && children.length === 0) {
      setLoading(true);
      try {
        const res = await apiClient.get(`/auth/referrals/${user._id}`);
        setChildren(res.data);
      } catch (err) {
        console.error("Failed to load sub-referrals", err);
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
          "flex items-center justify-between p-4 rounded-xl hover:bg-gray-50/80 transition-all cursor-pointer group border border-transparent min-w-[1000px]",
          isOpen && "bg-gray-50 border-[#efefef] shadow-sm"
        )}
        style={{ paddingLeft: `${level * 24 + 16}px` }}
        onClick={toggleOpen}
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 flex items-center justify-center">
            {loading ? (
              <Loader2 size={14} className="animate-spin text-[#276152]" />
            ) : (
              (user.totalSales > 0 || children.length > 0) ? (
                <div className={cn("transition-transform duration-200", isOpen && "rotate-90")}>
                   <ChevronRight size={18} className="text-gray-400 group-hover:text-[#276152]" />
                </div>
              ) : (
                <div className="size-1.5 rounded-full bg-gray-200" />
              )
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#276152]/10 flex items-center justify-center text-[#276152] font-bold text-xs uppercase shadow-inner">
              {user.username?.substring(0, 2)}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[15px] text-[#111827]">@{user.username}</span>
                <span className="text-[13px] text-gray-500 font-semibold">{user.fullName}</span>
              </div>
              <span className="text-[11px] text-gray-400 font-mono tracking-tight">{user.email}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 px-4">
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">{t("referrals.stats.network_size")}</p>
            <p className="text-[15px] font-bold text-amber-600">{user.totalNetwork || 0} <span className="text-[11px]">{t("referrals.stats.members")}</span></p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">{t("referrals.stats.personal_paid")}</p>
            <p className="text-[15px] font-bold text-blue-600">{user.personalPaid?.toLocaleString()} <span className="text-[11px]">USDT</span></p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">{t("referrals.stats.total_sales")}</p>
            <p className="text-[15px] font-bold text-emerald-700">{user.totalSales?.toLocaleString()} <span className="text-[11px]">USDT</span></p>
          </div>
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
              <div className="mt-1 border-l border-gray-100 ml-7">
                {children.map((child) => (
                  <ReferralTreeNode key={child._id} user={child} level={level + 1} />
                ))}
              </div>
            ) : !loading && (
              <div className="py-2 text-[11px] text-gray-400 italic ml-16" style={{ paddingLeft: `${(level + 1) * 24}px` }}>
                {t("commissions.empty")}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function ReferralPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ReferralStats>({ totalF1: 0, totalNetwork: 0, totalSales: 0 })
  const [network, setNetwork] = useState<ReferralUser[]>([])

  useEffect(() => {
    fetchReferrals()
  }, [])

  const fetchReferrals = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get("/auth/referrals")
      setStats(response.data.summary)
      setNetwork(response.data.network)
    } catch (err) {
      console.error("Failed to fetch referrals", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-[#276152]" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-8 font-['SVN-Gilroy',sans-serif]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-[#0d1f1d] tracking-tight">{t("referrals.title")}</h1>
          <p className="text-[#6b7280] text-sm">{t("referrals.subtitle")}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={UserPlus} 
          label={t("pre_register.f1_label")} 
          value={stats.totalF1} 
          suffix={` ${t("referrals.stats.members")}`}
          color="bg-blue-50 text-blue-600"
          gradient="from-blue-50 to-white"
        />
        <StatCard 
          icon={Users} 
          label={t("pre_register.total_referrals")} 
          value={stats.totalNetwork} 
          suffix={` ${t("referrals.stats.members")}`}
          color="bg-emerald-50 text-emerald-600"
          gradient="from-emerald-50 to-white"
        />
        <StatCard 
          icon={TrendingUp} 
          label={t("referrals.stats.total_sales")} 
          value={stats.totalSales} 
          suffix=" USDT"
          color="bg-amber-50 text-amber-600"
          gradient="from-amber-50 to-white"
        />
      </div>

      {/* Network Tree */}
      <div className="bg-white rounded-3xl border border-[#efefef] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#efefef] bg-gray-50/30 flex items-center gap-2">
          <div className="size-8 rounded-lg bg-[#276152] flex items-center justify-center text-white">
             <Users size={16} />
          </div>
          <h3 className="text-lg font-bold text-[#0d1f1d]">{t("referrals.network_list")}</h3>
        </div>

        <div className="p-4 space-y-1 min-h-[400px] overflow-x-auto custom-scrollbar">
          <div className="space-y-1 w-max min-w-full">
            {network.length > 0 ? (
            network.map((f1) => (
              <ReferralTreeNode 
                key={f1._id} 
                user={f1} 
              />
            ))
          ) : (
            <div className="py-20 text-center space-y-3">
               <div className="size-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-300">
                  <Users size={32} />
               </div>
               <p className="text-gray-400 font-medium">{t("commissions.empty")}</p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, suffix, color, gradient }: { icon: any, label: string, value: number, suffix: string, color: string, gradient: string }) {
  return (
    <Card className={cn("border-none shadow-sm bg-gradient-to-br overflow-hidden", gradient)}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={cn("size-14 rounded-2xl flex items-center justify-center shadow-sm", color, "bg-white")}>
            <Icon size={28} />
          </div>
          <div>
            <p className="text-[11px] text-[#6b7280] font-bold uppercase tracking-wider mb-1">{label}</p>
            <p className="text-2xl font-black text-[#0d1f1d]">
              {value.toLocaleString()}
              {suffix && <span className="text-sm font-bold ml-1">{suffix}</span>}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

import { Card, CardContent } from "@/components/ui/card"
