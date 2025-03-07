
import { toast } from "sonner";
import { AppError, ErrorType } from "@/utils/errors";

// Keys for different offline operation queues
export const OFFLINE_QUEUE_STAMPS = 'offline-queue-stamps';
export const OFFLINE_QUEUE_REDEMPTIONS = 'offline-queue-redemptions';

// Offline operation types
export enum OfflineOperationType {
  ISSUE_STAMP = 'ISSUE_STAMP',
  REDEEM_REWARD = 'REDEEM_REWARD',
}

// Interface for offline operations
export interface OfflineOperation {
  id: string;
  type: OfflineOperationType;
  payload: any;
  timestamp: number;
  retryCount: number;
}

/**
 * Add an operation to the offline queue
 */
export const addToOfflineQueue = (
  queueKey: string,
  type: OfflineOperationType,
  payload: any
): string => {
  const operationId = `offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const operation: OfflineOperation = {
    id: operationId,
    type,
    payload,
    timestamp: Date.now(),
    retryCount: 0,
  };

  try {
    // Get current queue
    const queueJson = localStorage.getItem(queueKey);
    const queue: OfflineOperation[] = queueJson ? JSON.parse(queueJson) : [];
    
    // Add new operation to queue
    queue.push(operation);
    
    // Save back to localStorage
    localStorage.setItem(queueKey, JSON.stringify(queue));
    
    return operationId;
  } catch (error) {
    console.error('Failed to add operation to offline queue:', error);
    throw new AppError(
      ErrorType.OFFLINE_STORAGE_ERROR,
      'Failed to store operation for offline use'
    );
  }
};

/**
 * Get all operations from an offline queue
 */
export const getOfflineQueue = (queueKey: string): OfflineOperation[] => {
  try {
    const queueJson = localStorage.getItem(queueKey);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (error) {
    console.error('Failed to retrieve offline queue:', error);
    return [];
  }
};

/**
 * Remove an operation from the offline queue
 */
export const removeFromOfflineQueue = (queueKey: string, operationId: string): boolean => {
  try {
    const queueJson = localStorage.getItem(queueKey);
    if (!queueJson) return false;
    
    const queue: OfflineOperation[] = JSON.parse(queueJson);
    const filteredQueue = queue.filter(op => op.id !== operationId);
    
    if (filteredQueue.length === queue.length) {
      return false; // Operation not found
    }
    
    localStorage.setItem(queueKey, JSON.stringify(filteredQueue));
    return true;
  } catch (error) {
    console.error('Failed to remove operation from offline queue:', error);
    return false;
  }
};

/**
 * Update an operation in the offline queue (e.g., increase retry count)
 */
export const updateOfflineOperation = (
  queueKey: string, 
  operationId: string, 
  updates: Partial<OfflineOperation>
): boolean => {
  try {
    const queueJson = localStorage.getItem(queueKey);
    if (!queueJson) return false;
    
    const queue: OfflineOperation[] = JSON.parse(queueJson);
    const operationIndex = queue.findIndex(op => op.id === operationId);
    
    if (operationIndex === -1) {
      return false; // Operation not found
    }
    
    queue[operationIndex] = { ...queue[operationIndex], ...updates };
    localStorage.setItem(queueKey, JSON.stringify(queue));
    return true;
  } catch (error) {
    console.error('Failed to update operation in offline queue:', error);
    return false;
  }
};

/**
 * Check if the device is online
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Register online/offline event listeners
 */
export const registerConnectivityListeners = (
  onlineCallback: () => void,
  offlineCallback: () => void
): () => void => {
  // Define event handlers
  const handleOnline = () => {
    console.log('App is online');
    toast.success('You are back online');
    onlineCallback();
  };

  const handleOffline = () => {
    console.log('App is offline');
    toast.warning('You are offline. Changes will be saved locally and synced when you reconnect.');
    offlineCallback();
  };

  // Add event listeners
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return function to remove listeners
  return () => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  };
};
