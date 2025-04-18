import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { 
  getMerchantStampCard, 
  createMerchantStampCard,
  updateMerchantStampCard
} from "@/utils/merchantData";
import { mockMerchant } from "@/utils/mockMerchantData";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentMerchant } from "@/utils/merchantAuth";
import { handleError } from "@/utils/errors";

const MerchantCardForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [totalStamps, setTotalStamps] = useState(10);
  const [reward, setReward] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [logo, setLogo] = useState("🏪");
  const [isActive, setIsActive] = useState(true);
  const [expiryDays, setExpiryDays] = useState<number | undefined>(undefined);
  
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    totalStamps?: string;
    reward?: string;
  }>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      setIsLoading(true);
      const card = getMerchantStampCard(id);
      
      if (card) {
        setName(card.name);
        setDescription(card.description);
        setTotalStamps(card.totalStamps);
        setReward(card.reward);
        setLogo(card.logo);
        setColor(card.color);
        setIsActive(card.isActive);
        setExpiryDays(card.expiryDays || 0);
      } else {
        toast.error("Stamp card not found");
        navigate("/merchant/cards");
      }
      
      setIsLoading(false);
    }
  }, [id, isEditMode, navigate]);

  const validateForm = () => {
    const newErrors: {
      name?: string;
      description?: string;
      totalStamps?: string;
      reward?: string;
    } = {};
    
    if (!name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!description.trim()) {
      newErrors.description = "Description is required";
    }
    
    if (!totalStamps || totalStamps < 1) {
      newErrors.totalStamps = "Must be at least 1";
    }
    
    if (!reward.trim()) {
      newErrors.reward = "Reward is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      console.log("Getting current merchant profile...");
      const merchant = await getCurrentMerchant();
      
      if (!merchant) {
        console.error("No merchant found in the current session");
        toast.error("You must be logged in as a merchant to create stamp cards");
        navigate("/merchant/login");
        return;
      }
      
      console.log("Current merchant:", merchant);
      
      const stampCardData = {
        name,
        description,
        total_stamps: totalStamps,
        reward,
        business_color: color,
        business_logo: logo,
        is_active: isActive,
        expiry_days: expiryDays,
        merchant_id: merchant.id
      };
      
      console.log("Saving stamp card data to Supabase:", stampCardData);
      
      if (isEditMode && id) {
        console.log(`Attempting to update stamp card with ID ${id} in Supabase...`);
        const { data, error } = await supabase
          .from('stamp_cards')
          .update(stampCardData)
          .eq('id', id)
          .select();
          
        if (error) {
          console.error("Error updating stamp card in Supabase:", error);
          throw new Error(error.message);
        }
        
        console.log("Supabase update response:", data);
        
        await updateMerchantStampCard(id, {
          name,
          description,
          totalStamps,
          reward,
          color,
          logo,
          isActive,
          expiryDays
        });
        
        toast.success("Stamp card updated successfully");
      } else {
        console.log("Attempting to create new stamp card in Supabase...");
        const { data, error } = await supabase
          .from('stamp_cards')
          .insert(stampCardData)
          .select()
          .single();
          
        if (error) {
          console.error("Supabase insert error:", error);
          throw new Error(error.message);
        }
        
        console.log("Successfully created stamp card in Supabase:", data);
        
        await createMerchantStampCard({
          name,
          description,
          totalStamps,
          reward,
          color,
          logo,
          isActive,
          expiryDays
        });
        
        toast.success("Stamp card created successfully");
      }
      
      console.log("Card creation/update process completed successfully");
      navigate("/merchant/cards");
    } catch (error) {
      console.error("Error during stamp card save operation:", error);
      handleError(error, undefined, "Failed to save stamp card");
    } finally {
      setIsSubmitting(false);
    }
  };

  const logoOptions = ["🏪", "☕", "🍔", "🍕", "🍦", "🥪", "🛍️", "📚", "👕", "💇", "🛒", "🧁"];
  
  const colorOptions = [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#6366F1", // Indigo
    "#14B8A6", // Teal
    "#F97316", // Orange
    "#84CC16", // Lime
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/merchant/cards")}
          className="mr-3 p-2 rounded-md hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">
          {isEditMode ? "Edit Stamp Card" : "Create Stamp Card"}
        </h1>
      </div>

      <div className="bg-card border rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Card Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`flex h-10 w-full rounded-md border ${
                    errors.name ? "border-destructive" : "border-input"
                  } bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                  placeholder="Coffee Lovers"
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`flex min-h-24 w-full rounded-md border ${
                    errors.description ? "border-destructive" : "border-input"
                  } bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                  placeholder="Buy 9 coffees, get 1 free!"
                  disabled={isSubmitting}
                />
                {errors.description && (
                  <p className="text-xs text-destructive">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="totalStamps" className="text-sm font-medium">
                    Stamps Required
                  </label>
                  <input
                    id="totalStamps"
                    type="number"
                    min="1"
                    value={totalStamps}
                    onChange={(e) => setTotalStamps(parseInt(e.target.value))}
                    className={`flex h-10 w-full rounded-md border ${
                      errors.totalStamps ? "border-destructive" : "border-input"
                    } bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                    disabled={isSubmitting}
                  />
                  {errors.totalStamps && (
                    <p className="text-xs text-destructive">{errors.totalStamps}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="expiryDays" className="text-sm font-medium">
                    Expiry Days (Optional)
                  </label>
                  <input
                    id="expiryDays"
                    type="number"
                    min="1"
                    value={expiryDays || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setExpiryDays(value ? parseInt(value) : undefined);
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="30"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank for no expiry
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="reward" className="text-sm font-medium">
                  Reward Description
                </label>
                <input
                  id="reward"
                  type="text"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  className={`flex h-10 w-full rounded-md border ${
                    errors.reward ? "border-destructive" : "border-input"
                  } bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                  placeholder="Free Coffee of Choice"
                  disabled={isSubmitting}
                />
                {errors.reward && (
                  <p className="text-xs text-destructive">{errors.reward}</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Card Logo</label>
                <div className="grid grid-cols-6 gap-2">
                  {logoOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`h-10 rounded-md flex items-center justify-center text-lg ${
                        logo === option 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary text-secondary-foreground"
                      }`}
                      onClick={() => setLogo(option)}
                      disabled={isSubmitting}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Card Color</label>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`h-10 rounded-md ${color === option ? "ring-2 ring-primary" : ""}`}
                      style={{ backgroundColor: option }}
                      onClick={() => setColor(option)}
                      disabled={isSubmitting}
                    />
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Card Status</label>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={isActive}
                      onChange={() => setIsActive(true)}
                      className="h-4 w-4 text-primary focus:ring-primary"
                      disabled={isSubmitting}
                    />
                    <span>Active</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={!isActive}
                      onChange={() => setIsActive(false)}
                      className="h-4 w-4 text-primary focus:ring-primary"
                      disabled={isSubmitting}
                    />
                    <span>Inactive</span>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Inactive cards won't be available to customers
                </p>
              </div>
              
              <div className="mt-4 p-4 border rounded-md bg-muted/50">
                <h3 className="text-sm font-medium mb-2">Card Preview</h3>
                <div className="relative rounded-lg overflow-hidden shadow-md bg-white">
                  <div 
                    className="absolute inset-0 opacity-10" 
                    style={{ backgroundColor: color }}
                  />
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground">
                          0/{totalStamps} stamps
                        </span>
                        <h3 className="text-lg font-semibold mt-2">{name || "Card Name"}</h3>
                      </div>
                      <div 
                        className="flex items-center justify-center w-12 h-12 rounded-full text-2xl"
                        style={{ backgroundColor: color }}
                      >
                        {logo}
                      </div>
                    </div>
                    
                    <div className="h-2 bg-secondary rounded-full overflow-hidden mb-3">
                      <div 
                        className="h-full"
                        style={{ width: "0%", backgroundColor: color }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        {totalStamps} more to go
                      </p>
                      <p className="text-sm font-medium">{reward || "Reward"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              className="px-4 py-2 rounded-md border hover:bg-muted transition-colors"
              onClick={() => navigate("/merchant/cards")}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? (isEditMode ? "Updating..." : "Creating...") 
                : (isEditMode ? "Update Card" : "Create Card")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MerchantCardForm;
