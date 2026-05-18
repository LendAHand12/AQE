import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, Loader2, User, ShieldCheck } from "lucide-react"
import apiClient from "@/lib/axios"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"

export default function TicketDetailPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [ticket, setTicket] = useState<any>(null)

  const fetchTicket = async () => {
    try {
      const res = await apiClient.get(`/tickets/${id}`)
      setTicket(res.data)
    } catch (err) {
      console.error("Fetch ticket error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTicket()
  }, [id])

  const [replyMessage, setReplyMessage] = useState("")
  const [replyFiles, setReplyFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyMessage.trim()) return

    setSubmitting(true)
    try {
      const data = new FormData()
      data.append("message", replyMessage)
      replyFiles.forEach(file => {
        data.append("images", file)
      })

      await apiClient.post(`/tickets/${id}/reply`, data, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      setReplyMessage("")
      setReplyFiles([])
      fetchTicket()
    } catch (err: any) {
      console.error("Reply error:", err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files)
      if (replyFiles.length + newImages.length > 5) {
        return
      }
      setReplyFiles(prev => [...prev, ...newImages])
    }
  }

  const removeFile = (index: number) => {
    setReplyFiles(prev => prev.filter((_, i) => i !== index))
  }

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-[#276152]" />
    </div>
  )

  if (!ticket) return (
    <div className="text-center py-20 text-gray-500">{t("ticket.not_found")}</div>
  )

  return (
    <div className="max-w-[800px] mx-auto space-y-6 font-sans pb-6">
      <div className="flex items-center gap-4">
        <Link to="/tickets" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <div className="space-y-1 flex-1">
          <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">{t("ticket.details_title")}</h1>
          <p className="text-sm text-gray-400">ID: {ticket._id}</p>
        </div>
      </div>

      <div className="bg-white border border-[#EFEFEF] rounded-[16px] overflow-hidden shadow-sm">
        {/* Ticket Header */}
        <div className="p-6 border-b border-[#EFEFEF] bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{ticket.subject}</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <User size={14} />
            <span>{ticket.userId.fullName || ticket.userId.email}</span>
            <span>•</span>
            <span>{dayjs(ticket.createdAt).format("MMM DD, YYYY HH:mm")}</span>
          </div>
        </div>

        {/* User Message */}
        <div className="p-6">
          <div className="prose max-w-none text-gray-700 whitespace-pre-wrap text-[15px]">
            {ticket.message}
          </div>
          
          {ticket.images && ticket.images.length > 0 && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <h4 className="text-sm font-bold text-gray-500 mb-4">{t("ticket.attachments")}</h4>
              <div className="flex flex-wrap gap-4">
                {ticket.images.map((img: string, idx: number) => (
                  <a key={idx} href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${img}`} target="_blank" rel="noreferrer">
                    <img 
                      src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${img}`} 
                      alt={`attachment-${idx}`}
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Response (Backward compatibility) */}
      {ticket.adminResponse && !ticket.replies?.some((r: any) => r.message === ticket.adminResponse) && (
        <div className="bg-gray-50/80 border border-[#EFEFEF] p-6 sm:p-8 rounded-[16px]">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="text-[#276152] w-5 h-5" />
            <h3 className="font-bold text-gray-900">{t("ticket.admin_response")}</h3>
            <span className="text-xs text-gray-500 ml-auto">
              {dayjs(ticket.adminResponseAt).format("MMM DD, YYYY HH:mm")}
            </span>
          </div>
          <div className="prose max-w-none text-[#14532d] whitespace-pre-wrap text-[15px]">
            {ticket.adminResponse}
          </div>
        </div>
      )}

      {/* Replies Loop */}
      {ticket.replies && ticket.replies.map((reply: any, idx: number) => (
        <div key={idx} className={
          reply.sender === 'ADMIN' 
            ? "bg-gray-50/80 border border-[#EFEFEF] p-6 sm:p-8 rounded-[16px]" 
            : "bg-white border border-[#EFEFEF] p-6 sm:p-8 rounded-[16px]"
        }>
          <div className="flex items-center gap-2 mb-4">
            {reply.sender === 'ADMIN' ? (
              <ShieldCheck className="text-[#276152] w-5 h-5" />
            ) : (
              <User className="text-gray-500 w-5 h-5" />
            )}
            <h3 className={reply.sender === 'ADMIN' ? "font-bold text-gray-900" : "font-bold text-gray-900"}>
              {reply.sender === 'ADMIN' ? t("ticket.admin_response") : "You"}
            </h3>
            <span className="text-xs text-gray-500 ml-auto">
              {dayjs(reply.createdAt).format("MMM DD, YYYY HH:mm")}
            </span>
          </div>
          
          <div className="prose max-w-none text-gray-700 whitespace-pre-wrap text-[15px]">
            {reply.message}
          </div>
          
          {reply.images && reply.images.length > 0 && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <div className="flex flex-wrap gap-4">
                {reply.images.map((img: string, i: number) => (
                  <a key={i} href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${img}`} target="_blank" rel="noreferrer">
                    <img 
                      src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${img}`} 
                      alt={`attachment-${i}`}
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Reply Form */}
      {ticket.status !== 'CLOSED' && (
        <div className="bg-white border border-[#EFEFEF] rounded-[16px] overflow-hidden shadow-sm p-6 sm:p-8 mt-6">
          <h3 className="font-bold text-gray-900 mb-4">Reply to this ticket</h3>
          <form onSubmit={handleReplySubmit} className="space-y-4">
            <textarea 
              className="w-full min-h-[120px] p-4 bg-gray-50 border border-gray-200 rounded-xl resize-y text-[15px] focus:outline-none focus:ring-2 focus:ring-[#276152]/50"
              placeholder="Type your message..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              required
            ></textarea>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  Attach Images
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
                <span className="text-xs text-gray-500">Max 5 images</span>
              </div>
              
              <button 
                type="submit"
                disabled={submitting || !replyMessage.trim()}
                className="bg-[#276152] hover:bg-[#1e4b40] text-white px-8 py-2.5 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Reply
              </button>
            </div>
            
            {replyFiles.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
                {replyFiles.map((file, idx) => (
                  <div key={idx} className="relative group">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt="preview" 
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    />
                    <button 
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>
      )}

    </div>
  )
}
