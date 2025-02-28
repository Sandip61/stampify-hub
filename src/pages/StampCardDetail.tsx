
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getCurrentUser, User } from "@/utils/auth";
import { getStampCard, addStamp, redeemReward, StampCard as StampCardType, Transaction } from "@/utils/data";
import StampCard from "@/components/StampCard";
import { ArrowLeft, Clock, Gift, Award, Badge, BadgeCheck } from "lucide-react";

const StampCardDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [card, setCard] = useState<StampCardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingStamp, setAddingStamp] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [rewardCode, setRewardCode] = useState<string | null>(null);
  const [rewardTransaction, setRewardTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!id) {
          navigate("/");
          return;
        }
        
        // Check user authentication
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          navigate("/login");
          return;
        }
        
        setUser(currentUser);
        
        // Load card details
        const cardDetails = await getStampCard(id);
        if (!cardDetails) {
          toast.error("Stamp card not found");
          navigate("/");
          return;
        }
        
        setCard(cardDetails);
        setLoading(false);
      } catch (error) {
        console.error("Error loading card details:", error);
        toast.error("Failed to load card details");
        navigate("/");
      }
    };
    
    loadData();
  }, [id, navigate]);

  const handleAddStamp = async () => {
    if (!card) return;
    
    setAddingStamp(true);
    
    try {
      const updatedCard = await addStamp(card.id);
      setCard(updatedCard);
      toast.success("Stamp added successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add stamp");
    } finally {
      setAddingStamp(false);
    }
  };

  const handleRedeemReward = async () => {
    if (!card) return;
    
    // Check if enough stamps
    if (card.currentStamps < card.totalStamps) {
      toast.error(`You need ${card.totalStamps - card.currentStamps} more stamps to redeem this reward`);
      return;
    }
    
    setRedeeming(true);
    
    try {
      const { card: updatedCard, code, transaction } = await redeemReward(card.id);
      setCard(updatedCard);
      setRewardCode(code);
      setRewardTransaction(transaction);
      toast.success("Reward redeemed successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to redeem reward");
    } finally {
      setRedeeming(false);
    }
  };

  const closeRewardModal = () => {
    setRewardCode(null);
    setRewardTransaction(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="w-12 h-12 rounded-full border-t-2 border-primary animate-spin" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-4">Card not found</h1>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-primary hover:underline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 pb-20 px-4">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center mb-6 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </button>

        <StampCard
          businessName={card.businessName}
          businessLogo={card.businessLogo}
          currentStamps={card.currentStamps}
          totalStamps={card.totalStamps}
          color={card.color}
          size="large"
        />

        <div className="bg-card rounded-xl border p-5 mt-6">
          <h3 className="text-lg font-medium mb-4">{card.businessName}</h3>
          
          <div className="flex items-center text-muted-foreground mb-6">
            <Clock className="h-4 w-4 mr-1" />
            <span className="text-sm">
              Since {new Date(card.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          <div className="flex items-start mb-6">
            <div className="rounded-full bg-primary/10 p-2 mr-3 text-primary">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium">Reward</h4>
              <p className="text-sm text-muted-foreground">{card.reward}</p>
            </div>
          </div>
          
          <div className="flex items-start mb-8">
            <div className="rounded-full bg-primary/10 p-2 mr-3 text-primary">
              <Badge className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium">Progress</h4>
              <p className="text-sm text-muted-foreground">
                {card.currentStamps} of {card.totalStamps} stamps collected
              </p>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div
                  className="bg-primary rounded-full h-2"
                  style={{ width: `${(card.currentStamps / card.totalStamps) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleAddStamp}
              className="flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              disabled={addingStamp}
            >
              {addingStamp ? (
                <span className="inline-block w-5 h-5 border-t-2 border-primary-foreground rounded-full animate-spin mr-2"></span>
              ) : (
                <Badge className="mr-2 h-4 w-4" />
              )}
              Add Stamp
            </button>
            
            <button
              onClick={handleRedeemReward}
              className={`flex items-center justify-center px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:hover:bg-green-500`}
              disabled={card.currentStamps < card.totalStamps || redeeming}
            >
              {redeeming ? (
                <span className="inline-block w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></span>
              ) : (
                <Gift className="mr-2 h-4 w-4" />
              )}
              Redeem Reward
            </button>
          </div>
        </div>
        
        {/* Reward redeemed modal */}
        {rewardCode && (
          <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 z-50">
            <div className="bg-card rounded-xl border p-6 max-w-md w-full">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-green-500/10 p-4 text-green-500">
                  <BadgeCheck className="h-10 w-10" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-center mb-2">Reward Redeemed!</h3>
              <p className="text-center text-muted-foreground mb-6">
                Show this code to the staff to claim your reward
              </p>
              
              <div className="bg-muted p-4 rounded-md text-center mb-6">
                <span className="text-2xl font-mono font-bold tracking-widest">
                  {rewardCode}
                </span>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-md mb-6">
                <h4 className="font-medium mb-2">{card.businessName}</h4>
                <p className="text-sm text-muted-foreground">
                  {card.reward}
                </p>
                {rewardTransaction && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Redeemed on {new Date(rewardTransaction.timestamp).toLocaleDateString()} at {" "}
                    {new Date(rewardTransaction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
              
              <button
                onClick={closeRewardModal}
                className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StampCardDetail;
