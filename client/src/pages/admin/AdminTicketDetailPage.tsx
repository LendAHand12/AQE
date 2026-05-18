import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { 
  ArrowLeft, 
  Loader2, 
  User, 
  ShieldCheck,
  CheckCircle,
  XCircle
} from "lucide-react"
import apiClient from "@/lib/axios"
import dayjs from "dayjs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function AdminTicketDetailPage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [ticket, setTicket] = useState<any>(null)
  
  const [responseMessage, setResponseMessage] = useState("")
  const [responseFiles, setResponseFiles] = useState<File[]>([])
  const [replying, setReplying] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [closing, setClosing] = useState(false)

  const fetchTicket = async () => {
    try {
      // Need to use the specific admin endpoint
      const res = await apiClient.get(`/tickets/admin/${id}`)
      setTicket(res.data)
    } catch (err) {
      console.error("Fetch ticket error:", err)
      toast.error("Could not fetch ticket details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTicket()
  }, [id])

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!responseMessage.trim()) {
      toast.error("Please enter a response")
      return
    }
    setReplying(true)
    try {
      const data = new FormData()
      data.append("adminResponse", responseMessage)
      responseFiles.forEach(file => {
        data.append("images", file)
      })

      await apiClient.put(`/tickets/admin/${id}/reply`, data, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      toast.success("Response sent successfully")
      setResponseMessage("")
      setResponseFiles([])
      fetchTicket()
    } catch (err) {
      console.error("Reply error:", err)
      toast.error("Could not send response")
    } finally {
      setReplying(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files)
      if (responseFiles.length + newImages.length > 5) {
        toast.error("Max 5 images allowed")
        return
      }
      setResponseFiles(prev => [...prev, ...newImages])
    }
  }

  const removeFile = (index: number) => {
    setResponseFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleResolve = async () => {
    setResolving(true)
    try {
      await apiClient.put(`/tickets/admin/${id}/resolve`)
      toast.success("Ticket marked as resolved")
      fetchTicket()
    } catch (err) {
      toast.error("Could not resolve ticket")
    } finally {
      setResolving(false)
    }
  }

  const handleClose = async () => {
    setClosing(true)
    try {
      await apiClient.put(`/tickets/admin/${id}/close`)
      toast.success("Ticket closed")
      fetchTicket()
    } catch (err) {
      toast.error("Could not close ticket")
    } finally {
      setClosing(false)
    }
  }

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-[#276152]" />
    </div>
  )

  if (!ticket) return (
    <div className="text-center py-20 text-gray-500">Ticket not found.</div>
  )

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 font-sans pb-10">
      <div className="flex items-center gap-4">
        <Link to="/admin/tickets" className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-200">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-3">
            <Badge className="bg-gray-100 text-gray-700 border-none uppercase font-bold">{ticket.status}</Badge>
          </div>
          <p className="text-xs text-gray-400">Ticket ID: {ticket._id}</p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
            <Button 
              variant="outline" 
              className="border-green-200 text-green-700 hover:bg-green-50"
              onClick={handleResolve}
              disabled={resolving}
            >
              {resolving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Mark Resolved
            </Button>
          )}
          {ticket.status !== 'CLOSED' && (
            <Button 
              variant="outline" 
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
              onClick={handleClose}
              disabled={closing}
            >
              {closing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
              Close Ticket
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: User Message & Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#EFEFEF] rounded-[16px] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#EFEFEF] bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{ticket.subject}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <User size={14} />
                <span className="font-medium text-gray-900">{ticket.userId.fullName || ticket.userId.username}</span>
                <span>({ticket.userId.email})</span>
                <span>•</span>
                <span>{dayjs(ticket.createdAt).format("MMM DD, YYYY HH:mm")}</span>
              </div>
            </div>

            <div className="p-6">
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap text-[15px]">
                {ticket.message}
              </div>
              
              {ticket.images && ticket.images.length > 0 && (
                <div className="mt-6 border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-bold text-gray-500 mb-4">Attachments</h4>
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
            <div className="bg-gray-50/80 border border-[#EFEFEF] rounded-[16px] shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[#EFEFEF]">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#276152]" />
                  Admin Response
                  <span className="text-xs text-gray-500 font-normal ml-auto">
                    {dayjs(ticket.adminResponseAt).format("MMM DD, YYYY HH:mm")}
                  </span>
                </h3>
              </div>
              <div className="p-6">
                <div className="prose max-w-none text-gray-700 whitespace-pre-wrap text-[15px]">
                  {ticket.adminResponse}
                </div>
              </div>
            </div>
          )}

          {/* Replies Loop */}
          {ticket.replies && ticket.replies.map((reply: any, idx: number) => (
            <div key={idx} className={
              reply.sender === 'ADMIN' 
                ? "bg-gray-50/80 border border-[#EFEFEF] rounded-[16px] shadow-sm overflow-hidden" 
                : "bg-white border border-[#EFEFEF] rounded-[16px] shadow-sm overflow-hidden"
            }>
              <div className="p-6 border-b border-[#EFEFEF] bg-gray-50/50">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  {reply.sender === 'ADMIN' ? (
                    <ShieldCheck size={18} className="text-[#276152]" />
                  ) : (
                    <User size={18} className="text-gray-500" />
                  )}
                  {reply.sender === 'ADMIN' ? 'Admin' : ticket.userId.fullName || ticket.userId.username}
                  <span className="text-xs text-gray-500 font-normal ml-auto">
                    {dayjs(reply.createdAt).format("MMM DD, YYYY HH:mm")}
                  </span>
                </h3>
              </div>
              
              <div className="p-6">
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
            </div>
          ))}

          {/* Reply Form */}
          {ticket.status !== 'CLOSED' && (
            <div className="bg-white border border-[#EFEFEF] rounded-[16px] shadow-sm p-6 sm:p-8">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#276152]" />
                Write a response
              </h3>
              <form onSubmit={handleReplySubmit} className="space-y-4">
                <textarea 
                  className="w-full min-h-[120px] p-4 bg-gray-50 border border-gray-200 rounded-xl resize-y text-[15px] focus:outline-none focus:ring-2 focus:ring-[#276152]/50"
                  placeholder="Type your response to the user..."
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
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
                  
                  <Button 
                    type="submit"
                    disabled={replying || !responseMessage.trim()}
                    className="bg-[#276152] hover:bg-[#1e4b40] text-white px-8 h-10 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {replying && <Loader2 className="w-4 h-4 animate-spin" />}
                    Send Response
                  </Button>
                </div>
                
                {responseFiles.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
                    {responseFiles.map((file, idx) => (
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

        {/* Right Column: User Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-[#EFEFEF] rounded-[16px] shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">User Information</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Full Name</p>
                <p className="font-medium">{ticket.userId.fullName}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Username</p>
                <p className="font-medium">@{ticket.userId.username}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Email</p>
                <p className="font-medium">{ticket.userId.email}</p>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <Link 
                  to={`/admin/users/${ticket.userId._id}`}
                  className="text-[#276152] hover:underline font-medium text-sm flex items-center justify-between"
                >
                  View full profile
                  <ArrowLeft size={14} className="rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
