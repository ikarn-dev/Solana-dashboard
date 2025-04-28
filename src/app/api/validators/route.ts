import { NextResponse } from 'next/server';
import { getTopValidators } from '@/lib/api/solana';
import { ApiResponse, Validator } from '@/lib/api/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const validators = await getTopValidators(offset);
    
    // Transform TopValidator[] to Validator[]
    const mappedValidators: Validator[] = validators.data.map((v, index) => ({
      votePubkey: v.votePubkey,
      name: v.moniker || 'Unnamed Validator',
      version: v.version || 'Unknown',
      activatedStake: v.activatedStake || 0,
      commission: v.commission || 0,
      skipRate: 0, // Default value since it's not in TopValidator
      lastVote: v.lastVote || Math.floor(Date.now() / 1000),
      voteDistance: 0, // Default value since it's not in TopValidator
      ll: v.ll || [0, 0],
      pictureURL: v.pictureURL || '',
      rank: index + 1,
      website: undefined
    }));

    return NextResponse.json({
      data: mappedValidators,
      timestamp: Date.now(),
      success: true
    } as ApiResponse<Validator[]>);
  } catch (error) {
    console.error('Error fetching validators:', error);
    return NextResponse.json(
      {
        data: [],
        timestamp: Date.now(),
        success: false
      } as ApiResponse<Validator[]>,
      { status: 500 }
    );
  }
} 