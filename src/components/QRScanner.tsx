
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

  const onScanFailure = (error: string) => {
    console.warn("QR Scan error:", error);
  };

  useEffect(() => {
    console.log("QRScanner useEffect: Initializing scanner");
    mountedRef.current = true;
    
    const initializeScanner = setTimeout(() => {
      const qrReaderElement = document.getElementById("qr-reader");
      if (qrReaderElement) {
        qrReaderElement.innerHTML = "";
        console.log("Cleared qr-reader element");
      } else {
        console.warn("qr-reader element not found in the DOM");
      }
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1,
        rememberLastUsedCamera: true,
        // Always use back camera
        videoConstraints: {
          facingMode: { exact: "environment" }
        },
        // Hide all UI controls
        showTorchButtonIfSupported: false,
        showZoomSliderIfSupported: false,
        formatsToSupport: [0],
        showCameraSelectButton: false,
        helpButtonText: "",
      };
      
      try {
        console.log("Creating new Html5QrcodeScanner instance");
        scannerRef.current = new Html5QrcodeScanner("qr-reader", config, /* verbose */ true);
        
        if (scannerRef.current) {
          console.log("QRScanner: Rendering scanner with callbacks");
          scannerRef.current.render(onScanSuccess, onScanFailure);
          console.log("Scanner render method called successfully");
          
          // Apply custom CSS to hide all unwanted scanner UI elements
          setTimeout(() => {
            try {
              const style = document.createElement('style');
              style.textContent = `
                /* Hide all scanner UI elements except the video stream */
                #html5-qrcode-anchor-scan-type-change,
                #html5-qrcode-button-camera-permission,
                #html5-qrcode-button-camera-stop,
                #html5-qrcode-anchor-scan-type-change,
                .html5-qrcode-element:not(#html5-qrcode-camera-start),
                #html5-qrcode-select-camera,
                #html5-qrcode-button-torch,
                #html5-qrcode-button-flash,
                #html5-qrcode-torch-button,
                #html5-qrcode-zoom-slider {
                  display: none !important;
                }
                
                /* Clean up the scanner container */
                .html5-qrcode-header {
                  display: none !important;
                }
                
                #qr-reader {
                  border: none !important;
                  padding: 0 !important;
                  box-shadow: none !important;
                  background: #fff !important;
                }
                
                #qr-reader__dashboard_section_csr {
                  display: none !important;
                }
                
                #qr-reader__dashboard_section_swaplink {
                  display: none !important;
                }
                
                #qr-reader__dashboard_section_fsr {
                  display: none !important;
                }
                
                #qr-reader__scan_region {
                  padding: 0 !important;
                }
                
                #qr-reader__scan_region img {
                  display: none !important;
                }
                
                /* Make the video fill the container nicely */
                video {
                  width: 100% !important;
                  height: auto !important;
                  border-radius: 0 !important;
                }
              `;
              document.head.appendChild(style);
              
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
    }, 300);

    return () => {
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
  }, []);

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
