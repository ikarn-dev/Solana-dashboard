"use client";

import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Memoized price display component
const PriceDisplay = memo(({ price }: { price: number }) => (
  <div className="text-2xl font-mono text-lime-600 transition-all duration-300 ease-in-out transform hover:scale-105">
    ${price.toFixed(2)}
  </div>
));

// Memoized volume display component
const VolumeDisplay = memo(({ volume }: { volume: number }) => (
  <div className="text-2xl font-mono transition-all duration-300 ease-in-out">
    ${(volume / 1e9).toFixed(2)}B
  </div>
));

// Memoized market cap display component
const MarketCapDisplay = memo(({ marketCap }: { marketCap: number }) => (
  <div className="text-xl font-mono transition-all duration-300 ease-in-out">
    ${(marketCap / 1e9).toFixed(2)}B
  </div>
));

// Memoized percentage change display component
const PercentChangeDisplay = memo(({ value }: { value: number }) => (
  <div className={`text-sm font-mono ${value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
    {value >= 0 ? '+' : ''}{value.toFixed(2)}%
  </div>
));

export default function MarketDataCard() {
  const [price, setPrice] = useState<number>(0);
  const [volume24h, setVolume24h] = useState<number>(0);
  const [marketCap, setMarketCap] = useState<number>(0);
  const [percentChange1h, setPercentChange1h] = useState<number>(0);
  const [percentChange24h, setPercentChange24h] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [priceChange, setPriceChange] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef<number>(0);
  const pollIntervalRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);

  const fetchMarketData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const response = await fetch('/api/market-data');
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.price && data.volume24h) {
        // Determine price change direction
        if (data.price > prevPriceRef.current) {
          setPriceChange('up');
        } else if (data.price < prevPriceRef.current) {
          setPriceChange('down');
        }
        prevPriceRef.current = data.price;

        setPrice(data.price);
        setVolume24h(data.volume24h);
        setMarketCap(data.marketCap);
        setPercentChange1h(data.percentChange1h);
        setPercentChange24h(data.percentChange24h);
        setLastUpdated(new Date(data.timestamp * 1000));
        setError(null);

        // Reset price change animation after a delay
        setTimeout(() => {
          if (isMountedRef.current) {
            setPriceChange(null);
          }
        }, 1000);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Error fetching market data');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Initial fetch
    fetchMarketData();

    // Set up polling
    pollIntervalRef.current = setInterval(fetchMarketData, 2000);

    // Cleanup
    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchMarketData]);

  if (error) {
    return (
      <div className="dashboard-card bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

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

  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <div className="dashboard-card bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-lime-600 mb-6 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Market Data
          {lastUpdated && (
            <span className="text-xs text-gray-500 ml-auto">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <small className="text-gray-500 mr-2">Price</small>
              <div className="flex items-center">
                {priceChange === 'up' ? (
                  <TrendingUp className="w-3 h-3 text-green-500 animate-bounce" />
                ) : priceChange === 'down' ? (
                  <TrendingDown className="w-3 h-3 text-red-500 animate-bounce" />
                ) : (
                  <TrendingUp className="w-3 h-3 text-gray-400" />
                )}
              </div>
            </div>
            <div className={`transition-all duration-300 ease-in-out ${
              priceChange === 'up' ? 'text-green-500 scale-110' :
              priceChange === 'down' ? 'text-red-500 scale-110' :
              'text-lime-600'
            }`}>
              <PriceDisplay price={price} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <small className="text-gray-500 mr-2">24h Volume</small>
              <div className="flex items-center">
                <TrendingDown className="w-3 h-3 text-gray-400" />
              </div>
            </div>
            <VolumeDisplay volume={volume24h} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <small className="text-gray-500 mr-2">Market Cap</small>
            </div>
            <MarketCapDisplay marketCap={marketCap} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <small className="text-gray-500 mr-2">1h Change</small>
            </div>
            <PercentChangeDisplay value={percentChange1h} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <small className="text-gray-500 mr-2">24h Change</small>
            </div>
            <PercentChangeDisplay value={percentChange24h} />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
} 