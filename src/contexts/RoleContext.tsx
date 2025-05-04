
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { customerSupabase, merchantSupabase, UserRole } from '@/integrations/supabase/client';

interface RoleContextType {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  hasBothRoles: boolean;
  customerSession: any | null;
  merchantSession: any | null;
  isLoading: boolean;
}

const RoleContext = createContext<RoleContextType>({
  activeRole: UserRole.CUSTOMER,
  setActiveRole: () => {},
  hasBothRoles: false,
  customerSession: null,
  merchantSession: null,
  isLoading: true,
});

export const useRole = () => useContext(RoleContext);

interface RoleProviderProps {
  children: ReactNode;
}

export const RoleProvider = ({ children }: RoleProviderProps) => {
  const [activeRole, setActiveRoleState] = useState<UserRole>(() => {
    // Initialize from localStorage if available, default to CUSTOMER
    const savedRole = localStorage.getItem('activeRole');
    return savedRole === UserRole.MERCHANT ? UserRole.MERCHANT : UserRole.CUSTOMER;
  });
  const [customerSession, setCustomerSession] = useState<any | null>(null);
  const [merchantSession, setMerchantSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Track both sessions
  useEffect(() => {
    const checkSessions = async () => {
      setIsLoading(true);
      
      try {
        // Check customer session
        const { data: customerData } = await customerSupabase.auth.getSession();
        setCustomerSession(customerData.session);
        
        // Check merchant session
        const { data: merchantData } = await merchantSupabase.auth.getSession();
        setMerchantSession(merchantData.session);
      } catch (error) {
        console.error('Error checking sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Set up auth state listeners
    const customerSubscription = customerSupabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Customer auth state changed:', event);
        setCustomerSession(session);
      }
    );
    
    const merchantSubscription = merchantSupabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Merchant auth state changed:', event);
        setMerchantSession(session);
      }
    );
    
    // Initial check
    checkSessions();
    
    return () => {
      customerSubscription.data.subscription.unsubscribe();
      merchantSubscription.data.subscription.unsubscribe();
    };
  }, []);
  
  // Derive if user has both roles
  const hasBothRoles = Boolean(customerSession && merchantSession);
  
  // Set active role and persist to localStorage
  const setActiveRole = (role: UserRole) => {
    localStorage.setItem('activeRole', role);
    setActiveRoleState(role);
  };
  
  // Value object
  const value = {
    activeRole,
    setActiveRole,
    hasBothRoles,
    customerSession,
    merchantSession,
    isLoading,
  };
  
  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};
