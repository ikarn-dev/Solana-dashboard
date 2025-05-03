import { NextResponse } from 'next/server';
import { Validator, TopValidator } from '@/lib/api/types';
import { getTopValidators } from '@/lib/api/solana';

// Mock data for testing
const mockValidators: Validator[] = [
  {
    votePubkey: 'mock1',
    name: 'Mock Validator 1',
    version: '1.0.0',
    activatedStake: 0,
    commission: 0,
    skipRate: 0,
    lastVote: 0,
    voteDistance: 0,
    ll: [0, 0],
    pictureURL: '',
    rank: 1
  }
];

export async function GET() {
  try {
    const validators = await getTopValidators();
    
    if (!validators.success || !validators.data) {
      console.error('Failed to fetch validators:', validators.error);
      return NextResponse.json(mockValidators);
    }

    // Transform TopValidator[] to Validator[]
    const mappedValidators: Validator[] = validators.data.map((v: TopValidator, index: number) => ({
      votePubkey: v.votePubkey,
      name: v.moniker || 'Unnamed Validator',
      version: v.version || 'Unknown',
      activatedStake: v.activatedStake,
      commission: v.commission,
      skipRate: 0, // Default value since it's not in TopValidator
      lastVote: v.lastVote,
      voteDistance: 0, // Default value since it's not in TopValidator
      ll: v.ll || [0, 0],
      pictureURL: v.pictureURL || '',
      rank: index + 1
    }));

    return NextResponse.json(mappedValidators);
  } catch (error) {
    console.error('Error fetching validators:', error);
    return NextResponse.json(mockValidators);
  }
} 