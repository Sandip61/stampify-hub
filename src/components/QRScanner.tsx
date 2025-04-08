
import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { processScannedQRCode } from '@/utils/stamps';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';
import { getCurrentUser } from '@/utils/auth';

interface QRScannerProps {
  onScanComplete?: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanComplete }) => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const mountedRef = useRef(false);
  const qrCodeRef = useRef<Html5Qrcode | null>(null);

  const onScanSuccess = async (decodedText: string) => {
    if (!mountedRef.current || scanResult) return;
    setScanResult(decodedText);
    setProcessing(true);

    try {
      // Validate QR format
      let payload;
      try {
        payload = JSON.parse(decodedText);
        if (payload.type !== 'stamp' || !payload.code || !payload.card_id) {
          throw new Error();
        }
      } catch {
        throw new Error('Invalid QR code format. Please scan a valid stamp card QR code.');
      }

      const user = await getCurrentUser();
      if (!user) {
        toast.error('Please log in to collect stamps');
        setScanResult(null);
        return;
      }

      const result = await processScannedQRCode(decodedText, user.id);
      if (result.rewardEarned) {
        toast.success(`Congratulations! You've earned a reward: ${result.stampCard.card.reward}`);
      } else {
        toast.success(`Added ${result.stampCard.current_stamps} stamps!`);
      }

      onScanComplete?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to process QR code');
      setScanResult(null);
    } finally {
      setProcessing(false);
    }
  };

  const onScanFailure = (error: string) => {
    // Only log unexpected errors
    if (!error.includes('No QR code found')) {
      console.warn('QR Scan error:', error);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    const qrRegionId = 'qr-reader';
    
    // Add a small delay to ensure the DOM element is fully mounted
    const timer = setTimeout(() => {
      try {
        const qrCode = new Html5Qrcode(qrRegionId);
        qrCodeRef.current = qrCode;
        
        // Start scanning with more flexible configuration
        const startScanning = async () => {
          try {
            console.log("Starting QR scanner with environment camera");
            await qrCode.start(
              { facingMode: "environment" },
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: window.innerWidth / window.innerHeight,
              },
              onScanSuccess,
              onScanFailure
            );
          } catch (err) {
            console.log("Trying with user camera instead:", err);
            try {
              await qrCode.start(
                { facingMode: "user" },
                {
                  fps: 10,
                  qrbox: { width: 250, height: 250 },
                  aspectRatio: window.innerWidth / window.innerHeight,
                },
                onScanSuccess,
                onScanFailure
              );
            } catch (err2) {
              console.error("Both camera options failed:", err2);
              toast.error("Failed to access camera. Please check camera permissions.");
            }
          }
        };
        
        startScanning();
      } catch (error) {
        console.error("Error setting up QR scanner:", error);
        toast.error("Failed to initialize camera. Please try again.");
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      mountedRef.current = false;
      if (qrCodeRef.current) {
        qrCodeRef.current
          .stop()
          .catch(e => console.warn('Failed to stop QR scanner:', e));
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 bg-black w-full h-full overflow-hidden">
      {/* Single QR reader container - this contains the camera feed */}
      <div id="qr-reader" className="w-full h-full" />
      
      {/* Scan overlay with corner markers */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-64 h-64 border-0">
          {/* Corner markers only */}
          <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white"></div>
          <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white"></div>
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white"></div>
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white"></div>
        </div>
      </div>

      {/* Processing indicator */}
      {processing && (
        <div className="absolute bottom-32 left-0 right-0 p-4 flex items-center justify-center text-white z-30">
          <div className="mr-2 h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
          <span>Processing stamp...</span>
        </div>
      )}

      {/* Success message */}
      {scanResult && !processing && (
        <div className="absolute bottom-32 left-0 right-0 mx-4 p-4 bg-green-50 border-t border-green-200 flex items-start rounded-lg z-30">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-800 font-medium">QR Code Scanned!</p>
            <p className="text-sm text-green-600">Processing your stamps...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
