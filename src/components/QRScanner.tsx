
import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
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
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    
    // Clean up any existing HTML before creating scanner
    const qrReaderElement = document.getElementById("qr-reader");
    if (qrReaderElement) {
      qrReaderElement.innerHTML = "";
    }
    
    // Create and initialize scanner
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1,
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
      },
      /* start scanning right away */ false // Initialize but don't start scanning yet
    );

    // Define scan success handler
    const onScanSuccess = async (decodedText: string) => {
      if (!mountedRef.current) return;
      
      if (scannerRef.current) {
        scannerRef.current.pause(true);
      }
      
      setScanResult(decodedText);

      try {
        setProcessing(true);
        const user = await getCurrentUser();
        
        if (!user) {
          toast.error("Please log in to collect stamps");
          return;
        }

        const result = await processScannedQRCode(decodedText, user.id);
        
        if (result.rewardEarned) {
          toast.success(`Congratulations! You've earned a reward: ${result.stampCard.card.reward}`);
        } else {
          toast.success(`Added ${result.stampCard.current_stamps} stamps!`);
        }
        
        if (onScanComplete && mountedRef.current) {
          onScanComplete();
        }
      } catch (error) {
        console.error("Error processing QR code:", error);
        if (mountedRef.current) {
          toast.error(error instanceof Error ? error.message : "Failed to process QR code");
          
          // Reset scanner after error to allow another attempt
          if (scannerRef.current) {
            scannerRef.current.resume();
          }
        }
      } finally {
        if (mountedRef.current) {
          setProcessing(false);
        }
      }
    };

    // Define scan failure handler
    const onScanFailure = (error: string) => {
      // Only log the error without showing an error message to the user
      console.warn("QR Scan error:", error);
    };

    // Start the scanner with a slight delay to ensure the DOM is fully rendered
    const timeoutId = setTimeout(() => {
      if (mountedRef.current && scannerRef.current) {
        scannerRef.current.render(onScanSuccess, onScanFailure);
        // Force start scanning after render
        const startScanningButton = document.getElementById("html5-qrcode-button-camera-start");
        if (startScanningButton) {
          (startScanningButton as HTMLButtonElement).click();
        }
      }
    }, 300);

    // Cleanup function to run when component unmounts or re-renders
    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutId);
      
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (error) {
          console.warn("Error clearing scanner:", error);
        }
      }
    };
  }, [onScanComplete]); // Only re-initialize when onScanComplete changes

  return (
    <div className="w-full bg-white">
      <div id="qr-reader" className="w-full"></div>
      
      {processing && (
        <div className="p-4 flex items-center justify-center text-teal-600">
          <div className="mr-2 h-5 w-5 rounded-full border-2 border-teal-600 border-t-transparent animate-spin"></div>
          <span>Processing stamp...</span>
        </div>
      )}
      
      {scanResult && !processing && (
        <div className="p-4 bg-green-50 border-t border-green-200 flex items-start">
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
