
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/utils/auth";
import StampCard from "@/components/StampCard";

// Define types for stamp cards
interface StampCardType {
  id: string;
  name: string;
  description: string;
  total_stamps: number;
  reward: string;
  business_logo: string;
  business_color: string;
  current_stamps?: number;
}

const Home = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stampCards, setStampCards] = useState<StampCardType[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const userData = await getCurrentUser();
      setUser(userData);
      setLoading(false);
    };

    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserCards();
    }
  }, [user]);

  const fetchUserCards = async () => {
    try {
      // Get customer's stamp cards with current stamp counts
      const { data, error } = await supabase
        .from("customer_stamp_cards")
        .select(`
          id,
          current_stamps,
          card:card_id (
            id,
            name,
            description,
            total_stamps,
            reward,
            business_logo,
            business_color
          )
        `)
        .eq("customer_id", user.id);

      if (error) {
        console.error("Error fetching stamp cards:", error);
        return;
      }

      // Transform data to flat structure for easier consumption by components
      const transformedData = data.map((item: any) => ({
        id: item.card.id,
        name: item.card.name,
        description: item.card.description,
        total_stamps: item.card.total_stamps,
        reward: item.card.reward,
        business_logo: item.card.business_logo,
        business_color: item.card.business_color,
        current_stamps: item.current_stamps,
        customer_card_id: item.id,
      }));

      setStampCards(transformedData);
    } catch (error) {
      console.error("Error fetching stamp cards:", error);
    }
  };

  // Content for authenticated users
  const authenticatedContent = (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Stamp Cards</h2>
      </div>

      {stampCards.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-medium text-gray-600">No stamp cards yet</h3>
          <p className="text-gray-500 mt-2">
            Visit your favorite stores to collect stamps and earn rewards.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stampCards.map((card) => (
            <Link to={`/card/${card.id}`} key={card.id}>
              <StampCard
                name={card.name}
                description={card.description}
                currentStamps={card.current_stamps || 0}
                totalStamps={card.total_stamps}
                reward={card.reward}
                businessLogo={card.business_logo}
                businessColor={card.business_color}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  // Content for non-authenticated users
  const guestContent = (
    <div className="text-center space-y-6 max-w-2xl mx-auto py-12">
      <h1 className="text-4xl font-bold">Digital Stamp Cards</h1>
      <p className="text-xl text-gray-600">
        Collect digital stamps from your favorite stores and earn rewards!
      </p>
      <div className="flex justify-center gap-4 pt-4">
        <Link
          to="/login"
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Login
        </Link>
        <Link
          to="/register"
          className="px-6 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
        >
          Register
        </Link>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return <div>{user ? authenticatedContent : guestContent}</div>;
};

export default Home;
