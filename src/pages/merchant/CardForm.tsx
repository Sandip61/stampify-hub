import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentMerchant } from "@/utils/merchantAuth";
import { handleError, handleSupabaseError } from "@/utils/errors";
import { ErrorType } from "@/utils/errors";
import { createMerchantStampCard, updateMerchantStampCard, getMerchantStampCard } from "@/utils/merchantData";

const MerchantCardForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [totalStamps, setTotalStamps] = useState(10);
  const [reward, setReward] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [logo, setLogo] = useState(""); // Start with empty logo, let user choose
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
      
      const fetchStampCard = async () => {
        try {
          const stampCard = await getMerchantStampCard(id);
          
          if (!stampCard) {
            toast.error("Stamp card not found");
            navigate("/merchant/cards");
            return;
          }

          setName(stampCard.name);
          setDescription(stampCard.description);
          setTotalStamps(stampCard.totalStamps);
          setReward(stampCard.reward);
          setLogo(stampCard.logo);
          setColor(stampCard.color);
          setIsActive(stampCard.isActive);
          setExpiryDays(stampCard.expiryDays);
        } catch (error) {
          handleError(error, ErrorType.RESOURCE_NOT_FOUND, "Failed to load stamp card");
          navigate("/merchant/cards");
        } finally {
          setIsLoading(false);
        }
      };

      fetchStampCard();
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
      console.log("Starting form submission...");
      console.log("Form data:", {
        name,
        description,
        totalStamps,
        reward,
        color,
        logo,
        isActive,
        expiryDays
      });

      if (isEditMode && id) {
        console.log("Updating existing card:", id);
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
        console.log("Creating new card...");
        const result = await createMerchantStampCard({
          name,
          description,
          totalStamps,
          reward,
          color,
          logo,
          isActive,
          expiryDays
        });
        
        console.log("Card creation result:", result);
        toast.success("Stamp card created successfully");
      }
      
      navigate("/merchant/cards");
    } catch (error) {
      console.error("Form submission error:", error);
      
      // Provide more specific error messaging
      let errorMessage = "Failed to save stamp card";
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        
        // Check for specific database constraint errors
        if (error.message.includes('duplicate key') || error.message.includes('unique')) {
          errorMessage = "A stamp card with this name already exists";
        } else if (error.message.includes('foreign key') || error.message.includes('merchant_id')) {
          errorMessage = "Invalid merchant session. Please log in again.";
        } else if (error.message.includes('not null') || error.message.includes('required')) {
          errorMessage = "Please fill in all required fields";
        } else if (error.message.includes('check constraint')) {
          errorMessage = "Invalid data provided. Please check your inputs.";
        }
      }
      
      toast.error(errorMessage);
      handleError(error, ErrorType.DATABASE_ERROR, errorMessage);
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
                <p className="text-xs text-muted-foreground">
                  Select a logo for your stamp card
                </p>
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
                        {logo || "?"} 
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
