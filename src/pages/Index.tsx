
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import StampCard from "@/components/StampCard";
import { getCurrentUser } from "@/utils/auth";
import { getUserStampCards, initializeDemoData } from "@/utils/data";
import { StampCard as StampCardType } from "@/utils/data";

const Index = () => {
  const navigate = useNavigate();
  const [stampCards, setStampCards] = useState<StampCardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate("/login");
      return;
    }

    // Initialize demo data
    initializeDemoData();
    
    // Load stamp cards
    const cards = getUserStampCards();
    setStampCards(cards);
    setIsLoading(false);
  }, [navigate]);

  return (
    <div className="min-h-screen pt-16 pb-20 px-4 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Your Stamp Cards</h1>
        <p className="text-muted-foreground mt-1">Collect stamps and earn rewards</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div 
              key={index}
              className="h-40 rounded-xl bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      ) : stampCards.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <CreditCard className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No stamp cards yet</h3>
          <p className="text-muted-foreground mt-2 mb-6">
            Your stamp cards will appear here once you add them
          </p>
          <button 
            className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            onClick={() => {
              // In a real app, this would open a modal to add a card
              alert("This feature would allow you to add a new card");
            }}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add your first card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {stampCards.map((card) => (
            <StampCard key={card.id} card={card} />
          ))}
          
          <button 
            className="flex items-center justify-center h-16 rounded-xl border border-dashed border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-muted-foreground/60 transition-colors"
            onClick={() => {
              // In a real app, this would open a modal to add a card
              alert("This feature would allow you to add a new card");
            }}
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Add new card
          </button>
        </div>
      )}
    </div>
  );
};

export default Index;
