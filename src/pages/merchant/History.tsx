import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Stamp, Gift, Clock, Calendar, PlusCircle, Edit, Archive } from "lucide-react";

interface TransactionHistory {
  id: string;
  type: string;
  timestamp: string;
  card_id: string;
  customer_id: string;
  count?: number;
  reward_code?: string;
  cardName?: string;
  customerEmail?: string;
  card_name?: string; // Additional field for card name
}

const MerchantHistory = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionHistory[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        // Updated query to include more details and transaction types
        const { data, error } = await supabase
          .from('stamp_transactions')
          .select(`
            *,
            stamp_cards!inner(name)
          `)
          .order('timestamp', { ascending: false });

        if (error) {
          console.error("Error fetching transaction history:", error);
          throw error;
        }

        if (data) {
          const formattedTransactions = data.map(transaction => ({
            ...transaction,
            card_name: transaction.stamp_cards?.name
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // New function to get icon and color based on transaction type
  const getTransactionTypeDetails = (type: string) => {
    switch (type) {
      case 'stamp':
        return { icon: <Stamp className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-500' };
      case 'redeem':
        return { icon: <Gift className="h-4 w-4" />, color: 'bg-green-500/10 text-green-500' };
      case 'card_created':
        return { icon: <PlusCircle className="h-4 w-4" />, color: 'bg-purple-500/10 text-purple-500' };
      case 'card_updated':
        return { icon: <Edit className="h-4 w-4" />, color: 'bg-yellow-500/10 text-yellow-500' };
      case 'card_deactivated':
        return { icon: <Archive className="h-4 w-4" />, color: 'bg-red-500/10 text-red-500' };
      default:
        return { icon: <Clock className="h-4 w-4" />, color: 'bg-gray-500/10 text-gray-500' };
    }
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
            <div key={date}>
              <div className="flex items-center mb-4">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">{date}</h3>
              </div>
              
              <div className="bg-card rounded-xl border overflow-hidden">
                <div className="divide-y">
                  {dayTransactions.map(transaction => {
                    const { icon, color } = getTransactionTypeDetails(transaction.type);
                    return (
                      <div key={transaction.id} className="p-4 flex items-center">
                        <div className={`rounded-full p-2 mr-3 ${color}`}>
                          {icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {transaction.card_name || 'Stamp Card Activity'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.type === 'stamp' 
                              ? `Added ${transaction.count || 1} stamp${(transaction.count || 1) > 1 ? 's' : ''} for ${transaction.customer_id}`
                              : transaction.type === 'redeem'
                                ? `Reward redeemed by ${transaction.customer_id}`
                                : transaction.type === 'card_created'
                                  ? 'New Stamp Card Created'
                                  : transaction.type === 'card_updated'
                                    ? 'Stamp Card Updated'
                                    : transaction.type === 'card_deactivated'
                                      ? 'Stamp Card Deactivated'
                                      : 'Unknown Activity'}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(transaction.timestamp)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MerchantHistory;
