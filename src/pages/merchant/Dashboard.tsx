import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  BarChart3, 
  CreditCard, 
  Users, 
  Stamp,
  Gift,
  PlusCircle,
  ArrowUpRight
} from "lucide-react";
import { 
  getMerchantAnalytics,
  initializeDemoMerchantDataForLogin,
  MerchantTransaction,
  getMerchantTransactions
} from "@/utils/merchantData";

// Mock merchant data
const mockMerchant = {
  id: "demo-merchant-id",
  businessName: "Demo Business",
  email: "demo@example.com",
  businessLogo: "🏪",
  businessColor: "#3B82F6"
};

const MerchantDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<MerchantTransaction[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Initialize demo data with our mock merchant ID
        initializeDemoMerchantDataForLogin(mockMerchant.id);
        
        // Load data
        setAnalytics(getMerchantAnalytics());
        setRecentTransactions(getMerchantTransactions().slice(0, 5));
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading merchant data:", error);
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
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin"></div>
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
          
          <div className="h-64">
            <div className="flex h-full items-end space-x-2">
              {analytics.transactionsByDay.map((day: any) => (
                <div key={day.date} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center space-y-1">
                    <div 
                      className="w-full bg-blue-500/20 rounded-t-sm"
                      style={{ 
                        height: `${(day.stamps / Math.max(...analytics.transactionsByDay.map((d: any) => d.stamps || 1))) * 150}px`,
                        minHeight: day.stamps > 0 ? '10px' : '0px'
                      }}
                    ></div>
                    <div 
                      className="w-full bg-green-500/20 rounded-t-sm"
                      style={{ 
                        height: `${(day.redemptions / Math.max(...analytics.transactionsByDay.map((d: any) => d.redemptions || 1))) * 70}px`,
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

        {/* Recent transactions */}
        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Recent Transactions</h3>
          </div>
          
          <div className="divide-y">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="p-4 flex items-center">
                  <div className={`rounded-full p-2 mr-3 ${
                    transaction.type === 'stamp' 
                      ? 'bg-blue-500/10 text-blue-500' 
                      : 'bg-green-500/10 text-green-500'
                  }`}>
                    {transaction.type === 'stamp' ? (
                      <Stamp className="h-4 w-4" />
                    ) : (
                      <Gift className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {transaction.customerName}
                      <span className="text-xs text-muted-foreground ml-2">
                        ({transaction.customerEmail})
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.type === 'stamp' ? 'Added stamp' : 'Redeemed reward'}
                      {transaction.rewardCode && ` (Code: ${transaction.rewardCode})`}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(transaction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No recent transactions
              </div>
            )}
          </div>
          
          <div className="p-3 border-t text-center">
            <Link to="/merchant/customers" className="text-sm text-primary">
              View all transactions
            </Link>
          </div>
        </div>
      </div>

      {/* Program performance */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Program Performance</h3>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-3">Card Performance</h4>
              <div className="space-y-4">
                {analytics.transactionsByCard.map((card: any) => (
                  <div key={card.cardId}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{card.cardName}</span>
                      <span className="text-muted-foreground">
                        {card.stamps} stamps, {card.redemptions} redemptions
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${(card.redemptions / (card.stamps || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-3">Customer Engagement</h4>
              <div className="space-y-4">
                <div>
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
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Redemption Rate</span>
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantDashboard;
