
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
  console.log("Using deprecated stamps.ts function, please update to use the stamps/operations.ts module");
  
  // Forward to the new implementation
  const { issueStampsToCustomer: newImplementation } = await import('./stamps/operations');
  
  try {
    return await newImplementation({
      cardId,
      customerEmail,
      count, 
      method
    });
  } catch (error) {
    console.error("Error in stamps.ts forwarding function:", error);
    throw error;
  }
};
