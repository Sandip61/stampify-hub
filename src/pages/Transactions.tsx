
import React, { useEffect, useState } from "react";
import { getCurrentUser } from "@/utils/auth";
import { getUserTransactions, Transaction } from "@/utils/data";
import { format } from "date-fns";
import { 
  Receipt, 
  BadgeCheck, 
  Clock, 
  CalendarDays,
  ChevronRight,
  ArrowLeft,
  Gift,
  Stamp
} from "lucide-react";
import { toast } from "sonner";

interface TransactionCard {
  name: string;
  business_logo: string;
  business_color?: string;
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "stamp" | "redeem">("all");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const data = await getUserTransactions();
        setTransactions(data);
      } catch (error) {
        console.error("Error loading transactions:", error);
        toast.error("Could not load your transaction history");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Get filtered transactions
  const filteredTransactions = transactions.filter(transaction => {
    if (activeFilter === "all") return true;
    return transaction.type === activeFilter;
  });

  // Format transaction type for display
  const formatType = (type: string, count?: number) => {
    if (type === "stamp") {
      return `Collected ${count || 1} stamp${count !== 1 ? "s" : ""}`;
    } else if (type === "redeem") {
      return "Redeemed reward";
    }
    return type;
  };

  // Format relative time (today, yesterday, etc.)
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return format(date, "MMM d, yyyy");
    }
  };

  // Group transactions by date
  const groupTransactionsByDate = () => {
    const groups: { [key: string]: Transaction[] } = {};
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });
    
    return Object.entries(groups)
      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
      .map(([date, transactions]) => ({
        date,
        transactions
      }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const groupedTransactions = groupTransactionsByDate();

  return (
    <div className="container mx-auto py-6 px-4 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Transaction History</h1>
        <div className="flex border rounded-lg overflow-hidden">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 text-sm ${
              activeFilter === "all" 
                ? "bg-primary text-primary-foreground" 
                : "bg-background hover:bg-muted/50"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter("stamp")}
            className={`px-3 py-1.5 text-sm flex items-center ${
              activeFilter === "stamp" 
                ? "bg-primary text-primary-foreground" 
                : "bg-background hover:bg-muted/50"
            }`}
          >
            <Stamp className="h-3.5 w-3.5 mr-1.5" />
            Stamps
          </button>
          <button
            onClick={() => setActiveFilter("redeem")}
            className={`px-3 py-1.5 text-sm flex items-center ${
              activeFilter === "redeem" 
                ? "bg-primary text-primary-foreground" 
                : "bg-background hover:bg-muted/50"
            }`}
          >
            <Gift className="h-3.5 w-3.5 mr-1.5" />
            Rewards
          </button>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Receipt className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium text-foreground mb-2">No transactions yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {activeFilter === "all" 
              ? "Your stamp collection and reward redemption history will appear here."
              : activeFilter === "stamp"
              ? "Your collected stamps will appear here."
              : "Your redeemed rewards will appear here."}
          </p>
          {activeFilter !== "all" && (
            <button
              onClick={() => setActiveFilter("all")}
              className="mt-4 text-primary hover:underline inline-flex items-center"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Show all transactions
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {groupedTransactions.map(group => (
            <div key={group.date}>
              <div className="flex items-center mb-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground mr-2" />
                <h3 className="text-sm font-medium text-muted-foreground">
                  {formatRelativeDate(group.date)}
                </h3>
              </div>
              
              <div className="bg-card border rounded-xl overflow-hidden">
                {group.transactions.map((transaction, index) => (
                  <div 
                    key={transaction.id} 
                    className={`p-4 hover:bg-muted/30 transition-colors ${
                      index !== group.transactions.length - 1 ? "border-b" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div 
                        className="h-12 w-12 flex items-center justify-center rounded-full overflow-hidden text-white"
                        style={{ backgroundColor: "#3B82F6" }}
                      >
                        <span className="text-xl">🏪</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">
                          {transaction.businessName}
                        </p>
                        <div className="flex items-center mt-1">
                          {transaction.type === "stamp" ? (
                            <>
                              <Stamp className="h-3.5 w-3.5 text-blue-500 mr-1.5" />
                              <p className="text-sm text-muted-foreground">
                                {formatType(transaction.type, transaction.count)}
                              </p>
                            </>
                          ) : (
                            <>
                              <BadgeCheck className="h-3.5 w-3.5 text-green-500 mr-1.5" />
                              <p className="text-sm text-muted-foreground">
                                Reward redeemed
                              </p>
                            </>
                          )}
                        </div>
                        {transaction.rewardCode && (
                          <div className="mt-2 rounded-md bg-muted px-2 py-1 text-xs inline-block">
                            Code: <span className="font-mono font-medium">{transaction.rewardCode}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right flex flex-col items-end">
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(transaction.timestamp), "h:mm a")}
                        </div>
                        <div className="mt-2">
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Transactions;
