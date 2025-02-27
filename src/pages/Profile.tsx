
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellOff, Download } from "lucide-react";
import { toast } from "sonner";
import { getCurrentUser, updateUserProfile, User } from "@/utils/auth";
import { getUserStampCards, getUserTransactions } from "@/utils/data";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate("/login");
      return;
    }

    setUser(currentUser);
    setIsLoading(false);
  }, [navigate]);

  const toggleNotifications = async () => {
    if (!user || isSaving) return;
    
    setIsSaving(true);
    
    try {
      const updatedUser = await updateUserProfile(user.id, {
        notificationsEnabled: !user.notificationsEnabled
      });
      
      setUser(updatedUser);
      toast.success(updatedUser.notificationsEnabled 
        ? "Notifications enabled" 
        : "Notifications disabled"
      );
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  const exportUserData = () => {
    if (!user) return;
    
    const cards = getUserStampCards();
    const transactions = getUserTransactions();
    
    const userData = {
      profile: user,
      cards,
      transactions
    };
    
    // Create a download link
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "stampify-data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    toast.success("Your data has been exported");
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen pt-16 pb-20 px-4 max-w-3xl mx-auto animate-fade-in">
        <div className="h-screen flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-t-2 border-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 pb-20 px-4 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Your Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account</p>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden mb-6">
        <div className="border-b px-4 py-3">
          <h3 className="font-medium">Account Information</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="text-sm font-medium">{user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Account ID</span>
            <span className="text-sm font-medium">{user.id}</span>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden mb-6">
        <div className="border-b px-4 py-3">
          <h3 className="font-medium">Notification Settings</h3>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive updates about your stamp cards
              </p>
            </div>
            <button 
              onClick={toggleNotifications}
              className="inline-flex items-center justify-center w-12 h-6 rounded-full transition-colors"
              style={{
                backgroundColor: user.notificationsEnabled ? 'var(--primary)' : 'var(--muted)'
              }}
              disabled={isSaving}
            >
              <div 
                className="w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform"
                style={{
                  transform: user.notificationsEnabled ? 'translateX(6px)' : 'translateX(-6px)'
                }}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden mb-6">
        <div className="border-b px-4 py-3">
          <h3 className="font-medium">Data & Privacy</h3>
        </div>
        <div className="p-4">
          <button
            onClick={exportUserData}
            className="inline-flex items-center px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Your Data
          </button>
          <p className="text-xs text-muted-foreground mt-2">
            Download a copy of your personal data including your profile, stamp cards, and activity history.
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="border-b px-4 py-3">
          <h3 className="font-medium">App Version</h3>
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">Stampify v1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
