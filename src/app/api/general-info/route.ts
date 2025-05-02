import { NextResponse } from 'next/server';
import { GeneralInfo } from '@/lib/api/types';
import { getGeneralInfo } from '@/lib/api/solana';

// Mock data for development/testing
const mockData: GeneralInfo = {
  activatedStake: 0,
  avgBlockTime_24h: 0,
  avgBlockTime_1h: 0,
  avgBlockTime_1min: 0,
  circulatingSupply: 0,
  dailyPriceChange: 0,
  dailyVolume: 0,
  delinquentStake: 0,
  epochInfo: {
    absoluteEpochStartSlot: 0,
    absoluteSlot: 0,
    blockHeight: 0,
    epoch: 0,
    slotIndex: 0,
    slotsInEpoch: 0,
    epochStartTime: 0,
  },
  stakingYield: 0,
  tokenPrice: 0,
  totalDelegatedStake: 0,
  totalSupply: 0,
  avgLastVote: 0,
  epoch: 0,
  skipRate: {
    skipRate: 0,
    stakeWeightedSkipRate: 0,
  },
  stakeWeightedNodeVersions: [],
  stakingYieldAdjusted: 0,
  avgTPS: 0,
  totalTransactionCount: 0,
  nrValidators: 0,
  nrNonValidators: 0,
  superminority: {
    stake: 0,
    nr: 0,
  },
  dailyRewards: 0
};

export async function GET() {
  try {
    const response = await getGeneralInfo();

    if (!response.success) {
      return NextResponse.json(
        { error: 'Failed to fetch general info' },
        { status: 500 }
      );
    }

    // Ensure dailyRewards is properly formatted
    const formattedData = {
      ...response.data,
      dailyRewards: typeof response.data.dailyRewards === 'number' 
        ? response.data.dailyRewards 
        : 0
    };

    return NextResponse.json({
      data: formattedData,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error in general-info route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 