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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch merchant user ID
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("Not authenticated");

        // Fetch stamp cards for this merchant
        const { data: cardsData, error: cardsError } = await supabase
          .from("stamp_cards")
          .select("*")
          .eq("merchant_id", user.id)
          .order("created_at", { ascending: false });

        if (cardsError) throw cardsError;
        setStampCards(cardsData || []);

        // Fetch transactions for this merchant
        const { data: transactionData, error: txError } = await supabase
          .from("stamp_transactions")
          .select("*")
          .eq("merchant_id", user.id);

        if (txError) throw txError;

        // Fetch all merchant customers
        const { data: merchantCustomers, error: custError } = await supabase
          .from("merchant_customers")
          .select("*")
          .eq("merchant_id", user.id);

        if (custError) throw custError;

        // Fetch all customer_stamp_cards for this merchant's cards
        const cardIds = cardsData?.map(card => card.id) ?? [];
        let customerStampCards: any[] = [];
        if (cardIds.length > 0) {
          const { data: cscData, error: cscError } = await supabase
            .from("customer_stamp_cards")
            .select("*, card:stamp_cards!inner(total_stamps, merchant_id)")
            .in("card_id", cardIds);

          if (cscError) throw cscError;
          customerStampCards = cscData ?? [];
        }

        // --- Calculate analytics metrics ---

        // Total stamp cards
        const totalStampCards = cardsData ? cardsData.length : 0;

        // Total redemptions: number of transactions with type === "redeem"
        const totalRedemptions = transactionData ? transactionData.filter(tx => tx.type === "redeem").length : 0;

        // Total customers = total merchantCustomers
        const totalCustomers = merchantCustomers ? merchantCustomers.length : 0;

        // Active customers: unique customer_id in transactions from last 30 days
        const date30d = new Date();
        date30d.setDate(date30d.getDate() - 30);
        const recentTxs = transactionData?.filter(tx => new Date(tx.timestamp) >= date30d) ?? [];
        const activeCustomerIds = [...new Set(recentTxs.map(tx => tx.customer_id))];
        const activeCustomers = activeCustomerIds.length;

        // Redemption Rate: fraction of customerStampCards completed
        const totalIssued = customerStampCards.length;
        const numRedeemed = customerStampCards.filter((csc: any) =>
          csc.card &&
          typeof csc.card.total_stamps === "number" &&
          csc.current_stamps >= csc.card.total_stamps
        ).length;
        const redemptionRate = totalIssued === 0 ? 0 : (numRedeemed / totalIssued) * 100;

        // Retention rate: not implemented, keep as 0 (to compliment Dashboard)
        const retentionRate = 0;

        // Activity by Day (last 7 days)
        const dailyData: { [key: string]: { stamps: number; redemptions: number } } = {};
        const daysBack = 7;
        const today = new Date();
        for (let i = daysBack - 1; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const key = d.toISOString().split("T")[0];
          dailyData[key] = { stamps: 0, redemptions: 0 };
        }
        transactionData?.forEach(tx => {
          const key = tx.timestamp.split("T")[0];
          if (dailyData[key]) {
            if (tx.type === "stamp") dailyData[key].stamps += tx.count || 1;
            if (tx.type === "redeem") dailyData[key].redemptions += 1;
          }
        });
        const transactionsByDay = Object.entries(dailyData).map(([date, data]) => ({
          date,
          stamps: data.stamps,
          redemptions: data.redemptions
        }));

        // Transactions by Card
        const txByCard: { [id: string]: { cardName: string; stamps: number; redemptions: number } } = {};
        cardsData?.forEach(card => {
          txByCard[card.id] = {
            cardName: card.name,
            stamps: 0,
            redemptions: 0
          };
        });
        transactionData?.forEach(tx => {
          if (tx.card_id && txByCard[tx.card_id]) {
            if (tx.type === "stamp") txByCard[tx.card_id].stamps += tx.count || 1;
            if (tx.type === "redeem") txByCard[tx.card_id].redemptions += 1;
          }
        });
        const transactionsByCard = Object.entries(txByCard).map(([cardId, stats]) => ({
          cardId,
          cardName: stats.cardName,
          stamps: stats.stamps,
          redemptions: stats.redemptions
        }));

        setAnalytics({
          totalStampCards,
          totalRedemptions,
          activeCustomers,
          totalCustomers,
          redemptionRate,
          retentionRate,
          transactionsByDay,
          transactionsByCard
        });
        setIsLoading(false);
      } catch (err: any) {
        setError("Could not load analytics.");
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

      {/* Customer engagement */}
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
