
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, User } from "@/utils/auth";
import { getUserStampCards, StampCard as StampCardType, getUserTransactions, Transaction, initializeDemoData } from "@/utils/data";
import StampCard from "@/components/StampCard";
import { Button } from "@/components/ui/button";
import { Search, Scan, Plus, Store, CreditCard, SortDesc } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Cards = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [cards, setCards] = useState<StampCardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNoCardsModal, setShowNoCardsModal] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "grouped">("all");

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

  // Group cards by business
  const groupedByBusiness = sortedCards.reduce<Record<string, StampCardType[]>>((groups, card) => {
    const businessName = card.businessName;
    if (!groups[businessName]) {
      groups[businessName] = [];
    }
    groups[businessName].push(card);
    return groups;
  }, {});

  const handleCardClick = (cardId: string) => {
    navigate(`/card/${cardId}`);
  };

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
        
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                <SortDesc className="h-4 w-4" />
                <span>View</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background">
              <DropdownMenuItem onClick={() => setViewMode("all")} className={viewMode === "all" ? "bg-muted" : ""}>
                <CreditCard className="h-4 w-4 mr-2" />
                <span>All Cards</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode("grouped")} className={viewMode === "grouped" ? "bg-muted" : ""}>
                <Store className="h-4 w-4 mr-2" />
                <span>Group by Business</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Link to="/scan" className="sm:ml-2">
            <Button variant="secondary" className="flex items-center gap-1.5 w-full sm:w-auto">
              <Scan className="h-4 w-4" />
              <span>Scan</span>
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Cards section */}
      {sortedCards.length > 0 ? (
        viewMode === "all" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedCards.map((card) => (
              <div key={card.id} onClick={() => handleCardClick(card.id)} className="cursor-pointer">
                <StampCard
                  card={card}
                  className="h-full transition-all transform hover:translate-y-[-2px]"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByBusiness).map(([businessName, businessCards]) => (
              <div key={businessName} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">{businessName}</h2>
                  <span className="text-xs bg-muted px-2 py-1 rounded-full">
                    {businessCards.length} {businessCards.length === 1 ? 'card' : 'cards'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {businessCards.map((card) => (
                    <div key={card.id} onClick={() => handleCardClick(card.id)} className="cursor-pointer">
                      <StampCard
                        card={card}
                        className="h-full transition-all transform hover:translate-y-[-2px]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
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
