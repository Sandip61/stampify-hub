import React, { useState } from "react";
import { toast } from "sonner";
import { issueStampsToCustomer } from "@/utils/stamps/operations";
import { Loader2, Badge, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConnectivity } from "@/hooks/useConnectivity";
import { useRole } from "@/contexts/RoleContext";
import { AppError, ErrorType } from "@/utils/errors";

interface StampIssuerProps {
  cardId: string;
}

const StampIssuer: React.FC<StampIssuerProps> = ({ cardId }) => {
  const [email, setEmail] = useState("");
  const [stampCount, setStampCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useConnectivity();
  const { activeRole } = useRole();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter a customer email");
      return;
    }

    if (!cardId) {
      toast.error("Card ID is missing. Please reload the page.");
      setError("Card ID is missing. Please reload the page.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Submitting stamp issue request for card: ${cardId}, email: ${email}, count: ${stampCount}`);
      const result = await issueStampsToCustomer({
        cardId,
        customerEmail: email,
        count: stampCount,
        method: "direct"
      }, activeRole); // Pass the active role from context
      
      console.log("Stamp issue result:", result);
      setLastResult(result);
      
      if (result.rewardEarned) {
        toast.success(`Stamp(s) issued and reward earned! Reward code: ${result.rewardCode}`);
      } else {
        toast.success(`${stampCount} stamp(s) issued successfully!`);
      }
      
      // Reset form on success
      setEmail("");
      setStampCount(1);
    } catch (error) {
      console.error("Error issuing stamps:", error);
      
      // Extract the specific error message if possible
      let errorMessage = "Failed to issue stamps. Please try again later.";
      
      if (error instanceof AppError) {
        errorMessage = error.getUserFriendlyMessage();
      } else if (error instanceof Error) {
        // Try to parse JSON error message from Edge Function if it exists
        try {
          const errorObj = JSON.parse(error.message);
          if (errorObj && errorObj.error) {
            errorMessage = errorObj.error;
          } else {
            errorMessage = error.message;
          }
        } catch {
          // If not JSON, use the error message directly
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {!isOnline && (
        <Alert variant="default" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You're offline. Stamps will be issued when you reconnect.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {!cardId && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Card ID is missing. Please reload the page or select a valid stamp card.
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
          disabled={isLoading || !cardId}
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
          {lastResult.offlineMode ? (
            <p className="text-sm text-amber-700 mt-1">
              Transaction queued for synchronization when online
            </p>
          ) : (
            <>
              <p className="text-sm text-green-700 mt-1">
                {lastResult.stampCard?.current_stamps || lastResult.cardInfo?.currentStamps} of {
                  lastResult.stampCard?.card?.total_stamps || lastResult.cardInfo?.totalStampsRequired
                } stamps collected
              </p>
              {lastResult.rewardEarned && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-green-800">Reward earned!</p>
                  <p className="text-sm text-green-700">
                    Reward: {lastResult.stampCard?.card?.reward || "Reward"}
                  </p>
                  <p className="text-sm text-green-700">
                    Code: {lastResult.rewardCode}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default StampIssuer;
