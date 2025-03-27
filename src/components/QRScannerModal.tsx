import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X } from 'lucide-react';
import QRScanner from '@/components/QRScanner';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';
import { processScannedQRCode } from '@/utils/stamps';
import { getCurrentUser } from '@/utils/auth';

interface QRScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ open, onOpenChange }) => {
  const [mode, setMode] = useState<'live' | 'file'>('live');
  const [scanComplete, setScanComplete] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Use proper key management for forcing re-renders
  const [scannerKey, setScannerKey] = useState(0);
  const [showScanner, setShowScanner] = useState(true);

  // Reset state when modal opens
  useEffect(() => {
    console.log("Modal open state changed:", open);
    if (open) {
      // Reset to live mode when modal opens
      setMode('live');
      setScanComplete(false);
      setScannerKey(prev => prev + 1);
      setShowScanner(true);
      
      // Request camera permissions when the modal opens
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: "environment" } } })
          .then(stream => {
            console.log("Camera permission granted");
            // Stop the stream immediately, we just needed the permission
            stream.getTracks().forEach(track => track.stop());
          })
          .catch(err => {
            console.error("Camera permission error:", err);
            toast.error("Camera access denied. Please allow camera access to scan QR codes.");
          });
      }
    }
  }, [open]);

  // Memoized mode change handler to prevent unnecessary re-renders
  const handleModeChange = useCallback((newMode: 'live' | 'file') => {
    console.log("Changing mode to:", newMode, "Button clicked!");
    setMode(newMode);
    
    if (newMode === 'file') {
      setShowScanner(false);
    } else {
      // For live mode, increment the key to force complete re-initialization
      setScannerKey(prev => prev + 1);
      setShowScanner(true);
      console.log("Scanner key updated to:", scannerKey + 1, "showScanner set to true");
    }
  }, [scannerKey]);

  const handleScanComplete = useCallback(() => {
    console.log("Scan complete");
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
        <div className="p-6 bg-gradient-to-r from-teal-50 to-amber-50">
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-teal-600 to-amber-600 bg-clip-text text-transparent">
              Scan QR Code
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
          <DialogDescription className="text-muted-foreground mb-6">
            Scan a merchant's QR code to collect stamps
          </DialogDescription>
          
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant={mode === 'live' ? "default" : "outline"} 
              size="lg"
              onClick={() => handleModeChange('live')}
              className="h-auto py-4 px-4 flex flex-col items-center gap-2 transition-all"
            >
              <Camera className="h-8 w-8" />
              <span>Use Camera</span>
            </Button>
            <Button 
              variant={mode === 'file' ? "default" : "outline"} 
              size="lg"
              onClick={() => handleModeChange('file')}
              className="h-auto py-4 px-4 flex flex-col items-center gap-2 transition-all"
            >
              <Upload className="h-8 w-8" />
              <span>Upload Image</span>
            </Button>
          </div>
        </div>
        
        <div className="bg-white">
          {mode === 'live' && showScanner && !scanComplete && (
            <QRScanner key={scannerKey} onScanComplete={handleScanComplete} />
          )}
          
          {mode === 'file' && (
            <div className="p-10 flex flex-col items-center justify-center">
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
          
          {scanComplete && (
            <div className="bg-green-50 p-10 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
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
