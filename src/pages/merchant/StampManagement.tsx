
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { QrCode, Send, ArrowLeft, BadgeCheck } from "lucide-react";
import { getCurrentMerchant, Merchant } from "@/utils/merchantAuth";

import QRCodeDisplay from "@/components/QRCodeDisplay";
import StampIssuer from "@/components/StampIssuer";
import RewardRedeemer from "@/components/RewardRedeemer";

// You'll need to install the qrcode.react package
// <lov-add-dependency>qrcode.react@latest</lov-add-dependency>

const StampManagement = () => {
  const { id: cardId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"qr" | "direct" | "redeem">("qr");

  useEffect(() => {
    const loadMerchantData = async () => {
      try {
        const currentMerchant = await getCurrentMerchant();
        if (!currentMerchant) {
          navigate("/merchant/login");
          return;
        }
        
        setMerchant(currentMerchant);
        
        // Load card details
        if (cardId) {
          const { data: card, error } = await getCardDetails(cardId);
          if (error || !card) {
            toast.error("Failed to load card details");
            navigate("/merchant/cards");
            return;
          }
          
          setCardDetails(card);
        } else {
          navigate("/merchant/cards");
          return;
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading merchant data:", error);
        navigate("/merchant/login");
      }
    };
    
    loadMerchantData();
  }, [cardId, navigate]);

  // This is a mock function - replace with actual API call when ready
  const getCardDetails = async (id: string) => {
    // Mock data for now - this will be replaced with a real API call
    return {
      data: {
        id,
        name: "Coffee Loyalty",
        description: "Buy 10 coffees, get 1 free",
        totalStamps: 10,
        reward: "Free Coffee",
        logo: "☕",
        color: "#8B4513",
        isActive: true,
        createdAt: new Date().toISOString()
      },
      error: null
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/merchant/cards")}
            className="mr-4 p-2 rounded-md hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{cardDetails?.name}</h1>
            <p className="text-muted-foreground">{cardDetails?.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Stamp Management</h2>
              <div className="inline-flex rounded-md shadow-sm">
                <button
                  onClick={() => setActiveTab("qr")}
                  className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                    activeTab === "qr"
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent hover:bg-muted"
                  }`}
                >
                  <QrCode className="h-4 w-4 inline mr-1" />
                  QR Code
                </button>
                <button
                  onClick={() => setActiveTab("direct")}
                  className={`px-3 py-2 text-sm font-medium ${
                    activeTab === "direct"
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent hover:bg-muted"
                  }`}
                >
                  <Send className="h-4 w-4 inline mr-1" />
                  Direct Issue
                </button>
                <button
                  onClick={() => setActiveTab("redeem")}
                  className={`px-3 py-2 text-sm font-medium rounded-r-md ${
                    activeTab === "redeem"
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent hover:bg-muted"
                  }`}
                >
                  <BadgeCheck className="h-4 w-4 inline mr-1" />
                  Redeem
                </button>
              </div>
            </div>

            {activeTab === "qr" && (
              <div className="flex flex-col items-center">
                <p className="text-center text-muted-foreground mb-4">
                  Generate a QR code that customers can scan to receive stamps.
                </p>
                <QRCodeDisplay 
                  cardId={cardId || ""} 
                  autoRefresh={true}
                  refreshInterval={60}
                  singleUse={false}
                  size={240}
                />
              </div>
            )}

            {activeTab === "direct" && (
              <div>
                <p className="text-center text-muted-foreground mb-4">
                  Issue stamps directly to customers by entering their email address.
                </p>
                <StampIssuer 
                  cardId={cardId || ""} 
                  businessName={merchant?.businessName || ""}
                />
              </div>
            )}

            {activeTab === "redeem" && (
              <div>
                <p className="text-center text-muted-foreground mb-4">
                  Redeem rewards by entering the code provided by the customer.
                </p>
                <RewardRedeemer businessName={merchant?.businessName || ""} />
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Card Details</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center mb-2">
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl"
                  style={{ backgroundColor: cardDetails?.color }}
                >
                  {cardDetails?.logo}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Reward</p>
                <p className="font-medium">{cardDetails?.reward}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Stamps Required</p>
                <p className="font-medium">{cardDetails?.totalStamps}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    cardDetails?.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {cardDetails?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {new Date(cardDetails?.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StampManagement;
