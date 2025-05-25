
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { customerSupabase, merchantSupabase, UserRole } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  
  // Use refs to track if we've already initialized sessions
  const initializedRef = useRef(false);
  
  // Track when sessions were last checked to prevent too frequent checks
  const lastSessionCheckRef = useRef(0);
  
  // Track ongoing session operations
  const customerOperationInProgressRef = useRef(false);
  const merchantOperationInProgressRef = useRef(false);
  
  // Track session check errors to prevent infinite loops
  const sessionErrorCountRef = useRef(0);
  const MAX_SESSION_ERRORS = 5; // Increased from 3 to be more tolerant
  
  // Setup auth listeners and initial session check
  useEffect(() => {
    if (initializedRef.current) {
      // Skip if we've already initialized to prevent duplicate subscriptions
      return;
    }
    
    initializedRef.current = true;
    
    // Helper function to handle rate limiting and other errors
    const safeSessionCheck = async (
      client: typeof customerSupabase,
      clientName: string,
      setSessionFn: (session: any) => void
    ) => {
      // Don't allow concurrent operations on the same client
      if (clientName === 'customer' && customerOperationInProgressRef.current) {
        console.log('Customer session check already in progress, skipping');
        return;
      }
      if (clientName === 'merchant' && merchantOperationInProgressRef.current) {
        console.log('Merchant session check already in progress, skipping');
        return;
      }
      
      // Check if we've had too many errors recently
      if (sessionErrorCountRef.current >= MAX_SESSION_ERRORS) {
        console.warn(`Too many session check errors (${sessionErrorCountRef.current}), suspending checks`);
        return;
      }
      
      // Implement backoff strategy
      const now = Date.now();
      const timeSinceLastCheck = now - lastSessionCheckRef.current;
      if (lastSessionCheckRef.current > 0 && timeSinceLastCheck < 3000) { // 3 seconds backoff
        console.log(`Too soon for another ${clientName} session check, skipping`);
        return;
      }
      
      // Set operation in progress flag
      if (clientName === 'customer') {
        customerOperationInProgressRef.current = true;
      } else {
        merchantOperationInProgressRef.current = true;
      }
      
      try {
        const { data, error } = await client.auth.getSession();
        
        if (error) {
          // If we hit rate limits, back off
          if (error.status === 429 || error.message?.includes('rate limit')) {
            console.warn(`${clientName} session check rate limited`);
            sessionErrorCountRef.current++;
            return;
          }
          
          console.error(`${clientName} session check error:`, error);
          sessionErrorCountRef.current++;
        } else {
          // Reset error count on success
          sessionErrorCountRef.current = Math.max(0, sessionErrorCountRef.current - 1);
          setSessionFn(data.session);
          console.log(`${clientName} session:`, data.session ? 'Active' : 'None');
          
          // Update timestamp on successful check
          lastSessionCheckRef.current = Date.now();
        }
      } catch (error) {
        console.error(`Error in ${clientName} session check:`, error);
        sessionErrorCountRef.current++;
      } finally {
        // Clear operation flag
        if (clientName === 'customer') {
          customerOperationInProgressRef.current = false;
        } else {
          merchantOperationInProgressRef.current = false;
        }
      }
    };
    
    const checkSessions = async () => {
      setIsLoading(true);
      
      try {
        // Check sessions with proper error handling
        await Promise.all([
          safeSessionCheck(customerSupabase, 'customer', setCustomerSession),
          safeSessionCheck(merchantSupabase, 'merchant', setMerchantSession)
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Set up auth state listeners
    const customerSubscription = customerSupabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Customer auth state changed:', event);
        setCustomerSession(session);
        // Reset error count when auth state changes
        sessionErrorCountRef.current = 0;
      }
    );
    
    const merchantSubscription = merchantSupabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Merchant auth state changed:', event);
        setMerchantSession(session);
        // Reset error count when auth state changes
        sessionErrorCountRef.current = 0;
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
    console.log(`Setting active role to: ${role}`);
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
