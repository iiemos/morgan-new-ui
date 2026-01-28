import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import useStakeStore from '../stores/stakeStore';

export const useWalletIntegration = () => {
  const { address, isConnected } = useAccount();
  
  const { 
    setConnection,
    setReferrer
  } = useStakeStore();

  // Update connection state in store when wallet state changes
  useEffect(() => {
    setConnection(isConnected, address, null, null);
  }, [isConnected, address, setConnection]);

  // Extract referrer from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const referrer = urlParams.get('ref');
    if (referrer) {
      setReferrer(referrer);
      // Store in localStorage for persistence
      localStorage.setItem('referrer', referrer);
    } else {
      // Try to get from localStorage
      const storedReferrer = localStorage.getItem('referrer');
      if (storedReferrer) {
        setReferrer(storedReferrer);
      }
    }
  }, [setReferrer]);

  return {
    isConnected,
    address
  };
};