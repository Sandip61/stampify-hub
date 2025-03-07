
import { cn } from "@/lib/utils";
import { Stamp, Gift, Star } from "lucide-react";

export interface StampCardProps {
  card?: {
    businessName: string;
    businessLogo: string;
    totalStamps: number;
    currentStamps: number;
    reward: string;
    color: string;
  };
  name?: string;
  description?: string;
  businessName?: string;
  businessLogo?: string;
  totalStamps?: number;
  currentStamps?: number;
  reward?: string;
  businessColor?: string;
  className?: string;
}

const StampCard = ({ 
  card, 
  name,
  description,
  businessName: propBusinessName,
  businessLogo: propBusinessLogo,
  totalStamps: propTotalStamps,
  currentStamps: propCurrentStamps,
  reward: propReward,
  businessColor,
  className 
}: StampCardProps) => {
  // Use either card props or direct props
  const businessNameValue = propBusinessName || (card?.businessName);
  const businessLogoValue = propBusinessLogo || (card?.businessLogo);
  const totalStampsValue = propTotalStamps || (card?.totalStamps) || 10;
  const currentStampsValue = propCurrentStamps || (card?.currentStamps) || 0;
  const rewardValue = propReward || (card?.reward);
  const colorValue = businessColor || (card?.color) || "#4F46E5";
  
  // Calculate progress percentage
  const progress = (currentStampsValue / totalStampsValue) * 100;
  const isComplete = currentStampsValue >= totalStampsValue;
  
  return (
    <div 
      className={cn(
        "stamp-card group relative rounded-xl border p-4 hover:shadow-md transition-all", 
        isComplete ? "ring-2 ring-offset-2" : "",
        className
      )}
      style={{ 
        ...(isComplete && { "--ring-color": colorValue }) 
      } as React.CSSProperties}
    >
      <div 
        className="absolute inset-0 opacity-10 rounded-xl" 
        style={{ backgroundColor: colorValue }}
      />
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span 
              className={cn(
                "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                isComplete 
                  ? "bg-green-100 text-green-800" 
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {isComplete ? (
                <>
                  <Star className="h-3 w-3 mr-1 fill-green-500 text-green-500" />
                  Ready
                </>
              ) : (
                <>
                  {currentStampsValue}/{totalStampsValue} stamps
                </>
              )}
            </span>
            
            {isComplete && (
              <span 
                className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary"
              >
                <Gift className="h-3 w-3 mr-1" />
                Reward Available
              </span>
            )}
          </div>
          
          <h3 className="text-lg font-semibold">{businessNameValue}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <div 
          className="flex items-center justify-center w-12 h-12 rounded-full text-white text-2xl"
          style={{ backgroundColor: colorValue }}
        >
          {businessLogoValue}
        </div>
      </div>
      
      <div className="h-2 bg-secondary rounded-full overflow-hidden mb-3">
        <div 
          className="h-full transition-all duration-500 ease-out"
          style={{ 
            width: `${progress}%`,
            backgroundColor: isComplete ? "#10B981" : colorValue
          }}
        />
      </div>
      
      <div className="flex items-center gap-2 flex-wrap">
        {Array.from({ length: totalStampsValue }).map((_, index) => (
          <div 
            key={index}
            className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-xs border transition-all",
              index < currentStampsValue 
                ? "border-none bg-opacity-100 text-white" 
                : "border-gray-300 bg-opacity-20 text-gray-400"
            )}
            style={{ 
              backgroundColor: index < currentStampsValue ? colorValue : 'transparent',
            }}
          >
            {index < currentStampsValue && (
              <Stamp className="h-3 w-3" />
            )}
          </div>
        ))}
      </div>
      
      <div className="flex justify-between items-center mt-3">
        <p className="text-sm text-muted-foreground">
          {isComplete ? (
            <span className="font-semibold text-green-600">Ready to redeem!</span>
          ) : (
            <span>{totalStampsValue - currentStampsValue} more to go</span>
          )}
        </p>
        <p className="text-sm font-medium">{rewardValue}</p>
      </div>
      
      <div 
        className="absolute bottom-0 left-0 right-0 h-1 transition-all duration-300"
        style={{ 
          backgroundColor: isComplete ? "#10B981" : colorValue,
          opacity: 0.7
        }}
      />
    </div>
  );
};

export default StampCard;
