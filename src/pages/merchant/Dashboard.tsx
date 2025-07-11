import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  BarChart3, 
  CreditCard, 
  Users, 
  Gift,
  PlusCircle,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Building2
} from "lucide-react";
import { merchantSupabase } from "@/integrations/supabase/client";
import { StampCard } from "@/types/StampCard";
import { TransactionItem } from "@/components/merchant/TransactionItem";
import { TransactionHistory } from "@/pages/merchant/History";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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

interface ActivityDataPoint {
  date: string;
  stamps: number;
  redemptions: number;
}

const MerchantDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<TransactionHistory[]>([]);
  const [stampCards, setStampCards] = useState<StampCard[]>([]);
  const [activityData, setActivityData] = useState<ActivityDataPoint[]>([]);
  const [activeCustomers, setActiveCustomers] = useState(0);
  const [merchantName, setMerchantName] = useState<string>("");
  const [merchantLogo, setMerchantLogo] = useState<string>("🏪");
  const [merchantColor, setMerchantColor] = useState<string>("#3B82F6");
  const [bestPerformingCard, setBestPerformingCard] = useState<{name: string, rate: number} | null>(null);
  const isMobile = useIsMobile();

  const fetchRecentTransactions = async (merchantId: string): Promise<TransactionHistory[]> => {
    try {
      // First get transactions with stamp card names, filtered by merchant_id
      const { data: transactionData, error: transactionError } = await merchantSupabase
        .from('stamp_transactions')
        .select(`
          *,
          stamp_cards!inner(name)
        `)
        .eq('merchant_id', merchantId)
        .order('timestamp', { ascending: false })
        .limit(5);

      if (transactionError) {
        console.error("Error fetching transactions:", transactionError);
        throw transactionError;
      }

      if (transactionData && transactionData.length > 0) {
        // Get unique customer IDs from transactions
        const customerIds = [...new Set(transactionData.map(t => t.customer_id))];
        
        // Fetch customer profiles separately
        const { data: profileData, error: profileError } = await merchantSupabase
          .from('profiles')
          .select('id, email, name')
          .in('id', customerIds);

        if (profileError) {
          console.error("Error fetching profiles:", profileError);
        }

        // Create a map of customer ID to profile data
        const profileMap = new Map();
        profileData?.forEach(profile => {
          profileMap.set(profile.id, profile);
        });

        // Combine transaction data with profile data and ensure proper typing
        const formattedTransactions: TransactionHistory[] = transactionData.map(transaction => {
          const profile = profileMap.get(transaction.customer_id);
          return {
            ...transaction,
            type: transaction.type as TransactionHistory['type'], // Type assertion for proper typing
            card_name: transaction.stamp_cards?.name,
            customerEmail: profile?.email,
            customerName: profile?.name
          };
        });
        
        return formattedTransactions;
      } else {
        return [];
      }
    } catch (error) {
      console.error("Error in fetchRecentTransactions:", error);
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
        console.error("Error fetching activity data:", error);
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

      // Convert to array and get last 7 days
      return Object.entries(dailyData)
        .map(([date, data]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          stamps: data.stamps,
          redemptions: data.redemptions
        }))
        .slice(-7);
    } catch (error) {
      console.error("Error in fetchActivityData:", error);
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
        .gte('timestamp', thirtyDaysAgo.toISOString())
        .neq('customer_id', merchantId); // Exclude system transactions where customer_id = merchant_id

      if (error) {
        console.error("Error fetching active customers:", error);
        return 0;
      }

      const uniqueCustomers = new Set(data?.map(t => t.customer_id) || []);
      return uniqueCustomers.size;
    } catch (error) {
      console.error("Error in fetchActiveCustomers:", error);
      return 0;
    }
  };

  const fetchTotalRedemptions = async (merchantId: string) => {
    try {
      const { data, error } = await merchantSupabase
        .from('stamp_transactions')
        .select('id')
        .eq('merchant_id', merchantId)
        .eq('type', 'redeem');

      if (error) {
        console.error("Error fetching total redemptions:", error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error("Error in fetchTotalRedemptions:", error);
      return 0;
    }
  };

  const fetchBestPerformingCard = async (merchantId: string, stampCards: StampCard[]) => {
    try {
      let bestCard = { name: 'No cards yet', rate: 0 };
      
      for (const card of stampCards) {
        // Get total issued for this card
        const { data: issuedCards, error: issuedError } = await merchantSupabase
          .from('customer_stamp_cards')
          .select('id')
          .eq('card_id', card.id);

        if (issuedError) continue;

        const totalIssued = issuedCards?.length || 0;
        if (totalIssued === 0) continue;

        // Get total redemptions for this card
        const { data: redemptions, error: redemptionsError } = await merchantSupabase
          .from('stamp_transactions')
          .select('id')
          .eq('merchant_id', merchantId)
          .eq('card_id', card.id)
          .eq('type', 'redeem');

        if (redemptionsError) continue;

        const totalRedeemed = redemptions?.length || 0;
        const redemptionRate = (totalRedeemed / totalIssued) * 100;

        if (redemptionRate > bestCard.rate) {
          bestCard = { name: card.name, rate: redemptionRate };
        }
      }

      return bestCard;
    } catch (error) {
      console.error("Error fetching best performing card:", error);
      return { name: 'Error loading', rate: 0 };
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current merchant user using merchantSupabase
        const { data: { user }, error: authError } = await merchantSupabase.auth.getUser();
        if (authError || !user) {
          console.error("Auth error:", authError);
          throw new Error("No authenticated merchant user");
        }

        console.log("Merchant user ID:", user.id);

        // Fetch merchant profile data
        const { data: merchantData, error: merchantError } = await merchantSupabase
          .from("merchants")
          .select("business_name, business_logo, business_color")
          .eq("id", user.id)
          .single();

        if (merchantError) {
          console.error("Error fetching merchant data:", merchantError);
        } else if (merchantData) {
          setMerchantName(merchantData.business_name || "Your Business");
          setMerchantLogo(merchantData.business_logo || "🏪");
          setMerchantColor(merchantData.business_color || "#3B82F6");
        }

        // Fetch all data in parallel
        const [
          cardsData,
          merchantCustomersData,
          recentTransactionsData,
          activityChartData,
          activeCustomersCount,
          totalRedemptions
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
          
          // Fetch recent transactions
          fetchRecentTransactions(user.id),
          
          // Fetch activity data
          fetchActivityData(user.id),
          
          // Fetch active customers count
          fetchActiveCustomers(user.id),

          // Fetch total redemptions count
          fetchTotalRedemptions(user.id)
        ]);

        if (cardsData.error) {
          console.error("Error fetching stamp cards:", cardsData.error);
          throw cardsData.error;
        }
        
        if (cardsData.data) {
          setStampCards(cardsData.data);
          console.log("Stamp cards fetched:", cardsData.data);

          // Fetch best performing card
          const bestCard = await fetchBestPerformingCard(user.id, cardsData.data);
          setBestPerformingCard(bestCard);
        }

        if (merchantCustomersData.error) {
          console.error("Error fetching merchant customers:", merchantCustomersData.error);
          throw merchantCustomersData.error;
        }

        const totalCustomers = merchantCustomersData.data?.length ?? 0;
        console.log("Total customers found:", totalCustomers);

        // Set recent transactions and activity data
        setRecentTransactions(recentTransactionsData);
        setActivityData(activityChartData);
        setActiveCustomers(activeCustomersCount);

        // Fetch all customer_stamp_cards for this merchant's cards
        const cardIds = cardsData.data?.map(card => card.id) ?? [];
        let customerStampCards: any[] = [];
        
        if (cardIds.length > 0) {
          const { data: cscData, error: cscError } = await merchantSupabase
            .from("customer_stamp_cards")
            .select("*, card:stamp_cards!inner(total_stamps, merchant_id)")
            .in("card_id", cardIds);
          
          if (cscError) {
            console.error("Error fetching customer stamp cards:", cscError);
          } else {
            customerStampCards = cscData ?? [];
          }
        }

        // Calculate total issued for redemption rate calculation
        const totalIssued = customerStampCards.length;
        
        // Calculate Redemption Rate based on actual redemptions vs total issued cards
        const redemptionRate = totalIssued === 0 ? 0 : (totalRedemptions / totalIssued) * 100;

        console.log("Analytics calculation:", {
          totalRedemptions,
          totalIssued,
          redemptionRate,
          activeCustomersCount,
          totalCustomers
        });

        // Update analytics
        setAnalytics({
          totalStampCards: cardsData.data ? cardsData.data.length : 0,
          totalRedemptions: totalRedemptions, // Use actual redemption transactions count
          totalCustomers: totalCustomers,
          activeCustomers: activeCustomersCount,
          redemptionRate: redemptionRate,
          retentionRate: 0,
          transactionsByDay: activityChartData,
          transactionsByCard: []
        });
        
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
          transactionsByDay: [],
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
      {/* Header with merchant name - Fixed mobile layout */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        {/* Merchant name display - Responsive layout */}
        <div className={cn(
          "flex items-center px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-lg shadow-sm",
          isMobile ? "justify-center" : ""
        )}>
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3 shadow-sm"
            style={{ backgroundColor: merchantColor }}
          >
            {merchantLogo}
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 font-medium">Welcome back!</p>
            <h2 className="text-lg font-bold text-gray-800">{merchantName}</h2>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            to="/merchant/cards/new"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Promotion
          </Link>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Total Promotions</p>
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
              <div className="flex items-center mt-1">
                <span className="text-xs text-muted-foreground">
                  {activeCustomers} active (30d)
                </span>
              </div>
            </div>
            <div className="rounded-full p-2 bg-blue-500/10 text-blue-500">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Best Performing Promotion</p>
              <h3 className="text-lg font-bold mt-1">{bestPerformingCard?.name || 'Loading...'}</h3>
              <div className="flex items-center mt-1">
                <span className="text-xs text-green-600 font-medium">
                  {bestPerformingCard?.rate.toFixed(1)}% redemption rate
                </span>
              </div>
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
            <h3 className="font-semibold">Recent Activity (Last 7 days)</h3>
            <Link to="/merchant/analytics" className="text-sm text-primary flex items-center">
              View Details <ArrowUpRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
          
          {activityData.length > 0 ? (
            <div className="h-64">
              <ChartContainer
                config={{
                  stamps: {
                    label: "Stamps",
                    color: "#3B82F6",
                  },
                  redemptions: {
                    label: "Redemptions",
                    color: "#10B981",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="stamps" fill="#3B82F6" />
                    <Bar dataKey="redemptions" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-muted-foreground">No activity data available yet.</p>
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Recent Transactions</h3>
            {recentTransactions.length > 0 && (
              <Link to="/merchant/history" className="text-sm text-primary">
                View All
              </Link>
            )}
          </div>
          
          {recentTransactions.length > 0 ? (
            <div className="divide-y">
              {recentTransactions.map(transaction => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p>No transactions yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Program performance / Your Promotions */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Your Promotions</h3>
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
              Create Promotion
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantDashboard;
