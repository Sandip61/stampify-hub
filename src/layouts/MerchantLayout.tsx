
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { logoutMerchant } from "@/utils/merchantAuth";
import { Store, CreditCard, Users, Settings, LogOut } from "lucide-react";

const MerchantLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const handleLogout = async () => {
    await logoutMerchant();
    window.location.href = "/merchant/login";
  };

  const menuItems = [
    { path: "/merchant", name: "Dashboard", icon: <Store className="w-5 h-5" /> },
    { path: "/merchant/cards", name: "Stamp Cards", icon: <CreditCard className="w-5 h-5" /> },
    { path: "/merchant/customers", name: "Customers", icon: <Users className="w-5 h-5" /> },
    { path: "/merchant/settings", name: "Settings", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r shadow-sm hidden md:block">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Merchant Portal</h2>
        </div>
        
        <nav className="p-2">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                    currentPath === item.path
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              </li>
            ))}
            <li className="mt-4 pt-4 border-t">
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 rounded-md text-red-600 hover:bg-red-50 transition-colors w-full text-left"
              >
                <LogOut className="w-5 h-5" />
                <span className="ml-3">Logout</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b z-10 p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Merchant Portal</h2>
          {/* Mobile menu button would go here */}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 md:py-6 md:px-8 p-4 pt-16 md:pt-6">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MerchantLayout;
