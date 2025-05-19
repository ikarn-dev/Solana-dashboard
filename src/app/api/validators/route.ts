import { NextResponse } from 'next/server';

const API_KEY = process.env.SOLANA_BEACH_API_KEY;
const API_URL = process.env.NEXT_PUBLIC_SOLANA_API_URL || 'https://api.solanaview.com';

// Add CORS headers to all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(request: Request) {
  try {
    if (!API_KEY) {
      console.error('API key is not configured');
      return NextResponse.json(
        { error: 'API key is not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    if (!API_URL) {
      console.error('API URL is not configured');
      return NextResponse.json(
        { error: 'API URL is not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';
    const offset = searchParams.get('offset') || '0';

    // Using the correct V2 endpoint for validators
    const apiUrl = `${API_URL}/v2/validator-list?limit=${limit}&offset=${offset}`;
    console.log('Fetching validators from:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API response error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      return NextResponse.json(
        { 
          error: 'Failed to fetch validators', 
          details: errorData,
          status: response.status,
          statusText: response.statusText
        },
        { status: response.status, headers: corsHeaders }
      );
    }

    const data = await response.json();
    console.log('API Response data:', JSON.stringify(data, null, 2));

    // Transform the response to match expected format
    const transformedData = {
      validators: data.validatorList.map((validator: any) => ({
        votePubkey: validator.votePubkey,
        name: validator.name,
        version: validator.version,
        activatedStake: validator.activatedStake,
        commission: validator.commission,
        lastVote: validator.lastVote,
        pictureURL: validator.iconUrl,
        delegatorCount: validator.stakeAccounts,
        delinquent: validator.delinquent
      })),
      pagination: {
        total: data.total || data.validatorList.length,
        offset: parseInt(offset),
        limit: parseInt(limit)
      }
    };

    console.log('Transformed data:', JSON.stringify(transformedData, null, 2));
    return NextResponse.json(transformedData, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in validators API route:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: corsHeaders
  });
} 