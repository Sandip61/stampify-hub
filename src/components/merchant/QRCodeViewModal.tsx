
import { useState } from "react";
import { Download, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { QRCode } from "@/utils/stamps";
import jsPDF from 'jspdf';

interface QRCodeViewModalProps {
  qrCode: QRCode | null;
  isOpen: boolean;
  onClose: () => void;
  businessName?: string;
  cardName?: string;
}

const QRCodeViewModal = ({ qrCode, isOpen, onClose, businessName, cardName }: QRCodeViewModalProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!qrCode) return null;

  // Generate the QR code value (same format as when originally created)
  const qrValue = JSON.stringify({
    type: "stamp",
    code: qrCode.code,
    card_id: qrCode.card_id,
    merchant_id: qrCode.merchant_id,
    timestamp: Date.now()
  });

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    
    try {
      // Create a new jsPDF instance
      const pdf = new jsPDF();
      
      // Add business information
      pdf.setFontSize(20);
      pdf.text(businessName || "Business", 20, 30);
      
      pdf.setFontSize(14);
      pdf.text(cardName || "Loyalty Card", 20, 45);
      
      pdf.setFontSize(12);
      pdf.text(`QR Code Type: ${qrCode.is_single_use ? 'Single Use' : 'Multi Use'}`, 20, 60);
      
      const expiresAt = new Date(qrCode.expires_at);
      pdf.text(`Expires: ${expiresAt.toLocaleString()}`, 20, 75);
      
      pdf.text(`Created: ${new Date(qrCode.created_at).toLocaleString()}`, 20, 90);
      
      // Get the QR code canvas element
      const qrElement = document.getElementById('qr-code-for-pdf');
      if (qrElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const svg = qrElement.querySelector('svg');
        
        if (svg && ctx) {
          // Convert SVG to canvas
          const svgData = new XMLSerializer().serializeToString(svg);
          const img = new Image();
          
          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              canvas.width = 200;
              canvas.height = 200;
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, 200, 200);
              ctx.drawImage(img, 0, 0, 200, 200);
              
              // Add the QR code image to PDF
              const imgData = canvas.toDataURL('image/png');
              pdf.addImage(imgData, 'PNG', 60, 110, 80, 80);
              resolve();
            };
            img.onerror = reject;
            img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
          });
        }
      }
      
      // Add instructions
      pdf.setFontSize(10);
      pdf.text('Instructions:', 20, 210);
      pdf.text('1. Print this QR code and display it where customers can scan', 20, 225);
      pdf.text('2. Customers scan to earn stamps on their loyalty card', 20, 240);
      pdf.text('3. QR code will expire on the date shown above', 20, 255);
      
      // Generate filename
      const date = new Date().toISOString().split('T')[0];
      const filename = `QR-Code-${businessName?.replace(/[^a-zA-Z0-9]/g, '') || 'Business'}-${date}.pdf`;
      
      // Save the PDF
      pdf.save(filename);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback: create a simple PDF with just text
      const pdf = new jsPDF();
      pdf.setFontSize(16);
      pdf.text('QR Code Information', 20, 30);
      pdf.setFontSize(12);
      pdf.text(`Business: ${businessName || 'Business'}`, 20, 50);
      pdf.text(`Card: ${cardName || 'Loyalty Card'}`, 20, 70);
      pdf.text(`Type: ${qrCode.is_single_use ? 'Single Use' : 'Multi Use'}`, 20, 90);
      pdf.text(`Expires: ${new Date(qrCode.expires_at).toLocaleString()}`, 20, 110);
      pdf.text('QR Code could not be embedded. Please generate a new one.', 20, 140);
      
      const date = new Date().toISOString().split('T')[0];
      const filename = `QR-Code-${businessName?.replace(/[^a-zA-Z0-9]/g, '') || 'Business'}-${date}.pdf`;
      pdf.save(filename);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            View QR Code
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Business Information */}
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">{businessName || "Business"}</h3>
            <p className="text-gray-600">{cardName || "Loyalty Card"}</p>
          </div>
          
          {/* QR Code Display */}
          <div className="flex justify-center" id="qr-code-for-pdf">
            <QRCodeDisplay 
              value={qrValue}
              size={200}
              level="M"
              borderSize={10}
            />
          </div>
          
          {/* QR Code Details */}
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Type:</span>
              <span>{qrCode.is_single_use ? 'Single Use' : 'Multi Use'}</span>
            </div>
            <div className="flex justify-between">
              <span>Created:</span>
              <span>{new Date(qrCode.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Expires:</span>
              <span>{new Date(qrCode.expires_at).toLocaleString()}</span>
            </div>
          </div>
          
          {/* Download Button */}
          <Button 
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? 'Generating PDF...' : 'Download PDF'}
          </Button>
          
          <p className="text-xs text-gray-500 text-center">
            The PDF will include the QR code and business information for easy printing.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeViewModal;
