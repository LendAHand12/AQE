import { Outlet, Navigate } from "react-router-dom"
import AdminSidebar from "./AdminSidebar"

export default function AdminLayout() {
  const adminToken = localStorage.getItem("admin_token")

  if (!adminToken) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className="flex bg-[#f8faf9] min-h-screen">
      <AdminSidebar />
      <main className="flex-1 ml-[280px] min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
