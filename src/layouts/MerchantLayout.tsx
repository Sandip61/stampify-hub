
import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface MerchantLayoutProps {
  children: ReactNode;
}

const MerchantLayout = ({ children }: MerchantLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center">
              <span className="text-xl mr-2">🏪</span>
              <h1 className="text-xl font-bold">Dashboard</h1>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="py-6">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

const AppSidebar = () => {
  const location = useLocation();
  const { setOpen, setOpenMobile } = useSidebar();

  const menuItems = [
    {
      title: "Dashboard",
      url: "/merchant",
      icon: LayoutDashboard,
      end: true,
    },
    {
      title: "Stamp Cards",
      url: "/merchant/cards",
      icon: CreditCard,
    },
    {
      title: "Customers",
      url: "/merchant/customers",
      icon: Users,
    },
    {
      title: "History",
      url: "/merchant/history",
      icon: History,
    },
    {
      title: "Profile",
      url: "/merchant/profile",
      icon: UserCircle,
    },
    {
      title: "Settings",
      url: "/merchant/settings",
      icon: Settings,
    },
  ];

  const handleMenuClick = () => {
    // Force-close both mobile and desktop sidebar states
    setOpen(false);
    setOpenMobile(false);
  };

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center px-2 py-2">
          <Link to="/merchant" className="flex items-center" onClick={handleMenuClick}>
            <span className="text-xl mr-2">🏪</span>
            <span className="text-lg font-bold">Dashboard</span>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = item.end 
                  ? location.pathname === item.url
                  : location.pathname.startsWith(item.url + '/') || location.pathname === item.url;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.url} onClick={handleMenuClick}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center px-2 py-2">
          <Building2 size={18} className="text-gray-400" />
          <span className="ml-3 text-sm font-medium text-gray-700">
            Merchant Portal
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default MerchantLayout;
