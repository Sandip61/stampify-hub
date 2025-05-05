
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { UserRole } from '@/integrations/supabase/client';

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeRole, merchantSession, customerSession, isLoading } = useRole();
  const [redirectAttempts, setRedirectAttempts] = useState(0);
  const hasRedirectedRef = useRef(false);
  
  useEffect(() => {
    // Prevent infinite redirect loops
    if (redirectAttempts > 3) {
      console.error('Too many redirect attempts, stopping to prevent infinite loop');
      return;
    }
    
    // Don't redirect if we're already at the right location
    if (location.pathname === '/merchant' && activeRole === UserRole.MERCHANT && merchantSession) {
      return;
    }
    
    if (location.pathname === '/customer' && activeRole === UserRole.CUSTOMER && customerSession) {
      return;
    }
    
    if (!isLoading && !hasRedirectedRef.current) {
      console.log('Home page render - Active role:', activeRole);
      console.log('Customer session:', customerSession ? 'Active' : 'None');
      console.log('Merchant session:', merchantSession ? 'Active' : 'None');
      
      const handleRedirect = () => {
        // Don't redirect if tab is not visible or we've already redirected
        if (document.hidden || hasRedirectedRef.current) {
          return;
        }
        
        // Track redirect attempts
        setRedirectAttempts(prev => prev + 1);
        
        if (activeRole === UserRole.MERCHANT && merchantSession) {
          // If they're actively using the merchant role and have a merchant session
          console.log('Redirecting to /merchant (active merchant role with session)');
          hasRedirectedRef.current = true;
          navigate('/merchant', { replace: true });
        } else if (activeRole === UserRole.CUSTOMER && customerSession) {
          // If they're actively using the customer role and have a customer session
          console.log('Redirecting to /customer (active customer role with session)');
          hasRedirectedRef.current = true;
          navigate('/customer', { replace: true });
        } else if (merchantSession) {
          // If they have a merchant session but no active role preference
          console.log('Redirecting to /merchant (merchant session available)');
          hasRedirectedRef.current = true;
          navigate('/merchant', { replace: true });
        } else if (customerSession) {
          // If they have a customer session but no active role preference
          console.log('Redirecting to /customer (customer session available)');
          hasRedirectedRef.current = true;
          navigate('/customer', { replace: true });
        } else {
          // Default fallback - send to customer login
          console.log('No active sessions, redirecting to customer login');
          hasRedirectedRef.current = true;
          navigate('/customer/login', { replace: true });
        }
      };
      
      // Use a longer delay to ensure context is fully updated and reduce rapid redirects
      const timeoutId = setTimeout(handleRedirect, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [activeRole, merchantSession, customerSession, isLoading, navigate, redirectAttempts, location.pathname]);

  // Show loading state while determining redirect
  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      <div className="mb-4">
        <div className="w-16 h-16 border-4 border-t-teal-500 border-r-amber-500 border-b-teal-500 border-l-amber-500 rounded-full animate-spin"></div>
      </div>
      <h1 className="text-xl font-medium text-gray-700">Redirecting...</h1>
      <p className="text-sm text-gray-500 mt-2">Checking authentication status...</p>
    </div>
  );
};

export default Home;
