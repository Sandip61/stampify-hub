
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
import { mockMerchant } from "@/utils/mockMerchantData";
import { supabase } from "@/integrations/supabase/client";

// Analytics data interface
interface AnalyticsData {
  totalStamps: number;
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
  const [merchant, setMerchant] = useState<Merchant | null>(mockMerchant);
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // In the future, we would fetch real data from Supabase
        // For now, use placeholder data
        
        setAnalytics({
          totalStamps: 0,
          totalRedemptions: 0,
          activeCustomers: 0,
          totalCustomers: 0,
          redemptionRate: 0,
          retentionRate: 0,
          transactionsByDay: [
            {
              date: new Date().toISOString(),
              stamps: 0,
              redemptions: 0
            }
          ],
          transactionsByCard: []
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading analytics data:", error);
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
        
        <div className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">No activity data available yet</p>
        </div>
      </div>

      {/* Card performance */}
      <div className="bg-card border rounded-xl p-5">
        <div className="flex items-center mb-6">
          <CreditCard className="mr-2 h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Card Performance</h3>
        </div>
        
        <div className="h-40 flex items-center justify-center">
          <p className="text-muted-foreground">No card performance data available yet</p>
        </div>
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
