
import React, { useState } from 'react';
import QRScanner from '@/components/QRScanner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, ScanLine } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';

const ScanQR = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(true);

  const handleScanComplete = () => {
    setIsScanning(false);
    // Navigate to home after successful scan
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  return (
    <MainLayout hideNav={true}>
      <div className="min-h-screen flex flex-col animate-fade-in px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center mb-8 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </button>

        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-amber-100 border border-teal-200 mb-4">
              <Camera className="h-8 w-8 text-teal-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-teal-600 to-amber-600 bg-clip-text text-transparent">Scan QR Code</h1>
            <p className="text-muted-foreground">
              Point your camera at a merchant's QR code to collect stamps
            </p>
          </div>
          
          <div className="relative w-full rounded-xl overflow-hidden shadow-lg border border-teal-100">
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                <div className="w-64 h-64 rounded-lg border-2 border-teal-400 border-dashed"></div>
                <ScanLine className="absolute w-64 h-1 bg-teal-500/50 text-teal-600 animate-pulse" />
              </div>
            )}
            
            <QRScanner onScanComplete={handleScanComplete} />
            
            <div className="p-4 bg-gradient-to-r from-teal-50 to-amber-50 border-t border-teal-100">
              <p className="text-sm text-center text-muted-foreground">
                Make sure the QR code is within the camera frame
              </p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Having trouble? Ask the merchant to help position the QR code
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ScanQR;
