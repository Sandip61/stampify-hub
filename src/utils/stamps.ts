
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
    // Update to v2+ function invocation syntax
    const { data, error } = await supabase.functions.invoke('issue-stamp', {
      body: {
        cardId,
        customerEmail,
        count,
        method
      }
    });

    if (error) {
      throw error;
    }

    // Add null check for response.data before accessing properties
    if (!data) {
      throw new Error("No response data received from the issue-stamp function");
    }

    if (!data.success) {
      throw new Error(data.error || "Failed to issue stamps");
    }

    return data;
  } catch (error) {
    console.error("Error issuing stamps:", error);
    throw error;
  }
};
