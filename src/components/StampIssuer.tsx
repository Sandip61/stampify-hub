
import { useState } from "react";
import { toast } from "sonner";
import { Check, ChevronDown, Search, User, Stamp } from "lucide-react";
import { issueStampsToCustomer } from "@/utils/stamps";

interface StampIssuerProps {
  cardId: string;
  businessName: string;
}

const StampIssuer = ({ cardId, businessName }: StampIssuerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [stampCount, setStampCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    customerEmail: string;
    currentStamps: number;
    totalStamps: number;
    rewardEarned: boolean;
    rewardCode?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerEmail.trim()) {
      toast.error("Please enter a customer email");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await issueStampsToCustomer({
        cardId,
        customerEmail,
        count: stampCount,
        method: "direct"
      });
      
      const result = {
        customerEmail,
        currentStamps: response.stampCard.current_stamps,
        totalStamps: response.stampCard.card.total_stamps,
        rewardEarned: response.rewardEarned,
        rewardCode: response.rewardCode || undefined
      };
      
      setLastResult(result);
      
      if (response.rewardEarned) {
        toast.success("Customer earned a reward!");
      } else {
        toast.success("Stamps added successfully!");
      }
      
      // Reset form
      setCustomerEmail("");
      setStampCount(1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to issue stamps");
      console.error("Stamp issuing error:", error);
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
        <h3 className="font-medium">Issue Stamps Directly</h3>
        <ChevronDown className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="customerEmail" className="block text-sm font-medium mb-1">
                Customer Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="pl-9 h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="stampCount" className="block text-sm font-medium mb-1">
                Number of Stamps
              </label>
              <div className="relative">
                <Stamp className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <select
                  id="stampCount"
                  value={stampCount}
                  onChange={(e) => setStampCount(Number(e.target.value))}
                  className="pl-9 h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num} stamp{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full flex justify-center items-center h-10 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></span>
                  Processing...
                </>
              ) : (
                <>Issue Stamps</>
              )}
            </button>
          </form>
          
          {lastResult && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Last Stamp Result</h4>
              <p className="text-sm mb-1">
                <span className="text-muted-foreground">Customer:</span> {lastResult.customerEmail}
              </p>
              <p className="text-sm mb-1">
                <span className="text-muted-foreground">Stamps:</span> {lastResult.currentStamps} / {lastResult.totalStamps}
              </p>
              
              {lastResult.rewardEarned && (
                <div className="mt-2 p-3 bg-green-100 text-green-800 rounded-md">
                  <div className="flex items-center mb-1">
                    <Check className="w-4 h-4 mr-1" />
                    <span className="font-medium">Reward Earned!</span>
                  </div>
                  {lastResult.rewardCode && (
                    <p className="text-sm">
                      <span className="font-medium">Code:</span> {lastResult.rewardCode}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StampIssuer;
