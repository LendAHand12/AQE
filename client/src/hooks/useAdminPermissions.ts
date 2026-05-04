import { useMemo } from "react"

export type AdminPermission = 
  | "USERS_VIEW" 
  | "USERS_EDIT" 
  | "USERS_DELETE" 
  | "KYC_VIEW" 
  | "KYC_APPROVE" 
  | "PROPERTIES_VIEW" 
  | "PROPERTIES_ADD" 
  | "PROPERTIES_EDIT" 
  | "PROPERTIES_DELETE" 
  | "TRANSACTIONS_VIEW" 
  | "TRANSACTIONS_EXPORT" 
  | "WITHDRAWALS_VIEW" 
  | "WITHDRAWALS_APPROVE" 
  | "SETTINGS_VIEW" 
  | "SETTINGS_EDIT"

export const useAdminPermissions = () => {
  const adminInfo = useMemo(() => {
    try {
      const info = localStorage.getItem("admin_info")
      return info ? JSON.parse(info) : null
    } catch (e) {
      return null
    }
  }, [])

  const hasPermission = (permission: AdminPermission): boolean => {
    if (!adminInfo) return false
    if (adminInfo.role === "superadmin") return true
    return adminInfo.permissions?.includes(permission) || false
  }

  const hasAnyPermission = (permissions: AdminPermission[]): boolean => {
    if (!adminInfo) return false
    if (adminInfo.role === "superadmin") return true
    return permissions.some(p => adminInfo.permissions?.includes(p))
  }

  return {
    hasPermission,
    hasAnyPermission,
    role: adminInfo?.role,
    isSuperAdmin: adminInfo?.role === "superadmin"
  }
}
