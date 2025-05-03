'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { TopValidator } from '@/lib/api/types';
import { getValidatorDetails, getValidatorMarkers } from '@/lib/api/solana';
import { formatExactNumber } from '@/lib/utils';

interface ValidatorDetails extends TopValidator {
  ll: [number, number];
}

interface Marker {
  nodeCount: number;
  svg: {
    x: number;
    y: number;
  };
  longitude: number;
  latitude: number;
  pubkeys: string[];
}

export default function ValidatorProfilePage({ params }: { params: { votePubkey: string } }) {
  const [validator, setValidator] = useState<ValidatorDetails | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<string>('Loading...');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [validatorResponse, markersResponse] = await Promise.all([
          getValidatorDetails(params.votePubkey),
          getValidatorMarkers()
        ]);

        if (!validatorResponse.success || !validatorResponse.data) {
          throw new Error(validatorResponse.error || 'Failed to fetch validator data');
        }

        if (!markersResponse.success || !markersResponse.data) {
          throw new Error(markersResponse.error || 'Failed to fetch markers data');
        }

        setValidator(validatorResponse.data);
        setMarkers(markersResponse.data);

        // Find the marker for this validator
        const validatorMarker = markersResponse.data.find(marker => 
          marker.pubkeys.some(pubkey => params.votePubkey.startsWith(pubkey))
        );

        if (validatorMarker) {
          // Convert coordinates to location name
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${validatorMarker.latitude}&lon=${validatorMarker.longitude}`
            );
            const data = await response.json();
            setLocation(data.display_name || 'Unknown Location');
          } catch (err) {
            console.error('Error fetching location:', err);
            setLocation('Unknown Location');
          }
        }
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load validator data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.votePubkey]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-lime-50 to-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-lime-200/50 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-lime-200/50 rounded w-1/2"></div>
              <div className="h-4 bg-lime-200/50 rounded w-1/3"></div>
            </div>
          </div>
        </div>
        </div>
    );
  }

  if (error || !validator) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-lime-50 to-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg">
            <p className="text-red-600">Error: {error || 'Validator not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-lime-50 to-white p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-4 mb-6">
          {validator.pictureURL ? (
            <img 
              src={validator.pictureURL} 
                  alt={validator.moniker || 'Validator'} 
                  className="w-16 h-16 rounded-full object-cover border border-lime-200"
            />
          ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lime-100 to-lime-200 flex items-center justify-center border border-lime-200 overflow-hidden">
                  <span className="text-xl font-bold text-lime-600">
                    {(validator.moniker || validator.votePubkey.slice(0, 1)).toUpperCase()}
              </span>
            </div>
          )}
              <div>
                <h1 className="text-2xl font-bold text-lime-600">
                  {validator.moniker || 'Unknown Validator'}
                </h1>
                <p className="text-gray-500 font-mono text-sm">
                  {validator.votePubkey}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-lime-50/50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-lime-600 mb-2">Stake Information</h3>
                  <div className="space-y-2">
                    <p className="flex justify-between">
                      <span className="text-gray-600">Total Stake:</span>
                      <span className="font-mono">{formatExactNumber(validator.activatedStake)} SOL</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600">Delegators:</span>
                      <span className="font-mono">{formatExactNumber(validator.delegatorCount)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600">Commission:</span>
                      <span className="font-mono">{validator.commission}%</span>
                    </p>
            </div>
          </div>

                <div className="bg-lime-50/50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-lime-600 mb-2">Node Information</h3>
                  <div className="space-y-2">
                    <p className="flex justify-between">
                      <span className="text-gray-600">Version:</span>
                      <span className="font-mono">{validator.version}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600">Last Vote:</span>
                      <span className="font-mono">
                        {new Date(validator.lastVote * 1000).toLocaleString()}
                </span>
                    </p>
                  </div>
                        </div>
                        </div>

              <div className="space-y-4">
                <div className="bg-lime-50/50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-lime-600 mb-2">Location</h3>
                  <div className="space-y-2">
                    <p className="text-gray-600">{location}</p>
                    {validator.ll && (
                      <div className="mt-2">
                        <iframe
                          width="100%"
                          height="200"
                          frameBorder="0"
                          scrolling="no"
                          marginHeight={0}
                          marginWidth={0}
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${validator.ll[1]-0.1},${validator.ll[0]-0.1},${validator.ll[1]+0.1},${validator.ll[0]+0.1}&layer=mapnik&marker=${validator.ll[0]},${validator.ll[1]}`}
                        />
                        </div>
                      )}
                    </div>
            </div>
          </div>
        </div>
          </div>
        </motion.div>
      </div>
    </ErrorBoundary>
  );
} 