
import { Clock, Stamp, Gift, PlusCircle, Edit, Archive } from "lucide-react";
import { TransactionHistory } from "@/pages/merchant/History";

export const getTransactionTypeDetails = (type: string) => {
  switch (type) {
    case 'stamp':
      return { icon: <Stamp className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-500' };
    case 'redeem':
      return { icon: <Gift className="h-4 w-4" />, color: 'bg-green-500/10 text-green-500' };
    case 'card_created':
      return { icon: <PlusCircle className="h-4 w-4" />, color: 'bg-purple-500/10 text-purple-500' };
    case 'card_updated':
      return { icon: <Edit className="h-4 w-4" />, color: 'bg-yellow-500/10 text-yellow-500' };
    case 'card_deactivated':
      return { icon: <Archive className="h-4 w-4" />, color: 'bg-red-500/10 text-red-500' };
    default:
      return { icon: <Clock className="h-4 w-4" />, color: 'bg-gray-500/10 text-gray-500' };
  }
};

export const getTransactionDescription = (transaction: TransactionHistory) => {
  switch (transaction.type) {
    case 'stamp':
      return `Added ${transaction.count || 1} stamp${(transaction.count || 1) > 1 ? 's' : ''} for ${transaction.customer_id}`;
    case 'redeem':
      return `Reward redeemed by ${transaction.customer_id}`;
    case 'card_created':
      return 'New Stamp Card Created';
    case 'card_updated':
      return 'Stamp Card Updated';
    case 'card_deactivated':
      return 'Stamp Card Deactivated';
    default:
      return 'Unknown Activity';
  }
};

export const TransactionItem = ({ transaction }: { transaction: TransactionHistory }) => {
  const { icon, color } = getTransactionTypeDetails(transaction.type);
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-4 flex items-center">
      <div className={`rounded-full p-2 mr-3 ${color}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">
          {transaction.card_name || 'Stamp Card Activity'}
        </p>
        <p className="text-xs text-muted-foreground">
          {getTransactionDescription(transaction)}
        </p>
      </div>
      <div className="text-xs text-muted-foreground">
        {formatTime(transaction.timestamp)}
      </div>
    </div>
  );
};
