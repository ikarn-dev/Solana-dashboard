export interface LocationInfo {
  coordinates: [number, number];
  placeName: string;
  address?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

export async function getLocationFromCoordinates(coordinates: [number, number]): Promise<LocationInfo> {
  try {
    const [latitude, longitude] = coordinates;
    
    // Skip if coordinates are default/zero values
    if (latitude === 0 && longitude === 0) {
      return {
        coordinates,
        placeName: 'Unknown Location'
      };
    }

    // Use OpenStreetMap Nominatim API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Solana Staking Dashboard/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }

    const data = await response.json();

    // Extract relevant location information
    const placeName = data.display_name || 'Unknown Location';
    const address = {
      city: data.address?.city || data.address?.town || data.address?.village,
      state: data.address?.state,
      country: data.address?.country
    };

    return {
      coordinates,
      placeName,
      address
    };
  } catch (error) {
    console.error('Error fetching location:', error);
    return {
      coordinates,
      placeName: 'Unknown Location'
    };
  }
} 