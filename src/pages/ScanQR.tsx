
import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';
import { processScannedQRCode } from '@/utils/stamps';
import { getCurrentUser } from '@/utils/auth';
import QRScanner from '@/components/QRScanner';

const ScanQR = () => {
  const navigate = useNavigate();
  const [scanComplete, setScanComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScanComplete = useCallback(() => {
    console.log("Scan complete callback triggered");
    setScanComplete(true);
    setTimeout(() => {
      navigate('/');
    }, 2000);
  }, [navigate]);

  const handleBack = () => {
    navigate(-1);
  };

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
            console.log("Processing QR code from file:", decodedText);
            const result = await processScannedQRCode(decodedText, user.id);
            
            if (result.rewardEarned) {
              toast.success(`Congratulations! You've earned a reward: ${result.stampCard.card.reward}`);
            } else {
              toast.success(`Added ${result.stampCard.current_stamps} stamps!`);
            }
            
            handleScanComplete();
          } catch (error) {
            console.error("Error processing QR code from file:", error);
            toast.error(error instanceof Error ? error.message : "Failed to process QR code");
          }
        };

        await html5QrCode.scanFile(files[0], true)
          .then(qrCodeSuccessCallback)
          .catch((error) => {
            console.error("Error scanning QR code from file:", error);
            toast.error("Unable to read QR code from image");
          });
        
        html5QrCode.clear();
      } catch (error) {
        console.error("Error in file upload handler:", error);
        toast.error("Error scanning QR code from file");
      }
    };
    
    fileReader.readAsDataURL(files[0]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full min-h-screen bg-black">
      <div id="qr-reader-file" className="hidden"></div>
      
      {/* Enhanced back button with background and shadow */}
      <button
        onClick={handleBack}
        className="absolute top-4 left-4 z-50 w-14 h-14 rounded-full bg-black/30 backdrop-blur-sm border border-teal-400/30 shadow-[0_0_15px_rgba(20,184,166,0.5)] flex items-center justify-center cursor-pointer hover:bg-black/40 active:bg-black/50 focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all duration-200"
        aria-label="Go back"
        type="button"
      >
        <ArrowLeft className="h-8 w-8 text-teal-300 pointer-events-none" />
      </button>

      <div className="absolute top-6 left-0 right-0 z-50 text-center">
        <p className="text-teal-400 font-medium py-1 px-4 inline-block">
          Point camera at QR code
        </p>
      </div>

      {!scanComplete ? (
        <div className="absolute inset-0 w-full h-full">
          <QRScanner onScanComplete={handleScanComplete} />
        </div>
      ) : (
        <div className="fixed inset-0 flex items-center justify-center bg-black">
          <div className="bg-green-50 p-10 flex flex-col items-center justify-center text-center rounded-lg m-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">Success!</h3>
            <p className="text-green-600">Your stamps have been collected</p>
          </div>
        </div>
      )}
      
      <div className="absolute top-[38%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 z-40">
        <div className="absolute top-0 left-0 w-10 h-10 border-l-4 border-t-4 border-teal-400 rounded-tl-lg"></div>
        <div className="absolute top-0 right-0 w-10 h-10 border-r-4 border-t-4 border-amber-400 rounded-tr-lg"></div>
        <div className="absolute bottom-0 left-0 w-10 h-10 border-l-4 border-b-4 border-amber-400 rounded-bl-lg"></div>
        <div className="absolute bottom-0 right-0 w-10 h-10 border-r-4 border-b-4 border-teal-400 rounded-br-lg"></div>
      </div>
      
      <div className="absolute top-3/4 left-0 right-0 flex justify-center z-50">
        <Button 
          onClick={triggerFileUpload} 
          className="flex items-center gap-2 bg-gradient-to-r from-teal-400 to-amber-400 hover:from-teal-500 hover:to-amber-500 text-black px-6 py-6 rounded-full shadow-lg"
        >
          <Upload className="h-5 w-5 text-black" />
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
    </div>
  );
};

export default ScanQR;
