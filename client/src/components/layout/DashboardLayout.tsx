import React from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"
import Header from "./Header"
import { useEffect } from "react"
import { useAuth } from "@/providers/AuthProvider"

export default function DashboardLayout() {
  const { syncProfile } = useAuth()

  useEffect(() => {
    syncProfile()
  }, [])

  return (
    <div className="flex min-h-screen bg-[#f8faf9] overflow-hidden">
      {/* Sidebar fixed or side-by-side */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto relative flex flex-col bg-[#f8faf9]">
        {/* Reusable Header */}
        <Header />
        
        <div className="p-5 flex-1">
          {/* This is where the specific page content will be rendered */}
          <Outlet />
        </div>
      </main>
    </div>
  )
}
