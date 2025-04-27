
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StampIssuer from "@/components/StampIssuer";
import RewardRedeemer from "@/components/RewardRedeemer";
import { StampCard } from "@/types/StampCard";
import StampCardHeader from "@/components/merchant/StampCardHeader";
import QRCodeGenerator from "@/components/merchant/QRCodeGenerator";
import ActiveQRCodes from "@/components/merchant/ActiveQRCodes";
import { getMerchantStampCard } from "@/utils/merchantData";
import { handleError } from "@/utils/errors";
import { ErrorType } from "@/utils/errors";

const StampManagement = () => {
  const { id } = useParams<{ id: string }>();
  const [stampCard, setStampCard] = useState<StampCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshQRCodes, setRefreshQRCodes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (id) {
      fetchStampCard();
    } else {
      setError("No stamp card ID provided");
      setLoading(false);
    }
  }, [id]);

  const fetchStampCard = async () => {
    if (!id) {
      setError("No stamp card ID provided");
      setLoading(false);
      return;
    }
    
    try {
      console.log("Fetching stamp card with ID:", id);
      const card = await getMerchantStampCard(id);
      
      if (!card) {
        toast.error("Stamp card not found");
        setError("Stamp card not found");
        setLoading(false);
        return;
      }

      console.log("Retrieved stamp card:", card);
      const convertedStampCard: StampCard = {
        id: card.id,
        name: card.name,
        description: card.description,
        total_stamps: card.totalStamps,
        reward: card.reward,
        business_logo: card.logo,
        business_color: card.color
      };

      setStampCard(convertedStampCard);
      setError(null);
    } catch (error) {
      console.error("Error fetching stamp card:", error);
      const appError = handleError(error, ErrorType.RESOURCE_NOT_FOUND, "Error loading stamp card");
      setError(appError.getUserFriendlyMessage());
    } finally {
      setLoading(false);
    }
  };

  const handleQRCodeGenerated = () => {
    setRefreshQRCodes(true);
  };

  const handleRefreshComplete = () => {
    setRefreshQRCodes(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!stampCard) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-red-600">Stamp card not found</h2>
        <p className="mt-2 text-gray-600">
          {error || "The stamp card you're looking for does not exist or you don't have permission to view it."}
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Card ID requested: {id || "No ID provided"}
        </p>
      </div>
    );
  }

  return (
    <div>
      <StampCardHeader stampCardName={stampCard.name} />

      <Tabs defaultValue="issue">
        <TabsList className="mb-4">
          <TabsTrigger value="issue">Issue Stamps</TabsTrigger>
          <TabsTrigger value="qr">QR Codes</TabsTrigger>
          <TabsTrigger value="redeem">Redeem Rewards</TabsTrigger>
        </TabsList>
        
        <TabsContent value="issue" className="space-y-4">
          <div className="p-6 border rounded-lg bg-white shadow-sm">
            <h2 className="text-lg font-medium mb-4">Issue Stamps Directly</h2>
            <StampIssuer cardId={stampCard.id} />
          </div>
        </TabsContent>
        
        <TabsContent value="qr" className="space-y-4">
          <QRCodeGenerator 
            cardId={stampCard.id} 
            onQRCodeGenerated={handleQRCodeGenerated} 
          />
          
          <ActiveQRCodes 
            cardId={stampCard.id} 
            shouldRefresh={refreshQRCodes} 
            onRefreshComplete={handleRefreshComplete} 
          />
        </TabsContent>
        
        <TabsContent value="redeem" className="space-y-4">
          <div className="p-6 border rounded-lg bg-white shadow-sm">
            <h2 className="text-lg font-medium mb-4">Redeem Rewards</h2>
            <RewardRedeemer />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StampManagement;
