
import React from "react";
import Navigation from "@/components/Navigation";

interface MainLayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, hideNav = false }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-teal-50 via-white to-amber-50">
      {!hideNav && <Navigation />}
      <main className={`flex-1 ${!hideNav ? 'container mx-auto px-4 py-4 max-w-5xl pt-20' : ''}`}>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
