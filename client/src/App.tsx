import { useEffect } from "react"
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import AuthPage from "@/pages/auth/AuthPage"
import Dashboard from "@/pages/Dashboard"
import SettingsPage from "@/pages/SettingsPage"
import ConfirmEmailPage from "@/pages/ConfirmEmailPage"
import DashboardLayout from "@/components/layout/DashboardLayout"
import AdminLayout from "@/components/layout/AdminLayout"
import AdminLoginPage from "@/pages/admin/AdminLoginPage"
import UserManagementPage from "@/pages/admin/UserManagementPage"
import TokenSettingsPage from "@/pages/admin/TokenSettingsPage"
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage"
import AdminPaymentHistoryPage from "@/pages/admin/AdminPaymentHistoryPage"
import AdminCommissionHistoryPage from "@/pages/admin/AdminCommissionHistoryPage"
import AdminPackagesPage from "@/pages/admin/AdminPackagesPage"
import AdminPropertyPage from "@/pages/admin/AdminPropertyPage"
import AddPropertyPage from "@/pages/admin/AddPropertyPage"
import EditPropertyPage from "@/pages/admin/EditPropertyPage"
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage"
import AdminUserProfilePage from "@/pages/admin/AdminUserProfilePage"
import AdminWithdrawalsPage from "@/pages/admin/AdminWithdrawalsPage"
import AdminManagementPage from "@/pages/admin/AdminManagementPage"
import AdminWalletConnectionsPage from "@/pages/admin/AdminWalletConnectionsPage"
import AdminTicketsPage from "@/pages/admin/AdminTicketsPage"
import AdminTicketDetailPage from "@/pages/admin/AdminTicketDetailPage"

import ExplorerPage from "@/pages/ExplorerPage"

// import PreRegisterPage from "@/pages/PreRegisterPage"
import PaymentHistoryPage from "@/pages/PaymentHistoryPage"
import NotFoundPage from "@/pages/NotFoundPage"
import ReferralPage from "@/pages/ReferralPage"
import { Toaster } from "@/components/ui/sonner"
import BalanceHistoryPage from "@/pages/BalanceHistoryPage"
import AssetsPage from "@/pages/AssetsPage"
import KycCallbackPage from "@/pages/KycCallbackPage"
import ClaimPage from "@/pages/ClaimPage"
import ClaimProfilePage from "@/pages/ClaimProfilePage"
import PaymentPage from "@/pages/PaymentPage"
import { SocketProvider } from "./providers/SocketProvider"
import { AuthProvider } from "./providers/AuthProvider"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import PublicRoute from "./components/auth/PublicRoute"
import TicketsPage from "@/pages/TicketsPage"
import CreateTicketPage from "@/pages/CreateTicketPage"
import TicketDetailPage from "@/pages/TicketDetailPage"
import TermsPage from "@/pages/TermsPage"
import BuyPage from "@/pages/BuyPage"
import InvestmentPackagesPage from "@/pages/InvestmentPackagesPage"
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage"
import ReturnPolicyPage from "@/pages/ReturnPolicyPage"

function ExternalRedirect({ url }: { url: string }) {
  useEffect(() => {
    window.location.replace(url)
  }, [url])
  return null
}

function ReferralTracker() {
  const location = useLocation()
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const ref = params.get("ref")
    if (ref) {
      localStorage.setItem("referral_code", ref)
    }
  }, [location])
  return null
}

export function App() {
  return (
    <BrowserRouter>
      <ReferralTracker />
      <AuthProvider>
        <SocketProvider>
          <Toaster position="top-right" richColors />
          <Routes>
            {/* Redirect root based on auth status is handled by guards, but default to login */}
            <Route path="/" element={<ExternalRedirect url="https://aqestate.net/" />} />

            {/* Auth routes (Public only) */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/register" element={<AuthPage mode="register" />} />
              <Route path="/forgot-password" element={<AuthPage mode="forgot-password" />} />
              <Route path="/reset-password/:token" element={<AuthPage mode="reset-password" />} />
            </Route>

            {/* Protected routes (Auth required) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<SettingsPage />} />
                {/* <Route path="/pre-register" element={<PreRegisterPage />} /> */}
                <Route path="/buy" element={<BuyPage />} />
                <Route path="/investment-packages" element={<InvestmentPackagesPage />} />
                <Route path="/payment-history" element={<PaymentHistoryPage />} />
                <Route path="/balance-history" element={<BalanceHistoryPage />} />
                <Route path="/assets" element={<AssetsPage />} />
                <Route path="/user/kyc-callback" element={<KycCallbackPage />} />
                <Route path="/user/claim" element={<ClaimPage />} />
                <Route path="/user/claim-profile" element={<ClaimProfilePage />} />
                <Route path="/referrals" element={<ReferralPage />} />
                <Route path="/tickets" element={<TicketsPage />} />
                <Route path="/tickets/create" element={<CreateTicketPage />} />
                <Route path="/tickets/:id" element={<TicketDetailPage />} />
              </Route>
            </Route>

            <Route path="/confirm/:token" element={<ConfirmEmailPage />} />

            {/* Admin routes (Should ideally have an AdminRoute guard too) */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route element={<AdminLayout />}>
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route path="/admin/users/:id" element={<AdminUserProfilePage />} />
              <Route path="/admin/wallet-connections" element={<AdminWalletConnectionsPage />} />
              <Route path="/admin/properties" element={<AdminPropertyPage />} />
              <Route path="/admin/properties/add" element={<AddPropertyPage />} />
              <Route path="/admin/properties/edit/:id" element={<EditPropertyPage />} />

              <Route path="/admin/settings" element={<AdminSettingsPage />} />

              <Route path="/admin/token-settings" element={<TokenSettingsPage />} />
              <Route path="/admin/packages" element={<AdminPackagesPage />} />
              <Route path="/admin/transactions/payments" element={<AdminPaymentHistoryPage />} />
              <Route path="/admin/transactions/commissions" element={<AdminCommissionHistoryPage />} />
              <Route path="/admin/withdrawals" element={<AdminWithdrawalsPage />} />
              <Route path="/admin/accounts" element={<AdminManagementPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/tickets" element={<AdminTicketsPage />} />
              <Route path="/admin/tickets/:id" element={<AdminTicketDetailPage />} />
            </Route>

            <Route path="/pay" element={<PaymentPage />} />
            <Route path="/explorer" element={<ExplorerPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/return-policy" element={<ReturnPolicyPage />} />

            {/* Not Found page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

