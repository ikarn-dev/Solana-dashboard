import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiKey = process.env.SOLANA_BEACH_API_KEY;
    const apiUrl = process.env.NEXT_PUBLIC_SOLANA_API_URL || 'https://api.solanaview.com';

    if (!apiKey) {
      return NextResponse.json({ 
        success: false,
        error: 'API key not configured',
        data: { apy: 0 },
        timestamp: Date.now()
      }, { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    const response = await fetch(`${apiUrl}/v1/staking-apy`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false,
          error: response.status === 403 ? 'API key is invalid or has insufficient permissions' : 'Failed to fetch APY data',
          data: { apy: 0 },
          timestamp: Date.now()
        },
        { 
          status: response.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }

    const rawData = await response.json();
    const apyValue = parseFloat(rawData.apy) || 0;

    // Log the raw data and parsed value for debugging
    console.log('APY API Response:', {
      rawData,
      parsedApy: apyValue
    });

    return NextResponse.json({ 
      success: true,
      data: {
        apy: apyValue
      },
      timestamp: Date.now()
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      data: { apy: 0 },
      timestamp: Date.now()
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
} 