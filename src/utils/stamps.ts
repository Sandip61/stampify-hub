
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Re-export everything from the modular stamps system
export * from './stamps/types';
export * from './stamps/qrCodes';
export * from './stamps/operations';

// This function is deprecated. Use the one in stamps/operations.ts instead.
export const issueStampsToCustomer = async ({
  cardId, 
  customerEmail, 
  count = 1, 
  method = "direct"
}: {
  cardId: string, 
  customerEmail?: string, 
  count?: number, 
  method?: "direct" | "qr"
}) => {
  try {
    // Show toast to indicate request is being processed
    const pendingToast = toast.loading("Issuing stamps...");

    // Update to v2+ function invocation syntax
    const { data, error } = await supabase.functions.invoke('issue-stamp', {
      body: {
        cardId,
        customerEmail,
        count,
        method
      }
    });

    // Clear the loading toast
    toast.dismiss(pendingToast);

    if (error) {
      console.error("Supabase function error:", error);
      toast.error("Failed to issue stamps. Please try again.");
      throw error;
    }

    // Add null check for response.data before accessing properties
    if (!data) {
      const errorMsg = "No response data received from the issue-stamp function";
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    if (!data.success) {
      const errorMsg = data.error || "Failed to issue stamps";
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Success notification
    toast.success(`Successfully issued ${count} stamp(s)`);
    return data;
  } catch (error) {
    console.error("Error issuing stamps:", error);
    
    // More descriptive error message
    const errorMessage = error instanceof Error ? error.message : "Unknown error issuing stamps";
    
    // Fix: Use a unique ID for the error toast instead of checking if it's active
    toast.error(errorMessage, { id: "stamp-error" });
    
    throw error;
  }
};
