
import { useState } from "react";
import { toast } from "sonner";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { generateStampQRCode } from "@/utils/stamps";
import { AppError, ErrorType } from "@/utils/errorHandling";

interface QRCodeGeneratorProps {
  cardId: string;
  onQRCodeGenerated: () => void;
}

const QRCodeGenerator = ({ cardId, onQRCodeGenerated }: QRCodeGeneratorProps) => {
  const [qrLoading, setQrLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrCodeId, setQrCodeId] = useState<string | null>(null);
  const [qrCodeExpiry, setQrCodeExpiry] = useState<Date | null>(null);
  const [isSingleUse, setIsSingleUse] = useState(false);
  const [expiryHours, setExpiryHours] = useState(24);
  const [securityLevel, setSecurityLevel] = useState<"L" | "M" | "Q" | "H">("M");

  const generateQRCode = async () => {
    if (!cardId) return;
    
    setQrLoading(true);
    
    try {
      // Validate input
      if (expiryHours < 1 || expiryHours > 72) {
        throw new AppError(
          ErrorType.VALIDATION_ERROR,
          "Expiry hours must be between 1 and 72"
        );
      }
      
      const { qrCode, qrValue } = await generateStampQRCode(cardId, expiryHours, isSingleUse, securityLevel);
      
      setQrCodeUrl(qrValue);
      setQrCodeId(qrCode.id);
      
      // Set expiry date
      const expiryDate = new Date(qrCode.expires_at);
      setQrCodeExpiry(expiryDate);
      
      // Notify parent component to refresh QR codes list
      onQRCodeGenerated();
      
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

  const handleExpiryHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || value === '0') {
      setExpiryHours(0);
    } else {
      setExpiryHours(Number(value));
    }
  };

  const handleExpiryHoursFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '0') {
      e.target.select();
    }
  };

  return (
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
              value={expiryHours || ''}
              onChange={handleExpiryHoursChange}
              onFocus={handleExpiryHoursFocus}
              placeholder="Enter hours (1-72)"
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
              logo={undefined}
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
  );
};

export default QRCodeGenerator;
