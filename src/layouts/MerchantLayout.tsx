import { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CreditCard,
  Users,
  Settings,
  LayoutDashboard,
  History,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MerchantLayoutProps {
  children: ReactNode;
}

const MerchantLayout = ({ children }: MerchantLayoutProps) => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r">
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <Link to="/merchant" className="flex items-center">
              <span className="text-xl mr-2">🏪</span>
              <h1 className="text-xl font-bold">Dashboard</h1>
            </Link>
          </div>

          <nav className="flex-1 px-2 pb-4 space-y-1">
            <NavItem to="/merchant" icon={<LayoutDashboard size={18} />} end>
              Dashboard
            </NavItem>
            <NavItem to="/merchant/cards" icon={<CreditCard size={18} />}>
              Stamp Cards
            </NavItem>
            <NavItem to="/merchant/customers" icon={<Users size={18} />}>
              Customers
            </NavItem>
            <NavItem to="/merchant/history" icon={<History size={18} />}>
              History
            </NavItem>
            <NavItem to="/merchant/profile" icon={<UserCircle size={18} />}>
              Profile
            </NavItem>
            <NavItem to="/merchant/settings" icon={<Settings size={18} />}>
              Settings
            </NavItem>
          </nav>
          
          <div className="px-4 mb-6 mt-auto">
            <div className="flex items-center py-2">
              <Building2 size={18} className="text-gray-400" />
              <span className="ml-3 text-sm font-medium text-gray-700">
                Merchant Portal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="flex flex-col flex-1">
        <div className="sticky top-0 z-10 flex h-16 bg-white border-b md:hidden">
          <div className="flex items-center px-4 w-full justify-between">
            <Link to="/merchant" className="flex items-center">
              <span className="text-xl mr-2">🏪</span>
              <h1 className="text-xl font-bold">Dashboard</h1>
            </Link>
            
            {/* Mobile menu button */}
            <button className="p-1 text-gray-400 rounded-md">
              <span className="sr-only">Open menu</span>
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  end?: boolean;
}

const NavItem = ({ to, icon, children, end }: NavItemProps) => {
  const isActive = location.pathname === to || 
    (!end && location.pathname.startsWith(to + '/'));

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
        isActive
          ? "bg-gray-100 text-gray-900"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <span
        className={cn(
          "mr-3",
          isActive ? "text-gray-500" : "text-gray-400 group-hover:text-gray-500"
        )}
      >
        {icon}
      </span>
      {children}
    </Link>
  );
};

export default MerchantLayout;
