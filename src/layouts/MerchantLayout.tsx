import { useState, ReactNode, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  CreditCard, 
  Settings, 
  Users, 
  Home,
  LogOut,
  Menu,
  X,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockMerchant, initMockMerchantData } from "@/utils/mockMerchantData";
import { toast } from "sonner";

interface MerchantLayoutProps {
  children: ReactNode;
}

const MerchantLayout = ({ children }: MerchantLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollPosition, setLastScrollPosition] = useState(0);
  
  useEffect(() => {
    initMockMerchantData();
  }, []);
  
  useEffect(() => {
    const handleScroll = () => {
      const currentPosition = window.scrollY;
      const isScrollingDown = currentPosition > lastScrollPosition;

      if (currentPosition > 60) {
        setVisible(!isScrollingDown);
      } else {
        setVisible(true);
      }

      setLastScrollPosition(currentPosition);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollPosition]);

  const handleLogout = () => {
    navigate("/");
    toast.success("You have been logged out successfully");
  };
  
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50">
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 merchant-sidebar transform transition-transform duration-200 ease-in-out md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center h-16 px-6 border-b border-teal-500">
            <h1 className="text-xl font-bold">Merchant Dashboard</h1>
          </div>
          
          <nav className="flex-1 px-4 py-4 space-y-1">
            <Link
              to="/merchant"
              className={cn(
                "merchant-nav-item",
                location.pathname === "/merchant" && "merchant-nav-item-active"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <Home className="mr-3 h-5 w-5" />
              Dashboard
            </Link>
            <Link
              to="/merchant/cards"
              className={cn(
                "merchant-nav-item",
                location.pathname.includes("/merchant/cards") && "merchant-nav-item-active"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <CreditCard className="mr-3 h-5 w-5" />
              Stamp Cards
            </Link>
            <Link
              to="/merchant/customers"
              className={cn(
                "merchant-nav-item",
                location.pathname.includes("/merchant/customers") && "merchant-nav-item-active"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <Users className="mr-3 h-5 w-5" />
              Customers
            </Link>
            <Link
              to="/merchant/analytics"
              className={cn(
                "merchant-nav-item",
                location.pathname.includes("/merchant/analytics") && "merchant-nav-item-active"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <BarChart3 className="mr-3 h-5 w-5" />
              Analytics
            </Link>
            <Link
              to="/merchant/settings"
              className={cn(
                "merchant-nav-item",
                location.pathname.includes("/merchant/settings") && "merchant-nav-item-active"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </Link>
            <Link
              to="/merchant/profile"
              className={cn(
                "merchant-nav-item",
                location.pathname.includes("/merchant/profile") && "merchant-nav-item-active"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <User className="mr-3 h-5 w-5" />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="merchant-nav-item w-full text-left text-red-100 hover:bg-red-500/30"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </nav>
          
          <div className="border-t border-teal-500 px-4 py-4">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium">{mockMerchant.businessName}</p>
                <p className="text-xs text-teal-100">{mockMerchant.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className={cn(
        "flex-1 transition-all duration-200",
        "md:ml-64"
      )}>
        <main className="p-6">
          {children}
        </main>
      </div>

      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 md:hidden merchant-mobile-nav transition-transform duration-300",
          !visible && "translate-y-full"
        )}
      >
        <nav className="flex items-center justify-between px-6 h-16">
          <Link 
            to="/merchant" 
            className={cn(
              "flex flex-col items-center space-y-1", 
              location.pathname === "/merchant" ? "text-teal-600" : "text-muted-foreground"
            )}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </Link>
          <Link 
            to="/merchant/cards" 
            className={cn(
              "flex flex-col items-center space-y-1", 
              location.pathname.includes("/merchant/cards") ? "text-teal-600" : "text-muted-foreground"
            )}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-xs">Cards</span>
          </Link>
          <Link 
            to="/merchant/customers" 
            className={cn(
              "flex flex-col items-center space-y-1", 
              location.pathname.includes("/merchant/customers") ? "text-teal-600" : "text-muted-foreground"
            )}
          >
            <Users className="w-5 h-5" />
            <span className="text-xs">Customers</span>
          </Link>
          <Link 
            to="/merchant/analytics" 
            className={cn(
              "flex flex-col items-center space-y-1", 
              location.pathname.includes("/merchant/analytics") ? "text-teal-600" : "text-muted-foreground"
            )}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs">Analytics</span>
          </Link>
          <Link 
            to="/merchant/settings" 
            className={cn(
              "flex flex-col items-center space-y-1", 
              location.pathname.includes("/merchant/settings") ? "text-teal-600" : "text-muted-foreground"
            )}
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs">Settings</span>
          </Link>
        </nav>
      </div>

      <button
        className="fixed z-50 top-4 right-4 md:hidden bg-teal-600 text-white p-3 rounded-full shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </div>
  );
};

export default MerchantLayout;
