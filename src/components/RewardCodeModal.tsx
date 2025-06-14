
import React, { useState } from "react";
import { Dialog, DialogContent, DialogOverlay, DialogTitle, DialogDescription } from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface RewardCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewardCode: string;
  rewardDescription: string;
}

const RewardCodeModal: React.FC<RewardCodeModalProps> = ({
  isOpen,
  onClose,
  rewardCode,
  rewardDescription,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(rewardCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open ? onClose() : undefined}>
      <DialogOverlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fade-in" />
      <DialogContent 
        className="fixed z-50 left-1/2 top-1/2 w-full max-w-xs p-8 bg-white rounded-xl shadow-2xl flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 animate-scale-in outline-none"
        tabIndex={0}
        aria-modal="true"
      >
        <DialogTitle className="text-2xl font-bold text-green-700 mb-1">You earned a reward!</DialogTitle>
        <DialogDescription className="text-green-600 mb-4 text-center">{rewardDescription}</DialogDescription>
        <div className="bg-green-100 text-green-900 font-mono text-3xl sm:text-4xl tracking-wider py-4 px-8 rounded-lg mb-4 user-select-all shadow-inner border-2 border-green-400 transition-all">
          {rewardCode}
        </div>
        <Button
          onClick={handleCopy}
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-green-600 hover:bg-green-700 text-white font-medium shadow hover-scale"
          aria-label="Copy reward code"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" /> Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" /> Copy Code
            </>
          )}
        </Button>
        <div className="text-xs text-gray-500 mt-3 text-center">
          Show this code to the merchant <br /> to redeem your offer.
        </div>
        <Button
          onClick={onClose}
          className="mt-6 w-full py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg"
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default RewardCodeModal;
