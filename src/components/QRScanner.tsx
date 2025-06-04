import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { processScannedQRCode } from '@/utils/stamps';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';
import { getCurrentUser } from '@/utils/auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRole } from '@/contexts/RoleContext';

interface QRScannerProps {
  onScanComplete?: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanComplete }) => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanCooldown, setScanCooldown] = useState(false);
  const mountedRef = useRef(false);
  const qrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedCodeRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number | null>(null);
  const isMobile = useIsMobile();
  const { activeRole } = useRole();
  
  const onScanSuccess = async (decodedText: string) => {
    if (!mountedRef.current || scanResult || processing || scanCooldown) return;
    
    try {
      const now = Date.now();
      const cooldownDuration = 5000;
      const sameDuplicateWindow = 10000;

      if (lastScanTimeRef.current && now - lastScanTimeRef.current < cooldownDuration) {
        console.log("Scan blocked: Still in cooldown period");
        return;
      }

      if (lastScannedCodeRef.current === decodedText && 
          lastScanTimeRef.current && 
          now - lastScanTimeRef.current < sameDuplicateWindow) {
        console.log("Scan blocked: Same QR code scanned recently");
        toast.info("Please wait before scanning again");
        return;
      }

      let payload;
      try {
        payload = JSON.parse(decodedText);
        if (payload.type !== 'stamp' || !payload.code || !payload.card_id) {
          throw new Error();
        }
      } catch {
        toast.error('Invalid QR code format. Please scan a valid stamp card QR code.');
        return;
      }

      setScanCooldown(true);
      setProcessing(true);
      setScanResult(decodedText);
      
      lastScannedCodeRef.current = decodedText;
      lastScanTimeRef.current = now;

      const user = await getCurrentUser();
      if (!user) {
        toast.error('Please log in to collect stamps');
        setProcessing(false);
        setScanResult(null);
        setScanCooldown(false);
        return;
      }

      const result = await processScannedQRCode(
        decodedText, 
        user.id, 
        user.email, 
        1,
        activeRole // Pass the active role from context
      );
      
      if (result.rewardEarned) {
        toast.success(`Congratulations! You've earned a reward: ${result.stampCard.card.reward}`);
      } else {
        toast.success(`Added stamps! Total: ${result.stampCard.current_stamps}/${result.stampCard.card.total_stamps}`);
      }

      onScanComplete?.();

      setTimeout(() => {
        setScanCooldown(false);
      }, 3000);
      
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to process QR code');
      setScanResult(null);
      setProcessing(false);
      setScanCooldown(false);
    }
  };

  const onScanFailure = (error: string) => {
    if (!error.includes('No QR code found')) {
      console.warn('QR Scan error:', error);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    const qrRegionId = 'qr-reader';
    
    const timer = setTimeout(() => {
      try {
        const element = document.getElementById(qrRegionId);
        if (element) {
          console.log("Initializing QR scanner");
          const qrCode = new Html5Qrcode(qrRegionId);
          qrCodeRef.current = qrCode;
          
          const cameraOptions = [
            { facingMode: "environment" },
            { facingMode: "user" }
          ];
          
          const scanConfig = {
            fps: 5,
            qrbox: undefined,
            aspectRatio: 1,
          };
          
          const tryCamera = async (cameraIndex = 0) => {
            if (cameraIndex >= cameraOptions.length) {
              toast.error("Failed to access camera. Please check camera permissions.");
              return;
            }
            
            try {
              console.log(`Trying camera option ${cameraIndex + 1}/${cameraOptions.length}`);
              await qrCode.start(
                cameraOptions[cameraIndex],
                scanConfig,
                onScanSuccess,
                onScanFailure
              );
              setScanning(true);
              console.log(`Camera ${cameraIndex + 1} started successfully`);
            } catch (err) {
              console.log(`Camera ${cameraIndex + 1} failed:`, err);
              tryCamera(cameraIndex + 1);
            }
          };
          
          tryCamera(0);
        } else {
          console.error("QR reader element not found in the DOM");
        }
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
    <div className="absolute inset-0 w-full h-full min-h-screen overflow-hidden bg-black">
      <div 
        id="qr-reader" 
        className="w-full h-full" 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden'
        }}
      />
      
      {processing && (
        <div className="absolute bottom-32 left-0 right-0 p-4 flex items-center justify-center text-white z-30">
          <div className="mr-2 h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
          <span>Processing stamp...</span>
        </div>
      )}

      {scanCooldown && !processing && (
        <div className="absolute bottom-32 left-0 right-0 p-4 flex items-center justify-center text-white z-30">
          <div className="bg-blue-500/80 backdrop-blur-sm px-4 py-2 rounded-lg">
            <span>Please wait before scanning again...</span>
          </div>
        </div>
      )}

      {scanResult && !processing && !scanCooldown && (
        <div className="absolute bottom-32 left-0 right-0 mx-4 p-4 bg-green-50 border-t border-green-200 flex items-start rounded-lg z-30">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-800 font-medium">QR Code Scanned!</p>
            <p className="text-sm text-green-600">Stamps have been processed</p>
          </div>
        </div>
      )}

      {!scanning && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white bg-black/70 px-4 py-2 rounded">
          Starting camera...
        </div>
      )}
    </div>
  );
};

export default QRScanner;
