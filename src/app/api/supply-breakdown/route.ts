import { NextResponse } from 'next/server';
import { SupplyBreakdown } from '@/lib/api/types';

// Mock data for development/testing (values in lamports)
const mockData: SupplyBreakdown = {
  supply: {
    circulating: 389418866690434750, // ~389.42M SOL
    nonCirculating: 209902919878283050, // ~209.90M SOL
    total: 599321786568717800 // ~599.32M SOL
  },
  stake: {
    effective: 389418866690434750, // ~389.42M SOL
    activating: 3931410430463524, // ~3.93M SOL
    deactivating: 6603569997013932 // ~6.60M SOL
  }
};

export async function GET() {
  try {
    console.log('Fetching supply breakdown data...');
    
    const response = await fetch('https://public-api.solanabeach.io/v2/supply-breakdown', {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      console.error('API response not ok:', response.status, response.statusText);
      return NextResponse.json({ data: mockData }, { status: 200 });
    }

    const rawData = await response.json();
    console.log('Raw API response:', rawData);

    // Validate the data structure
    if (!isValidSupplyData(rawData)) {
      console.error('Invalid data structure:', rawData);
      return NextResponse.json({ data: mockData }, { status: 200 });
    }

    return NextResponse.json({ data: rawData }, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('Error fetching supply data:', error);
    return NextResponse.json({ data: mockData }, { status: 200 });
  }
}

// Helper function to validate supply data
function isValidSupplyData(data: any): data is SupplyBreakdown {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.supply === 'object' &&
    typeof data.supply.circulating === 'number' &&
    typeof data.supply.nonCirculating === 'number' &&
    typeof data.supply.total === 'number' &&
    typeof data.stake === 'object' &&
    typeof data.stake.effective === 'number' &&
    typeof data.stake.activating === 'number' &&
    typeof data.stake.deactivating === 'number'
  );
} 