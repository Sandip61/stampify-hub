
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StampIssuer from "@/components/StampIssuer";
import RewardRedeemer from "@/components/RewardRedeemer";
import { AppError } from "@/utils/errorHandling";
import { StampCard } from "@/types/StampCard";
import StampCardHeader from "@/components/merchant/StampCardHeader";
import QRCodeGenerator from "@/components/merchant/QRCodeGenerator";
import ActiveQRCodes from "@/components/merchant/ActiveQRCodes";
import { getMerchantStampCard } from "@/utils/merchantData";

const StampManagement = () => {
  const { id } = useParams<{ id: string }>();
  const [stampCard, setStampCard] = useState<StampCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshQRCodes, setRefreshQRCodes] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchStampCard();
    }
  }, [id]);

  const fetchStampCard = async () => {
    if (!id) return;
    
    try {
      // First, check if this is a mock data ID (starts with "card-")
      if (id.startsWith('card-')) {
        console.log("Fetching mock stamp card data for ID:", id);
        const mockCard = getMerchantStampCard(id);
        
        if (mockCard) {
          // Convert mock card to StampCard format
          setStampCard({
            id: mockCard.id,
            name: mockCard.name,
            description: mockCard.description,
            total_stamps: mockCard.totalStamps,
            reward: mockCard.reward,
            business_logo: mockCard.logo,
            business_color: mockCard.color
          });
          setLoading(false);
          return;
        }
      }
      
      // If not a mock card or mock card not found, try Supabase
      console.log("Fetching stamp card from Supabase for ID:", id);
      const { data, error } = await supabase
        .from("stamp_cards")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching stamp card:", error);
        toast.error("Error loading stamp card");
        setLoading(false);
        return;
      }

      setStampCard(data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong");
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
        <p className="mt-2 text-gray-600">The stamp card you're looking for does not exist or you don't have permission to view it.</p>
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
