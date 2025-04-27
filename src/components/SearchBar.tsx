import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RecentBlock, 
  Transaction, 
  Validator, 
  MarketData,
  TransactionAccount,
  TransactionInstruction
} from '@/lib/api/types';

interface SearchResult {
  type: 'block' | 'transaction' | 'validator' | 'market';
  data: RecentBlock | Transaction | Validator | MarketData;
  score: number;
  matchedFields: string[];
}

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();

  // Debounce search
  const debouncedSearch = useCallback(
    (query: string) => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      // Search across all endpoints
      Promise.all([
        fetch('/api/recent-blocks?limit=50'),
        fetch('/api/recent-transactions?limit=50'),
        fetch('/api/validators'),
        fetch('/api/market-data')
      ])
        .then(responses => Promise.all(responses.map(r => r.json())))
        .then(([blocks, transactions, validators, marketData]) => {
          const searchResults: SearchResult[] = [];
          const queryLower = query.toLowerCase();

          // Search in blocks
          blocks.data.blocks.forEach((block: RecentBlock) => {
            const matchedFields: string[] = [];
            let score = 0;

            // Search in all block fields
            if (block.slot.toLowerCase().includes(queryLower)) {
              matchedFields.push('Slot');
              score += 10;
            }
            if (block.blockTime.toLowerCase().includes(queryLower)) {
              matchedFields.push('Block Time');
              score += 8;
            }
            if (block.voteTransactions.toString().includes(queryLower)) {
              matchedFields.push('Vote Transactions');
              score += 6;
            }
            if (block.userTransactions.toString().includes(queryLower)) {
              matchedFields.push('User Transactions');
              score += 6;
            }
            if (block.fees.toLowerCase().includes(queryLower)) {
              matchedFields.push('Fees');
              score += 6;
            }
            if (block.votePubkey.toLowerCase().includes(queryLower)) {
              matchedFields.push('Vote Pubkey');
              score += 8;
            }
            if (block.name?.toLowerCase().includes(queryLower)) {
              matchedFields.push('Name');
              score += 8;
            }
            if (block.iconUrl?.toLowerCase().includes(queryLower)) {
              matchedFields.push('Icon URL');
              score += 4;
            }

            if (matchedFields.length > 0) {
              searchResults.push({
                type: 'block',
                data: block,
                score,
                matchedFields
              });
            }
          });

          // Search in transactions
          transactions.data.transactions.forEach((tx: Transaction) => {
            const matchedFields: string[] = [];
            let score = 0;

            // Search in transaction fields
            if (tx.transactionHash.toLowerCase() === queryLower) {
              matchedFields.push('Transaction Hash (Exact)');
              score += 20;
            } else if (tx.transactionHash.toLowerCase().includes(queryLower)) {
              matchedFields.push('Transaction Hash');
              score += 10;
            }

            if (tx.blockNumber.toString() === queryLower) {
              matchedFields.push('Block Number (Exact)');
              score += 15;
            } else if (tx.blockNumber.toString().includes(queryLower)) {
              matchedFields.push('Block Number');
              score += 8;
            }

            // Search in transaction header
            if (tx.header.numRequiredSignatures.toString().includes(queryLower)) {
              matchedFields.push('Required Signatures');
              score += 6;
            }
            if (tx.header.numReadonlySignedAccounts.toString().includes(queryLower)) {
              matchedFields.push('Readonly Signed Accounts');
              score += 6;
            }
            if (tx.header.numReadonlyUnsignedAccounts.toString().includes(queryLower)) {
              matchedFields.push('Readonly Unsigned Accounts');
              score += 6;
            }

            // Search in accounts
            tx.accounts.forEach((acc: TransactionAccount) => {
              if (acc.account.address.toLowerCase() === queryLower) {
                matchedFields.push('Account Address (Exact)');
                score += 12;
              } else if (acc.account.address.toLowerCase().includes(queryLower)) {
                matchedFields.push('Account Address');
                score += 6;
              }
              if (acc.account.name?.toLowerCase().includes(queryLower)) {
                matchedFields.push('Account Name');
                score += 6;
              }
              if (acc.account.pubkey?.toLowerCase().includes(queryLower)) {
                matchedFields.push('Account Pubkey');
                score += 6;
              }
              if (acc.account.ticker?.toLowerCase().includes(queryLower)) {
                matchedFields.push('Account Ticker');
                score += 6;
              }
              if (acc.account.cmcid?.toLowerCase().includes(queryLower)) {
                matchedFields.push('Account CMCID');
                score += 6;
              }
              if (acc.account.logo?.toLowerCase().includes(queryLower)) {
                matchedFields.push('Account Logo');
                score += 4;
              }
              if (acc.account.decimals?.toString().includes(queryLower)) {
                matchedFields.push('Account Decimals');
                score += 4;
              }
            });

            // Search in instructions
            tx.instructions.forEach((instr: TransactionInstruction) => {
              if (instr.programId.address.toLowerCase().includes(queryLower)) {
                matchedFields.push('Program ID');
                score += 8;
              }
              if (instr.programId.name?.toLowerCase().includes(queryLower)) {
                matchedFields.push('Program Name');
                score += 6;
              }
              if (instr.programId.decimals?.toString().includes(queryLower)) {
                matchedFields.push('Program Decimals');
                score += 4;
              }
              if (instr.raw?.data.toLowerCase().includes(queryLower)) {
                matchedFields.push('Raw Data');
                score += 6;
              }
            });

            if (matchedFields.length > 0) {
              searchResults.push({
                type: 'transaction',
                data: tx,
                score,
                matchedFields
              });
            }
          });

          // Search in validators
          validators.data.forEach((validator: Validator) => {
            const matchedFields: string[] = [];
            let score = 0;

            // Search in all validator fields
            if (validator.votePubkey.toLowerCase() === queryLower) {
              matchedFields.push('Vote Pubkey (Exact)');
              score += 20;
            } else if (validator.votePubkey.toLowerCase().includes(queryLower)) {
              matchedFields.push('Vote Pubkey');
              score += 10;
            }

            if (validator.name?.toLowerCase().includes(queryLower)) {
              matchedFields.push('Name');
              score += 8;
            }
            if (validator.version?.toLowerCase().includes(queryLower)) {
              matchedFields.push('Version');
              score += 6;
            }
            if (validator.activatedStake?.toString().includes(queryLower)) {
              matchedFields.push('Activated Stake');
              score += 8;
            }
            if (validator.commission?.toString().includes(queryLower)) {
              matchedFields.push('Commission');
              score += 6;
            }
            if (validator.skipRate?.toString().includes(queryLower)) {
              matchedFields.push('Skip Rate');
              score += 6;
            }
            if (validator.lastVote?.toString().includes(queryLower)) {
              matchedFields.push('Last Vote');
              score += 6;
            }
            if (validator.voteDistance?.toString().includes(queryLower)) {
              matchedFields.push('Vote Distance');
              score += 6;
            }

            if (matchedFields.length > 0) {
              searchResults.push({
                type: 'validator',
                data: validator,
                score,
                matchedFields
              });
            }
          });

          // Search in market data
          if (marketData.data) {
            const market = marketData.data;
            const matchedFields: string[] = [];
            let score = 0;

            if (market.price.toString().includes(queryLower)) {
              matchedFields.push('Price');
              score += 10;
            }
            if (market.percentChange1h.toString().includes(queryLower)) {
              matchedFields.push('1h Change');
              score += 8;
            }
            if (market.percentChange24h.toString().includes(queryLower)) {
              matchedFields.push('24h Change');
              score += 8;
            }
            if (market.volume24h.toString().includes(queryLower)) {
              matchedFields.push('24h Volume');
              score += 8;
            }
            if (market.marketCap.toString().includes(queryLower)) {
              matchedFields.push('Market Cap');
              score += 8;
            }
            if (market.fullyDilutedMarketCap.toString().includes(queryLower)) {
              matchedFields.push('Fully Diluted Market Cap');
              score += 8;
            }

            if (matchedFields.length > 0) {
              searchResults.push({
                type: 'market',
                data: market,
                score,
                matchedFields
              });
            }
          }

          // Sort results by score and type
          searchResults.sort((a, b) => {
            if (b.score !== a.score) {
              return b.score - a.score;
            }
            // If scores are equal, prioritize exact matches
            const aHasExact = a.matchedFields.some(f => f.includes('(Exact)'));
            const bHasExact = b.matchedFields.some(f => f.includes('(Exact)'));
            if (aHasExact !== bHasExact) {
              return bHasExact ? 1 : -1;
            }
            return 0;
          });

          setResults(searchResults.slice(0, 5)); // Show top 5 results
        })
        .catch(error => {
          console.error('Search error:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, debouncedSearch]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'block' && 'slot' in result.data) {
      router.push(`/blocks/${result.data.slot}`);
    } else if (result.type === 'transaction' && 'transactionHash' in result.data) {
      router.push(`/transactions/${result.data.transactionHash}`);
    } else if (result.type === 'validator' && 'votePubkey' in result.data) {
      router.push(`/validators/${result.data.votePubkey}`);
    }
    setSearchQuery('');
    setResults([]);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder="Search by validator name/address, transaction hash, block number, or any other field..."
          className="w-full px-6 py-4 text-gray-700 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
        />
        <button
          type="button"
          className="absolute right-4 top-1/2 -translate-y-1/2"
          onClick={() => {
            setSearchQuery('');
            setResults([]);
          }}
        >
          {searchQuery ? (
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          ) : (
            <Search className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {showResults && (searchQuery.length > 0 || isLoading) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg overflow-hidden"
          >
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Searching...</div>
            ) : results.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleResultClick(result)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {result.type === 'block' && (
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 text-sm">B</span>
                          </div>
                        )}
                        {result.type === 'transaction' && (
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-600 text-sm">T</span>
                          </div>
                        )}
                        {result.type === 'validator' && (
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-purple-600 text-sm">V</span>
                          </div>
                        )}
                        {result.type === 'market' && (
                          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                            <span className="text-yellow-600 text-sm">M</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {result.type === 'block' && 'slot' in result.data && `Block ${result.data.slot}`}
                          {result.type === 'transaction' && 'transactionHash' in result.data && `Transaction ${result.data.transactionHash.slice(0, 8)}...`}
                          {result.type === 'validator' && 'votePubkey' in result.data && (result.data.name || result.data.votePubkey.slice(0, 8) + '...')}
                          {result.type === 'market' && 'Market Data'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {result.type === 'block' && 'votePubkey' in result.data && `Vote Pubkey: ${result.data.votePubkey.slice(0, 8)}...`}
                          {result.type === 'transaction' && 'blockNumber' in result.data && `Block: ${result.data.blockNumber}`}
                          {result.type === 'validator' && 'votePubkey' in result.data && `Vote Pubkey: ${result.data.votePubkey.slice(0, 8)}...`}
                          {result.type === 'market' && 'price' in result.data && `Price: $${result.data.price}`}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Matched in: {result.matchedFields.join(', ')}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">No results found</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 