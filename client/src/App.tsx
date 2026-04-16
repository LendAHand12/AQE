import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import AuthPage from "@/pages/auth/AuthPage"
import Dashboard from "@/pages/Dashboard"
import SettingsPage from "@/pages/SettingsPage"
import ConfirmEmailPage from "@/pages/ConfirmEmailPage"
import DashboardLayout from "@/components/layout/DashboardLayout"
import AdminLayout from "@/components/layout/AdminLayout"
import AdminLoginPage from "@/pages/admin/AdminLoginPage"
import UserManagementPage from "@/pages/admin/UserManagementPage"
import TokenSettingsPage from "@/pages/admin/TokenSettingsPage"
import ExplorerPage from "@/pages/ExplorerPage"
import { Toaster } from "@/components/ui/sonner"

export function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Auth routes */}
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        
        {/* Protected routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/confirm/:token" element={<ConfirmEmailPage />} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<AdminLayout />}>
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/settings" element={<TokenSettingsPage />} />
          <Route path="/admin/dashboard" element={<div className="p-8"><h1 className="text-2xl font-bold">Admin Dashboard Coming Soon</h1></div>} />
        </Route>

        <Route path="/explorer" element={<ExplorerPage />} />
        
        {/* Fallback to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

