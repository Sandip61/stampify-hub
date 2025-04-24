
import React, { useState } from "react";
import { toast } from "sonner";
import { issueStampsToCustomer } from "@/utils/stamps";
import { Loader2, Badge, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StampIssuerProps {
  cardId: string;
}

const StampIssuer: React.FC<StampIssuerProps> = ({ cardId }) => {
  const [email, setEmail] = useState("");
  const [stampCount, setStampCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter a customer email");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
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
      }
      
      // Reset form on success
      setEmail("");
      setStampCount(1);
    } catch (error) {
      console.error("Error issuing stamps:", error);
      
      // Get a more specific error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to issue stamps. Please try again later.";
        
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Customer Email
          </Label>
          <Input
            id="customerEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="customer@example.com"
            className="w-full"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="stampCount" className="block text-sm font-medium text-gray-700 mb-1">
            Number of Stamps
          </Label>
          <Input
            id="stampCount"
            type="number"
            min="1"
            max="10"
            value={stampCount}
            onChange={(e) => setStampCount(Number(e.target.value))}
            className="w-full"
          />
        </div>
        
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Issuing Stamps...
            </>
          ) : (
            <>
              <Badge className="mr-2 h-4 w-4" />
              Issue Stamps
            </>
          )}
        </Button>
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
