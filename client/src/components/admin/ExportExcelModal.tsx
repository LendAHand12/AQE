import { useState } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileSpreadsheet, Loader2 } from "lucide-react"
import { toast } from "sonner"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"

dayjs.extend(customParseFormat)

interface ExportExcelModalProps {
  isOpen: boolean
  onClose: () => void
  onExport: (startDate: string, endDate: string) => Promise<void>
  title?: string
}

export function ExportExcelModal({ 
  isOpen, 
  onClose, 
  onExport,
  title = "Export to Excel"
}: ExportExcelModalProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    // Validate format
    if (startDate && !dayjs(startDate, "DD/MM/YYYY", true).isValid()) {
      toast.error("Start Date format is invalid. Must be DD/MM/YYYY (e.g. 18/05/2026)")
      return
    }
    if (endDate && !dayjs(endDate, "DD/MM/YYYY", true).isValid()) {
      toast.error("End Date format is invalid. Must be DD/MM/YYYY (e.g. 18/05/2026)")
      return
    }

    setIsExporting(true)
    try {
      const formattedStart = startDate ? dayjs(startDate, "DD/MM/YYYY").format("YYYY-MM-DD") : ""
      const formattedEnd = endDate ? dayjs(endDate, "DD/MM/YYYY").format("YYYY-MM-DD") : ""
      await onExport(formattedStart, formattedEnd)
      onClose()
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-[24px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-[#276152] p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
              <DialogDescription className="text-emerald-100 mt-1">
                Select a date range to export data
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 bg-white">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">From Date</label>
              <Input 
                type="text" 
                placeholder="DD/MM/YYYY (e.g. 18/05/2026)"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-12 rounded-[12px]"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">To Date</label>
              <Input 
                type="text" 
                placeholder="DD/MM/YYYY (e.g. 18/05/2026)"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-12 rounded-[12px]"
              />
            </div>
            <p className="text-xs text-gray-500 italic">
              * Leave date inputs empty to export all system data
            </p>
          </div>
        </div>

        <DialogFooter className="p-6 pt-0 bg-white">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isExporting}
            className="rounded-[12px] h-11"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting}
            className="bg-[#276152] hover:bg-[#1e4b40] text-white rounded-[12px] h-11 px-6 font-bold"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              'Download Excel'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
