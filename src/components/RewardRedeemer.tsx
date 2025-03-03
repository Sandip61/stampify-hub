
import React, { useState } from "react";
import { toast } from "sonner";
import { redeemStampReward } from "@/utils/stamps";

const RewardRedeemer: React.FC = () => {
  const [rewardCode, setRewardCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [redeemedReward, setRedeemedReward] = useState<{
    reward: string;
    customerId: string;
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
      const result = await redeemStampReward(rewardCode);
      
      setRedeemedReward({
        reward: result.reward,
        customerId: result.customerInfo.id,
        redeemedAt: result.transaction.redeemed_at,
      });
      
      toast.success("Reward redeemed successfully!");
      
      // Reset form
      setRewardCode("");
    } catch (error) {
      console.error("Error redeeming reward:", error);
      toast.error(error instanceof Error ? error.message : "Failed to redeem reward");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="rewardCode" className="block text-sm font-medium text-gray-700 mb-1">
            Reward Code
          </label>
          <input
            id="rewardCode"
            type="text"
            value={rewardCode}
            onChange={(e) => setRewardCode(e.target.value)}
            placeholder="Enter reward code"
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? "Redeeming..." : "Redeem Reward"}
        </button>
      </form>
      
      {redeemedReward && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-medium text-green-800">Reward Redeemed</h3>
          <p className="text-sm text-green-700 mt-1">
            <strong>Reward:</strong> {redeemedReward.reward}
          </p>
          <p className="text-sm text-green-700">
            <strong>Customer ID:</strong> {redeemedReward.customerId}
          </p>
          <p className="text-sm text-green-700">
            <strong>Redeemed at:</strong> {new Date(redeemedReward.redeemedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default RewardRedeemer;
