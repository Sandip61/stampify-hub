
import { useEffect, useState } from "react";
import { 
  Calendar,
  CreditCard,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Award,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";
import { merchantSupabase } from "@/integrations/supabase/client";
import { StampCard } from "@/types/StampCard";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

// Card performance data interface
interface CardPerformanceData {
  cardId: string;
  cardName: string;
  cardLogo: string;
  cardColor: string;
  totalIssued: number;
  totalRedeemed: number;
  redemptionRate: number;
  uniqueCustomers: number;
  totalStampsEarned: number;
  performanceLevel: 'high' | 'medium' | 'low';
}

// Activity data interface
interface ActivityDataPoint {
  date: string;
  stamps: number;
  redemptions: number;
}

const MerchantAnalytics = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stampCards, setStampCards] = useState<StampCard[]>([]);
  const [activityData, setActivityData] = useState<ActivityDataPoint[]>([]);
  const [cardPerformanceData, setCardPerformanceData] = useState<CardPerformanceData[]>([]);
  const [uniqueCustomersCount, setUniqueCustomersCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchUniqueCustomersCount = async (merchantId: string) => {
    try {
      const { data, error } = await merchantSupabase
        .from('customer_stamp_cards')
        .select('customer_id')
        .in('card_id', stampCards.map(card => card.id));

      if (error) {
        console.error("Error fetching unique customers:", error);
        return 0;
      }

      // Get actual unique customers
      const uniqueCustomers = new Set(data?.map(item => item.customer_id) || []).size;
      return uniqueCustomers;
    } catch (error) {
      console.error("Error in fetchUniqueCustomersCount:", error);
      return 0;
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

  const fetchCardPerformanceData = async (merchantId: string, stampCards: StampCard[]) => {
    try {
      const performanceData: CardPerformanceData[] = [];

      for (const card of stampCards) {
        // Get total issued cards (customer_stamp_cards)
        const { data: issuedCards, error: issuedError } = await merchantSupabase
          .from('customer_stamp_cards')
          .select('customer_id, current_stamps')
          .eq('card_id', card.id);

        if (issuedError) {
          console.error(`Error fetching issued cards for ${card.name}:`, issuedError);
          continue;
        }

        const totalIssued = issuedCards?.length || 0;
        const uniqueCustomers = new Set(issuedCards?.map(c => c.customer_id) || []).size;

        // Get total redemptions for this card
        const { data: redemptions, error: redemptionsError } = await merchantSupabase
          .from('stamp_transactions')
          .select('id')
          .eq('merchant_id', merchantId)
          .eq('card_id', card.id)
          .eq('type', 'redeem');

        if (redemptionsError) {
          console.error(`Error fetching redemptions for ${card.name}:`, redemptionsError);
        }

        const totalRedeemed = redemptions?.length || 0;

        // Get total stamps earned for this card
        const { data: stampTransactions, error: stampsError } = await merchantSupabase
          .from('stamp_transactions')
          .select('count')
          .eq('merchant_id', merchantId)
          .eq('card_id', card.id)
          .eq('type', 'stamp');

        if (stampsError) {
          console.error(`Error fetching stamp transactions for ${card.name}:`, stampsError);
        }

        const totalStampsEarned = stampTransactions?.reduce((sum, t) => sum + (t.count || 1), 0) || 0;

        // Calculate redemption rate
        const redemptionRate = totalIssued === 0 ? 0 : (totalRedeemed / totalIssued) * 100;

        // Determine performance level
        let performanceLevel: 'high' | 'medium' | 'low' = 'low';
        if (redemptionRate >= 70) performanceLevel = 'high';
        else if (redemptionRate >= 30) performanceLevel = 'medium';

        performanceData.push({
          cardId: card.id,
          cardName: card.name,
          cardLogo: card.business_logo || '🏪',
          cardColor: card.business_color || '#3B82F6',
          totalIssued,
          totalRedeemed,
          redemptionRate,
          uniqueCustomers,
          totalStampsEarned,
          performanceLevel
        });
      }

      // Sort by redemption rate (highest first)
      return performanceData.sort((a, b) => b.redemptionRate - a.redemptionRate);
    } catch (error) {
      console.error("Error fetching card performance data:", error);
      return [];
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("Starting analytics data load...");

        const { data: { user }, error: authError } = await merchantSupabase.auth.getUser();
        if (authError || !user) {
          console.error("Auth error in analytics:", authError);
          throw new Error("Not authenticated");
        }

        console.log("Analytics - Merchant user ID:", user.id);

        // Fetch stamp cards first
        const { data: cardsData, error: cardsError } = await merchantSupabase
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
          console.log("Analytics - Stamp cards fetched:", cardsData.length);
          
          // Fetch unique customers count after cards are loaded
          const uniqueCount = await fetchUniqueCustomersCount(user.id);
          setUniqueCustomersCount(uniqueCount);
        }

        // Fetch activity data and card performance in parallel
        const [activityChartData, cardPerformanceResults] = await Promise.all([
          fetchActivityData(user.id),
          fetchCardPerformanceData(user.id, cardsData || [])
        ]);

        setActivityData(activityChartData);
        setCardPerformanceData(cardPerformanceResults);

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

  // Update unique customers count when cards change
  useEffect(() => {
    const updateUniqueCustomers = async () => {
      if (stampCards.length > 0) {
        const { data: { user }, error: authError } = await merchantSupabase.auth.getUser();
        if (!authError && user) {
          const uniqueCount = await fetchUniqueCustomersCount(user.id);
          setUniqueCustomersCount(uniqueCount);
        }
      }
    };

    updateUniqueCustomers();
  }, [stampCards]);

  const getPerformanceColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-red-600 bg-red-50';
    }
  };

  const getPerformanceIcon = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return <TrendingUp className="h-4 w-4" />;
      case 'medium': return <Award className="h-4 w-4" />;
      case 'low': return <TrendingDown className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-red-600">{error}</h2>
        <p className="mt-2 text-gray-600">Please try again later.</p>
        <Link to="/merchant" className="inline-flex items-center mt-4 px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/merchant" className="inline-flex items-center px-3 py-1 rounded bg-muted hover:bg-muted/60 text-sm font-medium transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold ml-3">Analytics</h1>
        </div>
      </div>

      {/* Activity Over Time Chart */}
      <div className="bg-card border rounded-xl p-5">
        <div className="flex items-center mb-6">
          <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Activity Over Time (Last 7 days)</h3>
        </div>
        
        {activityData.length > 0 ? (
          <div className="h-12">
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
                <BarChart data={activityData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="stamps" fill="#3B82F6" />
                  <Bar dataKey="redemptions" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        ) : (
          <div className="h-12 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No activity data available yet</p>
          </div>
        )}
      </div>

      {/* Card Performance Analysis */}
      <div className="bg-card border rounded-xl p-5">
        <div className="flex items-center mb-6">
          <CreditCard className="mr-2 h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Card Performance Analysis</h3>
        </div>
        
        {cardPerformanceData.length > 0 ? (
          <div className="space-y-4">
            {cardPerformanceData.map((card, index) => (
              <div key={card.cardId} className="p-4 border rounded-lg">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-3">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-muted-foreground mr-2">#{index + 1}</span>
                    <div 
                      className="w-8 h-8 flex items-center justify-center rounded-full mr-3 text-white text-sm flex-shrink-0"
                      style={{ backgroundColor: card.cardColor }}
                    >
                      {card.cardLogo}
                    </div>
                    <h4 className="font-medium truncate">{card.cardName}</h4>
                  </div>
                  <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(card.performanceLevel)} self-start`}>
                    {getPerformanceIcon(card.performanceLevel)}
                    <span className="ml-1 capitalize">{card.performanceLevel}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-muted-foreground">Redemption Rate</p>
                    <p className="text-lg font-bold text-primary">{card.redemptionRate.toFixed(1)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-muted-foreground">Cards Issued</p>
                    <p className="text-lg font-bold">{card.totalIssued}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-muted-foreground">Redeemed</p>
                    <p className="text-lg font-bold text-green-600">{card.totalRedeemed}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-muted-foreground">Unique Customers</p>
                    <p className="text-lg font-bold text-blue-600">{card.uniqueCustomers}</p>
                  </div>
                  <div className="text-center col-span-2 sm:col-span-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">Stamps Earned</p>
                    <p className="text-lg font-bold text-purple-600">{card.totalStampsEarned}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(card.redemptionRate, 100)}%` }}
                  ></div>
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

      {/* Customer Engagement Summary */}
      <div className="bg-card border rounded-xl p-5">
        <div className="flex items-center mb-6">
          <Users className="mr-2 h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Customer Engagement Summary</h3>
        </div>
        
        {cardPerformanceData.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Unique Customers</p>
              <p className="text-2xl font-bold text-primary">
                {uniqueCustomersCount}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Best Performing Card</p>
              <p className="text-lg font-bold text-green-600">
                {cardPerformanceData[0]?.cardName || 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">
                {cardPerformanceData[0]?.redemptionRate.toFixed(1)}% redemption rate
              </p>
            </div>
            <div className="text-center col-span-1 sm:col-span-2 lg:col-span-1">
              <p className="text-sm text-muted-foreground">Total Cards in Market</p>
              <p className="text-2xl font-bold text-blue-600">
                {cardPerformanceData.reduce((sum, card) => sum + card.totalIssued, 0)}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center">
            <p className="text-muted-foreground">No customer engagement data available yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantAnalytics;
