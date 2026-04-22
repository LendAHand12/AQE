import React, { useState, useEffect, useRef } from "react"
import { Bell, Check, Trash2, Clock, Info, CheckCircle2, AlertCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import { vi, enUS } from "date-fns/locale"
import { useSocket } from "@/providers/SocketProvider"
import { toast } from "sonner"
import apiClient from "@/lib/axios"

interface Notification {
  _id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

export default function NotificationDropdown() {
  const { t, i18n } = useTranslation()
  const { socket } = useSocket()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.isRead).length

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get("/notifications")
      setNotifications(response.data)
    } catch (error) {
      console.error("Error fetching notifications", error)
    }
  }

  useEffect(() => {
    fetchNotifications()

    if (socket) {
      socket.on("new_notification", (notification: Notification) => {
        setNotifications(prev => [notification, ...prev])
        // Trigger toast
        toast(t("notifications.new_notification"), {
          description: notification.title,
          icon: <Bell className="h-4 w-4" />,
        })
      })

      return () => {
        socket.off("new_notification")
      }
    }
  }, [socket, t])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const markAsRead = async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
    } catch (error) {
      console.error("Error marking as read", error)
    }
  }

  const markAllRead = async () => {
    try {
      await apiClient.put("/notifications/read-all")
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (error) {
      console.error("Error marking all read", error)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'KYC_APPROVED': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'KYC_REJECTED': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="size-[45px] rounded-full bg-[#efefef] hover:bg-gray-200 transition-colors flex items-center justify-center relative group"
      >
        <div className="relative">
          <Bell className="h-6 w-6 text-[#717c8d] group-hover:text-[#276152]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 size-5 bg-red-600 rounded-full border-2 border-white text-[10px] text-white font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[380px] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
            <h3 className="text-lg font-bold text-[#0d1f1d]">{t("notifications.title")}</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                className="text-xs font-semibold text-[#276152] hover:underline flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                {t("notifications.mark_all_read")}
              </button>
            )}
          </div>

          <ScrollArea className="h-[400px]">
            {notifications.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center opacity-40">
                <Bell className="h-12 w-12 mb-3" />
                <p className="text-sm font-medium">{t("notifications.empty")}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((n) => (
                  <div 
                    key={n._id}
                    onClick={() => !n.isRead && markAsRead(n._id)}
                    className={`p-4 flex gap-4 transition-colors cursor-pointer hover:bg-gray-50 relative group ${!n.isRead ? 'bg-[#276152]/5' : ''}`}
                  >
                    <div className="size-10 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-gray-50">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-bold ${!n.isRead ? 'text-[#0d1f1d]' : 'text-gray-600'}`}>{n.title}</p>
                        <span className="text-[10px] text-gray-400 font-medium shrink-0">
                          {formatDistanceToNow(new Date(n.createdAt), { 
                            addSuffix: true,
                            locale: i18n.language === 'vi' ? vi : enUS 
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{n.message}</p>
                    </div>
                    {!n.isRead && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2">
                         <div className="size-1.5 bg-[#276152] rounded-full" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
