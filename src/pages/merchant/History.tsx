import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock } from "lucide-react";
import { TransactionGroup } from "@/components/merchant/TransactionGroup";

export interface TransactionHistory {
  id: string;
  type: string;
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
        const { data, error } = await supabase
          .from('stamp_transactions')
          .select(`
            *,
            stamp_cards!inner(name),
            profiles(email, name)
          `)
          .order('timestamp', { ascending: false });

        if (error) {
          console.error("Error fetching transaction history:", error);
          throw error;
        }

        if (data) {
          const formattedTransactions = data.map(transaction => ({
            ...transaction,
            card_name: transaction.stamp_cards?.name,
            customerEmail: transaction.profiles?.email,
            customerName: transaction.profiles?.name
          }));
          setTransactions(formattedTransactions);
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
