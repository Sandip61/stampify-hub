
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Gift, Stamp } from "lucide-react";
import { getCurrentUser } from "@/utils/auth";
import { getUserTransactions, Transaction } from "@/utils/data";

const History = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate("/login");
      return;
    }

    // Load transactions
    const txs = getUserTransactions();
    setTransactions(txs);
    setIsLoading(false);
  }, [navigate]);

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Group transactions by date
  const groupTransactionsByDate = () => {
    const grouped: { [key: string]: Transaction[] } = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.timestamp).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(transaction);
    });
    
    return grouped;
  };

  const groupedTransactions = groupTransactionsByDate();

  return (
    <div className="min-h-screen pt-16 pb-20 px-4 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Activity History</h1>
        <p className="text-muted-foreground mt-1">Your stamps and rewards</p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-5 w-32 bg-muted/50 rounded mb-4"></div>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-muted/50 h-20 rounded-xl mb-3"></div>
              ))}
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No activity yet</h3>
          <p className="text-muted-foreground mt-2">
            Your stamp collection and reward redemption history will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([date, txs]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              
              <div className="space-y-3">
                {txs.map((tx) => (
                  <div 
                    key={tx.id}
                    className="bg-card rounded-xl border p-4 flex items-center"
                    onClick={() => navigate(`/card/${tx.cardId}`)}
                  >
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'stamp' ? 'bg-primary/10 text-primary' : 'bg-green-500/10 text-green-500'}`}
                    >
                      {tx.type === 'stamp' ? (
                        <Stamp className="w-5 h-5" />
                      ) : (
                        <Gift className="w-5 h-5" />
                      )}
                    </div>
                    
                    <div className="ml-4 flex-1">
                      <p className="font-medium">
                        {tx.type === 'stamp' 
                          ? `${tx.count} stamp${tx.count !== 1 ? 's' : ''} collected` 
                          : 'Reward redeemed'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tx.businessName}
                        {tx.rewardCode && ` · Code: ${tx.rewardCode}`}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(tx.timestamp).split(' at ')[1]}
                      </span>
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

export default History;
