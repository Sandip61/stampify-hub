
import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, CreditCard, History, User, LogOut, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { logoutUser } from "@/utils/auth";
import { toast } from "sonner";
import QRScannerModal from "./QRScannerModal";

const Navigation = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(true);
  const [lastScrollPosition, setLastScrollPosition] = useState(0);
  const [scannerOpen, setScannerOpen] = useState(false);

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
    logoutUser();
    window.location.href = "/login";
    toast.success("You have been logged out successfully");
  };

  const handleScanClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setScannerOpen(true);
  };

  if (isMobile === undefined) return null;

  const isAuthPage = ["/login", "/signup", "/forgot-password"].includes(location.pathname);
  
  if (isAuthPage) return null;

  return (
    <>
      {!isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
          <nav className="flex items-center justify-between max-w-3xl mx-auto px-6 h-16">
            <div className="flex items-center space-x-1">
              <NavLink 
                to="/" 
                className={({isActive}) => 
                  cn("nav-link", isActive && "nav-link-active")
                }
              >
                Home
              </NavLink>
              <NavLink 
                to="/cards" 
                className={({isActive}) => 
                  cn("nav-link", isActive && "nav-link-active")
                }
              >
                Cards
              </NavLink>
              <NavLink 
                to="/history" 
                className={({isActive}) => 
                  cn("nav-link", isActive && "nav-link-active")
                }
              >
                History
              </NavLink>
              <button 
                onClick={handleScanClick}
                className="nav-link"
              >
                Scan QR
              </button>
            </div>
            <div className="flex items-center space-x-1">
              <NavLink 
                to="/profile" 
                className={({isActive}) => 
                  cn("nav-link", isActive && "nav-link-active")
                }
              >
                Profile
              </NavLink>
              <button 
                onClick={handleLogout}
                className="nav-link flex items-center"
              >
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {isMobile && (
        <div 
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 bg-background border-t transition-transform duration-300",
            !visible && "translate-y-full"
          )}
        >
          <nav className="flex items-center justify-between px-6 h-16">
            <NavLink 
              to="/" 
              className={({isActive}) => 
                cn("flex flex-col items-center space-y-1", 
                isActive ? "text-foreground" : "text-muted-foreground")
              }
            >
              <Home className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </NavLink>
            <NavLink 
              to="/cards" 
              className={({isActive}) => 
                cn("flex flex-col items-center space-y-1", 
                isActive ? "text-foreground" : "text-muted-foreground")
              }
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-xs">Cards</span>
            </NavLink>
            <button 
              onClick={handleScanClick}
              className="flex flex-col items-center space-y-1 text-muted-foreground"
            >
              <ScanLine className="w-5 h-5" />
              <span className="text-xs">Scan</span>
            </button>
            <NavLink 
              to="/history" 
              className={({isActive}) => 
                cn("flex flex-col items-center space-y-1", 
                isActive ? "text-foreground" : "text-muted-foreground")
              }
            >
              <History className="w-5 h-5" />
              <span className="text-xs">History</span>
            </NavLink>
            <NavLink 
              to="/profile" 
              className={({isActive}) => 
                cn("flex flex-col items-center space-y-1", 
                isActive ? "text-foreground" : "text-muted-foreground")
              }
            >
              <User className="w-5 h-5" />
              <span className="text-xs">Profile</span>
            </NavLink>
            <button 
              onClick={handleLogout}
              className="flex flex-col items-center space-y-1 text-muted-foreground"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-xs">Logout</span>
            </button>
          </nav>
        </div>
      )}

      <QRScannerModal open={scannerOpen} onOpenChange={setScannerOpen} />
    </>
  );
};

export default Navigation;
