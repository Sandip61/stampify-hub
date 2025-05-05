import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginMerchant, validateMerchantEmail } from "@/utils/merchantAuth";
import { toast } from "sonner";
import PasswordInput from "@/components/PasswordInput";
import { getCurrentMerchant } from "@/utils/merchantAuth";
import { merchantSupabase } from "@/integrations/supabase/client";

const MerchantLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const [authCheckCompleted, setAuthCheckCompleted] = useState(false);
  
  const hasConfirmed = new URLSearchParams(location.search).get('confirmed') === 'true';
  const isJustLoggedOut = sessionStorage.getItem('just_logged_out') === 'true';
  
  // Get the intended redirect destination or default to "/merchant"
  const from = location.state?.from?.pathname || "/merchant";

  useEffect(() => {
    if (hasConfirmed) {
      toast.success("Email verified successfully! You can now log in.");
    }
    
    // Clear the logged out flag if it exists
    if (isJustLoggedOut) {
      sessionStorage.removeItem('just_logged_out');
    }
  }, [hasConfirmed, isJustLoggedOut]);

  useEffect(() => {
    // Flag to prevent race conditions
    let isMounted = true;
    
    const checkAuth = async () => {
      // Don't redirect to dashboard if user just logged out
      if (isJustLoggedOut) {
        if (isMounted) {
          setIsCheckingAuth(false);
          setAuthCheckCompleted(true);
        }
        return;
      }
      
      try {
        console.log("Checking merchant authentication status...");
        
        // First check directly with Supabase to get the latest state
        const { data, error } = await merchantSupabase.auth.getSession();
        
        if (error) {
          console.error("Error checking Supabase session:", error);
          if (isMounted) {
            setIsCheckingAuth(false);
            setAuthCheckCompleted(true);
          }
          return;
        }
        
        // If we have a session, redirect
        if (data.session) {
          console.log("Active merchant session found:", data.session.user.id);
          
          // Also check if we can get the merchant profile
          try {
            const merchant = await getCurrentMerchant();
            if (merchant) {
              console.log("Merchant profile fetched successfully, redirecting to", from);
              navigate(from || "/merchant");
              return;
            } else {
              console.log("No merchant profile found despite valid session");
              // Clear potentially corrupt session
              await merchantSupabase.auth.signOut();
            }
          } catch (profileError) {
            console.error("Error fetching merchant profile:", profileError);
          }
        } else {
          console.log("No active merchant session found");
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
          setAuthCheckCompleted(true);
        }
      }
    };
    
    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, [navigate, isJustLoggedOut, from]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!validateMerchantEmail(email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const merchant = await loginMerchant(email, password);
      toast.success(`Welcome back, ${merchant.businessName}!`);
      
      // Direct navigation to merchant dashboard instead of going through home
      // This eliminates the unnecessary redirection screen
      navigate('/merchant', { replace: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      
      // Check if it's an email confirmation error
      if (errorMessage.includes("Email not confirmed")) {
        setEmailConfirmationSent(true);
        toast.error("Please check your email to confirm your account");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth && !authCheckCompleted) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <div className="w-12 h-12 rounded-full border-t-2 border-teal-600 animate-spin" />
        <p className="mt-4 text-gray-600">Checking authentication status...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 animate-fade-in bg-gradient-to-br from-teal-50 via-white to-amber-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-amber-600 bg-clip-text text-transparent">Merchant Login</h1>
          <p className="text-muted-foreground mt-2">Sign in to your merchant dashboard</p>
        </div>
        
        {emailConfirmationSent && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
            <h3 className="text-amber-800 font-medium">Email confirmation required</h3>
            <p className="text-amber-700 text-sm mt-1">
              We've sent a confirmation email to <strong>{email}</strong>. 
              Please check your inbox and spam folder, then click the confirmation link to activate your account.
            </p>
          </div>
        )}
        
        <div className="bg-white rounded-xl shadow-lg border border-teal-100 p-6 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`flex h-10 w-full rounded-md border ${
                  errors.email ? "border-destructive" : "border-input"
                } bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                placeholder="your@business.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email}</p>
              )}
            </div>
            
            <div className="form-control">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Link to="/merchant/reset-password" className="text-xs text-teal-600 hover:text-teal-800 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                errorMessage={errors.password}
                disabled={isLoading}
              />
            </div>
            
            <button
              type="submit"
              className="w-full h-10 px-4 py-2 rounded-md bg-gradient-to-r from-teal-600 to-amber-600 text-white hover:from-teal-700 hover:to-amber-700 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Don't have a merchant account?{" "}
            <Link to="/merchant/register" className="text-teal-600 hover:text-teal-800 hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MerchantLogin;
