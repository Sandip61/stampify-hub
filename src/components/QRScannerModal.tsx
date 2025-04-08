
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';
import { processScannedQRCode } from '@/utils/stamps';
import { getCurrentUser } from '@/utils/auth';
import QRScanner from '@/components/QRScanner';

interface QRScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ open, onOpenChange }) => {
  const [scanComplete, setScanComplete] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (open) {
      setScanComplete(false);
      setIsScanning(false);
    }
  }, [open]);

  const handleScanComplete = useCallback(() => {
    setScanComplete(true);
    setTimeout(() => {
      onOpenChange(false);
      setScanComplete(false);
      setIsScanning(false);
    }, 2000);
  }, [onOpenChange]);

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileReader = new FileReader();
    fileReader.onload = async () => {
      try {
        const html5QrCode = new Html5Qrcode("qr-reader-file");
        const user = await getCurrentUser();
        
        if (!user) {
          toast.error("Please log in to collect stamps");
          return;
        }

        const qrCodeSuccessCallback = async (decodedText: string) => {
          try {
            try {
              const parsedData = JSON.parse(decodedText);
              if (!parsedData.type || parsedData.type !== 'stamp' || !parsedData.code || !parsedData.card_id) {
                throw new Error("Invalid QR code format. This QR code is not a valid stamp card QR code.");
              }
            } catch (parseError) {
              console.error("QR code format validation error:", parseError);
              toast.error("Invalid QR code format. Please scan a valid stamp card QR code.");
              return;
            }
            
            const result = await processScannedQRCode(decodedText, user.id);
            
            if (result.rewardEarned) {
              toast.success(`Congratulations! You've earned a reward: ${result.stampCard.card.reward}`);
            } else {
              toast.success(`Added ${result.stampCard.current_stamps} stamps!`);
            }
            
            handleScanComplete();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to process QR code");
          }
        };

        await html5QrCode.scanFile(files[0], true)
          .then(qrCodeSuccessCallback)
          .catch(() => toast.error("Unable to read QR code from image"));
        
        html5QrCode.clear();
      } catch (error) {
        toast.error("Error scanning QR code from file");
      }
    };
    
    fileReader.readAsDataURL(files[0]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto p-0 overflow-hidden rounded-lg">
        <div className="bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-teal-600 to-amber-600 bg-clip-text text-transparent">
              Scan QR Code
            </DialogTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {!scanComplete && !isScanning ? (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Button 
                variant="default"
                size="lg"
                onClick={() => setIsScanning(true)}
                className="h-auto py-6 px-4 flex flex-col items-center gap-3 transition-all"
              >
                <Camera className="h-10 w-10" />
                <span className="font-medium">Use Camera</span>
              </Button>
              <Button 
                variant="default"
                size="lg"
                onClick={triggerFileUpload}
                className="h-auto py-6 px-4 flex flex-col items-center gap-3 transition-all"
              >
                <Upload className="h-10 w-10" />
                <span className="font-medium">Upload Image</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          ) : isScanning ? (
            <div className="relative w-full h-64 flex items-center justify-center bg-black overflow-hidden">
              <QRScanner onScanComplete={handleScanComplete} />
              {/* Standard-sized scanning frame with fixed dimensions */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-4 border-transparent w-48 h-48 relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 p-10 flex flex-col items-center justify-center text-center rounded-lg">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-2">Success!</h3>
              <p className="text-green-600">Your stamps have been collected</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRScannerModal;
