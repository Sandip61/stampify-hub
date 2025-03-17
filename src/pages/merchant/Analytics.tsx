import { useEffect, useState } from "react";
import { 
  BarChart3, 
  Users, 
  Stamp,
  Gift,
  Calendar,
  CreditCard
} from "lucide-react";
import { Merchant } from "@/utils/merchantAuth";
import { 
  getMerchantAnalytics,
  initializeDemoMerchantDataForLogin
} from "@/utils/merchantData";
import { mockMerchant } from "@/utils/mockMerchantData";

const MerchantAnalytics = () => {
  const [merchant, setMerchant] = useState<Merchant | null>(mockMerchant);
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // Set the mock merchant directly instead of fetching
        setMerchant(mockMerchant);

        // Initialize demo data for this merchant
        initializeDemoMerchantDataForLogin(mockMerchant.id);
        
        // Load analytics data
        setAnalytics(getMerchantAnalytics());
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading merchant data:", error);
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
              <p className="text-sm text-muted-foreground">Total Stamps</p>
              <h3 className="text-2xl font-bold mt-1">{analytics.totalStamps}</h3>
            </div>
            <div className="rounded-full p-2 bg-primary/10 text-primary">
              <Stamp className="h-5 w-5" />
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
        
        <div className="h-64">
          <div className="flex h-full items-end space-x-2">
            {analytics.transactionsByDay.map((day: any) => (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center space-y-1">
                  <div 
                    className="w-full bg-blue-500/20 rounded-t-sm"
                    style={{ 
                      height: `${(day.stamps / Math.max(...analytics.transactionsByDay.map((d: any) => Math.max(d.stamps, 1)))) * 150}px`,
                      minHeight: day.stamps > 0 ? '10px' : '0px'
                    }}
                  ></div>
                  <div 
                    className="w-full bg-green-500/20 rounded-t-sm"
                    style={{ 
                      height: `${(day.redemptions / Math.max(...analytics.transactionsByDay.map((d: any) => Math.max(d.redemptions, 1)))) * 70}px`,
                      minHeight: day.redemptions > 0 ? '10px' : '0px'
                    }}
                  ></div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {formatDate(day.date)}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-center mt-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="h-3 w-3 bg-blue-500/20 rounded-sm mr-2"></div>
              <span className="text-xs text-muted-foreground">Stamps</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 bg-green-500/20 rounded-sm mr-2"></div>
              <span className="text-xs text-muted-foreground">Redemptions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card performance */}
      <div className="bg-card border rounded-xl p-5">
        <div className="flex items-center mb-6">
          <CreditCard className="mr-2 h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Card Performance</h3>
        </div>
        
        <div className="space-y-4">
          {analytics.transactionsByCard.map((card: any) => (
            <div key={card.cardId}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">{card.cardName}</span>
                <span className="text-sm text-muted-foreground">
                  {card.stamps} stamps, {card.redemptions} redemptions
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500"
                    style={{ width: `${Math.min((card.stamps / Math.max(...analytics.transactionsByCard.map((c: any) => c.stamps || 1))) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-blue-500">
                  {card.stamps}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500"
                    style={{ width: `${Math.min((card.redemptions / Math.max(...analytics.transactionsByCard.map((c: any) => c.redemptions || 1))) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-green-500">
                  {card.redemptions}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer engagement */}
      <div className="bg-card border rounded-xl p-5">
        <div className="flex items-center mb-6">
          <Users className="mr-2 h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Customer Engagement</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-2">Customer Retention</h4>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Active Customers</span>
                <span className="text-muted-foreground">
                  {analytics.activeCustomers}/{analytics.totalCustomers}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500"
                  style={{ width: `${analytics.retentionRate}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.retentionRate.toFixed(1)}% of customers active in the last 30 days
              </p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Redemption Rate</h4>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Stamps to Redemptions</span>
                <span className="text-muted-foreground">
                  {analytics.totalRedemptions}/{analytics.totalStamps}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500"
                  style={{ width: `${analytics.redemptionRate}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.redemptionRate.toFixed(1)}% of stamps lead to redemptions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantAnalytics;
