
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/utils/auth";
import { format } from "date-fns";

interface TransactionCard {
  name: string;
  business_logo: string;
}

interface Transaction {
  id: string;
  type: "stamp" | "redeem";
  count?: number;
  timestamp: string;
  reward_code?: string;
  card: TransactionCard;
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("stamp_transactions")
          .select(`
            id,
            type,
            count,
            reward_code,
            timestamp,
            card:card_id (
              name,
              business_logo
            )
          `)
          .eq("customer_id", user.id)
          .order("timestamp", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Error loading transactions:", error);
          return;
        }

        if (data) {
          // Ensure data conforms to our Transaction interface
          const typedTransactions: Transaction[] = data.map(item => ({
            id: item.id,
            type: item.type as "stamp" | "redeem",
            count: item.count || 0,
            reward_code: item.reward_code,
            timestamp: item.timestamp,
            card: {
              name: item.card.name,
              business_logo: item.card.business_logo
            } as TransactionCard
          }));
          
          setTransactions(typedTransactions);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Format transaction type for display
  const formatType = (type: string, count?: number) => {
    if (type === "stamp") {
      return `Collected ${count || 1} stamp${count !== 1 ? "s" : ""}`;
    } else if (type === "redeem") {
      return "Redeemed reward";
    }
    return type;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Transaction History</h1>

      {transactions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-medium text-gray-600">No transactions yet</h3>
          <p className="text-gray-500 mt-2">
            Your stamp collection and reward redemption history will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <ul className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <li key={transaction.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-100 h-12 w-12 flex items-center justify-center rounded-full overflow-hidden">
                    <span className="text-2xl">{transaction.card.business_logo}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {transaction.card.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {formatType(transaction.type, transaction.count)}
                    </p>
                    {transaction.reward_code && (
                      <p className="text-xs text-blue-600">
                        Reward code: {transaction.reward_code}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-500 text-right">
                    {formatDate(transaction.timestamp)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Transactions;

