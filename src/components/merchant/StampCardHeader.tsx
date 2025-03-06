
import React from "react";

interface StampCardHeaderProps {
  stampCardName: string;
}

const StampCardHeader: React.FC<StampCardHeaderProps> = ({ stampCardName }) => {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold">Manage {stampCardName}</h1>
      <p className="text-gray-500 mt-1">Issue stamps, generate QR codes, and redeem rewards</p>
    </div>
  );
};

export default StampCardHeader;
