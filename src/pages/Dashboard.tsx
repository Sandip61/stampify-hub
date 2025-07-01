import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getCurrentUser, User } from "@/utils/auth";
import { getUserStampCards, StampCard as StampCardType } from "@/utils/data";
import { RefreshCw, Gift, CreditCard, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DiscoverBusiness {
  id: string;
  business_name: string;
  business_logo: string;
  business_color: string;
  latest_offer: string;
  latest_card_name: string;
  total_stamps: number;
  created_at: string;
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

      console.log("Starting merchant discovery for user:", user.id);

      // Get user's existing cards to find which merchants they already have cards from
      const userCards = await getUserStampCards();
      console.log("User's existing stamp cards:", userCards);
      
      // Get merchant IDs from user's existing customer_stamp_cards
      const { data: userCustomerCards, error: userCardsError } = await supabase
        .from("customer_stamp_cards")
        .select(`
          card_id,
          card:stamp_cards(merchant_id)
        `)
        .eq("customer_id", user.id);

      if (userCardsError) {
        console.error("Error fetching user cards:", userCardsError);
      }

      // Extract merchant IDs where user already has cards
      const userMerchantIds = userCustomerCards
        ?.map(card => card.card?.merchant_id)
        .filter(Boolean) || [];

      console.log("User merchant IDs (excluded from discover):", userMerchantIds);

      // First, get all merchants
      const { data: allMerchants, error: merchantsError } = await supabase
        .from("merchants")
        .select("*")
        .order("business_name");

      if (merchantsError) {
        console.error("Error fetching merchants:", merchantsError);
        setDiscoverBusinesses([]);
        return;
      }

      if (!allMerchants || allMerchants.length === 0) {
        console.log("No merchants found");
        setDiscoverBusinesses([]);
        return;
      }

      // Then get active stamp cards for all merchants
      const { data: activeCards, error: cardsError } = await supabase
        .from("stamp_cards")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (cardsError) {
        console.error("Error fetching active stamp cards:", cardsError);
        setDiscoverBusinesses([]);
        return;
      }

      console.log("All merchants:", allMerchants);
      console.log("Active stamp cards:", activeCards);

      // Process the data to create discover business data
      const discoverData: DiscoverBusiness[] = allMerchants
        .map((merchant: any) => {
          // Skip merchants where user already has cards
          if (userMerchantIds.includes(merchant.id)) {
            return null;
          }

          // Find active cards for this merchant
          const merchantCards = activeCards?.filter(card => card.merchant_id === merchant.id) || [];
          
          if (merchantCards.length === 0) {
            return null;
          }

          // Get the latest (most recent) stamp card for this merchant
          const latestCard = merchantCards[0]; // Already sorted by created_at desc

          return {
            id: merchant.id,
            business_name: merchant.business_name,
            business_logo: merchant.business_logo || "🏪",
            business_color: merchant.business_color || "#3B82F6",
            latest_offer: latestCard.reward,
            latest_card_name: latestCard.name,
            total_stamps: latestCard.total_stamps,
            created_at: latestCard.created_at
          };
        })
        .filter(Boolean) // Remove null entries
        .slice(0, 6); // Limit to 6 businesses

      console.log("Final discover businesses after processing:", discoverData);
      setDiscoverBusinesses(discoverData);
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

  return (
    <div className="container mx-auto py-4 px-4">
      <div className="flex justify-between items-center mb-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <button
          onClick={() => navigate("/customer/cards")}
          className="bg-card border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer text-left"
        >
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
        </button>

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
      <div className="mb-6">
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
              No businesses available to discover. You may need to create some merchants and stamp cards first.
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
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{business.business_name}</h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {business.latest_card_name}
                    </p>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 mb-2">
                  <p className="text-sm font-medium text-center">
                    🎁 <span className="truncate">{business.latest_offer}</span>
                  </p>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  Collect {business.total_stamps} stamps
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
