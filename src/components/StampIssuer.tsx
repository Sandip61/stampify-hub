
import React, { useState } from "react";
import { toast } from "sonner";
import { issueStampsToCustomer } from "@/utils/stamps";

interface StampIssuerProps {
  cardId: string;
}

const StampIssuer: React.FC<StampIssuerProps> = ({ cardId }) => {
  const [email, setEmail] = useState("");
  const [stampCount, setStampCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter a customer email");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await issueStampsToCustomer({
        cardId,
        customerEmail: email,
        count: stampCount,
        method: "direct"
      });
      
      setLastResult(result);
      
      if (result.rewardEarned) {
        toast.success(`Stamp(s) issued and reward earned! Reward code: ${result.rewardCode}`);
      } else {
        toast.success(`${stampCount} stamp(s) issued successfully!`);
      }
      
      // Reset form
      setEmail("");
      setStampCount(1);
    } catch (error) {
      console.error("Error issuing stamps:", error);
      toast.error(error instanceof Error ? error.message : "Failed to issue stamps");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Customer Email
          </label>
          <input
            id="customerEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="customer@example.com"
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        
        <div>
          <label htmlFor="stampCount" className="block text-sm font-medium text-gray-700 mb-1">
            Number of Stamps
          </label>
          <input
            id="stampCount"
            type="number"
            min="1"
            max="10"
            value={stampCount}
            onChange={(e) => setStampCount(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? "Issuing Stamps..." : "Issue Stamps"}
        </button>
      </form>
      
      {lastResult && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-medium text-green-800">Last Transaction</h3>
          <p className="text-sm text-green-700 mt-1">
            {lastResult.stampCard.current_stamps} of {lastResult.stampCard.card.total_stamps} stamps collected
          </p>
          {lastResult.rewardEarned && (
            <div className="mt-2">
              <p className="text-sm font-medium text-green-800">Reward earned!</p>
              <p className="text-sm text-green-700">
                Reward: {lastResult.stampCard.card.reward}
              </p>
              <p className="text-sm text-green-700">
                Code: {lastResult.rewardCode}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StampIssuer;
