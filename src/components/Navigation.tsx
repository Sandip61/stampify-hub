
import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, CreditCard, History, User, LogOut, ScanLine, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { logoutUser } from "@/utils/auth";
import { toast } from "sonner";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(true);
  const [lastScrollPosition, setLastScrollPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentPosition = window.scrollY;
      const isScrollingDown = currentPosition > lastScrollPosition;

      // Show nav when scrolling up or when near the top
      // Hide nav only when scrolling down and past a threshold
      if (currentPosition > 50) {
        setVisible(!isScrollingDown || currentPosition < 10);
      } else {
        setVisible(true);
      }

      setLastScrollPosition(currentPosition);
    };

    const throttledScroll = () => {
      requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", throttledScroll, { passive: true });
    return () => window.removeEventListener("scroll", throttledScroll);
  }, [lastScrollPosition]);

  const handleLogout = () => {
    logoutUser();
    window.location.href = "/login";
    toast.success("You have been logged out successfully");
  };

  const handleScanClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/scan-qr');
  };

  const handleHistoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/transactions');
  };

  const handleBusinessesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/customer/businesses');
  };

  if (isMobile === undefined) return null;

  const isAuthPage = ["/login", "/signup", "/forgot-password"].includes(location.pathname);
  
  if (isAuthPage) return null;

  return (
    <>
      {!isMobile && (
        <div className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b transition-transform duration-300 ease-out",
          !visible && "-translate-y-full"
        )}>
          <nav className="flex items-center justify-between max-w-3xl mx-auto px-6 h-14">
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
              <button 
                onClick={handleBusinessesClick}
                className="nav-link"
              >
                Businesses
              </button>
              <button 
                onClick={handleHistoryClick}
                className="nav-link"
              >
                History
              </button>
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
            "fixed bottom-0 left-0 right-0 z-50 bg-background border-t transition-transform duration-300 ease-out",
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
              onClick={handleBusinessesClick}
              className={cn("flex flex-col items-center space-y-1", 
                location.pathname === "/customer/businesses" ? "text-foreground" : "text-muted-foreground")}
            >
              <Store className="w-5 h-5" />
              <span className="text-xs">Stores</span>
            </Button>
            <button 
              onClick={handleScanClick}
              className="flex flex-col items-center space-y-1 text-muted-foreground"
            >
              <ScanLine className="w-5 h-5" />
              <span className="text-xs">Scan</span>
            </button>
            <button 
              onClick={handleHistoryClick}
              className={cn("flex flex-col items-center space-y-1", 
                location.pathname === "/transactions" ? "text-foreground" : "text-muted-foreground")}
            >
              <History className="w-5 h-5" />
              <span className="text-xs">History</span>
            </button>
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
          </nav>
        </div>
      )}
    </>
  );
};

export default Navigation;
