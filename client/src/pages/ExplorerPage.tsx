import { useState, useEffect } from "react"
import { 
  Globe, 
  Box, 
  Activity, 
  DollarSign, 
  Search, 
  ArrowRight,
  Hash,
  Database,
  TrendingUp,
  Loader2
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import apiClient from "@/lib/axios"

export default function ExplorerPage() {
  const [stats, setStats] = useState<any>(null)
  const [blocks, setBlocks] = useState<any[]>([])
  const [txns, setTxns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [statsRes, blocksRes, txnsRes] = await Promise.all([
        apiClient.get("/explorer/stats"),
        apiClient.get("/explorer/blocks"),
        apiClient.get("/explorer/transactions")
      ])
      setStats(statsRes.data)
      setBlocks(blocksRes.data)
      setTxns(txnsRes.data)
    } catch (err) {
      console.error("Fetch failed", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <Loader2 className="w-10 h-10 text-[#1e40af] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Search Header Section */}
      <div className="bg-[#1e40af] pt-12 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div className="max-w-[1240px] mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Globe className="w-8 h-8 text-blue-300" />
                AQ Estate Explorer
              </h1>
              <p className="text-blue-100 text-sm font-medium">Virtual Blockchain Network for AQE Token Ecosystem</p>
            </div>
          </div>
          
          <div className="mt-10 relative max-w-[800px]">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <Input 
              className="h-14 pl-12 pr-6 rounded-[12px] bg-white border-none shadow-2xl shadow-blue-900/40 text-lg"
              placeholder="Search by Block / Txn Hash / Address / _id"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="max-w-[1240px] mx-auto px-6 -mt-12 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={<DollarSign className="w-5 h-5 text-green-600" />} 
            label="AQE PRICE" 
            value={`$${stats?.currentPrice?.toFixed(4)}`} 
            subValue={`Pool: ${stats?.usdtPool?.toLocaleString()} USDT`}
          />
          <StatCard 
            icon={<TrendingUp className="w-5 h-5 text-blue-600" />} 
            label="MARKET CAP" 
            value={`$${(stats?.totalSupply * stats?.currentPrice).toLocaleString()}`} 
            subValue={`Supply: ${stats?.totalSupply?.toLocaleString()}`}
          />
          <StatCard 
            icon={<Box className="w-5 h-5 text-purple-600" />} 
            label="LAST BLOCK" 
            value={`#${stats?.latestBlock}`} 
            subValue={`Transfers: ${stats?.totalTransactions}`}
          />
          <StatCard 
            icon={<Activity className="w-5 h-5 text-orange-600" />} 
            label="NETWORK STATUS" 
            value="Active" 
            subValue="TPS: 0.12 (Virtual)"
          />
        </div>
      </div>

      {/* Main Tables Section */}
      <div className="max-w-[1240px] mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Latest Blocks */}
        <Card className="border-none shadow-sm rounded-[16px] overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Database className="w-4 h-4 text-gray-400" /> Latest Blocks
            </h3>
            <Button variant="ghost" className="text-blue-600 text-[12px] font-bold h-8">View All</Button>
          </div>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50 flex flex-col">
              {blocks.map((block) => (
                <div key={block._id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-[10px] flex items-center justify-center">
                      <Box className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-blue-600 font-bold text-sm">#{block.number}</p>
                      <p className="text-[11px] text-gray-400 font-medium">{new Date(block.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-medium text-gray-700">Fee recipient: {block.miner}</p>
                    <p className="text-[12px] text-blue-500 font-mono">{block.transactions.length} txns</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Latest Transactions */}
        <Card className="border-none shadow-sm rounded-[16px] overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Hash className="w-4 h-4 text-gray-400" /> Latest Transactions
            </h3>
            <Button variant="ghost" className="text-blue-600 text-[12px] font-bold h-8">View All</Button>
          </div>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {txns.map((txn) => (
                <div key={txn._id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Hash className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-blue-600 font-bold text-sm max-w-[150px] truncate">{txn.hash}</p>
                      <p className="text-[11px] text-gray-400 font-medium">{new Date(txn.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-bold text-gray-800">
                      {txn.amount.toLocaleString()} {txn.symbol}
                    </p>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[11px] font-mono text-gray-400">From: {txn.from.slice(-6)}</span>
                      <ArrowRight className="w-3 h-3 text-gray-300" />
                      <span className="text-[11px] font-mono text-gray-400">To: {txn.to.slice(-6)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer info */}
      <div className="max-w-[1240px] mx-auto px-6 mt-12 text-center">
        <p className="text-[12px] text-gray-400 font-medium">
          © 2026 AQ Estate Virtual Ledger. This is a simulated environment. None of the transactions shown are on a public mainnet.
        </p>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, subValue }: { icon: any, label: string, value: string, subValue: string }) {
  return (
    <Card className="border-none shadow-sm rounded-[16px] bg-white hover:translate-y-[-2px] transition-all">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-2">
          {icon}
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          <p className="text-[13px] text-gray-500 font-medium">{subValue}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function Button({ children, variant, className, onClick }: any) {
  const base = "px-4 py-2 transition-all duration-200 active:scale-95"
  const styles: any = {
    ghost: "text-gray-600 hover:bg-gray-100 rounded-[8px]",
  }
  return <button className={`${base} ${styles[variant]} ${className}`} onClick={onClick}>{children}</button>
}
