import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Validator } from '@/lib/api/types';

const SOLANA_BEACH_API = process.env.NEXT_PUBLIC_SOLANA_BEACH_API_URL || 'https://public-api.solanabeach.io';
const API_KEY = process.env.SOLANA_BEACH_API_KEY;

export async function GET(
  request: NextRequest,
  { params }: { params: { votePubkey: string } }
) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    const response = await fetch(`${SOLANA_BEACH_API}/v1/validators/${params.votePubkey}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Validator not found' },
          { status: 404 }
        );
      }
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: `API error: ${response.status} ${response.statusText}`, details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      data: {
        votePubkey: data.votePubkey,
        name: data.name || data.moniker || 'Unnamed Validator',
        version: data.version || 'Unknown',
        activatedStake: data.activatedStake || 0,
        commission: data.commission || 0,
        skipRate: data.skipRate || 0,
        lastVote: data.lastVote || Math.floor(Date.now() / 1000),
        voteDistance: data.voteDistance || 0,
        pictureURL: data.pictureURL || ''
      },
      timestamp: Date.now(),
      success: true
    } as ApiResponse<Validator>);
  } catch (error) {
    console.error('Error fetching validator details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch validator details' },
      { status: 500 }
    );
  }
} 