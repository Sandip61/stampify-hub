
import { useEffect, useState } from 'react';
import { registerConnectivityListeners, isOnline } from '@/utils/offlineStorage';
import { syncOfflineData } from '@/utils/sync/syncService';

export const useConnectivity = () => {
  const [online, setOnline] = useState<boolean>(isOnline());

  useEffect(() => {
    // Set initial state
    setOnline(isOnline());
    
    // Handle when app comes online
    const handleOnline = async () => {
      setOnline(true);
      await syncOfflineData();
    };
    
    // Handle when app goes offline
    const handleOffline = () => {
      setOnline(false);
    };
    
    // Register listeners for online/offline events
    const cleanup = registerConnectivityListeners(handleOnline, handleOffline);
    
    // Cleanup on unmount
    return cleanup;
  }, []);

  return {
    isOnline: online,
    syncOfflineData
  };
};
