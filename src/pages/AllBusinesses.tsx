
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/utils/auth";

interface Business {
  id: string;
  business_name: string;
  business_logo: string;
  business_color: string;
  email?: string;
  created_at: string;
  stamp_cards: {
    id: string;
    name: string;
    reward: string;
    total_stamps: number;
    description?: string;
    created_at: string;
  }[];
}

const AllBusinesses = () => {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    const filtered = businesses.filter(business =>
      business.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.stamp_cards.some(card =>
        card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.reward.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredBusinesses(filtered);
  }, [searchTerm, businesses]);

  const loadBusinesses = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Fetch merchants with their active stamp cards
      const { data: merchants, error: merchantError } = await supabase
        .from("merchants")
        .select(`
          id,
          business_name,
          business_logo,
          business_color,
          email,
          created_at
        `)
        .order("business_name");

      if (merchantError) {
        console.error("Error fetching merchants:", merchantError);
        return;
      }

      if (!merchants) {
        setBusinesses([]);
        return;
      }

      // For each merchant, get their active stamp cards
      const businessesWithCards = await Promise.all(
        merchants.map(async (merchant) => {
          const { data: stampCards, error: cardsError } = await supabase
            .from("stamp_cards")
            .select("id, name, reward, total_stamps, description, created_at")
            .eq("merchant_id", merchant.id)
            .eq("is_active", true)
            .order("created_at", { ascending: false });

          if (cardsError) {
            console.error("Error fetching stamp cards for merchant:", merchant.id, cardsError);
            return {
              ...merchant,
              stamp_cards: []
            };
          }

          return {
            ...merchant,
            stamp_cards: stampCards || []
          };
        })
      );

      // Filter out businesses with no active stamp cards
      const validBusinesses = businessesWithCards.filter(business => business.stamp_cards.length > 0);
      
      setBusinesses(validBusinesses);
    } catch (error) {
      console.error("Error loading businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/customer")}
          className="mr-4 p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">All Participating Businesses</h1>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search businesses or offers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Results Count */}
      {!loading && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredBusinesses.length} business{filteredBusinesses.length !== 1 ? 'es' : ''} found
          </p>
        </div>
      )}

      {/* Businesses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-40 bg-muted/40 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredBusinesses.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-xl">
          <h3 className="text-xl font-medium text-muted-foreground mb-2">
            {searchTerm ? "No businesses found" : "No businesses available"}
          </h3>
          <p className="text-muted-foreground">
            {searchTerm 
              ? "Try adjusting your search terms" 
              : "Check back later for participating businesses"
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBusinesses.map((business) => (
            <div
              key={business.id}
              className="bg-card border rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div
                  className="w-16 h-16 flex items-center justify-center rounded-full text-white text-2xl mr-4"
                  style={{ backgroundColor: business.business_color }}
                >
                  {business.business_logo}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{business.business_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {business.stamp_cards.length} offer{business.stamp_cards.length !== 1 ? 's' : ''} available
                  </p>
                </div>
              </div>

              {/* Show latest/featured offer */}
              {business.stamp_cards.length > 0 && (
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 mb-4">
                  <div className="text-sm font-medium mb-1">
                    {business.stamp_cards[0].name}
                  </div>
                  <p className="text-sm font-medium text-center">
                    🎁 <span className="font-bold">{business.stamp_cards[0].reward}</span>
                  </p>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    Collect {business.stamp_cards[0].total_stamps} stamps
                  </p>
                </div>
              )}

              {/* Show additional offers if any */}
              {business.stamp_cards.length > 1 && (
                <div className="text-xs text-muted-foreground mb-4">
                  +{business.stamp_cards.length - 1} more offer{business.stamp_cards.length - 1 !== 1 ? 's' : ''} available
                </div>
              )}

              <div className="text-center">
                <button
                  onClick={() => navigate("/customer/scan-qr")}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  Visit & Start Collecting
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllBusinesses;
