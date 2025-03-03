
import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Gift, Check } from "lucide-react";
import { redeemStampReward } from "@/utils/stamps";

interface RewardRedeemerProps {
  businessName: string;
}

const RewardRedeemer = ({ businessName }: RewardRedeemerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rewardCode, setRewardCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    rewardCode: string;
    reward: string;
    redeemedAt: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rewardCode.trim()) {
      toast.error("Please enter a reward code");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await redeemStampReward(rewardCode);
      
      const result = {
        rewardCode,
        reward: response.reward,
        redeemedAt: response.transaction.redeemed_at
      };
      
      setLastResult(result);
      toast.success("Reward redeemed successfully!");
      
      // Reset form
      setRewardCode("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to redeem reward");
      console.error("Reward redemption error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
      <div 
        className="p-4 flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-medium">Redeem Customer Rewards</h3>
        <ChevronDown className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="rewardCode" className="block text-sm font-medium mb-1">
                Reward Code
              </label>
              <div className="relative">
                <Gift className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  id="rewardCode"
                  type="text"
                  value={rewardCode}
                  onChange={(e) => setRewardCode(e.target.value.toUpperCase())}
                  placeholder="Enter code (e.g., ABC123)"
                  className="pl-9 h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  pattern="[A-Z0-9]{6}"
                  maxLength={6}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Enter the 6-character code provided by the customer
              </p>
            </div>
            
            <button
              type="submit"
              className="w-full flex justify-center items-center h-10 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></span>
                  Processing...
                </>
              ) : (
                <>Redeem Reward</>
              )}
            </button>
          </form>
          
          {lastResult && (
            <div className="mt-4 p-4 bg-green-100 rounded-lg">
              <div className="flex items-center mb-2">
                <Check className="w-5 h-5 mr-2 text-green-600" />
                <h4 className="font-medium text-green-800">Reward Redeemed!</h4>
              </div>
              
              <p className="text-sm text-green-800 mb-1">
                <span className="font-medium">Code:</span> {lastResult.rewardCode}
              </p>
              <p className="text-sm text-green-800 mb-1">
                <span className="font-medium">Reward:</span> {lastResult.reward}
              </p>
              <p className="text-sm text-green-800">
                <span className="font-medium">Redeemed at:</span> {new Date(lastResult.redeemedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RewardRedeemer;
