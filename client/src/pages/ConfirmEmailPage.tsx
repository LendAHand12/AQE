import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import apiClient from "@/lib/axios"

export default function ConfirmEmailPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const hasCalled = React.useRef(false)

  useEffect(() => {
    if (hasCalled.current) return
    hasCalled.current = true

    const confirmAccount = async () => {
      try {
        const response = await apiClient.get(`/auth/confirm/${token}`)
        setStatus("success")
        setMessage(response.data.message)
      } catch (error: any) {
        setStatus("error")
        setMessage(error.response?.data?.message || "Xác thực thất bại. Vui lòng thử lại.")
      }
    }

    if (token) {
      confirmAccount()
    }
  }, [token])

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full space-y-6">
        {status === "loading" && (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-12 h-12 text-[#276152] animate-spin" />
            <h1 className="text-xl font-bold text-[#111827]">Đang xác thực tài khoản...</h1>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-[#276152]" />
            <h1 className="text-2xl font-bold text-[#111827]">Thành công!</h1>
            <p className="text-gray-500">{message}</p>
            <button
              onClick={() => navigate("/login")}
              className="w-full h-[44px] bg-[#276152] hover:bg-[#1e4d41] text-white font-semibold rounded-[12px] transition-all duration-300 mt-4"
            >
              Đăng nhập ngay
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center space-y-4">
            <XCircle className="w-16 h-16 text-red-500" />
            <h1 className="text-2xl font-bold text-[#111827]">Lỗi xác thực</h1>
            <p className="text-gray-500">{message}</p>
            <button
              onClick={() => navigate("/login")}
              className="w-full h-[44px] border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-[12px] transition-all duration-300 mt-4"
            >
              Quay lại trang chủ
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
