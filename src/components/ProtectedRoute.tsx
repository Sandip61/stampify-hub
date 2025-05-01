
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { customerSupabase, merchantSupabase, UserRole, isSessionExpiringSoon } from '@/integrations/supabase/client';
import { useRole } from '@/contexts/RoleContext';

interface ProtectedRouteProps {
  children: ReactNode;
  roleType: UserRole;
}

const ProtectedRoute = ({ children, roleType }: ProtectedRouteProps) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const location = useLocation();
  const { activeRole, setActiveRole } = useRole();
  
  useEffect(() => {
    const checkAuth = async () => {
      // Select the appropriate supabase client based on roleType
      const supabaseClient = roleType === UserRole.MERCHANT ? merchantSupabase : customerSupabase;
      
      try {
        // Get current session
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
          // No session found
          setIsAuthorized(false);
          setIsChecking(false);
          return;
        }
        
        // Check if session is expiring soon and refresh if needed
        if (isSessionExpiringSoon(session.expires_at)) {
          console.log(`Session for ${roleType} is expiring soon, refreshing...`);
          const { data: { session: refreshedSession }, error } = await supabaseClient.auth.refreshSession();
          
          if (error || !refreshedSession) {
            console.error('Failed to refresh session:', error);
            setIsAuthorized(false);
            setIsChecking(false);
            return;
          }
        }
        
        // Verify user role in JWT metadata
        const userRole = session.user?.user_metadata?.role;
        
        // If no specific role found, we'll still allow access during the transition period
        // We can remove this fallback later when all users have proper role metadata
        if (userRole && userRole !== roleType) {
          console.warn(`User role mismatch: expected ${roleType}, got ${userRole}`);
          setIsAuthorized(false);
          setIsChecking(false);
          return;
        }
        
        // Set active role in context
        setActiveRole(roleType);
        
        // User is authorized
        setIsAuthorized(true);
        setIsChecking(false);
      } catch (error) {
        console.error(`Error during auth check for ${roleType}:`, error);
        setIsAuthorized(false);
        setIsChecking(false);
      }
    };
    
    checkAuth();
  }, [roleType, setActiveRole, location.pathname]);
  
  if (isChecking) {
    // Show loading state while checking authentication
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-teal-500"></div>
      </div>
    );
  }
  
  // If not authorized, redirect to appropriate login page
  if (!isAuthorized) {
    return <Navigate to={roleType === UserRole.MERCHANT ? '/merchant/login' : '/customer/login'} replace />;
  }
  
  // If authorized, render children
  return <>{children}</>;
};

export default ProtectedRoute;
