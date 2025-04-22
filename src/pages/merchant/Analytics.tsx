import { useEffect, useState } from "react";
import { 
  BarChart3, 
  Users, 
  Gift,
  Calendar,
  CreditCard
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StampCard } from "@/types/StampCard";

// Analytics data interface
interface AnalyticsData {
  totalStampCards: number;
  totalRedemptions: number;
  activeCustomers: number;
  totalCustomers: number;
  redemptionRate: number;
  retentionRate: number;
  transactionsByDay: Array<{
    date: string;
    stamps: number;
    redemptions: number;
  }>;
  transactionsByCard: Array<{
    cardId: string;
    cardName: string;
    stamps: number;
    redemptions: number;
  }>;
}

const MerchantAnalytics = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [stampCards, setStampCards] = useState<StampCard[]>([]);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch actual stamp cards from Supabase
        const { data: cardsData, error: cardsError } = await supabase
          .from("stamp_cards")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (cardsError) {
          console.error("Error fetching stamp cards for analytics:", cardsError);
          throw cardsError;
        }
        
        if (cardsData) {
          setStampCards(cardsData);
          console.log("Analytics - Stamp cards fetched:", cardsData);
        }
        
        // Basic analytics from fetched data
        setAnalytics({
          totalStampCards: cardsData ? cardsData.length : 0,
          totalRedemptions: 0,
          activeCustomers: 0,
          totalCustomers: 0,
          redemptionRate: 0,
          retentionRate: 0,
          transactionsByDay: [
            { date: new Date().toISOString(), stamps: 0, redemptions: 0 }
          ],
          transactionsByCard: cardsData ? cardsData.map(card => ({
            cardId: card.id,
            cardName: card.name,
            stamps: 0,
            redemptions: 0
          })) : []
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading analytics data:", error);
        setIsLoading(false);
        
        setAnalytics({
          totalStampCards: 0,
          totalRedemptions: 0,
          activeCustomers: 0,
          totalCustomers: 0,
          redemptionRate: 0,
          retentionRate: 0,
          transactionsByDay: [
            { date: new Date().toISOString(), stamps: 0, redemptions: 0 }
          ],
          transactionsByCard: []
        });
      }
    };
    
    loadData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-red-600">Could not load analytics</h2>
        <p className="mt-2 text-gray-600">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Total Stamp Cards</p>
              <h3 className="text-2xl font-bold mt-1">{analytics.totalStampCards}</h3>
            </div>
            <div className="rounded-full p-2 bg-primary/10 text-primary">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Rewards Redeemed</p>
              <h3 className="text-2xl font-bold mt-1">{analytics.totalRedemptions}</h3>
            </div>
            <div className="rounded-full p-2 bg-green-500/10 text-green-500">
              <Gift className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Active Customers</p>
              <h3 className="text-2xl font-bold mt-1">{analytics.activeCustomers}</h3>
              <p className="text-xs text-muted-foreground">of {analytics.totalCustomers} total</p>
            </div>
            <div className="rounded-full p-2 bg-blue-500/10 text-blue-500">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Redemption Rate</p>
              <h3 className="text-2xl font-bold mt-1">{analytics.redemptionRate.toFixed(1)}%</h3>
            </div>
            <div className="rounded-full p-2 bg-purple-500/10 text-purple-500">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity chart */}
      <div className="bg-card border rounded-xl p-5">
        <div className="flex items-center mb-6">
          <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Activity Over Time</h3>
        </div>
        
        {stampCards.length > 0 ? (
          <div className="h-64 flex flex-col justify-center">
            <p className="text-muted-foreground text-center">Activity data is being collected. Check back soon for insights.</p>
            <p className="text-sm text-muted-foreground text-center mt-2">You have {stampCards.length} active stamp card{stampCards.length !== 1 ? 's' : ''}.</p>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">No activity data available yet</p>
          </div>
        )}
      </div>

      {/* Card performance */}
      <div className="bg-card border rounded-xl p-5">
        <div className="flex items-center mb-6">
          <CreditCard className="mr-2 h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Card Performance</h3>
        </div>
        
        {stampCards.length > 0 ? (
          <div className="space-y-4">
            {stampCards.map(card => (
              <div key={card.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div 
                      className="w-8 h-8 flex items-center justify-center rounded-full mr-3 text-white"
                      style={{ backgroundColor: card.business_color || '#3B82F6' }}
                    >
                      {card.business_logo || '🏪'}
                    </div>
                    <h4 className="font-medium">{card.name}</h4>
                  </div>
                  <span className="text-sm text-muted-foreground">{card.total_stamps} stamps required</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center">
            <p className="text-muted-foreground">No card performance data available yet</p>
          </div>
        )}
      </div>

      {/* Customer engagement */}
      <div className="bg-card border rounded-xl p-5">
        <div className="flex items-center mb-6">
          <Users className="mr-2 h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Customer Engagement</h3>
        </div>
        
        <div className="h-40 flex items-center justify-center">
          <p className="text-muted-foreground">No customer engagement data available yet</p>
        </div>
      </div>
    </div>
  );
};

export default MerchantAnalytics;
