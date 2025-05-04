
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { UserRole } from '@/integrations/supabase/client';

const Home = () => {
  const navigate = useNavigate();
  const { activeRole, merchantSession, customerSession, isLoading } = useRole();

  useEffect(() => {
    if (!isLoading) {
      console.log('Home page render - Active role:', activeRole);
      console.log('Customer session:', customerSession ? 'Active' : 'None');
      console.log('Merchant session:', merchantSession ? 'Active' : 'None');
      
      if (activeRole === UserRole.MERCHANT && merchantSession) {
        // If they're actively using the merchant role and have a merchant session
        console.log('Redirecting to /merchant (active merchant role)');
        navigate('/merchant');
      } else if (activeRole === UserRole.CUSTOMER && customerSession) {
        // If they're actively using the customer role and have a customer session
        console.log('Redirecting to /customer (active customer role)');
        navigate('/customer');
      } else if (merchantSession) {
        // If they have a merchant session but no active role preference
        console.log('Redirecting to /merchant (merchant session)');
        navigate('/merchant');
      } else if (customerSession) {
        // If they have a customer session but no active role preference
        console.log('Redirecting to /customer (customer session)');
        navigate('/customer');
      } else {
        // Default fallback - send to customer login
        console.log('No active sessions, redirecting to customer login');
        navigate('/customer/login');
      }
    }
  }, [activeRole, merchantSession, customerSession, isLoading, navigate]);

  // Show loading state while determining redirect
  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      <div className="mb-4">
        <div className="w-16 h-16 border-4 border-t-teal-500 border-r-amber-500 border-b-teal-500 border-l-amber-500 rounded-full animate-spin"></div>
      </div>
      <h1 className="text-xl font-medium text-gray-700">Redirecting...</h1>
    </div>
  );
};

export default Home;
