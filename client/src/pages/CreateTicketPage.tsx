import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Loader2, ImagePlus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import apiClient from "@/lib/axios"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export default function CreateTicketPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files)
      if (files.length + newImages.length > 5) {
        toast.error(t("ticket.err_max_images"))
        return
      }
      setFiles(prev => [...prev, ...newImages])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      const newImages = Array.from(e.dataTransfer.files)
      if (files.length + newImages.length > 5) {
        toast.error(t("ticket.err_max_images"))
        return
      }
      setFiles(prev => [...prev, ...newImages])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject || !message) {
      toast.error(t("ticket.err_required"))
      return
    }

    setLoading(true)
    try {
      const data = new FormData()
      data.append("subject", subject)
      data.append("message", message)
      files.forEach(file => {
        data.append("images", file)
      })

      await apiClient.post("/tickets", data, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      
      toast.success(t("ticket.success_created"))
      navigate("/tickets")
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("ticket.err_create"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[800px] mx-auto space-y-8 font-sans pb-10">
      <div className="flex items-center gap-4">
        <Link to="/tickets" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <div className="space-y-1">
          <h1 className="text-[32px] font-bold text-[#111827] tracking-tight">{t("ticket.create_title")}</h1>
          <p className="text-[#636D7D] text-[16px]">{t("ticket.create_subtitle")}</p>
        </div>
      </div>

      <div className="bg-white border border-[#EFEFEF] rounded-[24px] p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">{t("ticket.subject_label")}</label>
            <Input 
              placeholder={t("ticket.subject_placeholder")}
              className="h-12 bg-gray-50 border-gray-200"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">{t("ticket.message_label")}</label>
            <Textarea 
              placeholder={t("ticket.message_placeholder")}
              className="min-h-[150px] bg-gray-50 border-gray-200 resize-y"
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700">{t("ticket.attachments_label")}</label>
            <div 
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-colors relative",
                isDragging ? "border-[#276152] bg-[#276152]/5" : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                multiple 
                accept="image/png, image/jpeg, image/webp"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
                title=""
              />
              <div className="flex flex-col items-center gap-2 pointer-events-none">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-2">
                  <ImagePlus className="text-[#276152] w-6 h-6" />
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-bold text-[#276152]">{t("ticket.upload_file")}</span> {t("ticket.drag_drop")}
                </p>
                <p className="text-xs text-gray-400">{t("ticket.file_limits")}</p>
              </div>
            </div>
            
            {files.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {files.map((file, idx) => (
                  <div key={idx} className="relative group">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt="preview" 
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                    <button 
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end">
            <Button 
              type="submit" 
              className="w-full sm:w-auto px-8 bg-[#276152] hover:bg-[#1e4b40] text-white font-bold h-12 text-md rounded-xl"
              disabled={loading}
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
              {t("ticket.submit_btn")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
