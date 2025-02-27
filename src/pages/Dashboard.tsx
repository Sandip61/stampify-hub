
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "@/utils/auth";
import { getUserStampCards, getUserTransactions } from "@/utils/data";
import { StampCard as StampCardType } from "@/utils/data";
import StampCard from "@/components/StampCard";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stampCards, setStampCards] = useState<StampCardType[]>([]);
  const [readyToRedeem, setReadyToRedeem] = useState<StampCardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate("/login");
      return;
    }

    // Load stamp cards
    const cards = getUserStampCards();
    setStampCards(cards);
    
    // Filter cards that are ready to redeem
    setReadyToRedeem(cards.filter(card => card.currentStamps === card.totalStamps));
    
    setIsLoading(false);
  }, [navigate]);

  // Get recent transactions (last 3)
  const recentTransactions = getUserTransactions().slice(0, 3);

  return (
    <div className="min-h-screen pt-16 pb-20 px-4 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back!</p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="h-40 rounded-xl bg-muted/50 animate-pulse" />
          <div className="h-6 w-32 bg-muted/50 rounded animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-40 rounded-xl bg-muted/50 animate-pulse" />
            <div className="h-40 rounded-xl bg-muted/50 animate-pulse" />
          </div>
        </div>
      ) : (
        <>
          {readyToRedeem.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-3">Ready to Redeem</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {readyToRedeem.map((card) => (
                  <StampCard key={card.id} card={card} />
                ))}
              </div>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Your Cards</h2>
            {stampCards.length === 0 ? (
              <div className="bg-card rounded-xl border p-6 text-center">
                <p className="text-muted-foreground">
                  You don't have any stamp cards yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stampCards
                  .filter(card => card.currentStamps < card.totalStamps)
                  .slice(0, 4)
                  .map((card) => (
                    <StampCard key={card.id} card={card} />
                  ))}
                
                {stampCards.length > 4 && (
                  <button
                    onClick={() => navigate("/cards")}
                    className="flex items-center justify-center h-40 rounded-xl border border-dashed border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-muted-foreground/60 transition-colors"
                  >
                    View all cards
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
            {recentTransactions.length === 0 ? (
              <div className="bg-card rounded-xl border p-6 text-center">
                <p className="text-muted-foreground">
                  No recent activity to show
                </p>
              </div>
            ) : (
              <div className="bg-card rounded-xl border overflow-hidden">
                {recentTransactions.map((tx, index) => (
                  <div 
                    key={tx.id}
                    className="flex items-center p-4 hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => navigate(`/card/${tx.cardId}`)}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      {tx.type === 'stamp' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-stamp">
                          <path d="M5 22h14"></path>
                          <path d="M19.27 13.73A2.5 2.5 0 0 0 17.5 13h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1.5c0-.66-.26-1.3-.73-1.77Z"></path>
                          <path d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-3-3c-1.66 0-3 1-3 3s1 2 1 3.5V13"></path>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-gift">
                          <polyline points="20 12 20 22 4 22 4 12"></polyline>
                          <rect x="2" y="7" width="20" height="5"></rect>
                          <line x1="12" y1="22" x2="12" y2="7"></line>
                          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                        </svg>
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
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                
                <div className="border-t p-3 text-center">
                  <button 
                    onClick={() => navigate("/history")}
                    className="text-sm text-primary hover:underline"
                  >
                    View all activity
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
