
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/utils/auth";

interface Business {
  id: string;
  business_name: string;
  business_logo: string;
  business_color: string;
  email?: string;
}

interface StampCard {
  id: string;
  name: string;
  reward: string;
  total_stamps: number;
  description?: string;
  created_at: string;
}

const BusinessDetail = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [stampCards, setStampCards] = useState<StampCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (businessId) {
      loadBusinessDetails();
    }
  }, [businessId]);

  const loadBusinessDetails = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Fetch business details
      const { data: businessData, error: businessError } = await supabase
        .from("merchants")
        .select("id, business_name, business_logo, business_color, email")
        .eq("id", businessId)
        .single();

      if (businessError) {
        console.error("Error fetching business:", businessError);
        navigate("/customer/businesses");
        return;
      }

      setBusiness(businessData);

      // Fetch all active stamp cards for this business
      const { data: cardsData, error: cardsError } = await supabase
        .from("stamp_cards")
        .select("id, name, reward, total_stamps, description, created_at")
        .eq("merchant_id", businessId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (cardsError) {
        console.error("Error fetching stamp cards:", cardsError);
        setStampCards([]);
      } else {
        setStampCards(cardsData || []);
      }
    } catch (error) {
      console.error("Error loading business details:", error);
      navigate("/customer/businesses");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-t-2 border-primary animate-spin" />
        <p className="mt-4 text-muted-foreground">Loading business details...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center py-12">
          <h2 className="text-xl font-medium text-muted-foreground mb-4">
            Business not found
          </h2>
          <button
            onClick={() => navigate("/customer/businesses")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Businesses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header with back navigation */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/customer/businesses")}
          className="mr-4 p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Business Offers</h1>
      </div>

      {/* Business Header */}
      <div className="bg-card border rounded-xl p-6 mb-6">
        <div className="flex items-center">
          <div
            className="w-20 h-20 flex items-center justify-center rounded-full text-white text-3xl mr-6"
            style={{ backgroundColor: business.business_color }}
          >
            {business.business_logo}
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2">{business.business_name}</h2>
            <p className="text-muted-foreground">
              {stampCards.length} offer{stampCards.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>
      </div>

      {/* Offers Grid */}
      {stampCards.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-xl">
          <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium text-muted-foreground mb-2">
            No offers available
          </h3>
          <p className="text-muted-foreground">
            This business doesn't have any active loyalty programs at the moment.
          </p>
        </div>
      ) : (
        <div>
          <h3 className="text-xl font-semibold mb-4">Available Offers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stampCards.map((card) => (
              <div
                key={card.id}
                className="bg-card border rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="mb-4">
                  <h4 className="font-bold text-lg mb-2">{card.name}</h4>
                  {card.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {card.description}
                    </p>
                  )}
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-center">
                    🎁 <span className="font-bold">{card.reward}</span>
                  </p>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    Collect {card.total_stamps} stamps
                  </p>
                </div>

                <div className="text-xs text-muted-foreground">
                  Created {new Date(card.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>How to start collecting:</strong> Use the "Scan QR" option in the main menu when you visit this business to start collecting stamps for any of these offers.
        </p>
      </div>
    </div>
  );
};

export default BusinessDetail;
