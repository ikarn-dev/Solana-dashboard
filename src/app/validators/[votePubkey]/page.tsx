'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getValidatorDetails } from '@/lib/api/solana';
import { ValidatorDetails } from '@/lib/api/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

export default function ValidatorProfilePage() {
  const params = useParams();
  const [validator, setValidator] = useState<ValidatorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchValidatorDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getValidatorDetails(params.votePubkey as string);
        
        if (response.success && response.data) {
          setValidator(response.data);
        } else {
          setError(response.error || 'Failed to fetch validator details');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (params.votePubkey) {
      fetchValidatorDetails();
    }
  }, [params.votePubkey]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!validator) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <ErrorMessage message="Validator not found" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center space-x-6 mb-8">
          {validator.pictureURL ? (
            <div className="relative w-24 h-24 rounded-full overflow-hidden">
              <img
                src={validator.pictureURL}
                alt={validator.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-4xl">
                {(validator.name || validator.votePubkey.slice(0, 4)).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{validator.name || validator.votePubkey.slice(0, 4)}</h1>
            <p className="text-gray-600">Vote Account: {validator.votePubkey}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Stake Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Activated Stake:</span>
                <span className="font-medium">
                  {(Number(validator.activatedStake) / 1e9).toFixed(2)} SOL
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Commission:</span>
                <span className="font-medium">{validator.commission}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delegators:</span>
                <span className="font-medium">{validator.delegatorCount}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Node Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Version:</span>
                <span className="font-medium">{validator.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Vote:</span>
                <span className="font-medium">{validator.lastVote}</span>
              </div>
              {validator.delinquent && (
                <div className="text-red-600 font-medium">
                  Delinquent
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Skip Rate:</span>
                <span className="font-medium">{validator.skipRate || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Uptime:</span>
                <span className="font-medium">{validator.uptime || 0}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 