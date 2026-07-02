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
    
    if (location.pathname.startsWith("/admin/tickets/")) {
      return { 
        title: "Ticket Details", 
        description: "View and resolve user support ticket" 
      };
    }

    switch (location.pathname) {
      case "/admin/dashboard":
        return { 
          title: "Admin Dashboard", 
          description: "AQE Estate system overview" 
        };
      case "/admin/users":
        return { 
          title: "User Management", 
          description: "View, edit, and manage all system members" 
        };
      case "/admin/properties":
        return { 
          title: "Property Management", 
          description: "Manage real estate listings and investment projects" 
        };

      case "/admin/transactions/payments":
        return { 
          title: "USDT Transactions", 
          description: "Track and manage user deposit transactions" 
        };
      case "/admin/transactions/commissions":
        return { 
          title: "Commission History", 
          description: "Track system commission reward transactions" 
        };
      case "/admin/withdrawals":
        return { 
          title: "Withdrawal Management", 
          description: "Approve and track user USDT withdrawal requests" 
        };
      case "/admin/wallet-connections":
        return { 
          title: "Wallet Connections", 
          description: "Manage and reconcile wallets used to connect to the system" 
        };
      case "/admin/token-settings":
        return { 
          title: "Pool & Token Settings", 
          description: "Configure liquidity parameters and system token values" 
        };
      case "/admin/settings":
        return { 
          title: "Account Settings", 
          description: "Manage personal info and admin security" 
        };
      case "/admin/tickets":
        return { 
          title: "Support Tickets", 
          description: "Manage user support requests" 
        };
        case "/admin/packages":
        return { 
          title: "Manage Partnership Packages", 
          description: "Create and configure AQE partnership packages for users." 
        };
      default:
        return { 
          title: "Management System", 
          description: "AQ Estate Management System" 
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
