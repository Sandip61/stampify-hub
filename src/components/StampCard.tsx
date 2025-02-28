
import { cn } from "@/lib/utils";
import { StampCard as StampCardType } from "@/utils/data";

interface StampCardProps {
  card: StampCardType;
  className?: string;
}

const StampCard = ({ card, className }: StampCardProps) => {
  const { businessName, businessLogo, totalStamps, currentStamps, reward, color } = card;
  
  // Calculate progress percentage
  const progress = (currentStamps / totalStamps) * 100;
  
  return (
    <div className={cn("stamp-card group relative rounded-xl border p-4 hover:shadow-md transition-shadow", className)}>
      <div 
        className="absolute inset-0 opacity-10 rounded-xl" 
        style={{ backgroundColor: color }}
      />
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground">
            {currentStamps}/{totalStamps} stamps
          </span>
          <h3 className="text-lg font-semibold mt-2">{businessName}</h3>
        </div>
        <div 
          className="flex items-center justify-center w-12 h-12 rounded-full text-2xl"
          style={{ backgroundColor: color }}
        >
          {businessLogo}
        </div>
      </div>
      
      <div className="h-2 bg-secondary rounded-full overflow-hidden mb-3">
        <div 
          className="h-full transition-all duration-500 ease-out"
          style={{ 
            width: `${progress}%`,
            backgroundColor: color
          }}
        />
      </div>
      
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {currentStamps === totalStamps ? (
            <span className="font-semibold text-foreground">Ready to redeem!</span>
          ) : (
            <span>{totalStamps - currentStamps} more to go</span>
          )}
        </p>
        <p className="text-sm font-medium">{reward}</p>
      </div>
      
      <div 
        className="absolute bottom-0 left-0 right-0 h-1 transition-all duration-300"
        style={{ 
          backgroundColor: color,
          opacity: 0.7
        }}
      />
    </div>
  );
};

export default StampCard;
