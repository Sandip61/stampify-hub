
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getCurrentUser, User } from "@/utils/auth";
import { getUserStampCards, StampCard as StampCardType } from "@/utils/data";
import StampCard from "@/components/StampCard";
import { generateDummyData } from "@/utils/generateDummyData";
import { RefreshCw, Gift, CreditCard } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [stampCards, setStampCards] = useState<StampCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          navigate("/login");
          return;
        }
        
        setUser(currentUser);
        
        // Load stamp cards directly (no need to initialize demo data)
        loadStampCards();
      } catch (error) {
        console.error("Error checking authentication:", error);
        navigate("/login");
      }
    };
    
    checkAuth();
  }, [navigate]);

  const loadStampCards = async () => {
    try {
      setLoading(true);
      const cards = await getUserStampCards();
      setStampCards(cards);
    } catch (error) {
      console.error("Error loading stamp cards:", error);
      toast.error("Failed to load your stamp cards");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStampCards();
    setRefreshing(false);
  };

  const handleGenerateDummyData = async () => {
    try {
      toast.info("Generating demo data...");
      const success = await generateDummyData();
      if (success) {
        await loadStampCards();
        toast.success("Demo data created successfully!");
      }
    } catch (error) {
      console.error("Error generating dummy data:", error);
      toast.error("Failed to generate demo data");
    }
  };

  const handleCardClick = (cardId: string) => {
    navigate(`/card/${cardId}`);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={handleRefresh}
          className="flex items-center px-3 py-2 text-sm font-medium rounded-md border hover:bg-muted transition-colors"
          disabled={refreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center text-primary mb-2">
            <CreditCard className="h-5 w-5 mr-2" />
            <h2 className="font-semibold">Total Cards</h2>
          </div>
          <p className="text-3xl font-bold">
            {loading ? (
              <span className="animate-pulse">...</span>
            ) : (
              stampCards.length
            )}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Number of your loyalty cards
          </p>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center text-green-600 mb-2">
            <Gift className="h-5 w-5 mr-2" />
            <h2 className="font-semibold">Available Rewards</h2>
          </div>
          <p className="text-3xl font-bold">
            {loading ? (
              <span className="animate-pulse">...</span>
            ) : (
              stampCards.filter(card => card.currentStamps >= card.totalStamps).length
            )}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Ready to redeem
          </p>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Your Loyalty Cards</h2>
          
          <button
            onClick={handleGenerateDummyData}
            className="text-xs px-2 py-1 bg-muted/70 text-muted-foreground hover:bg-muted rounded-md transition-colors"
          >
            Generate Demo Data
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 bg-muted/40 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : stampCards.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-xl">
            <h3 className="text-xl font-medium text-muted-foreground mb-2">
              No loyalty cards yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Visit a participating merchant to get started
            </p>
            <button
              onClick={() => navigate("/scan-qr")}
              className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Scan QR to Add Card
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stampCards.map((card) => (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className="cursor-pointer"
              >
                <StampCard card={card} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
