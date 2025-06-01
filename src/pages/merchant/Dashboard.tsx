import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  BarChart3, 
  CreditCard, 
  Users, 
  Gift,
  PlusCircle,
  ArrowUpRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StampCard } from "@/types/StampCard";

// Placeholder for analytics data structure
interface AnalyticsData {
  totalStampCards: number;
  totalRedemptions: number;
  totalCustomers: number;
  activeCustomers: number;
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

// Placeholder for transaction data structure
interface Transaction {
  id: string;
  customerName: string;
  customerEmail: string;
  type: 'stamp' | 'redeem';
  timestamp: string;
  rewardCode?: string;
}

const MerchantDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [stampCards, setStampCards] = useState<StampCard[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("No authenticated user");
        }

        // Fetch actual stamp cards from Supabase
        const { data: cardsData, error: cardsError } = await supabase
          .from("stamp_cards")
          .select("*")
          .eq("merchant_id", user.id)
          .order("created_at", { ascending: false });
        
        if (cardsError) {
          console.error("Error fetching stamp cards:", cardsError);
          throw cardsError;
        }
        
        if (cardsData) {
          setStampCards(cardsData);
          console.log("Stamp cards fetched:", cardsData);
        }

        // Fetch merchant customers to get total customer count
        const { data: merchantCustomersData, error: customersError } = await supabase
          .from("merchant_customers")
          .select("*")
          .eq("merchant_id", user.id);

        if (customersError) {
          console.error("Error fetching merchant customers:", customersError);
          throw customersError;
        }

        const totalCustomers = merchantCustomersData?.length ?? 0;

        // Fetch all customer_stamp_cards for this merchant's cards
        const cardIds = cardsData?.map(card => card.id) ?? [];
        let customerStampCards: any[] = [];
        
        if (cardIds.length > 0) {
          const { data: cscData, error: cscError } = await supabase
            .from("customer_stamp_cards")
            .select("*, card:stamp_cards!inner(total_stamps, merchant_id)")
            .in("card_id", cardIds);
          
          if (cscError) {
            console.error("Error fetching customer stamp cards:", cscError);
          } else {
            customerStampCards = cscData ?? [];
          }
        }

        // Calculate total issued
        const totalIssued = customerStampCards.length;
        
        // Number redeemed: where individual current_stamps >= corresponding card.total_stamps
        const numRedeemed =
          customerStampCards.filter((csc: any) =>
            csc.card &&
            typeof csc.card.total_stamps === "number" &&
            csc.current_stamps >= csc.card.total_stamps
          ).length;

        // Calculate Redemption Rate
        const redemptionRate = totalIssued === 0 ? 0 : (numRedeemed / totalIssued) * 100;

        // Update analytics
        setAnalytics({
          totalStampCards: cardsData ? cardsData.length : 0,
          totalRedemptions: numRedeemed,
          totalCustomers: totalCustomers,
          activeCustomers: 0,
          redemptionRate: redemptionRate,
          retentionRate: 0,
          transactionsByDay: [
            { date: new Date().toISOString(), stamps: 0, redemptions: 0 }
          ],
          transactionsByCard: []
        });
        
        // Fetch recent transactions (if we had them)
        setRecentTransactions([]);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading merchant data:", error);
        setIsLoading(false);
        
        // Set default analytics in case of error
        setAnalytics({
          totalStampCards: 0,
          totalRedemptions: 0,
          totalCustomers: 0,
          activeCustomers: 0,
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
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
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
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Link
            to="/merchant/cards/new"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Stamp Card
          </Link>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Total Cards</p>
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
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <h3 className="text-2xl font-bold mt-1">{analytics.totalCustomers}</h3>
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

      {/* Charts and recent activities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Activity chart */}
        <div className="md:col-span-2 bg-card border rounded-xl p-5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold">Recent Activity</h3>
            <Link to="/merchant/analytics" className="text-sm text-primary flex items-center">
              View Details <ArrowUpRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
          
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">No activity data available yet.</p>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Recent Transactions</h3>
          </div>
          
          <div className="p-8 text-center text-muted-foreground">
            <p>No transactions yet</p>
          </div>
        </div>
      </div>

      {/* Program performance / Your Stamp Cards */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Your Stamp Cards</h3>
        </div>
        
        {stampCards.length > 0 ? (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stampCards.map((card) => (
                <Link 
                  key={card.id} 
                  to={`/merchant/cards/${card.id}`}
                  className="block p-4 border rounded-lg bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{card.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {card.description || `${card.total_stamps} stamps required`}
                      </p>
                    </div>
                    <div 
                      className="w-12 h-12 flex items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: card.business_color || '#3B82F6' }}
                    >
                      {card.business_logo || '🏪'}
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between text-sm">
                    <span>{card.total_stamps} stamps</span>
                    <span className="text-primary">{card.reward}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <p>Start building your loyalty program to see performance metrics</p>
            <Link 
              to="/merchant/cards/new"
              className="mt-4 inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Stamp Card
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantDashboard;
