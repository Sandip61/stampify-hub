import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  Search,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Merchant } from "@/utils/merchantAuth";
import { 
  getMerchantStampCards, 
  MerchantStampCard,
  deleteMerchantStampCard,
  updateMerchantStampCard
} from "@/utils/merchantData";
import { mockMerchant } from "@/utils/mockMerchantData";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const MerchantCards = () => {
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState<Merchant | null>(mockMerchant);
  const [cards, setCards] = useState<MerchantStampCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  useEffect(() => {
    loadCards();
  }, [navigate]);

  const loadCards = async () => {
    setIsLoading(true);
    try {
      const cardsData = await getMerchantStampCards();
      setCards(cardsData);
    } catch (error) {
      console.error("Error fetching cards:", error);
      toast.error("Failed to load stamp cards");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (cardId: string) => {
    if (!confirm("Are you sure you want to delete this stamp card? This action cannot be undone.")) {
      return;
    }
    
    try {
      await deleteMerchantStampCard(cardId);
      toast.success("Stamp card deleted successfully");
      loadCards();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete stamp card");
    }
  };

  const toggleCardStatus = async (card: MerchantStampCard) => {
    try {
      await updateMerchantStampCard(card.id, { isActive: !card.isActive });
      toast.success(`Stamp card ${card.isActive ? 'deactivated' : 'activated'} successfully`);
      loadCards();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update stamp card");
    }
  };

  const filteredCards = cards.filter(card => 
    card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-amber-600 bg-clip-text text-transparent">Stamp Cards</h1>
        <Link
          to="/merchant/cards/new"
          className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-gradient-to-r from-teal-600 to-amber-600 text-white hover:from-teal-700 hover:to-amber-700 transition-colors"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          New Stamp Card
        </Link>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search stamp cards..."
            className="pl-9 h-10 w-full rounded-md border border-teal-100 bg-white/70 backdrop-blur-sm px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-t-2 border-teal-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center merchant-card p-12">
          <div className="rounded-full bg-amber-50 p-3 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-credit-card text-amber-600"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
          </div>
          {searchTerm ? (
            <>
              <h3 className="text-lg font-semibold mb-1">No results found</h3>
              <p className="text-muted-foreground mb-4">No stamp cards match your search criteria</p>
              <button
                onClick={() => setSearchTerm("")}
                className="text-sm text-teal-600 hover:text-teal-700"
              >
                Clear search
              </button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold mb-1">No stamp cards yet</h3>
              <p className="text-muted-foreground mb-4">Start creating loyalty programs for your customers</p>
              <Link
                to="/merchant/cards/new"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-gradient-to-r from-teal-600 to-amber-600 text-white hover:from-teal-700 hover:to-amber-700 transition-colors"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create your first card
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCards.map((card) => (
            <div 
              key={card.id} 
              className="merchant-card overflow-hidden relative"
            >
              <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4">
                <div className="flex-shrink-0">
                  <div 
                    className="w-16 h-16 md:w-20 md:h-20 rounded-lg flex items-center justify-center text-2xl md:text-3xl shadow-md"
                    style={{ backgroundColor: card.color }}
                  >
                    {card.logo}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                    <div>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        card.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {card.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <h3 className="text-lg font-semibold mt-2 bg-gradient-to-r from-teal-700 to-amber-700 bg-clip-text text-transparent">{card.name}</h3>
                    </div>
                    <div className="flex items-center space-x-2 mt-2 md:mt-0 -ml-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              to={`/merchant/cards/${card.id}/manage`}
                              className="p-2 rounded-md hover:bg-purple-100 text-purple-500"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ticket"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="bottom" 
                            align="start" 
                            className="whitespace-nowrap"
                          >
                            Manage Stamps
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => toggleCardStatus(card)}
                              className={`p-2 rounded-md ${
                                card.isActive 
                                  ? 'hover:bg-red-100 text-red-500' 
                                  : 'hover:bg-green-100 text-green-500'
                              }`}
                            >
                              {card.isActive ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            {card.isActive ? 'Deactivate Card' : 'Activate Card'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              to={`/merchant/cards/edit/${card.id}`}
                              className="p-2 rounded-md hover:bg-teal-100 text-teal-600"
                            >
                              <Edit className="h-5 w-5" />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            Edit Stamp Card
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleDelete(card.id)}
                              className="p-2 rounded-md hover:bg-red-100 text-red-500"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="bottom" 
                            align="end" 
                            className="mr-2 overflow-visible"
                          >
                            Delete Stamp Card
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground">{card.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="bg-teal-50/70 rounded-md p-2">
                      <p className="text-xs text-teal-700">Stamps Required</p>
                      <p className="text-sm font-medium">{card.totalStamps}</p>
                    </div>
                    <div className="bg-amber-50/70 rounded-md p-2">
                      <p className="text-xs text-amber-700">Reward</p>
                      <p className="text-sm font-medium">{card.reward}</p>
                    </div>
                    <div className="bg-teal-50/70 rounded-md p-2">
                      <p className="text-xs text-teal-700">Created</p>
                      <p className="text-sm font-medium">{new Date(card.createdAt).toLocaleDateString()}</p>
                    </div>
                    {card.expiryDays && (
                      <div className="bg-amber-50/70 rounded-md p-2">
                        <p className="text-xs text-amber-700">Expiry</p>
                        <p className="text-sm font-medium">{card.expiryDays} days</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MerchantCards;
