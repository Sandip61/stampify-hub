
import { supabase } from "@/integrations/supabase/client";

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

    if (!response.data.success) {
      throw new Error(response.data.error || "Failed to issue stamps");
    }

    return response.data;
  } catch (error) {
    console.error("Error issuing stamps:", error);
    throw error;
  }
};
