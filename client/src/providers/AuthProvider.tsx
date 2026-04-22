import React, { createContext, useContext, useState, useEffect } from "react"

interface AuthContextType {
  user: any
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (userData: any, token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize auth state from localStorage
    const savedUser = localStorage.getItem("user")
    const savedToken = localStorage.getItem("token")

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser))
        setToken(savedToken)
      } catch (err) {
        console.error("Failed to parse user from localStorage", err)
        localStorage.removeItem("user")
        localStorage.removeItem("token")
      }
    }
    setIsLoading(false)
  }, [])

  const syncProfile = async () => {
    if (!token) return
    try {
      const response = await import("@/lib/axios").then(m => m.default.get("/auth/profile"))
      setUser(response.data)
      localStorage.setItem("user", JSON.stringify(response.data))
    } catch (err) {
      console.error("Failed to sync profile", err)
    }
  }

  const login = (userData: any, authToken: string) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem("user", JSON.stringify(userData))
    localStorage.setItem("token", authToken)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    // Note: We don't necessarily redirect here, the guards will handle it
  }

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    syncProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
