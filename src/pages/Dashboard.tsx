
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getCurrentUser, User } from "@/utils/auth";
import { getUserStampCards, StampCard as StampCardType } from "@/utils/data";
import { generateDummyData } from "@/utils/generateDummyData";
import { RefreshCw, Gift, CreditCard, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DiscoverBusiness {
  id: string;
  name: string;
  business_logo: string;
  business_color: string;
  reward: string;
  total_stamps: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [stampCards, setStampCards] = useState<StampCardType[]>([]);
  const [discoverBusinesses, setDiscoverBusinesses] = useState<DiscoverBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          navigate("/login");
          return;
        }
        
        setUser(currentUser);
        
        // Load stamp cards and discover businesses
        await Promise.all([
          loadStampCards(),
          loadDiscoverBusinesses()
        ]);
      } catch (error) {
        console.error("Error checking authentication:", error);
        navigate("/login");
      }
    };
    
    checkAuth();
  }, [navigate]);

  const loadStampCards = async () => {
    try {
      const cards = await getUserStampCards();
      setStampCards(cards);
    } catch (error) {
      console.error("Error loading stamp cards:", error);
      toast.error("Failed to load your stamp cards");
    }
  };

  const loadDiscoverBusinesses = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      // Get user's existing cards to avoid showing them in discover
      const userCards = await getUserStampCards();
      const userCardIds = userCards.map(card => card.id);

      // Fetch all available stamp cards from merchants
      const { data: allCards, error } = await supabase
        .from("stamp_cards")
        .select("id, name, business_logo, business_color, reward, total_stamps")
        .eq("is_active", true)
        .not("id", "in", `(${userCardIds.length > 0 ? userCardIds.join(',') : 'null'})`)
        .limit(6);

      if (error) {
        console.error("Error fetching discover businesses:", error);
        return;
      }

      setDiscoverBusinesses(allCards || []);
    } catch (error) {
      console.error("Error loading discover businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadStampCards(),
      loadDiscoverBusinesses()
    ]);
    setRefreshing(false);
  };

  const handleGenerateDummyData = async () => {
    try {
      toast.info("Generating demo data...");
      const success = await generateDummyData();
      if (success) {
        await Promise.all([
          loadStampCards(),
          loadDiscoverBusinesses()
        ]);
        toast.success("Demo data created successfully!");
      }
    } catch (error) {
      console.error("Error generating dummy data:", error);
      toast.error("Failed to generate demo data");
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={handleRefresh}
          className="flex items-center px-3 py-2 text-sm font-medium rounded-md border hover:bg-muted transition-colors"
          disabled={refreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center text-primary mb-2">
            <CreditCard className="h-5 w-5 mr-2" />
            <h2 className="font-semibold">Total Cards</h2>
          </div>
          <p className="text-3xl font-bold">
            {loading ? (
              <span className="animate-pulse">...</span>
            ) : (
              stampCards.length
            )}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Number of your loyalty cards
          </p>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center text-green-600 mb-2">
            <Gift className="h-5 w-5 mr-2" />
            <h2 className="font-semibold">Available Rewards</h2>
          </div>
          <p className="text-3xl font-bold">
            {loading ? (
              <span className="animate-pulse">...</span>
            ) : (
              stampCards.filter(card => card.currentStamps >= card.totalStamps).length
            )}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Ready to redeem
          </p>
        </div>
      </div>

      {/* Discover Businesses Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Discover Businesses</h2>
          <button
            onClick={() => navigate("/customer/businesses")}
            className="flex items-center text-sm text-primary hover:text-primary/80 transition-colors"
          >
            View All Businesses
            <ArrowRight className="ml-1 h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-muted/40 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : discoverBusinesses.length === 0 ? (
          <div className="text-center py-8 bg-muted/20 rounded-xl">
            <p className="text-muted-foreground">
              No new businesses to discover at the moment
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {discoverBusinesses.map((business) => (
              <div
                key={business.id}
                className="bg-card border rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center mb-3">
                  <div
                    className="w-12 h-12 flex items-center justify-center rounded-full text-white text-xl mr-3"
                    style={{ backgroundColor: business.business_color }}
                  >
                    {business.business_logo}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{business.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {business.total_stamps} stamps required
                    </p>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-medium text-center">
                    🎁 {business.reward}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => navigate("/customer/scan-qr")}
          className="flex items-center px-6 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Scan QR to Add Card
        </button>
        <button
          onClick={handleGenerateDummyData}
          className="px-4 py-3 bg-muted/70 text-muted-foreground hover:bg-muted rounded-md transition-colors text-sm"
        >
          Generate Demo Data
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
