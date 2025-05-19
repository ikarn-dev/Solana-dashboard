'use client';

import { useEffect, useState } from 'react';
import { getTopValidators } from '@/lib/api/solana';
import { TopValidator } from '@/lib/api/types';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import Link from 'next/link';

const ITEMS_PER_PAGE = 10;
const TOTAL_VALIDATORS = 100;

export default function ValidatorsPage() {
  const [validators, setValidators] = useState<TopValidator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(Math.ceil(TOTAL_VALIDATORS / ITEMS_PER_PAGE));

  useEffect(() => {
    const fetchValidators = async () => {
      try {
        setLoading(true);
        setError(null);
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        const response = await getTopValidators(ITEMS_PER_PAGE, offset);
        
        if (response.success && response.data) {
          setValidators(response.data);
          setTotalPages(Math.ceil(TOTAL_VALIDATORS / ITEMS_PER_PAGE));
        } else {
          setError(response.error || 'Failed to fetch validators');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchValidators();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Validators</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Validator
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Version
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stake
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Commission
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Delegators
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {validators.map((validator) => (
              <tr key={validator.votePubkey} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link href={`/validators/${validator.votePubkey}`} className="flex items-center space-x-3">
                    {validator.pictureURL ? (
                      <img
                        src={validator.pictureURL}
                        alt={validator.name || validator.votePubkey.slice(0, 4)}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">
                          {(validator.name || validator.votePubkey.slice(0, 4)).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {validator.name || validator.votePubkey.slice(0, 4)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {validator.votePubkey.slice(0, 8)}...
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {validator.version || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {(Number(validator.activatedStake) / 1e9).toFixed(2)} SOL
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {validator.commission}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {validator.delegatorCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {validator.delinquent ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Delinquent
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
} 