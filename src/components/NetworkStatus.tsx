import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Activity } from 'lucide-react';
import { NetworkStatus as NetworkStatusType, ApiResponse } from '@/lib/api/types';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { calculateEpochETA } from '@/lib/utils';

// Component for animated digit display
const AnimatedDigit = ({ digit }: { digit: string }) => {
  return (
    <div className="relative h-8 w-4 overflow-hidden">
      <motion.div
        initial={{ y: -40 }}
        animate={{ y: 0 }}
        exit={{ y: 40 }}
        transition={{ duration: 0.2 }}
        className="absolute w-full text-center"
      >
        {digit}
      </motion.div>
    </div>
  );
};

// Component for animated number display
const AnimatedNumber = ({ value }: { value: number }) => {
  const digits = value.toString().split('');
  
  return (
    <div className="flex">
      {digits.map((digit, index) => (
        <AnimatedDigit key={`${value}-${index}-${digit}`} digit={digit} />
      ))}
    </div>
  );
};

export default function NetworkStatus() {
  const [data, setData] = useState<NetworkStatusType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlot, setCurrentSlot] = useState<number>(0);
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [nextEpoch, setNextEpoch] = useState<number>(0);
  const [epochProgress, setEpochProgress] = useState<number>(0);
  const [networkLag, setNetworkLag] = useState<number>(0);
  const lastApiSlot = useRef<number>(0);
  const isInitialized = useRef<boolean>(false);
  const lastFetchTime = useRef<number>(0);
  const baseSlot = useRef<number>(0);
  const baseTime = useRef<number>(0);
  const animationFrameRef = useRef<number>();

  // Calculate current epoch based on slot
  const calculateCurrentEpoch = (slot: number): number => {
    // Each epoch is 432000 slots
    return Math.floor(slot / 432000);
  };

  // Calculate epoch progress percentage
  const calculateEpochProgress = (slot: number): number => {
    const currentEpochSlot = slot % 432000;
    return (currentEpochSlot / 432000) * 100;
  };

  // Format progress percentage
  const formatProgress = (progress: number): string => {
    return `${Math.min(progress, 100).toFixed(2)}%`;
  };

  // Calculate current slot based on time elapsed
  const calculateCurrentSlot = () => {
    const now = Date.now();
    const timeElapsed = (now - baseTime.current) / 1000; // in seconds
    const slotsElapsed = timeElapsed / 0.4; // 0.4 seconds per slot
    return Math.floor(baseSlot.current + slotsElapsed);
  };

  // Update slot and epoch continuously using requestAnimationFrame
  const updateValues = () => {
    if (!isInitialized.current) {
      animationFrameRef.current = requestAnimationFrame(updateValues);
      return;
    }
    
    const newSlot = calculateCurrentSlot();
    
    // Update the display value for the current slot
    setCurrentSlot(newSlot);
    
    // Update epoch based on slot
    const newEpoch = calculateCurrentEpoch(newSlot);
    setCurrentEpoch(newEpoch);
    setNextEpoch(newEpoch + 1);
    
    // Update epoch progress
    const progress = calculateEpochProgress(newSlot);
    setEpochProgress(progress);
    
    animationFrameRef.current = requestAnimationFrame(updateValues);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/network-status');
        if (!response.ok) throw new Error('Failed to fetch network status');
        const result: ApiResponse<NetworkStatusType> = await response.json();
        
        // Get the API slot - use lastSyncedSlot if available, otherwise fall back to lastNetworkSlot
        const apiSlot = result.data.lastSyncedSlot || result.data.lastNetworkSlot;
        const now = Date.now();
        
        // Only update base values if the API slot is higher than our current calculation
        // This ensures we only move forward, never backward
        const currentCalculatedSlot = calculateCurrentSlot();
        
        if (apiSlot > currentCalculatedSlot || !isInitialized.current) {
          console.log(`Updating base slot from ${baseSlot.current} to ${apiSlot}`);
          baseSlot.current = apiSlot;
          baseTime.current = now;
          lastApiSlot.current = apiSlot;
          lastFetchTime.current = now;
          
          if (!isInitialized.current) {
            isInitialized.current = true;
          }
        }
        
        setData(result.data);
        setNetworkLag(result.data.networkLag);
        setError(null);
      } catch (err) {
        console.error('Error fetching network status:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    // Start the animation frame first to ensure it's always running
    animationFrameRef.current = requestAnimationFrame(updateValues);

    // Then fetch initial data
    fetchData();
    const interval = setInterval(fetchData, 1000); // Update every second

    return () => {
      clearInterval(interval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="dashboard-card bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-lime-200/50 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-lime-200/50 rounded w-1/2"></div>
            <div className="h-4 bg-lime-200/50 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-card bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="dashboard-card bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg"
      >
        <h2 className="text-xl font-semibold text-lime-600 mb-6 flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Network Status
        </h2>
        
        <div className="flex flex-col space-y-6">
          {/* Slot Height Section */}
          <div className="flex flex-col">
            <div className="flex items-center">
              <small className="text-gray-500 mr-2">Slot Height</small>
            </div>
            <div className="flex items-center mt-1">
              <div className="text-2xl font-mono">
                <AnimatedNumber value={currentSlot} />
              </div>
            </div>
          </div>
          
          {/* Epoch Section */}
          <div className="flex flex-col">
            <div className="flex items-center mb-2">
              <small className="text-gray-500 mr-2">Epoch</small>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-xl font-mono">{currentEpoch}</div>
              
              <div className="flex-1 mx-4">
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-lime-500 rounded-full"
                    style={{ width: `${epochProgress}%` }}
                    key={`progress-${Math.floor(epochProgress * 100)}`}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>{formatProgress(epochProgress)}</span>
                  <span>ETA {calculateEpochETA(currentSlot)}</span>
                </div>
              </div>
              
              <div className="text-xl font-mono">{nextEpoch}</div>
            </div>
          </div>
          
          {/* Network Lag Section */}
          <div className="flex items-center">
            <small className="text-gray-500 mr-2">Network Lag</small>
            <div className="flex items-center ml-2">
              <div className="text-2xl font-mono">
                {networkLag.toFixed(2)}
              </div>
              <small className="text-gray-500 ml-1">s</small>
            </div>
          </div>
        </div>
      </motion.div>
    </ErrorBoundary>
  );
}