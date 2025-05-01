
// Update MainLayout to include RoleSwitcher
import { ReactNode } from "react";
import Navigation from "@/components/Navigation";
import RoleSwitcher from "@/components/RoleSwitcher";
import { useRole } from "@/contexts/RoleContext";

interface MainLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

const MainLayout = ({ children, hideNav = false }: MainLayoutProps) => {
  const { hasBothRoles } = useRole();

  return (
    <div className="flex flex-col min-h-screen">
      {!hideNav && <Navigation />}
      
      {/* Show role switcher for users with dual roles */}
      {!hideNav && hasBothRoles && (
        <div className="flex justify-center mt-2 mb-4">
          <RoleSwitcher />
        </div>
      )}
      
      <main className={`flex-1 ${hideNav ? "" : "pt-16"}`}>{children}</main>
    </div>
  );
};

export default MainLayout;
