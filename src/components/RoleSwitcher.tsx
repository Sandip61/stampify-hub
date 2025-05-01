
import { useRole } from '@/contexts/RoleContext';
import { UserRole } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const RoleSwitcher = () => {
  const { activeRole, setActiveRole, hasBothRoles } = useRole();
  const navigate = useNavigate();
  
  // If user doesn't have both roles, don't render anything
  if (!hasBothRoles) return null;
  
  const handleRoleSwitch = () => {
    const newRole = activeRole === UserRole.CUSTOMER ? UserRole.MERCHANT : UserRole.CUSTOMER;
    setActiveRole(newRole);
    
    // Navigate to the appropriate home page for the selected role
    navigate(newRole === UserRole.CUSTOMER ? '/customer' : '/merchant');
  };
  
  return (
    <button
      onClick={handleRoleSwitch}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-gradient-to-r from-teal-600 to-amber-600 text-white hover:from-teal-700 hover:to-amber-700 transition-colors"
    >
      <span>Switch to {activeRole === UserRole.CUSTOMER ? 'Merchant' : 'Customer'}</span>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    </button>
  );
};

export default RoleSwitcher;
