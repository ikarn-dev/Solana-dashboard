import { NextResponse } from 'next/server';
import { GeneralInfo } from '@/lib/api/types';

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
    const apiKey = process.env.SOLANA_BEACH_API_KEY;
    const apiUrl = process.env.NEXT_PUBLIC_SOLANA_BEACH_API_URL || 'https://public-api.solanabeach.io';

    if (!apiKey) {
      console.error('API key not configured');
      return NextResponse.json({ data: mockData }, { status: 200 });
    }

    // Fetch both general info and supply breakdown
    const [generalInfoResponse, supplyResponse] = await Promise.all([
      fetch(`${apiUrl}/v1/general-info`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        cache: 'no-store'
      }),
      fetch(`${apiUrl}/v2/supply-breakdown`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        cache: 'no-store'
      })
    ]);

    if (!generalInfoResponse.ok || !supplyResponse.ok) {
      console.error('API response not ok:', generalInfoResponse.status, supplyResponse.status);
      return NextResponse.json({ data: mockData }, { status: 200 });
    }

    const [generalInfoData, supplyData] = await Promise.all([
      generalInfoResponse.json(),
      supplyResponse.json()
    ]);

    // Calculate daily rewards based on total stake and APY
    const totalStake = Number(generalInfoData.activatedStake) || 0;
    const stakingYield = Number(generalInfoData.stakingYield) || 0;
    const dailyRewards = (totalStake * (stakingYield / 100)) / 365;

    // Transform the data to match our GeneralInfo interface
    const transformedData: GeneralInfo = {
      activatedStake: Number(generalInfoData.activatedStake) || 0,
      avgBlockTime_24h: Number(generalInfoData.avgBlockTime_24h) || 0,
      avgBlockTime_1h: Number(generalInfoData.avgBlockTime_1h) || 0,
      avgBlockTime_1min: Number(generalInfoData.avgBlockTime_1min) || 0,
      circulatingSupply: Number(generalInfoData.circulatingSupply) || 0,
      dailyPriceChange: Number(generalInfoData.dailyPriceChange) || 0,
      dailyVolume: Number(generalInfoData.dailyVolume) || 0,
      delinquentStake: Number(generalInfoData.delinquentStake) || 0,
      epochInfo: {
        absoluteEpochStartSlot: Number(generalInfoData.epochInfo?.absoluteEpochStartSlot) || 0,
        absoluteSlot: Number(generalInfoData.epochInfo?.absoluteSlot) || 0,
        blockHeight: Number(generalInfoData.epochInfo?.blockHeight) || 0,
        epoch: Number(generalInfoData.epochInfo?.epoch) || 0,
        slotIndex: Number(generalInfoData.epochInfo?.slotIndex) || 0,
        slotsInEpoch: Number(generalInfoData.epochInfo?.slotsInEpoch) || 0,
        epochStartTime: Number(generalInfoData.epochInfo?.epochStartTime) || 0,
      },
      stakingYield: Number(generalInfoData.stakingYield) || 0,
      tokenPrice: Number(generalInfoData.tokenPrice) || 0,
      totalDelegatedStake: Number(generalInfoData.totalDelegatedStake) || 0,
      totalSupply: Number(generalInfoData.totalSupply) || 0,
      avgLastVote: Number(generalInfoData.avgLastVote) || 0,
      epoch: Number(generalInfoData.epoch) || 0,
      skipRate: {
        skipRate: Number(generalInfoData.skipRate?.skipRate) || 0,
        stakeWeightedSkipRate: Number(generalInfoData.skipRate?.stakeWeightedSkipRate) || 0,
      },
      stakeWeightedNodeVersions: (generalInfoData.stakeWeightedNodeVersions || []).map((item: any) => ({
        index: Number(item.index) || 0,
        version: item.version || '',
        value: Number(item.value) || 0,
      })),
      stakingYieldAdjusted: Number(generalInfoData.stakingYieldAdjusted) || 0,
      avgTPS: Number(generalInfoData.avgTPS) || 0,
      totalTransactionCount: Number(generalInfoData.totalTransactionCount) || 0,
      nrValidators: Number(generalInfoData.nrValidators) || 0,
      nrNonValidators: Number(generalInfoData.nrNonValidators) || 0,
      superminority: {
        stake: Number(generalInfoData.superminority?.stake) || 0,
        nr: Number(generalInfoData.superminority?.nr) || 0,
      },
      dailyRewards: dailyRewards
    };

    return NextResponse.json({ 
      data: transformedData,
      timestamp: Date.now()
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('Error fetching general info:', error);
    return NextResponse.json({ data: mockData }, { status: 200 });
  }
} 