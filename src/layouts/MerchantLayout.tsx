
import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
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

// Mock merchant data for direct access
const mockMerchant = {
  id: "demo-merchant-id",
  businessName: "Demo Business",
  email: "demo@example.com",
  businessLogo: "🏪",
  businessColor: "#3B82F6"
};

const MerchantLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar toggle */}
      <button
        className="fixed z-50 bottom-4 right-4 md:hidden bg-primary text-white p-3 rounded-full shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      
      {/* Sidebar */}
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{mockMerchant.businessName}</p>
                <p className="text-xs text-muted-foreground">{mockMerchant.email}</p>
              </div>
              <Link
                to="/"
                className="p-2 rounded-md hover:bg-muted transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </Link>
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
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MerchantLayout;
