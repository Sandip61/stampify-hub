
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import StampIssuer from "@/components/StampIssuer";
import RewardRedeemer from "@/components/RewardRedeemer";
import { generateStampQRCode } from "@/utils/stamps";

interface StampCard {
  id: string;
  name: string;
  description: string;
  total_stamps: number;
  reward: string;
  business_logo: string;
  business_color: string;
}

const StampManagement = () => {
  const { id } = useParams<{ id: string }>();
  const [stampCard, setStampCard] = useState<StampCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrCodeId, setQrCodeId] = useState<string | null>(null);
  const [qrCodeExpiry, setQrCodeExpiry] = useState<Date | null>(null);
  const [isSingleUse, setIsSingleUse] = useState(false);
  const [expiryHours, setExpiryHours] = useState(24);

  useEffect(() => {
    if (id) {
      fetchStampCard();
    }
  }, [id]);

  const fetchStampCard = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from("stamp_cards")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching stamp card:", error);
        toast.error("Error loading stamp card");
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

  const generateQRCode = async () => {
    if (!id) return;
    
    setQrLoading(true);
    
    try {
      const { qrCode, qrValue } = await generateStampQRCode(id, expiryHours, isSingleUse);
      
      setQrCodeUrl(qrValue);
      setQrCodeId(qrCode.id);
      
      // Set expiry date
      const expiryDate = new Date(qrCode.expires_at);
      setQrCodeExpiry(expiryDate);
      
      toast.success("QR code generated successfully");
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Failed to generate QR code");
    } finally {
      setQrLoading(false);
    }
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Manage {stampCard.name}</h1>
        <p className="text-gray-500 mt-1">Issue stamps, generate QR codes, and redeem rewards</p>
      </div>

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
          <div className="p-6 border rounded-lg bg-white shadow-sm">
            <h2 className="text-lg font-medium mb-4">Generate QR Code</h2>
            
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expiryHours" className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Time (hours)
                  </label>
                  <input
                    id="expiryHours"
                    type="number"
                    min="1"
                    max="72"
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    id="singleUse"
                    type="checkbox"
                    checked={isSingleUse}
                    onChange={(e) => setIsSingleUse(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="singleUse" className="ml-2 text-sm text-gray-700">
                    Single use only
                  </label>
                </div>
              </div>
              
              <button
                onClick={generateQRCode}
                disabled={qrLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {qrLoading ? "Generating..." : "Generate QR Code"}
              </button>
            </div>
            
            {qrCodeUrl && (
              <div className="mt-6 p-4 border rounded-md bg-gray-50">
                <div className="flex flex-col items-center">
                  <QRCodeDisplay value={qrCodeUrl} size={200} />
                  
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500">
                      {isSingleUse ? "This QR code can only be used once." : "This QR code can be used multiple times."}
                    </p>
                    {qrCodeExpiry && (
                      <p className="text-sm text-gray-500 mt-1">
                        Expires: {qrCodeExpiry.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6 border rounded-lg bg-white shadow-sm">
            <h2 className="text-lg font-medium mb-4">Active QR Codes</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200" id="qrCodesTable">
                  {/* Active QR codes will be listed here */}
                </tbody>
              </table>
            </div>
          </div>
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
