import { Bell } from "lucide-react"
import { useLocation } from "react-router-dom"

interface AdminHeaderProps {
  title?: string;
  description?: string;
}

export default function AdminHeader({ title, description }: AdminHeaderProps) {
  const location = useLocation();
  
  // Default values based on route if not provided
  const getHeaderInfo = () => {
    if (title && description) return { title, description };
    
    switch (location.pathname) {
      case "/admin/dashboard":
        return { 
          title: "Admin Dashboard", 
          description: "Tổng quan hệ thống AQE Estate" 
        };
      case "/admin/users":
        return { 
          title: "Quản lý thành viên", 
          description: "Xem, chỉnh sửa và quản lý tất cả thành viên trong hệ thống" 
        };
      case "/admin/properties":
        return { 
          title: "Quản lý Dự án", 
          description: "Quản lý danh sách bất động sản và các dự án đầu tư" 
        };

      case "/admin/transactions/payments":
        return { 
          title: "Giao dịch USDT", 
          description: "Theo dõi và quản lý các giao dịch nạp tiền của người dùng" 
        };
      case "/admin/transactions/commissions":
        return { 
          title: "Lịch sử hoa hồng", 
          description: "Theo dõi các giao dịch trả thưởng hoa hồng hệ thống" 
        };
      case "/admin/transactions/aqe":
        return { 
          title: "Phân phối AQE", 
          description: "Quản lý lịch sử phân phối và trả thưởng token AQE" 
        };
      case "/admin/withdrawals":
        return { 
          title: "Quản lý Rút tiền", 
          description: "Duyệt và theo dõi các yêu cầu rút tiền USDT của người dùng" 
        };
      case "/admin/token-settings":
        return { 
          title: "Cài đặt Pool & Token", 
          description: "Cấu hình thông số thanh khoản và giá trị token hệ thống" 
        };
      case "/admin/settings":
        return { 
          title: "Cài đặt tài khoản", 
          description: "Quản lý thông tin cá nhân và bảo mật tài khoản Admin" 
        };
      default:
        return { 
          title: "Hệ thống quản trị", 
          description: "Hệ thống quản trị AQ Estate" 
        };
    }
  };

  const headerInfo = getHeaderInfo();
  const adminInfo = JSON.parse(localStorage.getItem("admin_info") || "{}");

  return (
    <header className="bg-white border-b border-[#efefef] flex items-center justify-between py-6 px-8 sticky top-0 z-40">
      <div className="flex flex-col gap-0.5">
        <h1 className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[20px] font-bold text-[#276152] tracking-[0.6px] leading-tight">
          {headerInfo.title}
        </h1>
        <p className="font-['SVN-Gilroy:Regular',sans-serif] text-[16px] text-[#636d7d] leading-normal">
          {headerInfo.description}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative group cursor-pointer">
          <div className="w-[45px] h-[45px] bg-[#efefef] rounded-full flex items-center justify-center transition-all hover:bg-[#e5e7eb]">
            <Bell size={24} className="text-[#111827]" />
            <span className="absolute top-2.5 right-2.5 bg-[#dc2626] w-2 h-2 rounded-full border-2 border-[#efefef]"></span>
          </div>
        </div>

        {/* User Profile Capsule */}
        <div className="h-[45px] bg-[#efefef] rounded-full pl-1 pr-4 flex items-center gap-2.5 cursor-pointer hover:bg-[#e5e7eb] transition-all">
          <div className="w-9 h-9 rounded-full bg-[#276152] flex items-center justify-center text-white overflow-hidden shadow-sm">
            {adminInfo.avatar ? (
              <img src={adminInfo.avatar} alt="Admin" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold">A</span>
            )}
          </div>
          <span className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[16px] font-bold text-[#0d1f1d] tracking-[0.6px]">
            {adminInfo.fullName || "Admin"}
          </span>
        </div>
      </div>
    </header>
  );
}
