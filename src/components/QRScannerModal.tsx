
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  const [mode, setMode] = useState<'live' | 'file'>('live');
  const [scanComplete, setScanComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setMode('live');
      setScanComplete(false);
    }
  }, [open]);

  const handleScanComplete = useCallback(() => {
    setScanComplete(true);
    // Close the dialog after a short delay
    setTimeout(() => {
      onOpenChange(false);
      setScanComplete(false);
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
          .catch((err) => {
            toast.error("Unable to read QR code from image");
            console.error("QR code scan error:", err);
          });
        
        // Always clear the html5QrCode instance
        html5QrCode.clear();
      } catch (error) {
        toast.error("Error scanning QR code from file");
        console.error("File processing error:", error);
      }
    };
    
    fileReader.readAsDataURL(files[0]);
    
    // Clear the input value to allow selecting the same file again
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
          <DialogDescription className="text-muted-foreground mb-6">
            Scan a merchant's QR code to collect stamps
          </DialogDescription>
          
          {!scanComplete ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Button 
                  variant={mode === 'live' ? "default" : "outline"} 
                  size="lg"
                  onClick={() => setMode('live')}
                  className="h-auto py-6 px-4 flex flex-col items-center gap-3 transition-all"
                >
                  <Camera className="h-10 w-10" />
                  <span className="font-medium">Use Camera</span>
                </Button>
                <Button 
                  variant={mode === 'file' ? "default" : "outline"} 
                  size="lg"
                  onClick={() => setMode('file')}
                  className="h-auto py-6 px-4 flex flex-col items-center gap-3 transition-all"
                >
                  <Upload className="h-10 w-10" />
                  <span className="font-medium">Upload Image</span>
                </Button>
              </div>
              
              {mode === 'live' ? (
                <div className="mt-4 rounded-lg overflow-hidden">
                  <QRScanner onScanComplete={handleScanComplete} />
                </div>
              ) : (
                <div className="mt-4 p-10 flex flex-col items-center justify-center bg-gray-50 rounded-lg">
                  <button 
                    onClick={triggerFileUpload}
                    className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mb-6 hover:bg-teal-200 transition-colors cursor-pointer"
                    aria-label="Upload image file"
                  >
                    <Upload className="h-10 w-10 text-teal-600" />
                  </button>
                  <h3 className="text-lg font-medium mb-2">Upload Image</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Select an image containing a QR code
                  </p>
                  <div id="qr-reader-file" style={{ display: 'none' }}></div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    aria-hidden="true"
                  />
                </div>
              )}
            </>
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
