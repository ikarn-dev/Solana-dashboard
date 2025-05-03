import { NextResponse } from 'next/server';

// Add CORS headers to all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_SOLANA_API_URL || 'https://api.solanaview.com';
    const apiKey = process.env.SOLANA_BEACH_API_KEY;
    
    if (!apiKey) {
      throw new Error('Solana Beach API key is not configured');
    }

    const response = await fetch(`${apiUrl}/v1/network-status`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API responded with status: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data, {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Error in network-status route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch network status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: corsHeaders
  });
} 