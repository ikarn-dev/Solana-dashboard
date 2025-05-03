import { NextResponse } from 'next/server';

// Function to fetch market data
async function fetchMarketData() {
  try {
    console.log('Fetching market data from SolanaView...');
    
    const apiKey = process.env.SOLANA_BEACH_API_KEY;
    if (!apiKey) {
      throw new Error('SOLANA_BEACH_API_KEY is not configured');
    }

    const response = await fetch('https://api.solanaview.com/v2/market-data', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Solana Dashboard/1.0',
        'Authorization': `Bearer ${apiKey}`,
        'Origin': 'https://solana-dashboard.vercel.app'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Raw API response:', data);
    
    // Validate required fields
    if (!data || typeof data.price !== 'number' || typeof data.volume24h !== 'number') {
      console.error('Invalid data format:', data);
      throw new Error('Invalid market data response format');
    }

    // Return data in the expected format
    return {
      price: data.price,
      volume24h: data.volume24h,
      percentChange1h: data.percentChange1h || 0,
      percentChange24h: data.percentChange24h || 0,
      marketCap: data.marketCap || 0,
      timestamp: data.timestamp || Math.floor(Date.now() / 1000)
    };
  } catch (error) {
    console.error('Error in fetchMarketData:', error);
    throw error; // Let the calling function handle the error
  }
}

export async function GET() {
  try {
    const data = await fetchMarketData();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error in market data API route:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch market data',
      timestamp: Math.floor(Date.now() / 1000)
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 