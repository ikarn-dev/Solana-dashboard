// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// Network Status Types
export interface NetworkStatus {
  lastSyncedSlot: number;
  lastNetworkSlot: number;
  networkLag: number;
  laggingBehind: boolean;
  epochProgress: number;
  currentEpoch: number;
  slotsPerEpoch: number;
}

// Supply Breakdown Types
export interface SupplyBreakdown {
  supply: {
    circulating: number;
    nonCirculating: number;
    total: number;
  };
  stake: {
    effective: number;
    activating: number;
    deactivating: number;
  };
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// Cache Types
export interface CacheConfig {
  ttl: number;
  key: string;
}

// Rate Limit Types
export interface RateLimitConfig {
  requests: number;
  window: number;
}

// TPS Types
export interface TPSData {
  voteTransactionsPerSecond: number;
  userTransactionsPerSecond: number;
  totalTransactionsPerSecond: number;
}

// Market Data Types
export interface MarketData {
  timestamp: number;
  price: number;
  percentChange1h: number;
  percentChange24h: number;
  volume24h: number;
  marketCap: number;
  fullyDilutedMarketCap: number;
  history: Array<{
    timestamp: number;
    price: number;
    volume24h: number;
  }>;
}

// Validator Types
export interface Validator {
  votePubkey: string;
  name: string;
  version: string;
  activatedStake: number;
  commission: number;
  skipRate: number;
  lastVote: number;
  voteDistance: number;
  ll: [number, number];
  pictureURL: string;
  rank?: number;
  website?: string;
  delegatorCount?: number;
  epochCredits?: number;
  epochVoteAccount?: boolean;
  identity?: string;
  rootSlot?: number;
  credits?: number;
  epoch?: number;
}

// General Info Types
export interface GeneralInfo {
  activatedStake: number;
  avgBlockTime_24h: number;
  avgBlockTime_1h: number;
  avgBlockTime_1min: number;
  circulatingSupply: number;
  dailyPriceChange: number;
  dailyVolume: number;
  delinquentStake: number;
  epochInfo: {
    absoluteEpochStartSlot: number;
    absoluteSlot: number;
    blockHeight: number;
    epoch: number;
    slotIndex: number;
    slotsInEpoch: number;
    epochStartTime: number;
  };
  stakingYield: number;
  tokenPrice: number;
  totalDelegatedStake: number;
  totalSupply: number;
  avgLastVote: number;
  epoch: number;
  skipRate: {
    skipRate: number;
    stakeWeightedSkipRate: number;
  };
  stakeWeightedNodeVersions: Array<{
    index: number;
    version: string;
    value: number;
  }>;
  stakingYieldAdjusted: number;
  avgTPS: number;
  totalTransactionCount: number;
  nrValidators: number;
  nrNonValidators: number;
  superminority: {
    stake: number;
    nr: number;
  };
  dailyRewards: number;
}

export interface RecentBlock {
  slot: string;
  blockTime: string;
  voteTransactions: number;
  userTransactions: number;
  fees: string;
  votePubkey: string;
  name: string | null;
  iconUrl: string | null;
}

export interface RecentBlocksResponse {
  blocks: RecentBlock[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
  };
}

// Top Validator Types
export interface TopValidator {
  activatedStake: number;
  commission: number;
  votePubkey: string;
  delegatorCount: number;
  ll: [number, number];
  moniker: string;
  version: string;
  lastVote: number;
  pictureURL: string;
}

// Recent Transaction Types
export interface TransactionAccount {
  isSigner: boolean;
  isWritable: boolean;
  isLUT: boolean;
  account: {
    address: string;
    name?: string;
    pubkey?: string;
    ticker?: string;
    cmcid?: string | null;
    logo?: string;
    meta?: {
      mintAuthority?: string;
      freezeAuthority?: string;
    };
    decimals?: number;
  };
}

export interface TransactionInstruction {
  parsed?: {
    [key: string]: any;
  };
  raw?: {
    data: string;
    accounts: number[];
    stackHeight: number | null;
    programIdIndex: number;
  };
  programId: {
    address: string;
    name?: string;
    decimals?: number;
  };
  innerInstructions?: TransactionInstruction[];
}

export interface Transaction {
  transactionHash: string;
  blockNumber: number;
  index: number;
  accounts: TransactionAccount[];
  header: {
    numRequiredSignatures: number;
    numReadonlySignedAccounts: number;
    numReadonlyUnsignedAccounts: number;
  };
  instructions: TransactionInstruction[];
}

export interface RecentTransactionsResponse {
  transactions: Transaction[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
  };
}

export interface ValidatorDetails extends TopValidator {
  ll: [number, number];
}

export interface Marker {
  nodeCount: number;
  svg: {
    x: number;
    y: number;
  };
  longitude: number;
  latitude: number;
  pubkeys: string[];
}

