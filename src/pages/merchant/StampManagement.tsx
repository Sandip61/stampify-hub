
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import StampIssuer from "@/components/StampIssuer";
import RewardRedeemer from "@/components/RewardRedeemer";
import { 
  generateStampQRCode, 
  fetchActiveQRCodes, 
  deleteQRCode,
  type QRCode 
} from "@/utils/stamps";
import { Trash2, RefreshCw, AlertCircle } from "lucide-react";
import { AppError, ErrorType } from "@/utils/errorHandling";

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
  const [securityLevel, setSecurityLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [activeQRCodes, setActiveQRCodes] = useState<QRCode[]>([]);
  const [fetchingQRCodes, setFetchingQRCodes] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchStampCard();
      fetchQRCodes();
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

  const fetchQRCodes = async () => {
    if (!id) return;
    
    setFetchingQRCodes(true);
    
    try {
      const qrCodes = await fetchActiveQRCodes(id);
      setActiveQRCodes(qrCodes);
    } catch (error) {
      console.error("Error fetching QR codes:", error);
      toast.error("Failed to load active QR codes");
    } finally {
      setFetchingQRCodes(false);
    }
  };

  const handleDeleteQRCode = async (qrCodeId: string) => {
    try {
      await deleteQRCode(qrCodeId);
      
      // If the deleted QR code is currently displayed, clear it
      if (qrCodeId === qrCodeId) {
        setQrCodeUrl(null);
        setQrCodeId(null);
        setQrCodeExpiry(null);
      }
      
      // Refresh the list
      fetchQRCodes();
      
      toast.success("QR code deleted successfully");
    } catch (error) {
      console.error("Error deleting QR code:", error);
      toast.error("Failed to delete QR code");
    }
  };

  const generateQRCode = async () => {
    if (!id) return;
    
    setQrLoading(true);
    
    try {
      // Validate input
      if (expiryHours < 1 || expiryHours > 72) {
        throw new AppError(
          ErrorType.VALIDATION_ERROR,
          "Expiry hours must be between 1 and 72"
        );
      }
      
      const { qrCode, qrValue } = await generateStampQRCode(id, expiryHours, isSingleUse, securityLevel);
      
      setQrCodeUrl(qrValue);
      setQrCodeId(qrCode.id);
      
      // Set expiry date
      const expiryDate = new Date(qrCode.expires_at);
      setQrCodeExpiry(expiryDate);
      
      // Refresh the QR codes list
      fetchQRCodes();
      
      toast.success("QR code generated successfully");
    } catch (error) {
      console.error("Error generating QR code:", error);
      if (error instanceof AppError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to generate QR code");
      }
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
              
              <div>
                <label htmlFor="securityLevel" className="block text-sm font-medium text-gray-700 mb-1">
                  Error Correction Level
                </label>
                <select
                  id="securityLevel"
                  value={securityLevel}
                  onChange={(e) => setSecurityLevel(e.target.value as "L" | "M" | "Q" | "H")}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="L">Low (7% damage recovery)</option>
                  <option value="M">Medium (15% damage recovery)</option>
                  <option value="Q">Quartile (25% damage recovery)</option>
                  <option value="H">High (30% damage recovery)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Higher levels make QR codes more robust but also more dense
                </p>
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
                  <QRCodeDisplay 
                    value={qrCodeUrl} 
                    size={220}
                    level={securityLevel}
                    logo={stampCard.business_logo.startsWith('http') ? stampCard.business_logo : undefined}
                    borderSize={12}
                  />
                  
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500">
                      {isSingleUse ? "This QR code can only be used once." : "This QR code can be used multiple times."}
                    </p>
                    {qrCodeExpiry && (
                      <p className="text-sm text-gray-500 mt-1">
                        Expires: {qrCodeExpiry.toLocaleString()}
                      </p>
                    )}
                    <p className="text-sm font-medium mt-2">
                      Security level: {securityLevel === "L" ? "Low" : securityLevel === "M" ? "Medium" : securityLevel === "Q" ? "Quartile" : "High"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6 border rounded-lg bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Active QR Codes</h2>
              <button 
                onClick={fetchQRCodes}
                disabled={fetchingQRCodes}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <RefreshCw className="mr-1 h-4 w-4" />
                Refresh
              </button>
            </div>
            
            {fetchingQRCodes ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin h-6 w-6 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            ) : activeQRCodes.length > 0 ? (
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
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeQRCodes.map((qrCode) => {
                      const createdAt = new Date(qrCode.created_at);
                      const expiresAt = new Date(qrCode.expires_at);
                      const isExpiringSoon = expiresAt.getTime() - Date.now() < 1000 * 60 * 60; // Less than 1 hour
                      
                      return (
                        <tr key={qrCode.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {createdAt.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm ${isExpiringSoon ? 'text-amber-600 font-medium flex items-center' : 'text-gray-500'}`}>
                              {isExpiringSoon && <AlertCircle className="h-4 w-4 mr-1" />}
                              {expiresAt.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {qrCode.is_single_use ? "Single use" : "Multi use"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleDeleteQRCode(qrCode.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 border-2 border-dashed rounded-lg">
                <p className="text-gray-500">No active QR codes</p>
                <p className="text-sm text-gray-400 mt-1">Generate a new QR code above</p>
              </div>
            )}
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
