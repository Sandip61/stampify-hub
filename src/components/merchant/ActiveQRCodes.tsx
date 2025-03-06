
import { useState, useEffect } from "react";
import { RefreshCw, AlertCircle, Trash2 } from "lucide-react";
import { fetchActiveQRCodes, deleteQRCode, QRCode } from "@/utils/stamps";
import { toast } from "sonner";

interface ActiveQRCodesProps {
  cardId: string;
  shouldRefresh: boolean;
  onRefreshComplete: () => void;
}

const ActiveQRCodes = ({ cardId, shouldRefresh, onRefreshComplete }: ActiveQRCodesProps) => {
  const [activeQRCodes, setActiveQRCodes] = useState<QRCode[]>([]);
  const [fetchingQRCodes, setFetchingQRCodes] = useState(false);

  useEffect(() => {
    if (cardId) {
      fetchQRCodes();
    }
  }, [cardId, shouldRefresh]);

  const fetchQRCodes = async () => {
    if (!cardId) return;
    
    setFetchingQRCodes(true);
    
    try {
      const qrCodes = await fetchActiveQRCodes(cardId);
      setActiveQRCodes(qrCodes);
    } catch (error) {
      console.error("Error fetching QR codes:", error);
      toast.error("Failed to load active QR codes");
    } finally {
      setFetchingQRCodes(false);
      onRefreshComplete();
    }
  };

  const handleDeleteQRCode = async (qrCodeId: string) => {
    try {
      await deleteQRCode(qrCodeId);
      
      // Refresh the list
      fetchQRCodes();
      
      toast.success("QR code deleted successfully");
    } catch (error) {
      console.error("Error deleting QR code:", error);
      toast.error("Failed to delete QR code");
    }
  };

  return (
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
  );
};

export default ActiveQRCodes;
