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
import AdminPaymentHistoryPage from "@/pages/admin/AdminPaymentHistoryPage"
import AdminCommissionHistoryPage from "@/pages/admin/AdminCommissionHistoryPage"
import AdminAQEHistoryPage from "@/pages/admin/AdminAQEHistoryPage"
import ExplorerPage from "@/pages/ExplorerPage"
import PreRegisterPage from "@/pages/PreRegisterPage"
import PaymentHistoryPage from "@/pages/PaymentHistoryPage"
import NotFoundPage from "@/pages/NotFoundPage"
import ReferralPage from "@/pages/ReferralPage"
import { Toaster } from "@/components/ui/sonner"
import BalanceHistoryPage from "@/pages/BalanceHistoryPage"
import { SocketProvider } from "./providers/SocketProvider"
import { AuthProvider } from "./providers/AuthProvider"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import PublicRoute from "./components/auth/PublicRoute"

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Toaster position="top-right" richColors />
          <Routes>
            {/* Redirect root based on auth status is handled by guards, but default to login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Auth routes (Public only) */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/register" element={<AuthPage mode="register" />} />
            </Route>
            
            {/* Protected routes (Auth required) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/pre-register" element={<PreRegisterPage />} />
                <Route path="/payment-history" element={<PaymentHistoryPage />} />
                <Route path="/balance-history" element={<BalanceHistoryPage />} />
                <Route path="/referrals" element={<ReferralPage />} />
              </Route>
            </Route>

            <Route path="/confirm/:token" element={<ConfirmEmailPage />} />

            {/* Admin routes (Should ideally have an AdminRoute guard too) */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route element={<AdminLayout />}>
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route path="/admin/settings" element={<TokenSettingsPage />} />
              <Route path="/admin/transactions/payments" element={<AdminPaymentHistoryPage />} />
              <Route path="/admin/transactions/commissions" element={<AdminCommissionHistoryPage />} />
              <Route path="/admin/transactions/aqe" element={<AdminAQEHistoryPage />} />
              <Route path="/admin/dashboard" element={<div className="p-8"><h1 className="text-2xl font-bold">Admin Dashboard Coming Soon</h1></div>} />
            </Route>

            <Route path="/explorer" element={<ExplorerPage />} />
            
            {/* Not Found page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

