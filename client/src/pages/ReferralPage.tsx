import React, { useState, useEffect } from "react"
import { 
  Users, 
  UserPlus, 
  ChevronDown, 
  ChevronRight, 
  Mail, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Loader2,
  Search,
  Filter
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
  pledgeUsdt: number
  paidUsdtPreRegister: number
  createdAt: string
  f2s?: ReferralUser[]
}

interface ReferralStats {
  totalF1: number
  totalF2: number
  totalReferrals: number
}

export default function ReferralPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ReferralStats>({ totalF1: 0, totalF2: 0, totalReferrals: 0 })
  const [network, setNetwork] = useState<ReferralUser[]>([])
  const [expandedF1s, setExpandedF1s] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

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

  const toggleExpand = (id: string) => {
    setExpandedF1s(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const filteredNetwork = network.filter(user => 
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-[#276152]" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-[#0d1f1d]">{t("referrals.title")}</h1>
          <p className="text-[#6b7280]">{t("referrals.subtitle")}</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-[#efefef] shadow-sm">
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#276152] transition-colors" />
              <input 
                type="text"
                placeholder={t("history.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-transparent outline-none text-sm w-full md:w-64"
              />
           </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={Users} 
          label={t("pre_register.total_referrals")} 
          value={stats.totalReferrals} 
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard 
          icon={UserPlus} 
          label={t("pre_register.f1_label")} 
          value={stats.totalF1} 
          color="bg-blue-50 text-blue-600"
        />
        <StatCard 
          icon={TrendingUp} 
          label={t("pre_register.f2_label")} 
          value={stats.totalF2} 
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Network Tree */}
      <div className="bg-white rounded-2xl border border-[#efefef] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#efefef]">
          <h3 className="text-lg font-bold text-[#0d1f1d]">{t("referrals.network_list")}</h3>
        </div>

        <div className="divide-y divide-[#efefef]">
          {filteredNetwork.length > 0 ? (
            filteredNetwork.map((f1) => (
              <ReferralItem 
                key={f1._id} 
                user={f1} 
                level={1}
                isExpanded={expandedF1s.includes(f1._id)}
                onToggle={() => toggleExpand(f1._id)}
              />
            ))
          ) : (
            <div className="p-20 text-center space-y-3">
               <div className="size-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                  <Users size={32} />
               </div>
               <p className="text-gray-400 font-medium">{t("commissions.empty")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#efefef] shadow-sm flex items-center gap-4">
      <div className={cn("size-12 rounded-xl flex items-center justify-center", color)}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-[#6b7280] font-medium">{label}</p>
        <p className="text-2xl font-bold text-[#0d1f1d]">{value.toLocaleString()}</p>
      </div>
    </div>
  )
}

function ReferralItem({ user, level, isExpanded, onToggle }: { user: ReferralUser, level: number, isExpanded?: boolean, onToggle?: () => void }) {
  const hasSub = user.f2s && user.f2s.length > 0
  
  return (
    <div className="w-full">
      <div 
        className={cn(
          "flex items-center gap-4 py-4 px-6 hover:bg-gray-50 transition-colors cursor-pointer group",
          level === 2 && "bg-[#F9FAFB]/50 border-l-4 border-l-[#276152]/30 pl-16 md:pl-20"
        )}
        onClick={level === 1 ? onToggle : undefined}
      >
        {/* Toggle Icon or Dot */}
        <div className="shrink-0">
          {level === 1 ? (
             <div className={cn("size-6 flex items-center justify-center transition-transform", isExpanded && "rotate-90")}>
               <ChevronRight size={18} className="text-gray-400 group-hover:text-[#276152]" />
             </div>
          ) : (
             <div className="size-2 bg-[#276152] rounded-full mx-2" />
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-2">
           <div className="flex flex-col">
              <span className="font-bold text-[#111827] truncate group-hover:text-[#276152] transition-colors">
                {user.fullName}
              </span>
              <span className="text-xs text-gray-400 font-mono">@{user.username}</span>
           </div>
           
           <div className="flex flex-wrap items-center gap-y-1 gap-x-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100/50 px-2.5 py-1 rounded-lg">
                 <Mail size={12} className="text-gray-400" />
                 {user.email}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100/50 px-2.5 py-1 rounded-lg">
                 <Calendar size={12} className="text-gray-400" />
                 {format(new Date(user.createdAt), "dd/MM/yyyy")}
              </div>
           </div>
        </div>

        {/* Pledge Info */}
        <div className="shrink-0 flex items-center gap-3">
           <div className="text-right">
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Pledge</p>
              <div className="flex items-center gap-1 text-[#276152] font-bold">
                 <span>{user.pledgeUsdt.toLocaleString()}</span>
                 <span className="text-[10px]">USDT</span>
              </div>
           </div>
        </div>
      </div>

      {/* Sub Items (F2) */}
      <AnimatePresence>
        {isExpanded && hasSub && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="bg-[#f8fafc]/30">
               {user.f2s?.map((f2) => (
                 <ReferralItem key={f2._id} user={f2} level={2} />
               ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
