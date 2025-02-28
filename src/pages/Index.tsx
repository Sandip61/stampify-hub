
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, User } from "@/utils/auth";
import { getUserStampCards, StampCard } from "@/utils/data";
import { CreditCard, LogIn } from "lucide-react";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [cards, setCards] = useState<StampCard[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (currentUser) {
          const userCards = await getUserStampCards();
          setCards(userCards);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error checking user:", error);
        setLoading(false);
      }
    };
    
    checkUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="w-12 h-12 rounded-full border-t-2 border-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-bold mb-4">Stampify</h1>
          <p className="text-xl text-muted-foreground">
            Collect digital stamps, earn rewards from your favorite places
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">The Digital Solution for Loyalty Cards</h2>
            <p className="text-muted-foreground">
              No more lost paper cards or forgotten loyalty programs. Stampify
              keeps all your loyalty cards in one place - your phone.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="rounded-full bg-primary/10 p-2 mr-3">
                  <span className="text-lg">🎯</span>
                </div>
                <div>
                  <h3 className="font-medium">All Your Cards in One App</h3>
                  <p className="text-sm text-muted-foreground">
                    Keep track of all your loyalty programs in a single app
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="rounded-full bg-primary/10 p-2 mr-3">
                  <span className="text-lg">🎁</span>
                </div>
                <div>
                  <h3 className="font-medium">Earn Rewards Easily</h3>
                  <p className="text-sm text-muted-foreground">
                    Collect digital stamps and redeem rewards with a tap
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="rounded-full bg-primary/10 p-2 mr-3">
                  <span className="text-lg">🔔</span>
                </div>
                <div>
                  <h3 className="font-medium">Never Miss a Reward</h3>
                  <p className="text-sm text-muted-foreground">
                    Get notified when you're close to earning a reward
                  </p>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              {user ? (
                <Link 
                  to="/dashboard" 
                  className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  View Your Cards
                </Link>
              ) : (
                <div className="space-x-4">
                  <Link 
                    to="/login" 
                    className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Link>
                  <Link 
                    to="/signup" 
                    className="inline-flex items-center px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          <div className="rounded-xl bg-muted p-6 shadow-sm">
            <div className="space-y-6">
              <div className="rounded-lg bg-card border p-4 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="rounded-full bg-blue-500 text-white p-2 mr-3">
                    ☕
                  </div>
                  <div>
                    <h3 className="font-medium">Morning Brew Coffee</h3>
                    <p className="text-xs text-muted-foreground">
                      Buy 9 coffees, get 1 free
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={`stamp-${i}`} 
                      className="aspect-square rounded-md flex items-center justify-center bg-blue-500/10 text-blue-500"
                    >
                      {i < 3 ? "✓" : ""}
                    </div>
                  ))}
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={`empty-${i}`} 
                      className="aspect-square rounded-md flex items-center justify-center border border-dashed border-muted-foreground/30"
                    />
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-3 text-right">
                  3/10 stamps collected
                </div>
              </div>
              
              <div className="rounded-lg bg-card border p-4 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="rounded-full bg-green-500 text-white p-2 mr-3">
                    🥪
                  </div>
                  <div>
                    <h3 className="font-medium">Sandwich Heaven</h3>
                    <p className="text-xs text-muted-foreground">
                      Complete 5 stamps for a free sandwich
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={`stamp-${i}`} 
                      className={`aspect-square rounded-md flex items-center justify-center ${
                        i < 4 
                          ? "bg-green-500/10 text-green-500" 
                          : "border border-dashed border-muted-foreground/30"
                      }`}
                    >
                      {i < 4 ? "✓" : ""}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-3 text-right">
                  4/5 stamps collected
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-6">Ready to simplify your loyalty programs?</h2>
          {user ? (
            <Link 
              to="/dashboard" 
              className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              View Your Cards
            </Link>
          ) : (
            <Link 
              to="/signup" 
              className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Create Free Account
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
