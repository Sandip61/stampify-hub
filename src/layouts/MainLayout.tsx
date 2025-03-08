
import React from "react";
import Navigation from "@/components/Navigation";

interface MainLayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, hideNav = false }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {!hideNav && <Navigation />}
      <main className="flex-1 container mx-auto px-4 py-4 max-w-5xl pt-20">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
