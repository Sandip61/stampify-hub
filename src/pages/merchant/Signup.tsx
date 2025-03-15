import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { isValidEmail, registerMerchant, getCurrentMerchant } from "@/utils/merchantAuth";
import { logoutUser } from "@/utils/auth";
import PasswordInput from "@/components/PasswordInput";

const MerchantSignup = () => {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState("");
  const [businessLogo, setBusinessLogo] = useState("🏪");
  const [businessColor, setBusinessColor] = useState("#3B82F6");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    businessName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Clear all existing toast notifications when component mounts
    toast.dismiss();
    
    const checkAuth = async () => {
      try {
        // Attempt to get merchant profile if already logged in as merchant
        const merchant = await getCurrentMerchant();
        if (merchant) {
          navigate("/merchant");
        } else {
          // Force logout to ensure clean state (temporary solution)
          await logoutUser();
          setIsCheckingAuth(false);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        // Force logout on any error to ensure clean state
        await logoutUser();
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  const validateForm = () => {
    const newErrors: {
      businessName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};
    
    if (!businessName.trim()) {
      newErrors.businessName = "Business name is required";
    }
    
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Clear any previous errors
    setErrors({});
    
    // Clear all existing toast notifications
    toast.dismiss();
    
    setIsLoading(true);
    
    try {
      // Force logout before registration attempt
      await logoutUser();
      
      const merchant = await registerMerchant(
        email, 
        password, 
        businessName, 
        businessLogo, 
        businessColor
      );
      
      toast.success("Merchant account created! Welcome to Stampify.");
      navigate("/merchant");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Signup failed";
      toast.error(errorMessage);
      
      // If there's a permission error or authentication conflict, offer the logout option
      if (errorMessage.includes("Permission") || errorMessage.includes("logged in")) {
        toast.info(
          <div className="flex flex-col gap-2">
            <p>Would you like to completely log out and try again?</p>
            <button 
              onClick={async () => {
                await logoutUser();
                toast.success("Logged out successfully. Please try registering again.");
                // Short delay before reloading to allow the toast to be seen
                setTimeout(() => window.location.reload(), 1500);
              }}
              className="bg-primary text-white rounded px-3 py-1.5 text-sm"
            >
              Log out and try again
            </button>
          </div>,
          { duration: 10000 }
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Sample business logos to choose from
  const logoOptions = ["🏪", "☕", "🍔", "🍕", "🍦", "🥪", "🛍️", "📚", "👕", "💇", "🛒", "🧁"];
  
  // Sample color options
  const colorOptions = [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#6366F1", // Indigo
    "#14B8A6", // Teal
    "#F97316", // Orange
    "#84CC16", // Lime
  ];

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8">
        <div className="w-12 h-12 rounded-full border-t-2 border-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Create a Merchant Account</h1>
          <p className="text-muted-foreground mt-2">Join Stampify and start your loyalty program</p>
        </div>
        
        <div className="bg-card rounded-xl shadow-sm border p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label htmlFor="businessName" className="text-sm font-medium">
                Business Name
              </label>
              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className={`flex h-10 w-full rounded-md border ${
                  errors.businessName ? "border-destructive" : "border-input"
                } bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                placeholder="Coffee Shop"
                disabled={isLoading}
              />
              {errors.businessName && (
                <p className="text-xs text-destructive mt-1">{errors.businessName}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Business Logo</label>
                <div className="grid grid-cols-4 gap-2">
                  {logoOptions.map((logo) => (
                    <button
                      key={logo}
                      type="button"
                      className={`h-10 rounded-md flex items-center justify-center text-lg ${
                        businessLogo === logo ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                      }`}
                      onClick={() => setBusinessLogo(logo)}
                    >
                      {logo}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Brand Color</label>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`h-10 rounded-md ${businessColor === color ? "ring-2 ring-primary" : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setBusinessColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
            
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
                } bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                placeholder="your@email.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email}</p>
              )}
            </div>
            
            <div className="form-control">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                errorMessage={errors.password}
                disabled={isLoading}
              />
            </div>
            
            <div className="form-control">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                errorMessage={errors.confirmPassword}
                disabled={isLoading}
              />
            </div>
            
            <button
              type="submit"
              className="w-full h-10 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Merchant Account"}
            </button>
          </form>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/merchant/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MerchantSignup;
