import React, { useState, useEffect } from "react";
import { merchantSupabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Mail, Calendar, LogOut, Edit2, Check, X, Palette } from "lucide-react";

interface MerchantProfile {
  id: string;
  business_name: string;
  business_logo: string;
  business_color: string;
  email: string;
  created_at: string;
}

const MerchantProfile = () => {
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessLogo, setBusinessLogo] = useState("");
  const [businessColor, setBusinessColor] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await merchantSupabase.auth.getUser();
      if (!user) {
        navigate("/merchant/login");
        return;
      }

      const { data: profileData, error } = await merchantSupabase
        .from("merchants")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setProfile(profileData);
      setBusinessName(profileData?.business_name || "");
      setBusinessLogo(profileData?.business_logo || "");
      setBusinessColor(profileData?.business_color || "");
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await merchantSupabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out successfully");
      navigate("/merchant/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  const startEditing = () => {
    setBusinessName(profile?.business_name || "");
    setBusinessLogo(profile?.business_logo || "");
    setBusinessColor(profile?.business_color || "");
    setEditing(true);
  };

  const saveProfile = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      const { error } = await merchantSupabase
        .from("merchants")
        .update({ 
          business_name: businessName,
          business_logo: businessLogo,
          business_color: businessColor
        })
        .eq("id", profile.id);

      if (error) throw error;

      setProfile({ 
        ...profile, 
        business_name: businessName,
        business_logo: businessLogo,
        business_color: businessColor
      });
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setEditing(false);
    setBusinessName(profile?.business_name || "");
    setBusinessLogo(profile?.business_logo || "");
    setBusinessColor(profile?.business_color || "");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Profile not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              {editing ? (
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Enter business name"
                />
              ) : (
                <Input
                  value={profile.business_name || "Not set"}
                  readOnly
                  className="bg-gray-50"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessLogo">Business Logo (Emoji)</Label>
              {editing ? (
                <Input
                  id="businessLogo"
                  value={businessLogo}
                  onChange={(e) => setBusinessLogo(e.target.value)}
                  placeholder="🏪"
                  maxLength={2}
                />
              ) : (
                <Input
                  value={profile.business_logo || "🏪"}
                  readOnly
                  className="bg-gray-50"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessColor">Brand Color</Label>
              {editing ? (
                <div className="flex gap-2">
                  <Input
                    id="businessColor"
                    type="color"
                    value={businessColor}
                    onChange={(e) => setBusinessColor(e.target.value)}
                    className="w-20"
                  />
                  <Input
                    value={businessColor}
                    onChange={(e) => setBusinessColor(e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-gray-400" />
                  <div 
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: profile.business_color }}
                  />
                  <Input
                    value={profile.business_color || "#3B82F6"}
                    readOnly
                    className="bg-gray-50 flex-1"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  value={profile.email}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="created">Member Since</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <Input
                  id="created"
                  value={new Date(profile.created_at).toLocaleDateString()}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>

            {editing ? (
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={saveProfile}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelEditing}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                onClick={startEditing}
                variant="outline"
                className="flex items-center gap-2 mt-4"
              >
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleSignOut}
              variant="destructive"
              className="w-full flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MerchantProfile;
