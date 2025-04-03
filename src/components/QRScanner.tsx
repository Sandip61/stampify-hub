import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { processScannedQRCode } from '@/utils/stamps';
import { toast } from 'sonner';
import { CheckCircle, Camera } from 'lucide-react';
import { getCurrentUser } from '@/utils/auth';
import { Button } from '@/components/ui/button';

interface QRScannerProps {
  onScanComplete?: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanComplete }) => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const mountedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const onScanSuccess = async (decodedText: string) => {
    if (!mountedRef.current) return;
    
    if (scannerRef.current) {
      scannerRef.current.pause(true);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
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

  const initializeDirectCamera = async () => {
    try {
      console.log("Attempting direct camera initialization...");
      
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      const constraints = { 
        video: { 
          facingMode: { ideal: "environment" },
          width: { ideal: window.innerWidth },
          height: { ideal: window.innerHeight }
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (!videoRef.current) {
        const videoContainer = document.getElementById('direct-camera-feed');
        if (videoContainer) {
          videoContainer.innerHTML = '';
          const video = document.createElement('video');
          video.id = 'qr-video';
          video.className = 'w-full h-full object-cover';
          video.playsInline = true;
          video.autoplay = true;
          video.muted = true;
          videoContainer.appendChild(video);
          videoRef.current = video;
        }
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
            .then(() => {
              console.log("Camera started successfully");
              setCameraInitialized(true);
              
              try {
                scannerRef.current.clear();
              } catch (e) {
                console.warn("Error clearing existing scanner:", e);
              }
              
              const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                videoConstraints: constraints.video,
                formatsToSupport: [0], // QR code only
              };
              
              scannerRef.current = new Html5QrcodeScanner("qr-reader", config, false);
              scannerRef.current.render(onScanSuccess, onScanFailure);
              
              setTimeout(applyCustomStyling, 300);
            })
            .catch(err => {
              console.error("Error playing video:", err);
              setPermissionError(true);
              toast.error("Could not start camera. Please try again.");
            });
        };
      }
    } catch (error) {
      console.error("Error with direct camera access:", error);
      initializeScannerLibrary();
    }
  };

  const initializeScannerLibrary = async () => {
    try {
      console.log("Falling back to scanner library...");
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        rememberLastUsedCamera: true,
        videoConstraints: {
          facingMode: { exact: "environment" }
        },
        formatsToSupport: [0], // QR code only
      };
      
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {
          console.warn("Error clearing existing scanner:", e);
        }
      }
      
      const qrReaderElement = document.getElementById("qr-reader");
      if (qrReaderElement) {
        qrReaderElement.innerHTML = "";
        
        scannerRef.current = new Html5QrcodeScanner("qr-reader", config, false);
        scannerRef.current.render(onScanSuccess, onScanFailure);
        
        setTimeout(applyCustomStyling, 300);
      }
    } catch (error) {
      console.error("Error initializing scanner library:", error);
      setPermissionError(true);
      toast.error("Camera access denied. Please allow camera permissions and try again.");
    }
  };

  const applyCustomStyling = () => {
    if (!mountedRef.current) return;
    
    try {
      const existingStyle = document.getElementById("qr-scanner-styles");
      if (existingStyle) {
        existingStyle.remove();
      }
      
      const style = document.createElement('style');
      style.id = "qr-scanner-styles";
      style.textContent = `
        #html5-qrcode-anchor-scan-type-change,
        #html5-qrcode-button-camera-permission,
        #html5-qrcode-button-camera-stop,
        #html5-qrcode-anchor-scan-type-change,
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
        
        #qr-reader {
          border: none !important;
          padding: 0 !important;
          box-shadow: none !important;
          background: transparent !important;
          margin: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          height: 100% !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
        }
        
        #qr-reader__scan_region {
          padding: 0 !important;
          margin: 0 !important;
          background: transparent !important;
          border: none !important;
        }
        
        #qr-reader__scan_region img {
          display: none !important;
        }
        
        video {
          width: 100vw !important;
          height: 100vh !important;
          object-fit: cover !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          display: block !important;
          z-index: 1 !important;
          background-color: #000 !important;
        }
        
        #qr-shaded-region {
          display: none !important;
        }
        
        .code-finder-row, .code-finder-column {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
      
      const startButton = document.getElementById("html5-qrcode-button-camera-start");
      if (startButton) {
        (startButton as HTMLButtonElement).click();
        console.log("Camera start button clicked automatically");
      }
    } catch (err) {
      console.warn("Could not apply custom styling or start camera:", err);
    }
  };

  const retryInitialization = () => {
    setPermissionError(false);
    toast.info("Trying to initialize camera...");
    initializeDirectCamera();
  };

  useEffect(() => {
    console.log("QRScanner useEffect: Initializing scanner");
    mountedRef.current = true;
    
    const timer = setTimeout(() => {
      initializeDirectCamera();
    }, 500);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
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
    <div className="w-full h-full fixed inset-0 bg-black z-0">
      <div id="direct-camera-feed" className="absolute inset-0 w-full h-full z-0"></div>
      <div id="qr-reader" className="absolute inset-0 w-full h-full z-1"></div>
      
      {permissionError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
          <div className="bg-white p-4 rounded-lg max-w-xs text-center">
            <p className="text-red-600 font-medium mb-3">Camera access denied</p>
            <p className="text-gray-700 mb-4">Please allow camera permissions in your browser settings and try again.</p>
            <Button 
              className="bg-blue-500 text-white"
              onClick={retryInitialization}
            >
              <Camera className="h-4 w-4 mr-2" />
              Retry Camera
            </Button>
          </div>
        </div>
      )}
      
      {processing && (
        <div className="absolute bottom-24 left-0 right-0 p-4 flex items-center justify-center text-white z-30">
          <div className="mr-2 h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
          <span>Processing stamp...</span>
        </div>
      )}
      
      {scanResult && !processing && (
        <div className="absolute bottom-24 left-0 right-0 p-4 bg-green-50 mx-4 border-t border-green-200 flex items-start rounded-lg z-30">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-800 font-medium">QR Code Scanned!</p>
            <p className="text-sm text-green-600">Processing your stamps...</p>
          </div>
        </div>
      )}
      
      {!cameraInitialized && !permissionError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <div className="text-center text-white">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-white border-t-transparent animate-spin"></div>
            <p className="text-xl font-medium">Initializing camera...</p>
            <p className="text-sm opacity-80 mt-2">Please wait or grant permission if prompted</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
