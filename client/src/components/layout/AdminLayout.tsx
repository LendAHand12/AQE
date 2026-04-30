import { Outlet, Navigate } from "react-router-dom"
import AdminSidebar from "./AdminSidebar"
import AdminHeader from "./AdminHeader"

export default function AdminLayout() {
  const adminToken = localStorage.getItem("admin_token")

  if (!adminToken) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className="flex bg-[#f8faf9] min-h-screen">
      <AdminSidebar />
      <div className="flex-1 ml-[260px] flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

