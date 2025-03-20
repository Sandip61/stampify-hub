
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser, User } from "@/utils/auth";
import { getUserStampCards, StampCard as StampCardType, initializeDemoData } from "@/utils/data";
import StampCard from "@/components/StampCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Star, Scan, TrendingUp } from "lucide-react";
import QRScannerModal from "@/components/QRScannerModal";

const Home = () => {
  const [user, setUser] = useState<User | null>(null);
  const [cards, setCards] = useState<StampCardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);

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
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Get cards that are close to completion (>50% complete)
  const nearCompletionCards = cards.filter(card => 
    (card.currentStamps / card.totalStamps) >= 0.5 && 
    card.currentStamps < card.totalStamps
  );

  // Get cards that are complete and ready for redemption
  const readyToRedeemCards = cards.filter(card => 
    card.currentStamps >= card.totalStamps
  );

  // Get recently updated cards
  const recentlyUpdatedCards = [...cards]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-t-2 border-primary animate-spin" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6">
      {/* Welcome section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          Welcome back{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="text-muted-foreground">
          Keep track of your rewards and discover new offers
        </p>
      </div>
      
      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Button 
          variant="outline" 
          className="w-full h-16 justify-start"
          onClick={() => setScannerOpen(true)}
        >
          <div className="flex flex-col items-start">
            <div className="flex items-center text-primary">
              <Scan className="w-4 h-4 mr-2" />
              <span className="font-medium whitespace-normal text-left">Scan QR</span>
            </div>
            <span className="text-xs text-muted-foreground mt-1 whitespace-normal text-left">
              Add stamps to your card
            </span>
          </div>
        </Button>
        <Link to="/cards">
          <Button variant="outline" className="w-full h-16 justify-start">
            <div className="flex flex-col items-start">
              <div className="flex items-center text-primary">
                <Star className="w-4 h-4 mr-2" />
                <span className="font-medium whitespace-normal text-left">View Cards</span>
              </div>
              <span className="text-xs text-muted-foreground mt-1 whitespace-normal text-left">
                See all your loyalty cards
              </span>
            </div>
          </Button>
        </Link>
      </div>
      
      {/* Ready to redeem section */}
      {readyToRedeemCards.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-500 fill-yellow-500" />
              Ready to Redeem
            </h2>
            {readyToRedeemCards.length > 2 && (
              <Link to="/cards" className="text-sm text-primary flex items-center">
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4">
            {readyToRedeemCards.slice(0, 2).map((card) => (
              <Link key={card.id} to={`/card/${card.id}`} className="block">
                <StampCard
                  card={card}
                  className="transition-all transform hover:translate-y-[-2px]"
                />
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* Almost there section */}
      {nearCompletionCards.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              Almost There
            </h2>
            {nearCompletionCards.length > 2 && (
              <Link to="/cards" className="text-sm text-primary flex items-center">
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4">
            {nearCompletionCards.slice(0, 2).map((card) => (
              <Link key={card.id} to={`/card/${card.id}`} className="block">
                <StampCard
                  card={card}
                  className="transition-all transform hover:translate-y-[-2px]"
                />
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* Recent activity section */}
      {recentlyUpdatedCards.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Clock className="w-5 h-5 mr-2 text-purple-500" />
              Recent Activity
            </h2>
            <Link to="/history" className="text-sm text-primary flex items-center">
              View history <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentlyUpdatedCards.map((card) => (
              <Link key={card.id} to={`/card/${card.id}`} className="block">
                <StampCard
                  card={card}
                  className="transition-all transform hover:translate-y-[-2px]"
                />
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* No cards state */}
      {cards.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-100 text-center">
          <h3 className="text-lg font-medium mb-2">Get Started with Stampify</h3>
          <p className="text-muted-foreground mb-4">
            Add your first loyalty card by scanning a QR code at participating businesses
          </p>
          <Button onClick={() => setScannerOpen(true)}>Scan QR Code</Button>
        </div>
      )}

      <QRScannerModal open={scannerOpen} onOpenChange={setScannerOpen} />
    </div>
  );
};

export default Home;
