
import { ReactNode, useEffect, useState, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { customerSupabase, merchantSupabase, UserRole, isSessionExpiringSoon } from '@/integrations/supabase/client';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
  roleType: UserRole;
}

const ProtectedRoute = ({ children, roleType }: ProtectedRouteProps) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const location = useLocation();
  const { activeRole, setActiveRole, customerSession, merchantSession } = useRole();
  
  // Use a ref to track if a refresh operation is in progress
  const isRefreshingRef = useRef(false);
  // Track last refresh attempt time to implement backoff
  const lastRefreshAttemptRef = useRef(0);
  // Debounce timer
  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Use session info from RoleContext first if available
    // This prevents unnecessary API calls
    if (roleType === UserRole.MERCHANT && merchantSession) {
      console.log('Using existing merchant session from context');
      setIsAuthorized(true);
      setIsChecking(false);
      return;
    } else if (roleType === UserRole.CUSTOMER && customerSession) {
      console.log('Using existing customer session from context');
      setIsAuthorized(true);
      setIsChecking(false);
      return;
    }
    
    // Debounce the auth check to prevent multiple rapid calls
    debounceTimerRef.current = window.setTimeout(() => {
      checkAuth();
    }, 100);
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [roleType, location.pathname, customerSession, merchantSession]);
  
  const checkAuth = async () => {
    // Select the appropriate supabase client based on roleType
    const supabaseClient = roleType === UserRole.MERCHANT ? merchantSupabase : customerSupabase;
    
    try {
      // Don't proceed if we're already refreshing
      if (isRefreshingRef.current) {
        console.log(`Auth refresh already in progress for ${roleType}, skipping`);
        return;
      }
      
      // Implement backoff for retry attempts (minimum 2 seconds between refresh attempts)
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshAttemptRef.current;
      if (lastRefreshAttemptRef.current > 0 && timeSinceLastRefresh < 2000) {
        console.log(`Too soon for another refresh attempt for ${roleType}, waiting...`);
        setIsChecking(false);
        return;
      }
      
      // Get current session
      console.log(`Checking auth for ${roleType}`);
      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
      
      if (sessionError) {
        console.error(`Session error for ${roleType}:`, sessionError);
        setIsAuthorized(false);
        setIsChecking(false);
        return;
      }
      
      if (!session) {
        // No session found
        console.log(`No session found for ${roleType}`);
        setIsAuthorized(false);
        setIsChecking(false);
        return;
      }
      
      // Check if session is expiring soon and refresh if needed
      // Only refresh if truly necessary
      if (isSessionExpiringSoon(session.expires_at)) {
        console.log(`Session for ${roleType} is expiring soon, refreshing...`);
        
        // Mark that we're refreshing to prevent concurrent refresh attempts
        isRefreshingRef.current = true;
        lastRefreshAttemptRef.current = Date.now();
        
        try {
          const { data: { session: refreshedSession }, error } = await supabaseClient.auth.refreshSession();
          
          isRefreshingRef.current = false;
          
          if (error) {
            console.error('Failed to refresh session:', error);
            
            // Handle rate limiting specifically
            if (error.status === 429 || error.message?.includes('rate limit')) {
              toast.error("Too many requests. Please try again in a moment.");
              // Still allow access if we have a valid session
              if (session && !isSessionExpiringSoon(session.expires_at)) {
                console.log("Using existing session despite refresh failure");
                setIsAuthorized(true);
                setIsChecking(false);
                return;
              }
            }
            
            setIsAuthorized(false);
            setIsChecking(false);
            return;
          }
          
          if (!refreshedSession) {
            console.log("No refreshed session returned");
            setIsAuthorized(false);
            setIsChecking(false);
            return;
          }
          
          // Continue with refreshed session
          console.log(`Successfully refreshed ${roleType} session`);
        } catch (refreshError) {
          console.error(`Error during refresh for ${roleType}:`, refreshError);
          isRefreshingRef.current = false;
          setIsAuthorized(false);
          setIsChecking(false);
          return;
        }
      }
      
      // Verify user role in JWT metadata
      const userRole = session.user?.user_metadata?.role;
      
      // If no specific role found, we'll still allow access during the transition period
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
  
  if (isChecking) {
    // Show loading state while checking authentication
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-teal-500"></div>
      </div>
    );
  }
  
  // If not authorized, redirect to appropriate login page, preserving the current location
  if (!isAuthorized) {
    const loginPath = roleType === UserRole.MERCHANT ? '/merchant/login' : '/customer/login';
    console.log(`Not authorized for ${roleType}, redirecting to ${loginPath}`);
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }
  
  // If authorized, render children
  return <>{children}</>;
};

export default ProtectedRoute;
