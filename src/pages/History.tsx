import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, User } from "@/utils/auth";
import { getUserTransactions, Transaction } from "@/utils/data";
import { Stamp, Gift, Clock, Calendar } from "lucide-react";
import { Copy, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const History = () => {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          navigate("/login");
          return;
        }
        
        setUser(currentUser);
        
        // Load transactions
        const userTransactions = await getUserTransactions();
        setTransactions(userTransactions);
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading history:", error);
        navigate("/login");
      }
    };
    
    loadData();
  }, [navigate]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group transactions by date for better visualization
  const groupedTransactions: { [key: string]: Transaction[] } = {};
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.timestamp).toLocaleDateString();
    if (!groupedTransactions[date]) {
      groupedTransactions[date] = [];
    }
    groupedTransactions[date].push(transaction);
  });

  // Convert to array for easier rendering
  const groupedTransactionsArray = Object.entries(groupedTransactions).map(
    ([date, transactions]) => ({ date, transactions })
  );

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="w-12 h-12 rounded-full border-t-2 border-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen pt-16 pb-20 px-4 flex flex-col">
      <div className="max-w-2xl mx-auto h-full flex flex-col">
        <header className="mb-8 flex-shrink-0">
          <h1 className="text-2xl font-bold">Activity History</h1>
          <p className="text-muted-foreground mt-1">Your stamp collection history</p>
        </header>

        {transactions.length === 0 ? (
          <div className="bg-card rounded-xl border p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No activity yet</h3>
            <p className="text-muted-foreground mt-2 mb-4">
              Visit merchants to start collecting stamps
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="space-y-8 pb-4">
                {groupedTransactionsArray.map(group => (
                  <div key={group.date}>
                    <div className="flex items-center mb-4">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-medium">{group.date}</h3>
                    </div>
                    
                    <div className="bg-card rounded-xl border overflow-hidden">
                      <div className="divide-y">
                        {group.transactions.map(transaction => (
                          <div key={transaction.id} className="p-4 flex items-center space-x-4">
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
                                {transaction.businessName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {transaction.type === 'stamp' 
                                  ? `Added ${transaction.count || 1} stamp${(transaction.count || 1) > 1 ? 's' : ''}` 
                                  : `Redeemed reward${transaction.reward_code ? ` (${transaction.reward_code})` : ''}`}
                              </p>
                              {/* Show reward code if present */}
                              {transaction.type === 'redeem' && transaction.reward_code && (
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded text-xs tracking-widest border border-green-200 select-all">{transaction.reward_code}</span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(transaction.reward_code as string);
                                      setCopiedCode(transaction.id);
                                      setTimeout(() => setCopiedCode(null), 1500);
                                    }}
                                    className="ml-2 px-2 py-1 bg-green-200 rounded hover:bg-green-300 flex items-center text-green-900 text-xs transition-all"
                                    aria-label="Copy code"
                                  >
                                    {copiedCode === transaction.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copiedCode === transaction.id ? "Copied" : "Copy"}
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(transaction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
