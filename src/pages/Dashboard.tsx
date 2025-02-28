
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StampCard as StampCardComponent } from "@/components/StampCard";
import { getCurrentUser, User } from "@/utils/auth";
import { getUserStampCards, getUserTransactions, StampCard, Transaction, initializeDemoData } from "@/utils/data";
import { Stamp, Gift, ChevronRight } from "lucide-react";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [cards, setCards] = useState<StampCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCards, setActiveCards] = useState<StampCard[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          navigate("/login");
          return;
        }
        
        setUser(currentUser);
        
        // Initialize demo data
        await initializeDemoData();
        
        // Load stamp cards
        const userCards = await getUserStampCards();
        setCards(userCards);
        setActiveCards(userCards.filter(card => card.currentStamps > 0));
        
        // Load recent transactions
        const transactions = await getUserTransactions();
        setRecentTransactions(transactions.slice(0, 3));
        
        setLoading(false);
      } catch (error) {
        console.error("Error initializing dashboard:", error);
        navigate("/login");
      }
    };
    
    initializeUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="w-12 h-12 rounded-full border-t-2 border-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold">Welcome, {user?.name || "Friend"}</h1>
          <p className="text-muted-foreground mt-1">
            Collect stamps and earn rewards
          </p>
        </header>

        {cards.length === 0 ? (
          <div className="bg-card rounded-xl border p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Stamp className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No stamp cards yet</h3>
            <p className="text-muted-foreground mt-2 mb-4">
              Visit your favorite merchants to start collecting stamps
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Your Active Cards</h2>
                <Link to="/history" className="text-sm text-primary flex items-center">
                  View all <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              {activeCards.length === 0 ? (
                <div className="bg-card rounded-xl border p-6 text-center">
                  <p className="text-muted-foreground">
                    You don't have any active stamp cards yet
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {activeCards.map((card) => (
                    <Link to={`/card/${card.id}`} key={card.id}>
                      <StampCardComponent
                        businessName={card.businessName}
                        businessLogo={card.businessLogo}
                        currentStamps={card.currentStamps}
                        totalStamps={card.totalStamps}
                        color={card.color}
                      />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Recent Activity</h2>
                <Link to="/history" className="text-sm text-primary flex items-center">
                  View all <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              {recentTransactions.length === 0 ? (
                <div className="bg-card rounded-xl border p-6 text-center">
                  <p className="text-muted-foreground">
                    No activity yet
                  </p>
                </div>
              ) : (
                <div className="bg-card rounded-xl border overflow-hidden">
                  <div className="divide-y">
                    {recentTransactions.map((transaction) => (
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
                            {transaction.businessName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.type === 'stamp' 
                              ? `Added ${transaction.count || 1} stamp${(transaction.count || 1) > 1 ? 's' : ''}` 
                              : 'Redeemed reward'}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(transaction.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
