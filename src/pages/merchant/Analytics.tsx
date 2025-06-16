
import { useEffect, useState } from "react";
import { 
  BarChart3, 
  Users, 
  Gift,
  Calendar,
  CreditCard,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { merchantSupabase } from "@/integrations/supabase/client";
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

// Reuse helper functions from Dashboard
const fetchRecentTransactions = async (merchantId: string) => {
  try {
    const { data: transactionData, error: transactionError } = await merchantSupabase
      .from('stamp_transactions')
      .select(`
        *,
        stamp_cards!inner(name)
      `)
      .eq('merchant_id', merchantId)
      .order('timestamp', { ascending: false });

    if (transactionError) {
      console.error("Error fetching transactions for analytics:", transactionError);
      return [];
    }

    return transactionData || [];
  } catch (error) {
    console.error("Error in fetchRecentTransactions for analytics:", error);
    return [];
  }
};

const fetchActivityData = async (merchantId: string) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await merchantSupabase
      .from('stamp_transactions')
      .select('timestamp, type, count')
      .eq('merchant_id', merchantId)
      .gte('timestamp', thirtyDaysAgo.toISOString())
      .order('timestamp', { ascending: true });

    if (error) {
      console.error("Error fetching activity data for analytics:", error);
      return [];
    }

    // Group by date and aggregate
    const dailyData: { [key: string]: { stamps: number; redemptions: number } } = {};
    
    data?.forEach(transaction => {
      const date = new Date(transaction.timestamp).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { stamps: 0, redemptions: 0 };
      }
      
      if (transaction.type === 'stamp') {
        dailyData[date].stamps += transaction.count || 1;
      } else if (transaction.type === 'redeem') {
        dailyData[date].redemptions += 1;
      }
    });

    // Convert to array and get last 7 days for Analytics
    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        stamps: data.stamps,
        redemptions: data.redemptions
      }))
      .slice(-7);
  } catch (error) {
    console.error("Error in fetchActivityData for analytics:", error);
    return [];
  }
};

const fetchActiveCustomers = async (merchantId: string) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await merchantSupabase
      .from('stamp_transactions')
      .select('customer_id')
      .eq('merchant_id', merchantId)
      .gte('timestamp', thirtyDaysAgo.toISOString());

    if (error) {
      console.error("Error fetching active customers for analytics:", error);
      return 0;
    }

    const uniqueCustomers = new Set(data?.map(t => t.customer_id) || []);
    return uniqueCustomers.size;
  } catch (error) {
    console.error("Error in fetchActiveCustomers for analytics:", error);
    return 0;
  }
};

const MerchantAnalytics = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [stampCards, setStampCards] = useState<StampCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("Starting analytics data load...");

        // Get current merchant user using merchantSupabase (same as Dashboard)
        const { data: { user }, error: authError } = await merchantSupabase.auth.getUser();
        if (authError || !user) {
          console.error("Auth error in analytics:", authError);
          throw new Error("Not authenticated");
        }

        console.log("Analytics - Merchant user ID:", user.id);

        // Fetch all data in parallel (same pattern as Dashboard)
        const [
          cardsData,
          merchantCustomersData,
          allTransactionsData,
          activityChartData,
          activeCustomersCount
        ] = await Promise.all([
          // Fetch stamp cards
          merchantSupabase
            .from("stamp_cards")
            .select("*")
            .eq("merchant_id", user.id)
            .order("created_at", { ascending: false }),
          
          // Fetch merchant customers
          merchantSupabase
            .from("merchant_customers")
            .select("*")
            .eq("merchant_id", user.id),
          
          // Fetch all transactions (not just recent)
          fetchRecentTransactions(user.id),
          
          // Fetch activity data
          fetchActivityData(user.id),
          
          // Fetch active customers count
          fetchActiveCustomers(user.id)
        ]);

        if (cardsData.error) {
          console.error("Error fetching stamp cards in analytics:", cardsData.error);
          throw cardsData.error;
        }
        
        if (cardsData.data) {
          setStampCards(cardsData.data);
          console.log("Analytics - Stamp cards fetched:", cardsData.data.length);
        }

        if (merchantCustomersData.error) {
          console.error("Error fetching merchant customers in analytics:", merchantCustomersData.error);
          throw merchantCustomersData.error;
        }

        const totalCustomers = merchantCustomersData.data?.length ?? 0;
        console.log("Analytics - Total customers found:", totalCustomers);

        // Fetch all customer_stamp_cards for this merchant's cards (same as Dashboard)
        const cardIds = cardsData.data?.map(card => card.id) ?? [];
        let customerStampCards: any[] = [];
        
        if (cardIds.length > 0) {
          const { data: cscData, error: cscError } = await merchantSupabase
            .from("customer_stamp_cards")
            .select("*, card:stamp_cards!inner(total_stamps, merchant_id)")
            .in("card_id", cardIds);
          
          if (cscError) {
            console.error("Error fetching customer stamp cards in analytics:", cscError);
          } else {
            customerStampCards = cscData ?? [];
          }
        }

        // Calculate redemption metrics (same logic as Dashboard)
        const totalIssued = customerStampCards.length;
        const numRedeemed = customerStampCards.filter((csc: any) =>
          csc.card &&
          typeof csc.card.total_stamps === "number" &&
          csc.current_stamps >= csc.card.total_stamps
        ).length;
        const redemptionRate = totalIssued === 0 ? 0 : (numRedeemed / totalIssued) * 100;

        // Calculate transactions by card
        const txByCard: { [id: string]: { cardName: string; stamps: number; redemptions: number } } = {};
        cardsData.data?.forEach(card => {
          txByCard[card.id] = {
            cardName: card.name,
            stamps: 0,
            redemptions: 0
          };
        });
        allTransactionsData?.forEach(tx => {
          if (tx.card_id && txByCard[tx.card_id]) {
            if (tx.type === 'stamp') txByCard[tx.card_id].stamps += tx.count || 1;
            if (tx.type === 'redeem') txByCard[tx.card_id].redemptions += 1;
          }
        });
        const transactionsByCard = Object.entries(txByCard).map(([cardId, stats]) => ({
          cardId,
          cardName: stats.cardName,
          stamps: stats.stamps,
          redemptions: stats.redemptions
        }));

        setAnalytics({
          totalStampCards: cardsData.data ? cardsData.data.length : 0,
          totalRedemptions: numRedeemed,
          activeCustomers: activeCustomersCount,
          totalCustomers: totalCustomers,
          redemptionRate: redemptionRate,
          retentionRate: 0, // Keep as 0 to match Dashboard
          transactionsByDay: activityChartData,
          transactionsByCard
        });

        console.log("Analytics data loaded successfully");
        setIsLoading(false);
      } catch (err: any) {
        console.error("Error loading analytics data:", err);
        setError(`Could not load analytics: ${err.message || 'Unknown error'}`);
        setIsLoading(false);
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

  if (error || !analytics) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-red-600">{error ?? "Could not load analytics"}</h2>
        <p className="mt-2 text-gray-600">Please try again later.</p>
        <Link to="/merchant" className="inline-flex items-center mt-4 px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Back */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/merchant" className="inline-flex items-center px-3 py-1 rounded bg-muted hover:bg-muted/60 text-sm font-medium transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold ml-3">Analytics</h1>
        </div>
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
          <h3 className="font-semibold">Activity Over Time (Last 7 days)</h3>
        </div>
        
        {analytics.transactionsByDay.length > 0 ? (
          <div className="h-64 flex flex-col justify-center">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-transparent">
                <thead>
                  <tr>
                    <th className="text-xs font-semibold text-muted-foreground px-2">Date</th>
                    <th className="text-xs font-semibold text-blue-500 px-2">Stamps</th>
                    <th className="text-xs font-semibold text-green-500 px-2">Redemptions</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.transactionsByDay.map(day => (
                    <tr key={day.date}>
                      <td className="text-sm px-2 py-1">{formatDate(day.date)}</td>
                      <td className="text-sm px-2 py-1 text-blue-600">{day.stamps}</td>
                      <td className="text-sm px-2 py-1 text-green-600">{day.redemptions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
        
        {analytics.transactionsByCard.length > 0 ? (
          <div className="space-y-4">
            {analytics.transactionsByCard.map(card => (
              <div key={card.cardId} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div 
                      className="w-8 h-8 flex items-center justify-center rounded-full mr-3 text-white"
                      style={{ backgroundColor: stampCards.find(c => c.id === card.cardId)?.business_color || '#3B82F6' }}
                    >
                      {stampCards.find(c => c.id === card.cardId)?.business_logo || '🏪'}
                    </div>
                    <h4 className="font-medium">{card.cardName}</h4>
                  </div>
                  <div className="flex gap-6">
                    <span className="text-sm text-blue-600">{card.stamps} stamps</span>
                    <span className="text-sm text-green-600">{card.redemptions} redemptions</span>
                  </div>
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

      <div className="bg-card border rounded-xl p-5">
        <div className="flex items-center mb-6">
          <Users className="mr-2 h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Customer Engagement</h3>
        </div>
        
        <div className="h-40 flex items-center justify-center">
          <p className="text-muted-foreground">
            {analytics.activeCustomers > 0
              ? `${analytics.activeCustomers} active customer(s) in the last 30 days`
              : "No customer engagement data available yet"
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default MerchantAnalytics;
