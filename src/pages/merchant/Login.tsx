
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { isValidEmail, loginMerchant, getCurrentMerchant } from "@/utils/merchantAuth";
import PasswordInput from "@/components/PasswordInput";

const MerchantLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  
  // Check if the user is coming from a confirmed email link
  const hasConfirmed = new URLSearchParams(location.search).get('confirmed') === 'true';

  useEffect(() => {
    if (hasConfirmed) {
      toast.success("Email verified successfully! You can now log in.");
    }
  }, [hasConfirmed]);

  useEffect(() => {
    const checkAuth = async () => {
      const merchant = await getCurrentMerchant();
      if (merchant) {
        navigate("/merchant");
      } else {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(email)) {
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
      navigate("/merchant");
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

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8">
        <div className="w-12 h-12 rounded-full border-t-2 border-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 animate-fade-in bg-gradient-to-br from-teal-50 via-white to-amber-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-amber-600 bg-clip-text text-transparent">Merchant Login</h1>
          <p className="text-muted-foreground mt-2">Sign in to your Stampify Merchant account</p>
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
                placeholder="your@email.com"
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
                <Link 
                  to="/merchant/forgot-password" 
                  className="text-sm text-teal-600 hover:text-teal-800 hover:underline"
                >
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
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            New to Stampify?{" "}
            <Link to="/merchant/signup" className="text-teal-600 hover:text-teal-800 hover:underline">
              Create a merchant account
            </Link>
          </p>
        </div>
      </div>
      
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-600 via-amber-600 to-teal-600"></div>
    </div>
  );
};

export default MerchantLogin;
