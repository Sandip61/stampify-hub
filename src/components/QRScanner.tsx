
import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
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

  // Function to handle successful QR code scan
  const onScanSuccess = async (decodedText: string) => {
    if (!mountedRef.current) return;
    
    if (scannerRef.current) {
      scannerRef.current.pause(true);
    }
    
    setScanResult(decodedText);
    console.log("QR code scanned successfully:", decodedText);

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

  // Function to handle scanning failures
  const onScanFailure = (error: string) => {
    // Only log the error without showing an error message to the user
    console.warn("QR Scan error:", error);
  };

  // Initialize and clean up scanner
  useEffect(() => {
    console.log("QRScanner useEffect: Initializing scanner");
    mountedRef.current = true;
    
    // Give browser time to initialize camera permissions properly
    const initializeScanner = setTimeout(() => {
      // Clean up any existing HTML before creating scanner
      const qrReaderElement = document.getElementById("qr-reader");
      if (qrReaderElement) {
        qrReaderElement.innerHTML = "";
        console.log("Cleared qr-reader element");
      } else {
        console.warn("qr-reader element not found in the DOM");
      }
      
      // Create scanner configuration
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1,
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        formatsToSupport: [Html5Qrcode.FORMATS.QR_CODE],
      };
      
      try {
        // Create and initialize scanner
        console.log("Creating new Html5QrcodeScanner instance");
        scannerRef.current = new Html5QrcodeScanner("qr-reader", config, /* verbose */ true);
        
        // Directly render the scanner with our callbacks
        if (scannerRef.current) {
          console.log("QRScanner: Rendering scanner with callbacks");
          scannerRef.current.render(onScanSuccess, onScanFailure);
          console.log("Scanner render method called successfully");
          
          // Attempt to force camera selection if possible
          setTimeout(() => {
            try {
              // Try to click the start button if it exists (backup method)
              const startButton = document.getElementById("html5-qrcode-button-camera-start");
              if (startButton) {
                console.log("Found start button, clicking it as backup method");
                (startButton as HTMLButtonElement).click();
              }
            } catch (err) {
              console.warn("Could not find or click camera start button:", err);
            }
          }, 500);
        }
      } catch (error) {
        console.error("Error initializing QR scanner:", error);
        toast.error("Failed to initialize camera scanner");
      }
    }, 300); // Short delay to ensure DOM is ready

    // Cleanup function
    return () => {
      console.log("QRScanner useEffect: Cleaning up scanner");
      clearTimeout(initializeScanner);
      mountedRef.current = false;
      
      if (scannerRef.current) {
        try {
          console.log("Attempting to clear scanner");
          scannerRef.current.clear();
          console.log("QRScanner: Scanner cleared successfully");
        } catch (error) {
          console.warn("Error clearing scanner:", error);
        }
      }
    };
  }, []); // We only want to initialize once on mount

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
