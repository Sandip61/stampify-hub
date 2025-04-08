
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
    const qrCode = new Html5Qrcode(qrRegionId);
    qrCodeRef.current = qrCode;
    
    // Add a small delay to ensure the DOM element is fully mounted
    const timer = setTimeout(() => {
      // Get the container dimensions
      const container = document.getElementById(qrRegionId);
      if (!container) return;
      
      qrCode.start(
        { facingMode: { exact: 'environment' } },
        {
          fps: 10,
          qrbox: 250,
          aspectRatio: 1.0
        },
        onScanSuccess,
        onScanFailure
      ).catch(err => {
        console.error('Camera start failed:', err);
        toast.error('Failed to access camera');
      });
    }, 300);

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
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Single full-screen video feed */}
      <div id="qr-reader" className="absolute inset-0 w-full h-full" />

      {/* Processing indicator */}
      {processing && (
        <div className="absolute bottom-24 left-0 right-0 p-4 flex items-center justify-center text-white z-30">
          <div className="mr-2 h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
          <span>Processing stamp...</span>
        </div>
      )}

      {/* Success message */}
      {scanResult && !processing && (
        <div className="absolute bottom-24 left-0 right-0 p-4 bg-green-50 mx-4 border-t border-green-200 flex items-start rounded-lg z-30">
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
