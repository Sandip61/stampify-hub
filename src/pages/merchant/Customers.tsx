
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { 
  UserPlus, 
  Search,
  Users,
  Stamp,
  Gift,
  ChevronDown,
  Filter
} from "lucide-react";
import { Merchant } from "@/utils/merchantAuth";
import { 
  getMerchantCustomers, 
  getMerchantTransactions,
  addMerchantCustomer,
  MerchantCustomer,
  MerchantTransaction,
  initializeDemoMerchantDataForLogin
} from "@/utils/merchantData";
import { mockMerchant } from "@/utils/mockMerchantData";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MerchantCustomers = () => {
  const [merchant, setMerchant] = useState<Merchant | null>(mockMerchant);
  const [customers, setCustomers] = useState<MerchantCustomer[]>([]);
  const [transactions, setTransactions] = useState<MerchantTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "" });
  const [customerErrors, setCustomerErrors] = useState<{ name?: string; email?: string }>({});
  
  const [viewMode, setViewMode] = useState<"customers" | "transactions">("customers");
  const [transactionFilter, setTransactionFilter] = useState<"all" | "stamp" | "redeem">("all");
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // Set the mock merchant directly
        setMerchant(mockMerchant);

        // Initialize demo data for this merchant
        initializeDemoMerchantDataForLogin(mockMerchant.id);
        
        // Load data
        loadCustomersAndTransactions();
      } catch (error) {
        console.error("Error loading merchant data:", error);
      }
    };
    
    loadData();
  }, []);

  const loadCustomersAndTransactions = () => {
    setIsLoading(true);
    const customers = getMerchantCustomers();
    const transactions = getMerchantTransactions();
    setCustomers(customers);
    setTransactions(transactions);
    setIsLoading(false);
  };

  const validateNewCustomer = () => {
    const errors: { name?: string; email?: string } = {};
    
    if (!newCustomer.name.trim()) {
      errors.name = "Name is required";
    }
    
    if (!newCustomer.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomer.email)) {
      errors.email = "Invalid email format";
    }
    
    setCustomerErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddCustomer = async () => {
    if (!validateNewCustomer()) return;
    
    setIsAddingCustomer(true);
    
    try {
      await addMerchantCustomer(newCustomer.name, newCustomer.email);
      toast.success("Customer added successfully");
      setNewCustomer({ name: "", email: "" });
      loadCustomersAndTransactions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add customer");
    } finally {
      setIsAddingCustomer(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter(transaction => {
    if (transactionFilter !== "all" && transaction.type !== transactionFilter) {
      return false;
    }
    
    return (
      transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <button
          onClick={() => setIsAddingCustomer(!isAddingCustomer)}
          className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          {!isMobile && "Add Customer"}
        </button>
      </div>

      {isAddingCustomer && (
        <div className="bg-card border rounded-xl p-4">
          <h3 className="font-medium mb-3">Add New Customer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                className={`mt-1 flex h-10 w-full rounded-md border ${
                  customerErrors.name ? "border-destructive" : "border-input"
                } bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                placeholder="John Smith"
              />
              {customerErrors.name && (
                <p className="text-xs text-destructive mt-1">{customerErrors.name}</p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className={`mt-1 flex h-10 w-full rounded-md border ${
                  customerErrors.email ? "border-destructive" : "border-input"
                } bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                placeholder="john@example.com"
              />
              {customerErrors.email && (
                <p className="text-xs text-destructive mt-1">{customerErrors.email}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setIsAddingCustomer(false)}
              className="px-3 py-2 text-sm font-medium rounded-md border hover:bg-muted transition-colors mr-2"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCustomer}
              className="px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              disabled={isAddingCustomer}
            >
              {isAddingCustomer ? "Adding..." : "Add Customer"}
            </button>
          </div>
        </div>
      )}

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
                        : "Redemptions"}
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
                <DropdownMenuItem onClick={() => setTransactionFilter("redeem")}>
                  Redemptions Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin"></div>
        </div>
      ) : viewMode === "customers" ? (
        filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center border rounded-xl p-12">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            {searchTerm ? (
              <>
                <h3 className="text-lg font-semibold mb-1">No customers found</h3>
                <p className="text-muted-foreground mb-4">
                  No customers match your search criteria
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-sm text-primary"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-1">No customers yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start adding customers to your loyalty program
                </p>
                <button
                  onClick={() => setIsAddingCustomer(true)}
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add your first customer
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="bg-card border rounded-xl overflow-x-auto">
            <div className="min-w-full">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Customer</th>
                    <th className="text-left p-4 font-medium">Email</th>
                    <th className="text-left p-4 font-medium">Stamps</th>
                    <th className="text-left p-4 font-medium">Rewards</th>
                    <th className="text-left p-4 font-medium">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-muted/50">
                      <td className="p-4">
                        <div className="font-medium">{customer.name}</div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {customer.email}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <Stamp className="h-4 w-4 text-blue-500 mr-1" />
                          {customer.totalStampsEarned}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <Gift className="h-4 w-4 text-green-500 mr-1" />
                          {customer.totalRewardsRedeemed}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(customer.lastActivityAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center border rounded-xl p-12">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Stamp className="h-6 w-6 text-muted-foreground" />
            </div>
            {searchTerm || transactionFilter !== "all" ? (
              <>
                <h3 className="text-lg font-semibold mb-1">No transactions found</h3>
                <p className="text-muted-foreground mb-4">
                  No transactions match your search criteria
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setTransactionFilter("all");
                  }}
                  className="text-sm text-primary"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-1">No transactions yet</h3>
                <p className="text-muted-foreground mb-4">
                  Transactions will appear here when customers interact with your loyalty program
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="bg-card border rounded-xl overflow-x-auto">
            <div className="min-w-full">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Type</th>
                    <th className="text-left p-4 font-medium">Customer</th>
                    <th className="text-left p-4 font-medium">Date & Time</th>
                    <th className="text-left p-4 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-muted/50">
                      <td className="p-4">
                        {transaction.type === "stamp" ? (
                          <div className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700">
                            <Stamp className="h-3 w-3 mr-1" />
                            Stamp
                          </div>
                        ) : (
                          <div className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-700">
                            <Gift className="h-3 w-3 mr-1" />
                            Redemption
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{transaction.customerName}</div>
                        <div className="text-xs text-muted-foreground">
                          {transaction.customerEmail}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {formatDate(transaction.timestamp)}
                      </td>
                      <td className="p-4">
                        {transaction.type === "stamp" ? (
                          <div>Stamp added</div>
                        ) : (
                          <div>
                            Reward redeemed
                            {transaction.rewardCode && (
                              <div className="text-xs text-muted-foreground">
                                Code: {transaction.rewardCode}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default MerchantCustomers;
