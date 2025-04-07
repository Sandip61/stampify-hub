
import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(false);

  const onScanSuccess = async (decodedText: string) => {
    if (!mountedRef.current || scanResult) return;
    
    console.log("QR code scanned successfully:", decodedText);
    setScanResult(decodedText);
    
    try {
      setProcessing(true);
      
      try {
        const parsedData = JSON.parse(decodedText);
        if (!parsedData.type || parsedData.type !== 'stamp' || !parsedData.code || !parsedData.card_id) {
          throw new Error("Invalid QR code format. This QR code is not a valid stamp card QR code.");
        }
      } catch (parseError) {
        console.error("QR code format validation error:", parseError);
        toast.error("Invalid QR code format. Please scan a valid stamp card QR code.");
        setScanResult(null);
        setProcessing(false);
        return;
      }
      
      const user = await getCurrentUser();
      
      if (!user) {
        toast.error("Please log in to collect stamps");
        setProcessing(false);
        setScanResult(null);
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
        setScanResult(null);
      }
    } finally {
      if (mountedRef.current) {
        setProcessing(false);
      }
    }
  };

  const onScanFailure = (error: string) => {
    // Don't log every frame failure as it's too noisy
    if (error && !error.includes("No QR code found")) {
      console.warn("QR Scan error:", error);
    }
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
      
      // Explicitly request permissions first
      const permissionResult = await navigator.permissions.query({ name: 'camera' as PermissionName });
      if (permissionResult.state === 'denied') {
        setPermissionError(true);
        toast.error("Camera access denied. Please allow camera permissions and try again.");
        return;
      }
      
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
              
              // Initialize the QR scanner using the direct approach with Html5Qrcode
              if (html5QrCodeRef.current) {
                try {
                  html5QrCodeRef.current.stop();
                } catch (e) {
                  console.warn("Error stopping existing scanner:", e);
                }
              }
              
              const qrCodeId = "qr-reader-direct";
              const qrContainer = document.getElementById(qrCodeId);
              
              if (!qrContainer) {
                console.error("QR code container not found!");
                return;
              }
              
              try {
                html5QrCodeRef.current = new Html5Qrcode(qrCodeId);
                
                html5QrCodeRef.current.start(
                  { facingMode: "environment" },
                  {
                    fps: 10,
                    qrbox: 250, // Using a fixed size of 250px for the QR scanning box
                    aspectRatio: 1.0,
                    disableFlip: false,
                  },
                  onScanSuccess,
                  onScanFailure
                ).catch(err => {
                  console.error("Failed to start QR scanner:", err);
                  toast.error("Failed to initialize QR scanner");
                });
                
                console.log("QR scanner started successfully");
              } catch (error) {
                console.error("Error initializing direct QR scanner:", error);
                toast.error("Failed to initialize QR scanner");
              }
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
      setPermissionError(true);
      toast.error("Camera access failed. Please check your browser permissions.");
    }
  };

  const retryInitialization = () => {
    setPermissionError(false);
    setScanResult(null);
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
      
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop();
        } catch (error) {
          console.warn("Error stopping QR scanner:", error);
        }
      }
    };
  }, []);

  return (
    <div className="w-full h-full fixed inset-0 bg-black z-0">
      <div id="direct-camera-feed" className="absolute inset-0 w-full h-full z-0"></div>
      <div id="qr-reader-direct" className="absolute inset-0 w-full h-full z-10"></div>
      
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
