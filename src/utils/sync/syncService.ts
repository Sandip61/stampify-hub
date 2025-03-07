
import { 
  getOfflineQueue, 
  removeFromOfflineQueue, 
  updateOfflineOperation,
  OFFLINE_QUEUE_STAMPS,
  OFFLINE_QUEUE_REDEMPTIONS,
  OfflineOperationType,
  OfflineOperation
} from "@/utils/offlineStorage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

/**
 * Process a single offline operation
 */
const processOperation = async (operation: OfflineOperation): Promise<boolean> => {
  try {
    switch (operation.type) {
      case OfflineOperationType.ISSUE_STAMP:
        const { data: stampData, error: stampError } = await supabase.functions.invoke(
          'issue-stamp',
          { body: operation.payload }
        );
        
        if (stampError || !stampData.success) {
          throw new Error(stampError?.message || stampData?.error || 'Failed to sync stamps');
        }
        return true;
        
      case OfflineOperationType.REDEEM_REWARD:
        const { data: redeemData, error: redeemError } = await supabase.functions.invoke(
          'redeem-reward',
          { body: operation.payload }
        );
        
        if (redeemError || !redeemData.success) {
          throw new Error(redeemError?.message || redeemData?.error || 'Failed to sync redemption');
        }
        return true;
        
      default:
        console.warn(`Unknown operation type: ${operation.type}`);
        return false;
    }
  } catch (error) {
    console.error(`Error processing offline operation:`, error);
    
    // Increment retry count
    if (operation.retryCount < MAX_RETRIES) {
      const queueKey = operation.type === OfflineOperationType.ISSUE_STAMP 
        ? OFFLINE_QUEUE_STAMPS 
        : OFFLINE_QUEUE_REDEMPTIONS;
        
      updateOfflineOperation(queueKey, operation.id, {
        retryCount: operation.retryCount + 1
      });
      
      // Schedule retry
      setTimeout(() => {
        processOperation(operation);
      }, RETRY_DELAY);
    }
    
    return false;
  }
};

/**
 * Sync all offline operations for a specific queue
 */
const syncQueue = async (queueKey: string): Promise<void> => {
  const operations = getOfflineQueue(queueKey);
  
  if (operations.length === 0) {
    return;
  }
  
  console.log(`Syncing ${operations.length} operations from ${queueKey}`);
  
  for (const operation of operations) {
    try {
      const success = await processOperation(operation);
      
      if (success) {
        removeFromOfflineQueue(queueKey, operation.id);
      }
    } catch (error) {
      console.error(`Failed to sync operation ${operation.id}:`, error);
    }
  }
};

/**
 * Sync all offline data
 */
export const syncOfflineData = async (): Promise<void> => {
  try {
    await Promise.all([
      syncQueue(OFFLINE_QUEUE_STAMPS),
      syncQueue(OFFLINE_QUEUE_REDEMPTIONS)
    ]);
    
    toast.success('Offline data synchronized successfully');
  } catch (error) {
    console.error('Error syncing offline data:', error);
    toast.error('Failed to sync some offline data. Will retry later.');
  }
};
