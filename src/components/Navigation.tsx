import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, CreditCard, History, User, LogOut, ScanLine, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRole } from "@/contexts/RoleContext";
import { UserRole } from "@/integrations/supabase/client";
import { logoutUser } from "@/utils/auth";
import { toast } from "sonner";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { activeRole } = useRole();
  const [visible, setVisible] = useState(true);
  const [lastScrollPosition, setLastScrollPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentPosition = window.scrollY;
      const isScrollingDown = currentPosition > lastScrollPosition;
      const scrollThreshold = 10;

      // For mobile, hide navigation when scrolling down and show when scrolling up
      if (isMobile) {
        if (Math.abs(currentPosition - lastScrollPosition) > scrollThreshold) {
          if (isScrollingDown && currentPosition > 100) {
            setVisible(false);
          } else if (!isScrollingDown || currentPosition < 50) {
            setVisible(true);
          }
        }
      } else {
        // Desktop behavior - hide when scrolling down past threshold
        if (currentPosition > 50) {
          setVisible(!isScrollingDown || currentPosition < 10);
        } else {
          setVisible(true);
        }
      }

      setLastScrollPosition(currentPosition);
    };

    const throttledScroll = () => {
      requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", throttledScroll, { passive: true });
    return () => window.removeEventListener("scroll", throttledScroll);
  }, [lastScrollPosition, isMobile]);

  const handleLogout = () => {
    logoutUser();
    window.location.href = "/login";
    toast.success("You have been logged out successfully");
  };

  const handleScanClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/${activeRole}/scan-qr`);
  };

  const handleHistoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (activeRole === UserRole.CUSTOMER) {
      navigate('/customer/transactions');
    } else {
      navigate('/merchant/history');
    }
  };

  const handleBusinessesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/${activeRole}/businesses`);
  };

  if (isMobile === undefined) return null;

  const isAuthPage = ["/login", "/signup", "/forgot-password"].includes(location.pathname);
  
  if (isAuthPage) return null;

  // Generate role-aware paths
  const homePath = activeRole === UserRole.CUSTOMER ? "/customer" : "/merchant";
  const cardsPath = activeRole === UserRole.CUSTOMER ? "/customer/cards" : "/merchant/cards";
  const profilePath = activeRole === UserRole.CUSTOMER ? "/customer/profile" : "/merchant/profile";
  const businessesPath = `/${activeRole}/businesses`;
  const historyPath = activeRole === UserRole.CUSTOMER ? "/customer/transactions" : "/merchant/history";

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
                to={homePath}
                className={({isActive}) => 
                  cn("nav-link", isActive && "nav-link-active")
                }
              >
                Home
              </NavLink>
              <NavLink 
                to={cardsPath}
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
                to={profilePath}
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
            "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t transition-transform duration-300 ease-out",
            !visible && "translate-y-full"
          )}
        >
          <nav className="flex items-center justify-between px-6 h-16">
            <NavLink 
              to={homePath}
              className={({isActive}) => 
                cn("flex flex-col items-center space-y-1", 
                isActive ? "text-foreground" : "text-muted-foreground")
              }
            >
              <Home className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </NavLink>
            <NavLink 
              to={cardsPath}
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
                location.pathname === businessesPath ? "text-foreground" : "text-muted-foreground")}
            >
              <Store className="w-5 h-5" />
              <span className="text-xs">Stores</span>
            </button>
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
                location.pathname === historyPath ? "text-foreground" : "text-muted-foreground")}
            >
              <History className="w-5 h-5" />
              <span className="text-xs">History</span>
            </button>
            <NavLink 
              to={profilePath}
              className={({isActive}) => 
                cn("flex flex-col items-center space-y-1", 
                isActive ? "text-foreground" : "text-muted-foreground")
              }
            >
              <User className="w-5 h-5" />
              <span className="text-xs">Profile</span>
            </button>
          </nav>
        </div>
      )}
    </>
  );
};

export default Navigation;
