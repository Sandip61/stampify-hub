
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, User } from "@/utils/auth";
import { getUserStampCards, StampCard as StampCardType } from "@/utils/data";
import StampCard from "@/components/StampCard";
import { Button } from "@/components/ui/button";
import { Search, Scan, Store, CreditCard, SortDesc } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { generateDummyData } from "@/utils/generateDummyData";
import { toast } from "sonner";

const Cards = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [cards, setCards] = useState<StampCardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "grouped">("all");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (currentUser) {
          // Load user's stamp cards directly from Supabase
          const userCards = await getUserStampCards();
          setCards(userCards);
        }
      } catch (error) {
        console.error("Error loading cards:", error);
        toast.error("Failed to load your loyalty cards");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleGenerateDummyData = async () => {
    try {
      toast.info("Generating demo data...");
      const success = await generateDummyData();
      if (success) {
        // Reload cards after demo data is generated
        const userCards = await getUserStampCards();
        setCards(userCards);
        toast.success("Demo data created successfully!");
      }
    } catch (error) {
      console.error("Error generating dummy data:", error);
      toast.error("Failed to generate demo data");
    }
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
          <div className="mx-auto flex flex-col items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <CreditCard className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium">No loyalty cards yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Visit your favorite businesses and scan their QR codes to collect stamps
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/scan">
                <Button variant="default">
                  Scan QR Code
                </Button>
              </Link>
              <Button variant="outline" onClick={handleGenerateDummyData}>
                Generate Demo Data
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cards;
