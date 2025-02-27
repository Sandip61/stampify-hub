
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Gift } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/utils/auth";
import { getStampCard, addStamp, redeemReward, StampCard as StampCardType } from "@/utils/data";

const StampCardDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [card, setCard] = useState<StampCardType | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isAddingStamp, setIsAddingStamp] = useState(false);
  const [rewardCode, setRewardCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate("/login");
      return;
    }

    if (!id) {
      navigate("/");
      return;
    }

    // Load card
    const cardData = getStampCard(id);
    if (!cardData) {
      toast.error("Stamp card not found");
      navigate("/");
      return;
    }

    setCard(cardData);
    setIsLoading(false);
  }, [id, navigate]);

  const handleAddStamp = async () => {
    if (!card || isAddingStamp) return;
    
    setIsAddingStamp(true);
    
    try {
      const updatedCard = await addStamp(card.id);
      setCard(updatedCard);
      toast.success("Stamp added!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add stamp");
    } finally {
      setIsAddingStamp(false);
    }
  };

  const handleRedeemReward = async () => {
    if (!card || isRedeeming) return;
    
    if (card.currentStamps < card.totalStamps) {
      toast.error("Not enough stamps to redeem reward");
      return;
    }
    
    setIsRedeeming(true);
    
    try {
      const result = await redeemReward(card.id);
      setCard(result.card);
      setRewardCode(result.code);
      toast.success("Reward redeemed successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to redeem reward");
    } finally {
      setIsRedeeming(false);
    }
  };

  if (isLoading || !card) {
    return (
      <div className="min-h-screen pt-16 pb-20 px-4 max-w-3xl mx-auto animate-fade-in">
        <div className="h-screen flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-t-2 border-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 pb-20 px-4 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center justify-center rounded-md w-8 h-8 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold ml-2">{card.businessName}</h1>
      </div>

      <div className="stamp-card mb-8" style={{ borderColor: card.color }}>
        <div 
          className="absolute inset-0 opacity-10" 
          style={{ backgroundColor: card.color }}
        />
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground">
                {card.currentStamps}/{card.totalStamps} stamps
              </span>
              <h2 className="text-xl font-semibold mt-2">{card.businessName}</h2>
              <p className="text-muted-foreground">{card.reward}</p>
            </div>
            <div 
              className="flex items-center justify-center w-16 h-16 rounded-full text-3xl"
              style={{ backgroundColor: card.color }}
            >
              {card.businessLogo}
            </div>
          </div>
          
          <div className="stamp-grid mb-6">
            {Array.from({ length: card.totalStamps }).map((_, index) => (
              <div 
                key={index}
                className={cn(
                  "stamp",
                  index < card.currentStamps ? "stamp-filled" : "stamp-empty"
                )}
                style={
                  index < card.currentStamps 
                    ? { backgroundColor: card.color } 
                    : {}
                }
              >
                {index < card.currentStamps && "✓"}
              </div>
            ))}
          </div>
          
          <div className="flex justify-center">
            {card.currentStamps === card.totalStamps ? (
              <button
                onClick={handleRedeemReward}
                className="inline-flex items-center px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                disabled={isRedeeming}
                style={{ 
                  backgroundColor: card.color,
                  color: "#fff"
                }}
              >
                <Gift className="w-4 h-4 mr-2" />
                {isRedeeming ? "Redeeming..." : "Redeem Reward"}
              </button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Collect {card.totalStamps - card.currentStamps} more stamp{card.totalStamps - card.currentStamps !== 1 ? "s" : ""} to earn your reward
              </p>
            )}
          </div>
        </div>
      </div>

      {/* This is just a demo control to add stamps */}
      <div className="bg-card rounded-xl border p-4 mb-6">
        <h3 className="text-sm font-medium mb-3">Demo Controls</h3>
        <button
          onClick={handleAddStamp}
          className="inline-flex items-center px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          disabled={isAddingStamp || card.currentStamps >= card.totalStamps}
        >
          {isAddingStamp ? "Adding..." : "Add a Stamp"}
        </button>
        <p className="text-xs text-muted-foreground mt-2">
          This button simulates a merchant adding a stamp to your card.
        </p>
      </div>

      {rewardCode && (
        <div className="bg-card rounded-xl border p-6 text-center mb-6 animate-scale-in">
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 text-white"
            style={{ backgroundColor: card.color }}
          >
            <Gift className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium">Congratulations!</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            You've earned: {card.reward}
          </p>
          <div className="bg-secondary p-4 rounded-md font-mono text-xl font-semibold tracking-widest mb-4">
            {rewardCode}
          </div>
          <p className="text-sm text-muted-foreground">
            Show this code to the merchant to claim your reward
          </p>
        </div>
      )}

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="border-b px-4 py-3">
          <h3 className="font-medium">Card Details</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Business</span>
            <span className="text-sm font-medium">{card.businessName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Reward</span>
            <span className="text-sm font-medium">{card.reward}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm font-medium">{card.currentStamps}/{card.totalStamps} stamps</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Created</span>
            <span className="text-sm font-medium">{new Date(card.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StampCardDetail;
