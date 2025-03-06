
import React from 'react';
import QRScanner from '@/components/QRScanner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ScanQR = () => {
  const navigate = useNavigate();

  const handleScanComplete = () => {
    // Navigate to home after successful scan
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center mb-6 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </button>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Scan QR Code</h1>
        <p className="text-muted-foreground mb-8">
          Point your camera at a merchant's QR code to collect stamps
        </p>
        
        <QRScanner onScanComplete={handleScanComplete} />
      </div>
    </div>
  );
};

export default ScanQR;
