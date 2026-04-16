import React from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-[#f8faf9] overflow-hidden">
      {/* Sidebar fixed or side-by-side */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto relative">
        <div className="p-8 pb-12">
          {/* This is where the specific page content will be rendered */}
          <Outlet />
        </div>
      </main>
    </div>
  )
}
