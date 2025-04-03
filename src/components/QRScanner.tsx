
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
      if (!mountedRef.current) return;

      try {
        // Clear the qr-reader element first
        const qrReaderElement = document.getElementById("qr-reader");
        if (qrReaderElement) {
          qrReaderElement.innerHTML = "";
        }
        
        // Configure the scanner
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
          rememberLastUsedCamera: true,
          videoConstraints: {
            facingMode: { exact: "environment" }
          },
          showTorchButtonIfSupported: false,
          formatsToSupport: [0], // QR code only
        };
        
        // Create and render the scanner
        scannerRef.current = new Html5QrcodeScanner("qr-reader", config, /* verbose */ false);
        
        if (scannerRef.current && mountedRef.current) {
          scannerRef.current.render(onScanSuccess, onScanFailure);
          
          // Apply custom styling after a short delay
          setTimeout(() => {
            if (!mountedRef.current) return;
            
            try {
              // Add custom styles to clean up the scanner UI
              const style = document.createElement('style');
              style.textContent = `
                /* Hide scanner UI elements we don't want */
                #html5-qrcode-anchor-scan-type-change,
                #html5-qrcode-button-camera-permission,
                #html5-qrcode-button-camera-stop,
                #html5-qrcode-anchor-scan-type-change,
                .html5-qrcode-element:not(#html5-qrcode-camera-start),
                #html5-qrcode-select-camera,
                #html5-qrcode-button-torch,
                #html5-qrcode-button-flash,
                #html5-qrcode-torch-button,
                #html5-qrcode-zoom-slider,
                #html5-qrcode-button-file-selection,
                .html5-qrcode-header,
                #qr-reader__dashboard_section_csr,
                #qr-reader__dashboard_section_swaplink,
                #qr-reader__dashboard_section_fsr,
                #qr-reader__status_span,
                #qr-reader__dashboard_section {
                  display: none !important;
                }
                
                /* Clean up the scanner container */
                #qr-reader {
                  border: none !important;
                  padding: 0 !important;
                  box-shadow: none !important;
                  background: transparent !important;
                  margin: 0 !important;
                  width: 100% !important;
                  height: 100% !important;
                }
                
                #qr-reader__scan_region {
                  padding: 0 !important;
                  background: transparent !important;
                }
                
                #qr-reader__scan_region img {
                  display: none !important;
                }
                
                /* Style the video element */
                video {
                  width: 100% !important;
                  height: 100vh !important;
                  object-fit: cover !important;
                  position: absolute !important;
                  top: 0 !important;
                  left: 0 !important;
                  z-index: 0 !important;
                }
                
                /* Remove any horizontal/vertical lines */
                #qr-shaded-region {
                  display: none !important;
                }
                
                .code-finder-row, .code-finder-column {
                  display: none !important;
                }
              `;
              document.head.appendChild(style);
              
              // Auto-click the camera start button to begin scanning
              const startButton = document.getElementById("html5-qrcode-button-camera-start");
              if (startButton) {
                (startButton as HTMLButtonElement).click();
              }
            } catch (err) {
              console.warn("Could not apply custom styling or start camera:", err);
            }
          }, 300);
        }
      } catch (error) {
        console.error("Error initializing QR scanner:", error);
        toast.error("Failed to initialize camera scanner");
      }
    }, 300);

    // Cleanup function
    return () => {
      clearTimeout(initializeScanner);
      mountedRef.current = false;
      
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (error) {
          console.warn("Error clearing scanner:", error);
        }
      }
    };
  }, []);

  return (
    <div className="w-full h-full">
      {/* The scanner element */}
      <div id="qr-reader" className="w-full h-full absolute inset-0"></div>
      
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
