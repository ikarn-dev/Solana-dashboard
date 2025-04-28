'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getValidatorDetails } from '@/lib/api/solana';
import { Validator } from '@/lib/api/types';
import { getLocationFromCoordinates, LocationInfo } from '@/lib/utils/geocoding';
import Reloading from '@/components/Reloading';

export default function ValidatorProfilePage() {
  const { votePubkey } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [validator, setValidator] = useState<Validator | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);

  useEffect(() => {
    const fetchValidatorDetails = async () => {
      try {
        setIsLoading(true);
        const validatorData = await getValidatorDetails(votePubkey as string);
        setValidator(validatorData);

        // Fetch location information if coordinates are available
        if (validatorData.ll && validatorData.ll[0] !== 0 && validatorData.ll[1] !== 0) {
          const location = await getLocationFromCoordinates(validatorData.ll);
          setLocationInfo(location);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load validator details');
        console.error('Error fetching validator details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (votePubkey) {
      fetchValidatorDetails();
    }
  }, [votePubkey]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-100 via-purple-50 to-indigo-50 text-gray-800 relative overflow-hidden font-sans">
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="blob w-[800px] h-[800px] rounded-[999px] absolute top-0 right-0 blur-3xl bg-opacity-60 bg-gradient-to-r from-indigo-200 via-purple-100 to-gray-200"></div>
          <div className="blob w-[1000px] h-[1000px] rounded-[999px] absolute bottom-0 left-0 blur-3xl bg-opacity-60 bg-gradient-to-r from-gray-300 via-purple-100 to-indigo-100"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto p-8">
          <Reloading />
        </div>
      </main>
    );
  }

  if (error || !validator) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-100 via-purple-50 to-indigo-50 text-gray-800 relative overflow-hidden font-sans">
        <div className="relative z-10 max-w-7xl mx-auto p-8">
          <div className="text-center text-red-500">
            {error || 'Validator not found'}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-lime-50 to-white relative overflow-hidden font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="blob w-[800px] h-[800px] rounded-[999px] absolute top-0 right-0 blur-3xl bg-opacity-60 bg-gradient-to-r from-lime-200 via-lime-100 to-gray-200"></div>
        <div className="blob w-[1000px] h-[1000px] rounded-[999px] absolute bottom-0 left-0 blur-3xl bg-opacity-60 bg-gradient-to-r from-gray-300 via-lime-100 to-gray-100"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto p-8">
        <div className="flex flex-col items-center mb-12">
          {validator.pictureURL ? (
            <img 
              src={validator.pictureURL} 
              alt={validator.name}
              className="w-32 h-32 rounded-full object-cover mb-6 shadow-lg border-4 border-lime-200"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-lime-100 flex items-center justify-center mb-6 shadow-lg border-4 border-lime-200">
              <span className="text-5xl font-bold text-lime-600">
                {validator.name?.charAt(0).toUpperCase() || 'V'}
              </span>
            </div>
          )}
          <a 
            href={`https://solscan.io/account/${validator.votePubkey}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-4xl font-bold text-lime-600 text-center hover:text-lime-700 transition-colors group flex items-center gap-2"
          >
            {validator.name || 'Unnamed Validator'}
            <svg className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <a 
            href={`https://solscan.io/account/${validator.votePubkey}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group flex items-center gap-2"
          >
            <span className="text-gray-500 font-mono text-sm group-hover:text-lime-600 transition-colors">
              {validator.votePubkey.slice(0, 4)}...{validator.votePubkey.slice(-4)}
            </span>
            <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 transform hover:scale-[1.02] transition-transform duration-300 border border-gray-100">
            <h2 className="text-xl font-semibold text-lime-600 mb-4 flex items-center gap-2">
              <span>Validator Details</span>
              <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></div>
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-gray-500">Version</span>
                <span className="font-medium bg-lime-50 px-3 py-1 rounded-full text-lime-700">
                  {validator.version || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-gray-500">Commission</span>
                <span className="font-medium bg-lime-50 px-3 py-1 rounded-full text-lime-700">
                  {typeof validator.commission === 'number' ? `${validator.commission}%` : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-gray-500">Activated Stake</span>
                <span className="font-medium bg-lime-50 px-3 py-1 rounded-full text-lime-700">
                  {typeof validator.activatedStake === 'number' && validator.activatedStake > 0 
                    ? `${(validator.activatedStake / 1e9).toFixed(2)} SOL` 
                    : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-gray-500">Skip Rate</span>
                <span className="font-medium bg-lime-50 px-3 py-1 rounded-full text-lime-700">
                  {typeof validator.skipRate === 'number' ? `${validator.skipRate}%` : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Last Vote</span>
                <span className="font-medium bg-lime-50 px-3 py-1 rounded-full text-lime-700">
                  {typeof validator.lastVote === 'number' && validator.lastVote > 0 
                    ? new Date(validator.lastVote * 1000).toLocaleString() 
                    : 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 transform hover:scale-[1.02] transition-transform duration-300 border border-gray-100">
            <h2 className="text-xl font-semibold text-lime-600 mb-4 flex items-center gap-2">
              <span>Location</span>
              <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></div>
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-gray-500">Coordinates</span>
                <span className="font-medium bg-lime-50 px-3 py-1 rounded-full text-lime-700">
                  {validator.ll && validator.ll[0] !== 0 && validator.ll[1] !== 0 
                    ? `${validator.ll[0]}, ${validator.ll[1]}`
                    : 'Unknown'}
                </span>
              </div>
              {locationInfo && (
                <>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <span className="text-gray-500">Location</span>
                    <span className="font-medium bg-lime-50 px-3 py-1 rounded-full text-lime-700">
                      {locationInfo.placeName}
                    </span>
                  </div>
                  {locationInfo.address && (
                    <div className="space-y-2 pt-3">
                      {locationInfo.address.city && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">City</span>
                          <span className="font-medium bg-lime-50 px-3 py-1 rounded-full text-lime-700">
                            {locationInfo.address.city}
                          </span>
                        </div>
                      )}
                      {locationInfo.address.state && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">State</span>
                          <span className="font-medium bg-lime-50 px-3 py-1 rounded-full text-lime-700">
                            {locationInfo.address.state}
                          </span>
                        </div>
                      )}
                      {locationInfo.address.country && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Country</span>
                          <span className="font-medium bg-lime-50 px-3 py-1 rounded-full text-lime-700">
                            {locationInfo.address.country}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 transform hover:scale-[1.02] transition-transform duration-300 border border-gray-100">
          <h2 className="text-xl font-semibold text-lime-600 mb-4 flex items-center gap-2">
            <span>Vote Public Key</span>
            <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></div>
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <a 
              href={`https://solscan.io/account/${validator.votePubkey}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono break-all hover:text-lime-600 transition-colors group flex items-center gap-2"
            >
              {validator.votePubkey}
              <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
} 