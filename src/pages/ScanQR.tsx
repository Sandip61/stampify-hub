
import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';
import { processScannedQRCode } from '@/utils/stamps';
import { getCurrentUser } from '@/utils/auth';
import QRScanner from '@/components/QRScanner';
import MainLayout from '@/layouts/MainLayout';

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

  console.log("ScanQR render, scanComplete:", scanComplete);

  return (
    <MainLayout hideNav={true}>
      <div className="relative min-h-screen bg-black flex flex-col">
        {/* Back button */}
        <div className="absolute top-6 left-6 z-20">
          <Button variant="ghost" onClick={handleBack} className="text-white hover:bg-black/20">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </div>

        {/* Instruction text */}
        <div className="absolute top-6 left-0 right-0 z-20 text-center">
          <p className="text-white font-medium">Point camera at QR code</p>
        </div>

        {/* Hidden container for file upload */}
        <div id="qr-reader-file" className="hidden"></div>

        {/* Camera view with QR scanner */}
        <div className="flex-1 w-full flex items-center justify-center relative">
          {!scanComplete ? (
            <>
              <div className="absolute inset-0 z-10">
                <QRScanner onScanComplete={handleScanComplete} />
              </div>
              
              {/* Scan area overlay with just the corners - fixed size */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-15">
                <div className="relative w-64 h-64">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white"></div>
                </div>
              </div>

              {/* Upload Image button at the bottom */}
              <div className="absolute bottom-12 w-full flex flex-col items-center z-20">
                <Button onClick={triggerFileUpload} className="flex items-center gap-2 bg-white hover:bg-white/90 text-black px-6 py-6 rounded-full shadow">
                  <Upload className="h-5 w-5" />
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
            </>
          ) : (
            <div className="bg-green-50 p-10 flex flex-col items-center justify-center text-center rounded-lg m-4">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-2">Success!</h3>
              <p className="text-green-600">Your stamps have been collected</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ScanQR;
