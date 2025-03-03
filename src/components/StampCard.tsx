
import { cn } from "@/lib/utils";

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
  
  return (
    <div className={cn("stamp-card group relative rounded-xl border p-4 hover:shadow-md transition-shadow", className)}>
      <div 
        className="absolute inset-0 opacity-10 rounded-xl" 
        style={{ backgroundColor: colorValue }}
      />
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground">
            {currentStampsValue}/{totalStampsValue} stamps
          </span>
          <h3 className="text-lg font-semibold mt-2">{businessNameValue}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <div 
          className="flex items-center justify-center w-12 h-12 rounded-full text-2xl"
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
            backgroundColor: colorValue
          }}
        />
      </div>
      
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {currentStampsValue === totalStampsValue ? (
            <span className="font-semibold text-foreground">Ready to redeem!</span>
          ) : (
            <span>{totalStampsValue - currentStampsValue} more to go</span>
          )}
        </p>
        <p className="text-sm font-medium">{rewardValue}</p>
      </div>
      
      <div 
        className="absolute bottom-0 left-0 right-0 h-1 transition-all duration-300"
        style={{ 
          backgroundColor: colorValue,
          opacity: 0.7
        }}
      />
    </div>
  );
};

export default StampCard;
