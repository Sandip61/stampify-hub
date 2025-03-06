
import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { processScannedQRCode } from '@/utils/stamps';
import { toast } from 'sonner';
import { Camera, ScanLine, XCircle, CheckCircle } from 'lucide-react';
import { getCurrentUser } from '@/utils/auth';

interface QRScannerProps {
  onScanComplete?: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanComplete }) => {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    const initializeScanner = () => {
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        false
      );

      scanner.render(onScanSuccess, onScanFailure);
      setScanning(true);
    };

    const onScanSuccess = async (decodedText: string) => {
      setScanning(false);
      setScanResult(decodedText);
      scanner?.clear();

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
        
        onScanComplete?.();
      } catch (error) {
        console.error("Error processing QR code:", error);
        toast.error(error instanceof Error ? error.message : "Failed to process QR code");
      } finally {
        setProcessing(false);
      }
    };

    const onScanFailure = (error: string) => {
      console.warn("QR Scan error:", error);
    };

    initializeScanner();

    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [onScanComplete]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Scan QR Code
          </h3>
        </div>

        <div className="p-4">
          <div id="qr-reader" className="w-full"></div>
          
          {processing && (
            <div className="mt-4 flex items-center justify-center text-blue-600">
              <ScanLine className="w-5 h-5 animate-spin mr-2" />
              <span>Processing stamp...</span>
            </div>
          )}
          
          {scanResult && !processing && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-800 font-medium">QR Code Scanned!</p>
                <p className="text-sm text-green-600">Processing your stamps...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
