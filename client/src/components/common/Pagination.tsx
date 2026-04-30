import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
  totalItems?: number
  itemsPerPage?: number
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  disabled,
  totalItems,
  itemsPerPage = 10
}: PaginationProps) {
  if (totalPages <= 1 && !totalItems) return null

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

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems || 0)

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full px-4 py-2">
      {/* Left side: Item Info */}
      {totalItems !== undefined && (
        <div className="flex-1">
          <p className="font-['SVN-Gilroy:Regular',sans-serif] text-[18px] text-[#636d7d] leading-[28px]">
            {startItem}–{endItem} của {totalItems}
          </p>
        </div>
      )}

      {/* Right side: Controls */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full border-[#efefef] bg-white transition-all hover:bg-gray-50"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || disabled}
        >
          <ChevronLeft size={16} />
        </Button>

        <div className="flex items-center gap-1">
          {getPages().map((page, index, array) => {
            const showEllipsis = index > 0 && page - array[index - 1] > 1;
            return (
              <div key={page} className="flex items-center gap-1">
                {showEllipsis && <span className="text-gray-400 px-1">...</span>}
                <button
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center transition-all font-['SVN-Gilroy:Medium',sans-serif] text-[14px]",
                    currentPage === page 
                      ? "bg-[#276152] text-white" 
                      : "text-[#202020] hover:bg-gray-100"
                  )}
                  onClick={() => onPageChange(page)}
                  disabled={disabled}
                >
                  {page}
                </button>
              </div>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full border-[#efefef] bg-white transition-all hover:bg-gray-50"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || disabled}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}
