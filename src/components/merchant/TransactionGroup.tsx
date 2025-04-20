
import { Calendar } from "lucide-react";
import { TransactionHistory } from "@/pages/merchant/History";
import { TransactionItem } from "./TransactionItem";

interface TransactionGroupProps {
  date: string;
  transactions: TransactionHistory[];
}

export const TransactionGroup = ({ date, transactions }: TransactionGroupProps) => {
  return (
    <div>
      <div className="flex items-center mb-4">
        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">{date}</h3>
      </div>
      
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="divide-y">
          {transactions.map(transaction => (
            <TransactionItem key={transaction.id} transaction={transaction} />
          ))}
        </div>
      </div>
    </div>
  );
};
