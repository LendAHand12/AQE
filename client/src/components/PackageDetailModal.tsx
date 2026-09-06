import { Check } from "lucide-react"

const getImageUrl = (url?: string) => {
  if (!url) return ''
  return url.startsWith('/uploads') ? import.meta.env.VITE_API_URL.replace('/api', '') + url : url
}

interface Stat {
  label: string
  value: string
}

interface PackageDetailModalProps {
  title: string
  imageUrl?: string
  subtitle?: string
  badgeLabel?: string
  investment: Stat
  aqeReceived: Stat
  aqeRequired?: Stat
  stay: Stat
  roomType: Stat
  benefitsTitle: string
  benefits: string[]
  guests: Stat
  savings: Stat
  wellness: Stat & { included: boolean }
  closeLabel: string
  primaryLabel: string
  onClose: () => void
  onPrimaryClick: () => void
}

export function PackageDetailModal({
  title,
  imageUrl,
  subtitle,
  badgeLabel,
  investment,
  aqeReceived,
  aqeRequired,
  stay,
  roomType,
  benefitsTitle,
  benefits,
  guests,
  savings,
  wellness,
  closeLabel,
  primaryLabel,
  onClose,
  onPrimaryClick
}: PackageDetailModalProps) {
  return (
    <div
      className="fixed inset-0 bg-[#0d1f1d]/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[28px] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5 md:p-6 flex flex-col md:flex-row gap-6 animate-in zoom-in-95 duration-200 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Portrait package image */}
        <div className="w-full md:w-[230px] shrink-0 aspect-[3/5] relative rounded-[20px] overflow-hidden">
          {imageUrl ? (
            <img src={getImageUrl(imageUrl)} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1e4d41] to-[#0d1f1d]" />
          )}
          <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-black/70 via-black/20 to-transparent pointer-events-none" />
          {badgeLabel && (
            <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-bold text-emerald-700 shadow-sm">
              {badgeLabel}
            </span>
          )}
          <div className="absolute top-0 left-0 right-0 p-5">
            <h2 className="text-white font-black uppercase text-2xl leading-[1.15] tracking-wide">
              {title}
            </h2>
            {subtitle && (
              <p className="text-white/75 text-[11px] font-medium mt-2">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Info column */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            {[investment, aqeReceived, ...(aqeRequired ? [aqeRequired] : []), stay, roomType].map((stat, i) => (
              <div key={i}>
                <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                <p className="text-[15px] font-extrabold text-[#111827] mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          {benefits.length > 0 && (
            <div>
              <p className="text-[15px] font-bold text-[#111827] mb-3">{benefitsTitle}</p>
              <div className="space-y-2.5">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="size-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <Check size={12} strokeWidth={3} className="text-emerald-600" />
                    </span>
                    <span className="text-sm text-gray-600 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-400 font-medium">{guests.label}</p>
              <p className="text-sm font-bold text-[#111827] mt-1">{guests.value}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 font-medium">{savings.label}</p>
              <p className="text-sm font-bold text-[#111827] mt-1">{savings.value}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 font-medium">{wellness.label}</p>
              <p className="text-sm font-bold mt-1" style={{ color: wellness.included ? "#276152" : "#9ca3af" }}>
                {wellness.value}
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-auto pt-2">
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {closeLabel}
            </button>
            <button
              onClick={onPrimaryClick}
              className="flex-1 h-12 rounded-xl text-sm font-bold text-white bg-[#276152] hover:bg-[#1e4d41] transition-colors"
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
