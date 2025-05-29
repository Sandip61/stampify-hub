
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { 
  UserPlus, 
  Search,
  Users,
  Stamp,
  Gift,
  ChevronDown,
  Filter,
  Mail,
  Calendar,
  Award
} from "lucide-react";
import { merchantSupabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Define the interface for customer data
interface MerchantCustomer {
  id: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_email: string;
  total_stamps_earned: number;
  total_rewards_redeemed: number;
  first_interaction_at: string;
  last_interaction_at: string;
}

// Define the interface for transaction data
interface MerchantTransaction {
  id: string;
  customer_id: string;
  type: 'stamp' | 'reward';
  count: number | null;
  timestamp: string;
  reward_code: string | null;
  metadata: any;
}

const MerchantCustomers = () => {
  const [customers, setCustomers] = useState<MerchantCustomer[]>([]);
  const [transactions, setTransactions] = useState<MerchantTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [viewMode, setViewMode] = useState<"customers" | "transactions">("customers");
  const [transactionFilter, setTransactionFilter] = useState<"all" | "stamp" | "reward">("all");
  const isMobile = useIsMobile();
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load customers
      const { data: customersData, error: customersError } = await merchantSupabase
        .from('merchant_customers')
        .select('*')
        .order('last_interaction_at', { ascending: false });

      if (customersError) {
        console.error('Error loading customers:', customersError);
        toast.error('Failed to load customers');
      } else {
        setCustomers(customersData || []);
      }

      // Load transactions
      const { data: transactionsData, error: transactionsError } = await merchantSupabase
        .from('stamp_transactions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (transactionsError) {
        console.error('Error loading transactions:', transactionsError);
        toast.error('Failed to load transactions');
      } else {
        setTransactions(transactionsData || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getCustomerDisplayName = (customer: MerchantCustomer) => {
    return customer.customer_name || customer.customer_email.split('@')[0];
  };

  const getTransactionDisplayInfo = (transaction: MerchantTransaction) => {
    const email = transaction.metadata?.customer_email || 'Unknown customer';
    const name = email.split('@')[0];
    return { name, email };
  };

  const filteredCustomers = customers.filter(customer => 
    getCustomerDisplayName(customer).toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter(transaction => {
    if (transactionFilter !== "all" && transaction.type !== transactionFilter) {
      return false;
    }
    
    const { name, email } = getTransactionDisplayInfo(transaction);
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={viewMode === "customers" ? "Search customers..." : "Search transactions..."}
            className="pl-9 h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2">
          <div className="inline-flex rounded-md shadow-sm border">
            <button
              onClick={() => setViewMode("customers")}
              className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                viewMode === "customers"
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent hover:bg-muted"
              }`}
            >
              <Users className="h-4 w-4 inline mr-1" />
              {!isMobile && "Customers"}
            </button>
            <button
              onClick={() => setViewMode("transactions")}
              className={`px-3 py-2 text-sm font-medium rounded-r-md ${
                viewMode === "transactions"
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent hover:bg-muted"
              }`}
            >
              <Stamp className="h-4 w-4 inline mr-1" />
              {!isMobile && "Transactions"}
            </button>
          </div>
          
          {viewMode === "transactions" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="px-3 py-2 text-sm font-medium rounded-md border inline-flex items-center">
                  <Filter className="h-4 w-4 mr-1" />
                  {!isMobile ? (
                    <>
                      {transactionFilter === "all"
                        ? "All"
                        : transactionFilter === "stamp"
                        ? "Stamps"
                        : "Rewards"}
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={() => setTransactionFilter("all")}>
                  All Transactions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTransactionFilter("stamp")}>
                  Stamps Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTransactionFilter("reward")}>
                  Rewards Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {viewMode === "customers" ? (
        filteredCustomers.length > 0 ? (
          <div className="grid gap-4">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{getCustomerDisplayName(customer)}</h3>
                        {!customer.customer_id && (
                          <Badge variant="secondary" className="text-xs">Unregistered</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <Mail className="h-3 w-3" />
                        {customer.customer_email}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Last activity: {formatDate(customer.last_interaction_at)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm font-medium mb-1">
                        <Stamp className="h-3 w-3" />
                        {customer.total_stamps_earned} stamps
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Award className="h-3 w-3" />
                        {customer.total_rewards_redeemed} rewards
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center border rounded-xl p-12">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No customers yet</h3>
            <p className="text-muted-foreground mb-4">
              Customers will appear here when they scan your QR codes
            </p>
          </div>
        )
      ) : (
        filteredTransactions.length > 0 ? (
          <div className="grid gap-4">
            {filteredTransactions.map((transaction) => {
              const { name, email } = getTransactionDisplayInfo(transaction);
              return (
                <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{name}</h3>
                          <Badge 
                            variant={transaction.type === 'reward' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {transaction.type === 'reward' ? 'Reward' : 'Stamp'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                          <Mail className="h-3 w-3" />
                          {email}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(transaction.timestamp || '')}
                        </div>
                      </div>
                      <div className="text-right">
                        {transaction.type === 'stamp' && (
                          <div className="text-sm font-medium">
                            +{transaction.count || 1} stamps
                          </div>
                        )}
                        {transaction.type === 'reward' && transaction.reward_code && (
                          <div className="text-sm font-medium">
                            Code: {transaction.reward_code}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center border rounded-xl p-12">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Stamp className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No transactions yet</h3>
            <p className="text-muted-foreground mb-4">
              Transactions will appear here when customers interact with your loyalty program
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default MerchantCustomers;
