
import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  level?: "L" | "M" | "Q" | "H";
  bgColor?: string;
  fgColor?: string;
  borderSize?: number;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 200,
  level = "M",
  bgColor = "#FFFFFF",
  fgColor = "#000000",
  borderSize = 0,
}) => {
  return (
    <div
      className="bg-white rounded-lg p-4"
      style={{ 
        padding: borderSize,
        maxWidth: "fit-content"
      }}
    >
      <QRCodeSVG
        value={value}
        size={size}
        level={level}
        bgColor={bgColor}
        fgColor={fgColor}
      />
    </div>
  );
};

export default QRCodeDisplay;
