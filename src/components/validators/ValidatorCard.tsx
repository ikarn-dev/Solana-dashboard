import { TopValidator } from '@/lib/api/types';
import Link from 'next/link';

interface ValidatorCardProps {
  validator: TopValidator;
}

export function ValidatorCard({ validator }: ValidatorCardProps) {
  return (
    <Link href={`/validators/${validator.votePubkey}`}>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center space-x-4 mb-4">
          {validator.pictureURL ? (
            <div className="relative w-12 h-12 rounded-full overflow-hidden">
              <img
                src={validator.pictureURL}
                alt={validator.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-xl">
                {(validator.name || validator.votePubkey.slice(0, 4)).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{validator.name || validator.votePubkey.slice(0, 4)}</h3>
            <p className="text-sm text-gray-500">Version: {validator.version || 'Unknown'}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Commission:</span>
            <span className="font-medium">{validator.commission}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Stake:</span>
            <span className="font-medium">
              {(Number(validator.activatedStake) / 1e9).toFixed(2)} SOL
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Delegators:</span>
            <span className="font-medium">{validator.delegatorCount}</span>
          </div>
          {validator.delinquent && (
            <div className="mt-2 text-sm text-red-600 font-medium">
              Delinquent
            </div>
          )}
        </div>
      </div>
    </Link>
  );
} 