
import { supabase } from "@/integrations/supabase/client";

// Re-export everything from the modular stamps system
export * from './stamps/types';
export * from './stamps/qrCodes';
export * from './stamps/operations';

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
    // Updated URL to use the new Supabase Functions domain
    const response = await supabase.functions.invoke('issue-stamp', {
      body: JSON.stringify({
        cardId,
        customerEmail,
        count,
        method
      })
    });

    // Add null check for response.data before accessing properties
    if (!response.data) {
      throw new Error("No response data received from the issue-stamp function");
    }

    if (!response.data.success) {
      throw new Error(response.data.error || "Failed to issue stamps");
    }

    return response.data;
  } catch (error) {
    console.error("Error issuing stamps:", error);
    throw error;
  }
};
