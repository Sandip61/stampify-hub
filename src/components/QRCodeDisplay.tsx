
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { generateStampQRCode } from "@/utils/stamps";
import QRCode from "qrcode.react";
import { Download, RefreshCw, Clock } from "lucide-react";

interface QRCodeDisplayProps {
  cardId: string;
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in minutes
  singleUse?: boolean;
  size?: number;
}

const QRCodeDisplay = ({ 
  cardId, 
  className = "", 
  autoRefresh = false,
  refreshInterval = 60, // 1 hour default
  singleUse = false,
  size = 200
}: QRCodeDisplayProps) => {
  const [qrValue, setQrValue] = useState<string>("");
  const [expiryTime, setExpiryTime] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");

  // Generate QR code on mount or when card ID changes
  useEffect(() => {
    generateQRCode();
    
    // Set up auto refresh if enabled
    if (autoRefresh) {
      const intervalId = setInterval(() => {
        generateQRCode();
      }, refreshInterval * 60 * 1000);
      
      return () => clearInterval(intervalId);
    }
  }, [cardId, autoRefresh, refreshInterval, singleUse]);
  
  // Update countdown timer
  useEffect(() => {
    if (!expiryTime) return;
    
    const intervalId = setInterval(() => {
      const now = new Date();
      const diff = expiryTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft("Expired");
        clearInterval(intervalId);
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${minutes}m`);
    }, 60 * 1000); // Update every minute
    
    // Initial update
    const now = new Date();
    const diff = expiryTime.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    setTimeLeft(`${hours}h ${minutes}m`);
    
    return () => clearInterval(intervalId);
  }, [expiryTime]);

  const generateQRCode = async () => {
    if (!cardId) return;
    
    setIsLoading(true);
    setIsRefreshing(true);
    
    try {
      const { qrValue, qrCode } = await generateStampQRCode(
        cardId, 
        refreshInterval / 60, // Convert minutes to hours
        singleUse
      );
      
      setQrValue(qrValue);
      setExpiryTime(new Date(qrCode.expires_at));
    } catch (error) {
      toast.error("Failed to generate QR code");
      console.error("QR code generation error:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    generateQRCode();
  };

  const handleDownload = () => {
    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `stamp-qr-code-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading && !qrValue) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 bg-card border rounded-lg shadow-sm ${className}`}>
        <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-muted-foreground">Generating QR code...</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center p-6 bg-card border rounded-lg shadow-sm ${className}`}>
      <div className="relative mb-4">
        {isRefreshing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg">
            <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin"></div>
          </div>
        )}
        
        <div className="p-4 bg-white rounded-lg">
          <QRCode
            id="qr-code-canvas"
            value={qrValue}
            size={size}
            level="H"
            includeMargin={true}
            renderAs="canvas"
          />
        </div>
      </div>
      
      {expiryTime && (
        <div className="flex items-center mb-3 text-sm text-muted-foreground">
          <Clock className="w-4 h-4 mr-1" />
          <span>Expires in {timeLeft}</span>
        </div>
      )}
      
      <div className="flex space-x-2">
        <button 
          onClick={handleRefresh} 
          className="flex items-center px-3 py-2 text-sm bg-muted rounded-md hover:bg-muted/80 transition-colors"
          disabled={isRefreshing}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
        
        <button 
          onClick={handleDownload} 
          className="flex items-center px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </button>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
