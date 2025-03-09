
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerMerchant, isValidEmail, getCurrentMerchant } from "@/utils/merchantAuth";
import { logoutUser } from "@/utils/auth";
import { toast } from "sonner";
import PasswordInput from "@/components/PasswordInput";

const MerchantRegister = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessLogo, setBusinessLogo] = useState("🏪");
  const [businessColor, setBusinessColor] = useState("#3B82F6");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    businessName?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const merchant = await getCurrentMerchant();
        if (merchant) {
          navigate("/merchant");
        } else {
          setIsCheckingAuth(false);
        }
      } catch (error) {
        console.error("Error checking merchant auth:", error);
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  const validateForm = () => {
    const newErrors: {
      email?: string;
      password?: string;
      businessName?: string;
    } = {};
    
    if (!businessName) {
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Clear any previous toasts to prevent duplicates
      toast.dismiss();
      
      const merchant = await registerMerchant(
        email,
        password,
        businessName,
        businessLogo,
        businessColor
      );
      
      toast.success(`Welcome, ${merchant.businessName}!`);
      navigate("/merchant");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      toast.error(errorMessage);
      
      // If the error relates to being logged in as a customer, offer to log them out
      if (errorMessage.includes("logged in as a customer")) {
        toast.info(
          <div className="flex flex-col gap-2">
            <p>Do you want to log out from your customer account?</p>
            <button 
              onClick={async () => {
                await logoutUser();
                toast.success("Logged out successfully. You can now register as a merchant.");
                // Refresh the page after a short delay
                setTimeout(() => window.location.reload(), 1000);
              }}
              className="bg-teal-600 text-white rounded px-3 py-1.5 text-sm"
            >
              Log out
            </button>
          </div>,
          { duration: 10000 }
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Array of emoji options for business logo
  const emojiOptions = ["🏪", "🛒", "🛍️", "🍕", "☕", "🍔", "🍰", "🍷", "📚", "👕", "💄", "💊", "🏥"];

  // Array of color options for business branding
  const colorOptions = [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Yellow
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#6366F1", // Indigo
    "#F97316", // Orange
  ];

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <div className="w-12 h-12 rounded-full border-t-2 border-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 animate-fade-in bg-gradient-to-br from-teal-50 via-white to-amber-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-amber-600 bg-clip-text text-transparent">Create Merchant Account</h1>
          <p className="text-muted-foreground mt-2">Get started with Stampify for your business</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-teal-100 p-6 backdrop-blur-sm">
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
                } bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                placeholder="Your Business Name"
                disabled={isLoading}
              />
              {errors.businessName && (
                <p className="text-xs text-destructive mt-1">{errors.businessName}</p>
              )}
            </div>
            
            <div className="form-control">
              <label className="text-sm font-medium">Business Logo</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setBusinessLogo(emoji)}
                    className={`w-10 h-10 text-xl flex items-center justify-center rounded-md transition-all ${
                      businessLogo === emoji
                        ? "bg-teal-100 border-2 border-teal-500"
                        : "bg-gray-100 border border-gray-200 hover:bg-gray-200"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="form-control">
              <label className="text-sm font-medium">Business Color</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setBusinessColor(color)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      businessColor === color
                        ? "ring-2 ring-offset-2 ring-gray-500"
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                  ></button>
                ))}
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
                } bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
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
            
            <button
              type="submit"
              className="w-full h-10 px-4 py-2 rounded-md bg-gradient-to-r from-teal-600 to-amber-600 text-white hover:from-teal-700 hover:to-amber-700 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Merchant Account"}
            </button>
          </form>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Already have a merchant account?{" "}
            <Link to="/merchant/login" className="text-teal-600 hover:text-teal-800 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-600 via-amber-600 to-teal-600"></div>
    </div>
  );
};

export default MerchantRegister;
