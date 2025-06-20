import { useEffect, useState } from "react";
import { merchantSupabase } from "@/integrations/supabase/client";
import { Clock } from "lucide-react";
import { TransactionGroup } from "@/components/merchant/TransactionGroup";

export interface TransactionHistory {
  id: string;
  type: 'stamp' | 'reward' | 'redeem' | 'card_created' | 'card_updated' | 'card_deactivated';
  timestamp: string;
  card_id: string;
  customer_id: string;
  count?: number;
  reward_code?: string;
  cardName?: string;
  customerEmail?: string;
  customerName?: string;
  card_name?: string;
}

const MerchantHistory = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionHistory[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        // Get current merchant user using merchantSupabase
        const { data: { user }, error: authError } = await merchantSupabase.auth.getUser();
        if (authError || !user) {
          console.error("Auth error:", authError);
          throw new Error("No authenticated merchant user");
        }

        console.log("Merchant user ID for history:", user.id);

        // First get transactions with stamp card names, filtered by merchant_id
        const { data: transactionData, error: transactionError } = await merchantSupabase
          .from('stamp_transactions')
          .select(`
            *,
            stamp_cards!inner(name)
          `)
          .eq('merchant_id', user.id)
          .order('timestamp', { ascending: false });

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
          
          setTransactions(formattedTransactions);
        } else {
          setTransactions([]);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error in history page:", error);
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Group transactions by date
  const groupedTransactions: { [key: string]: TransactionHistory[] } = {};
  transactions.forEach(transaction => {
    const date = formatDate(transaction.timestamp);
    if (!groupedTransactions[date]) {
      groupedTransactions[date] = [];
    }
    groupedTransactions[date].push(transaction);
  });

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
        <h1 className="text-2xl font-bold">Transaction History</h1>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-card border rounded-xl p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No transactions yet</h3>
          <p className="text-muted-foreground mt-2">
            Transactions will appear here when customers collect stamps or redeem rewards
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
            <TransactionGroup 
              key={date} 
              date={date} 
              transactions={dayTransactions} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MerchantHistory;
