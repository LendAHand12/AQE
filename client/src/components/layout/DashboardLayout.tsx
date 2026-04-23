import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"
import Header from "./Header"
import { useEffect, useState } from "react"
import { useAuth } from "@/providers/AuthProvider"

export default function DashboardLayout() {
  const { syncProfile } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    syncProfile()
  }, [])

  return (
    <div className="flex min-h-screen bg-[#f8faf9] overflow-hidden lg:overflow-visible">
      {/* Sidebar Overlay (Mobile only) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#0d1f1d]/50 bg-blur-sm z-[45] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar fixed or side-by-side */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Main Content Area */}
      <main className="flex-1 h-screen lg:h-auto overflow-y-auto relative flex flex-col bg-[#f8faf9]">
        {/* Reusable Header */}
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        
        <div className="p-4 md:p-5 flex-1">
          {/* This is where the specific page content will be rendered */}
          <Outlet />
        </div>
      </main>
    </div>
  )
}
