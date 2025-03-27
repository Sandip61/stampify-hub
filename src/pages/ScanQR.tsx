
import React, { useState } from 'react';
import QRScanner from '@/components/QRScanner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';

const ScanQR = () => {
  const navigate = useNavigate();
  const [scanComplete, setScanComplete] = useState(false);

  const handleScanComplete = () => {
    setScanComplete(true);
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
            {!scanComplete ? (
              <QRScanner onScanComplete={handleScanComplete} />
            ) : (
              <div className="bg-green-50 p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-green-800 mb-2">Scan Complete!</h2>
                <p className="text-green-600">Your stamps have been collected</p>
              </div>
            )}
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
