import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

export function Pagination({ currentPage, totalPages, onPageChange, disabled }: PaginationProps) {
  if (totalPages <= 1) return null

  const getPages = () => {
    const pages = []
    const showMax = 5
    
    let start = Math.max(1, currentPage - 2)
    let end = Math.min(totalPages, start + showMax - 1)
    
    if (end === totalPages) {
      start = Math.max(1, end - showMax + 1)
    }

    for (let i = start; i <= end; i++) {
        pages.push(i)
    }
    return pages
  }

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-lg border-gray-200"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || disabled}
      >
        <ChevronLeft size={18} />
      </Button>

      <div className="flex items-center gap-1.5">
        {getPages().map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-9 w-9 rounded-lg font-bold transition-all",
              currentPage === page 
                ? "bg-[#276152] hover:bg-[#1e4d41] text-white shadow-sm" 
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
            onClick={() => onPageChange(page)}
            disabled={disabled}
          >
            {page}
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-lg border-gray-200"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || disabled}
      >
        <ChevronRight size={18} />
      </Button>
    </div>
  )
}
