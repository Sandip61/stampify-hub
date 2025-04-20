import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Mail, Store, Palette } from "lucide-react";
import { toast } from "sonner";
import { logoutMerchant, getCurrentMerchant } from "@/utils/merchantAuth";

const MerchantProfile = () => {
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMerchant = async () => {
      try {
        const currentMerchant = await getCurrentMerchant();
        if (!currentMerchant) {
          navigate("/merchant/login");
          return;
        }
        setMerchant(currentMerchant);
      } catch (error) {
        toast.error("Failed to load merchant profile");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMerchant();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logoutMerchant();
      setTimeout(() => {
        toast.success("Logged out successfully");
        navigate("/merchant/login", { replace: true });
      }, 100);
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  if (isLoading || !merchant) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-12 h-12 rounded-full border-t-2 border-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Merchant Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your merchant account settings</p>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="border-b px-4 py-3">
            <h3 className="font-medium">Account Information</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Store className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Business Name</span>
              </div>
              <span className="text-sm font-medium">{merchant.businessName}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Email</span>
              </div>
              <span className="text-sm font-medium">{merchant.email}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Account ID</span>
              </div>
              <span className="text-sm font-medium">{merchant.id}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Palette className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Brand Color</span>
              </div>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: merchant.businessColor }}
                />
                <span className="text-sm font-medium">{merchant.businessColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="border-b px-4 py-3">
            <h3 className="font-medium">Account Actions</h3>
          </div>
          <div className="p-4">
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantProfile;
