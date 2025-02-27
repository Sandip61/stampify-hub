
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  Save,
  Store,
  PaintBucket
} from "lucide-react";
import { getCurrentMerchant, updateMerchantProfile } from "@/utils/merchantAuth";

const MerchantSettings = () => {
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState<any>(null);
  const [businessName, setBusinessName] = useState("");
  const [businessLogo, setBusinessLogo] = useState("");
  const [businessColor, setBusinessColor] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    const currentMerchant = getCurrentMerchant();
    if (!currentMerchant) {
      navigate("/merchant/login");
      return;
    }
    
    setMerchant(currentMerchant);
    setBusinessName(currentMerchant.businessName);
    setBusinessLogo(currentMerchant.businessLogo);
    setBusinessColor(currentMerchant.businessColor);
    setIsLoading(false);
  }, [navigate]);

  const handleSave = async () => {
    if (!merchant) return;
    
    setIsSaving(true);
    
    try {
      const updatedMerchant = await updateMerchantProfile(merchant.id, {
        businessName,
        businessLogo,
        businessColor
      });
      
      setMerchant(updatedMerchant);
      toast.success("Settings updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Logo options
  const logoOptions = ["🏪", "☕", "🍔", "🍕", "🍦", "🥪", "🛍️", "📚", "👕", "💇", "🛒", "🧁"];
  
  // Color options
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <button
          onClick={handleSave}
          className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          disabled={isSaving}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="bg-card border rounded-xl p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="businessName" className="flex items-center text-sm font-medium">
              <Store className="h-4 w-4 mr-2" />
              Business Name
            </label>
            <input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Your Business Name"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium">
              Business Logo
            </label>
            <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
              {logoOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`h-10 rounded-md flex items-center justify-center text-lg ${
                    businessLogo === option 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-secondary text-secondary-foreground"
                  }`}
                  onClick={() => setBusinessLogo(option)}
                  disabled={isSaving}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium">
              <PaintBucket className="h-4 w-4 mr-2" />
              Brand Color
            </label>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {colorOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`h-10 rounded-md ${businessColor === option ? "ring-2 ring-primary" : ""}`}
                  style={{ backgroundColor: option }}
                  onClick={() => setBusinessColor(option)}
                  disabled={isSaving}
                />
              ))}
            </div>
          </div>
          
          <div className="mt-8 p-4 border rounded-md bg-muted/50">
            <h3 className="text-sm font-medium mb-4">Preview</h3>
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-md flex items-center justify-center text-2xl"
                style={{ backgroundColor: businessColor }}
              >
                {businessLogo}
              </div>
              <div>
                <h3 className="font-medium">{businessName}</h3>
                <p className="text-sm text-muted-foreground">Your brand identity</p>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              These settings will be applied to your loyalty program and customer-facing interfaces.
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-card border rounded-xl p-6">
        <h2 className="text-lg font-medium mb-4">Account Settings</h2>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Email Address
            </label>
            <input
              type="email"
              value={merchant?.email || ""}
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={true}
            />
            <p className="text-xs text-muted-foreground">
              This is the email you use to log in
            </p>
          </div>
          
          <div className="pt-4 border-t">
            <button
              className="text-sm text-destructive hover:underline"
              onClick={() => navigate("/merchant/change-password")}
            >
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantSettings;
