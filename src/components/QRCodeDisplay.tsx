
import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  level?: "L" | "M" | "Q" | "H";
  bgColor?: string;
  fgColor?: string;
  borderSize?: number;
  logo?: string;
  logoSize?: number;
  logoBackgroundColor?: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 200,
  level = "M",
  bgColor = "#FFFFFF",
  fgColor = "#000000",
  borderSize = 0,
  logo,
  logoSize = 50,
  logoBackgroundColor = "#FFFFFF",
}) => {
  return (
    <div
      className="bg-white rounded-lg"
      style={{ 
        padding: borderSize,
        maxWidth: "fit-content"
      }}
    >
      <QRCodeSVG
        value={value}
        size={size}
        level={level} // L, M, Q, H - error correction capability (Low to High)
        bgColor={bgColor}
        fgColor={fgColor}
        imageSettings={logo ? {
          src: logo,
          height: logoSize,
          width: logoSize,
          excavate: true,
        } : undefined}
      />
    </div>
  );
};

export default QRCodeDisplay;
