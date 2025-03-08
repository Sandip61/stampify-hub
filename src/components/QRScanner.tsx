
import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    const initializeScanner = () => {
      // Clean up any existing HTML (to prevent duplicates)
      const qrReaderElement = document.getElementById("qr-reader");
      if (qrReaderElement) {
        qrReaderElement.innerHTML = "";
      }
      
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
          rememberLastUsedCamera: true,
        },
        false
      );

      scanner.render(onScanSuccess, onScanFailure);
    };

    const onScanSuccess = async (decodedText: string) => {
      if (scanner) {
        scanner.clear();
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
        
        if (onScanComplete) {
          onScanComplete();
        }
      } catch (error) {
        console.error("Error processing QR code:", error);
        toast.error(error instanceof Error ? error.message : "Failed to process QR code");
      } finally {
        setProcessing(false);
      }
    };

    const onScanFailure = (error: string) => {
      // Only log the error without showing an error message to the user
      console.warn("QR Scan error:", error);
    };

    // Initialize scanner after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      initializeScanner();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (scanner) {
        scanner.clear();
      }
    };
  }, [onScanComplete]);

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
