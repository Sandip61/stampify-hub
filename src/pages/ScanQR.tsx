
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
    <div className="animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center mb-6 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </button>

      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
            <Camera className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Scan QR Code</h1>
          <p className="text-muted-foreground">
            Point your camera at a merchant's QR code to collect stamps
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
              <ScanLine className="w-64 h-64 text-primary/20 animate-pulse" />
            </div>
          )}
          
          <QRScanner onScanComplete={handleScanComplete} />
          
          <div className="p-4 bg-gray-50 border-t border-gray-100">
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
  );
};

export default ScanQR;
