
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
  X
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
  
  // Initialize mock merchant data on component mount
  useEffect(() => {
    initMockMerchantData();
  }, []);
  
  // Handle scroll for mobile navigation visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentPosition = window.scrollY;
      const isScrollingDown = currentPosition > lastScrollPosition;

      // Only hide on scroll down when we're past a certain threshold
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
    // For now this just navigates to home page since we don't have real auth
    navigate("/");
    toast.success("You have been logged out successfully");
  };
  
  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center h-16 px-6 border-b">
            <h1 className="text-xl font-bold">Merchant Dashboard</h1>
          </div>
          
          <nav className="flex-1 px-4 py-4 space-y-1">
            <Link
              to="/merchant"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <Home className="mr-3 h-5 w-5" />
              Dashboard
            </Link>
            <Link
              to="/merchant/cards"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <CreditCard className="mr-3 h-5 w-5" />
              Stamp Cards
            </Link>
            <Link
              to="/merchant/customers"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <Users className="mr-3 h-5 w-5" />
              Customers
            </Link>
            <Link
              to="/merchant/analytics"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <BarChart3 className="mr-3 h-5 w-5" />
              Analytics
            </Link>
            <Link
              to="/merchant/settings"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </Link>
          </nav>
          
          <div className="border-t px-4 py-4">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium">{mockMerchant.businessName}</p>
                <p className="text-xs text-muted-foreground">{mockMerchant.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className={cn(
        "flex-1 transition-all duration-200",
        "md:ml-64" // Always shifted on medium screens and above
      )}>
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Mobile navigation */}
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t transition-transform duration-300",
          !visible && "translate-y-full"
        )}
      >
        <nav className="flex items-center justify-between px-6 h-16">
          <Link 
            to="/merchant" 
            className={cn(
              "flex flex-col items-center space-y-1", 
              location.pathname === "/merchant" ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </Link>
          <Link 
            to="/merchant/cards" 
            className={cn(
              "flex flex-col items-center space-y-1", 
              location.pathname.includes("/merchant/cards") ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-xs">Cards</span>
          </Link>
          <Link 
            to="/merchant/customers" 
            className={cn(
              "flex flex-col items-center space-y-1", 
              location.pathname.includes("/merchant/customers") ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <Users className="w-5 h-5" />
            <span className="text-xs">Customers</span>
          </Link>
          <Link 
            to="/merchant/analytics" 
            className={cn(
              "flex flex-col items-center space-y-1", 
              location.pathname.includes("/merchant/analytics") ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs">Analytics</span>
          </Link>
          <Link 
            to="/merchant/settings" 
            className={cn(
              "flex flex-col items-center space-y-1", 
              location.pathname.includes("/merchant/settings") ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs">Settings</span>
          </Link>
        </nav>
      </div>

      {/* Mobile menu toggle button - only visible on smaller screens */}
      <button
        className="fixed z-50 top-4 right-4 md:hidden bg-primary text-white p-3 rounded-full shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </div>
  );
};

export default MerchantLayout;
