
import React, { useState } from "react";
import { toast } from "sonner";
import { redeemStampReward } from "@/utils/stamps";
import { CheckCircle, AlertTriangle, Copy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const RewardRedeemer: React.FC = () => {
  const [rewardCode, setRewardCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState<"input" | "verifying" | "success" | "error">("input");
  const [redeemedReward, setRedeemedReward] = useState<{
    reward: string;
    customerId: string;
    redeemedAt: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rewardCode.trim()) {
      toast.error("Please enter a reward code");
      return;
    }
    
    setIsLoading(true);
    setVerificationStep("verifying");
    
    try {
      const result = await redeemStampReward(rewardCode);
      
      setRedeemedReward({
        reward: result.reward,
        customerId: result.customerInfo.id,
        redeemedAt: result.transaction.redeemed_at,
      });
      
      setVerificationStep("success");
      toast.success("Reward redeemed successfully!");
      
      // Reset form
      setRewardCode("");
    } catch (error) {
      console.error("Error redeeming reward:", error);
      setVerificationStep("error");
      const errorMsg = error instanceof Error ? error.message : "Failed to redeem reward";
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success("Copied to clipboard"))
      .catch(() => toast.error("Failed to copy"));
  };

  const resetForm = () => {
    setRewardCode("");
    setVerificationStep("input");
    setRedeemedReward(null);
    setErrorMessage("");
  };

  return (
    <div className="space-y-6">
      {verificationStep === "input" && (
        <Card className="p-6 border rounded-lg">
          <h3 className="text-lg font-medium mb-4">Redeem Customer Reward</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="rewardCode" className="block text-sm font-medium mb-1">
                Reward Code
              </label>
              <div className="flex space-x-2">
                <Input
                  id="rewardCode"
                  value={rewardCode}
                  onChange={(e) => setRewardCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit code (e.g. ABC123)"
                  className="font-mono uppercase"
                  required
                  autoComplete="off"
                  maxLength={6}
                />
                <Button type="submit" disabled={isLoading || rewardCode.length < 6}>
                  Verify
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Enter the 6-digit code shown by the customer
              </p>
            </div>
          </form>
        </Card>
      )}
      
      {verificationStep === "verifying" && (
        <Card className="p-6 border rounded-lg">
          <div className="text-center py-8">
            <div className="inline-block mb-4">
              <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
            </div>
            <h3 className="text-lg font-medium mb-2">Verifying Code</h3>
            <p className="text-muted-foreground">Please wait while we verify the reward code...</p>
          </div>
        </Card>
      )}
      
      {verificationStep === "error" && (
        <Card className="p-6 border rounded-lg border-red-200 bg-red-50">
          <div className="text-center py-6">
            <div className="inline-block mb-4 text-red-500">
              <AlertTriangle size={48} />
            </div>
            <h3 className="text-lg font-medium mb-2 text-red-700">Verification Failed</h3>
            <p className="text-red-600 mb-6">{errorMessage}</p>
            <Button variant="outline" onClick={resetForm}>
              Try Again
            </Button>
          </div>
        </Card>
      )}
      
      {verificationStep === "success" && redeemedReward && (
        <Card className="p-6 border rounded-lg border-green-200 bg-green-50">
          <div className="text-center py-4">
            <div className="inline-block mb-4 text-green-500">
              <CheckCircle size={48} />
            </div>
            <h3 className="text-lg font-medium mb-2 text-green-700">Reward Verified!</h3>
            <div className="bg-white p-4 rounded-md mb-4 text-left">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Reward:</p>
                  <p className="text-lg">{redeemedReward.reward}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(redeemedReward.reward)}
                  title="Copy reward details"
                >
                  <Copy size={16} />
                </Button>
              </div>
              <div className="mt-2 pt-2 border-t text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Clock size={14} className="mr-1" />
                  <span>Redeemed at: {new Date(redeemedReward.redeemedAt).toLocaleString()}</span>
                </div>
                <p className="mt-1">
                  Customer ID: {redeemedReward.customerId.substring(0, 8)}...
                </p>
              </div>
            </div>
            <div className="flex space-x-2 justify-center">
              <Button variant="outline" onClick={resetForm}>
                Redeem Another
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default RewardRedeemer;
