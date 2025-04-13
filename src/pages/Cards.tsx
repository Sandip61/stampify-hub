
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, User } from "@/utils/auth";
import { getUserStampCards, StampCard as StampCardType, getUserTransactions, Transaction, initializeDemoData } from "@/utils/data";
import StampCard from "@/components/StampCard";
import { Button } from "@/components/ui/button";
import { Search, Scan, Plus, Gift, Stamp, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Cards = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [cards, setCards] = useState<StampCardType[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNoCardsModal, setShowNoCardsModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<StampCardType | null>(null);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (currentUser) {
          // Initialize demo data if needed
          await initializeDemoData();
          
          // Get user's stamp cards
          const userCards = await getUserStampCards();
          setCards(userCards);
          
          // Get transaction history
          const userTransactions = await getUserTransactions();
          setTransactions(userTransactions);
          
          // Show modal if no cards
          if (userCards.length === 0) {
            setShowNoCardsModal(true);
          }
        }
      } catch (error) {
        console.error("Error loading cards:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleCardClick = (card: StampCardType) => {
    setSelectedCard(card);
    setShowTransactionsModal(true);
  };

  // Filter transactions for selected card
  const getCardTransactions = (cardId: string) => {
    return transactions.filter(transaction => transaction.cardId === cardId);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filter cards based on search term
  const filteredCards = cards.filter(card => 
    card.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.reward.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort cards: complete cards first, then by businessName
  const sortedCards = [...filteredCards].sort((a, b) => {
    // Complete cards first
    const aComplete = a.currentStamps >= a.totalStamps;
    const bComplete = b.currentStamps >= b.totalStamps;
    
    if (aComplete && !bComplete) return -1;
    if (!aComplete && bComplete) return 1;
    
    // Then by business name
    return a.businessName.localeCompare(b.businessName);
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-t-2 border-primary animate-spin" />
        <p className="mt-4 text-muted-foreground">Loading your stamp cards...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-2">My Loyalty Cards</h1>
        <p className="text-muted-foreground">
          Manage all your loyalty cards and rewards in one place
        </p>
      </header>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by business or reward..."
            className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Link to="/scan" className="mt-2 sm:mt-0">
          <Button variant="secondary" className="flex items-center gap-1.5 w-full sm:w-auto">
            <Scan className="h-4 w-4" />
            <span>Scan</span>
          </Button>
        </Link>
      </div>
      
      {/* Cards section */}
      {sortedCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedCards.map((card) => (
            <div key={card.id} onClick={() => handleCardClick(card)} className="cursor-pointer">
              <StampCard
                card={card}
                className="h-full transition-all transform hover:translate-y-[-2px]"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 px-4 bg-gray-50 rounded-lg border border-gray-100">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">No loyalty cards yet</h3>
          <p className="text-muted-foreground mb-4">
            Visit your favorite businesses and scan their QR codes to collect stamps
          </p>
          <Link to="/scan">
            <Button variant="default">
              Scan QR Code
            </Button>
          </Link>
        </div>
      )}
      
      {/* Transaction history modal */}
      <Dialog open={showTransactionsModal} onOpenChange={setShowTransactionsModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center">
              <button 
                onClick={() => setShowTransactionsModal(false)} 
                className="mr-2 p-1 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <DialogTitle>
                {selectedCard?.businessName} Card History
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="py-4">
            {selectedCard && (
              <>
                <StampCard
                  card={selectedCard}
                  className="mb-4"
                />
                
                <h3 className="text-sm font-medium mb-2">Recent Activity</h3>
                <div className="bg-card rounded-xl border overflow-hidden">
                  <div className="divide-y">
                    {getCardTransactions(selectedCard.id).length > 0 ? (
                      getCardTransactions(selectedCard.id).map(transaction => (
                        <div key={transaction.id} className="p-4 flex items-center">
                          <div className={`rounded-full p-2 mr-3 ${
                            transaction.type === 'stamp' 
                              ? 'bg-blue-500/10 text-blue-500' 
                              : 'bg-green-500/10 text-green-500'
                          }`}>
                            {transaction.type === 'stamp' ? (
                              <Stamp className="h-4 w-4" />
                            ) : (
                              <Gift className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {transaction.businessName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.type === 'stamp' 
                                ? `Added ${transaction.count || 1} stamp${(transaction.count || 1) > 1 ? 's' : ''}` 
                                : `Redeemed reward${transaction.rewardCode ? ` (${transaction.rewardCode})` : ''}`}
                            </p>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(transaction.timestamp)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        No activity for this card yet
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Welcome modal */}
      <Dialog open={showNoCardsModal} onOpenChange={setShowNoCardsModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome to Stampify!</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              It looks like you don't have any loyalty cards yet. To get started, you can:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>Visit businesses with Stampify and scan their QR codes</li>
              <li>Browse the home screen to discover participating businesses</li>
              <li>Explore special offers and promotions</li>
            </ul>
            <p>
              Once you collect stamps, you'll be able to redeem rewards and track your progress right here!
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowNoCardsModal(false)}>Got it</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cards;
