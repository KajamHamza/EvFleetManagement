import mapboxgl from 'mapbox-gl';

// This will be filled by user input or from environment
let MAPBOX_TOKEN = localStorage.getItem('mapbox_token') || '';

interface DirectionsResponse {
  routes: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: [number, number][];
      type: string;
    };
  }>;
  waypoints: Array<{
    name: string;
    location: [number, number];
  }>;
}

interface OptimizationResponse {
  trips: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: [number, number][];
      type: string;
    };
  }>;
  waypoints: Array<{
    name: string;
    location: [number, number];
  }>;
}

interface GeocodeResponse {
  features: Array<{
    id: string;
    place_name: string;
    center: [number, number];
  }>;
}

interface EVChargingFeature {
  id: string;
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    name?: string;
    full_address?: string;
    address?: string;
    brand?: string;
    operator?: string;
    phone?: string;
    website?: string;
    access?: string;
    hours?: string;
    power_kw?: number;
    pricing?: string;
    connectors?: Array<{
      type: string;
      power_kw: number;
      quantity: number;
      pricing?: string;
    }>;
    amenities?: string[];
    network?: string;
    status?: string;
  };
}

interface POIFeature {
  id: string;
  center: [number, number];
  text?: string;
  place_name: string;
  properties?: {
    category?: string;
    brand?: string;
  };
}

// Store the token when it's set
export const setMapboxToken = (token: string) => {
  MAPBOX_TOKEN = token;
  localStorage.setItem('mapbox_token', token);
  mapboxgl.accessToken = token;
  return token;
};

// Get the stored token
export const getMapboxToken = (): string => {
  return MAPBOX_TOKEN || localStorage.getItem('mapbox_token') || '';
};

// Save route data to a JSON file
export const saveRouteAsJSON = (
  route: [number, number][],
  start: [number, number],
  end: [number, number],
  distance: number,
  duration: number,
  vehicleInfo?: Record<string, unknown>
) => {
  const routeData = {
    timestamp: new Date().toISOString(),
    route,
    start,
    end,
    distance,
    duration,
    vehicle: vehicleInfo
  };
  
  const dataStr = JSON.stringify(routeData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  // Create download link
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `route_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  return true;
};

const MapboxService = {
  // Get directions (route) between two points
  getDirections: async (
    start: [number, number], 
    end: [number, number],
    optimize: 'fastest' | 'balanced' | 'energy' = 'balanced'
  ): Promise<DirectionsResponse> => {
    const token = getMapboxToken();
    if (!token) throw new Error('Mapbox token not set');
    
    // Convert optimization mode to Mapbox profile
    const profile = optimize === 'fastest' ? 'mapbox/driving' 
                  : optimize === 'energy' ? 'mapbox/driving-traffic'
                  : 'mapbox/driving'; // balanced is default
    
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/${profile}/${start[0]},${start[1]};${end[0]},${end[1]}?` +
      `alternatives=true&geometries=geojson&overview=full&steps=true&access_token=${token}`
    );
    
    if (!response.ok) {
      throw new Error(`Directions API error: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  // Optimize a route with multiple waypoints
  optimizeRoute: async (
    origin: [number, number],
    destination: [number, number],
    waypoints: [number, number][],
    profile: 'driving' | 'driving-traffic' = 'driving'
  ): Promise<OptimizationResponse> => {
    const token = getMapboxToken();
    if (!token) throw new Error('Mapbox token not set');
    
    // Create coordinates string for API call
    const coordinates = [
      origin,
      ...waypoints,
      destination
    ].map(coord => `${coord[0]},${coord[1]}`).join(';');
    
    const response = await fetch(
      `https://api.mapbox.com/optimized-trips/v1/mapbox/${profile}/${coordinates}?` +
      `geometries=geojson&overview=full&steps=true&access_token=${token}`
    );
    
    if (!response.ok) {
      throw new Error(`Optimization API error: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  // Geocode a location name to coordinates
  geocode: async (locationName: string): Promise<GeocodeResponse> => {
    const token = getMapboxToken();
    if (!token) throw new Error('Mapbox token not set');
    
    // Validate input
    if (!locationName || locationName.trim().length === 0) {
      throw new Error('Location name cannot be empty');
    }
    
    const encodedLocation = encodeURIComponent(locationName.trim());
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedLocation}.json?access_token=${token}&limit=5`;
    
    console.log('Geocoding request:', { locationName, encodedLocation, url });
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Geocoding API error response:', errorText);
        throw new Error(`Geocoding API error (${response.status}): ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Geocoding response:', data);
      
      return data;
    } catch (error) {
      console.error('Geocoding fetch error:', error);
      throw error;
    }
  },
  
  // Reverse geocode coordinates to a location name
  reverseGeocode: async (coordinates: [number, number]): Promise<GeocodeResponse> => {
    const token = getMapboxToken();
    if (!token) throw new Error('Mapbox token not set');
    
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?` +
      `access_token=${token}&limit=1`
    );
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding API error: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  // Save route information
  saveRoute: (routeData: Record<string, unknown>): boolean => {
    try {
      const dataStr = JSON.stringify(routeData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `route_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error("Error saving route:", error);
      return false;
    }
  },

  // EV Charge Finder API - Get nearby charging stations
  getEVChargingStations: async (
    coordinates: [number, number],
    radiusKm: number = 25,
    connectorTypes?: string[],
    powerLevels?: ('level_1' | 'level_2' | 'dc_fast')[]
  ): Promise<{
    features: Array<{
      id: string;
      geometry: {
        coordinates: [number, number];
      };
      properties: {
        name: string;
        address?: string;
        operator?: string;
        phone?: string;
        website?: string;
        access?: string;
        hours?: string;
        connectors?: Array<{
          type: string;
          power_kw: number;
          quantity: number;
          pricing?: string;
        }>;
        amenities?: string[];
        network?: string;
        status?: 'operational' | 'planned' | 'construction' | 'decommissioned';
      };
    }>;
  }> => {
    const token = getMapboxToken();
    if (!token) throw new Error('Mapbox token not set');
    
    // Build query parameters
    const params = new URLSearchParams({
      access_token: token,
      proximity: `${coordinates[0]},${coordinates[1]}`,
      radius: (radiusKm * 1000).toString(), // Convert km to meters
      limit: '50'
    });
    
    // Add connector type filters if specified
    if (connectorTypes && connectorTypes.length > 0) {
      params.append('connector_type', connectorTypes.join(','));
    }
    
    // Add power level filters if specified
    if (powerLevels && powerLevels.length > 0) {
      params.append('power_level', powerLevels.join(','));
    }
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/search/geocode/v6/forward?q=charging%20station&${params.toString()}`
      );
      
      if (!response.ok) {
        throw new Error(`EV Charge Finder API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform the response to match our expected format
      return {
        features: data.features?.map((feature: EVChargingFeature) => ({
          id: feature.id || `ev-station-${Math.random().toString(36).substr(2, 9)}`,
          geometry: {
            coordinates: feature.geometry.coordinates
          },
          properties: {
            name: feature.properties.name || feature.properties.full_address || 'EV Charging Station',
            address: feature.properties.full_address || feature.properties.address,
            operator: feature.properties.brand || feature.properties.operator,
            phone: feature.properties.phone,
            website: feature.properties.website,
            access: feature.properties.access || 'public',
            hours: feature.properties.hours,
            connectors: feature.properties.connectors || [
              {
                type: 'type_2',
                power_kw: feature.properties.power_kw || 22,
                quantity: 2,
                pricing: feature.properties.pricing
              }
            ],
            amenities: feature.properties.amenities || [],
            network: feature.properties.network,
            status: feature.properties.status || 'operational'
          }
        })) || []
      };
    } catch (error) {
      console.error('EV Charge Finder API error:', error);
      // Return fallback data structure
      return { features: [] };
    }
  },

  // Alternative EV station search using POI search
  searchEVStations: async (
    coordinates: [number, number],
    radiusKm: number = 25
  ): Promise<{
    features: Array<{
      id: string;
      geometry: {
        coordinates: [number, number];
      };
      properties: {
        name: string;
        address?: string;
        category?: string;
        brand?: string;
        poi_category?: string[];
      };
    }>;
  }> => {
    const token = getMapboxToken();
    if (!token) throw new Error('Mapbox token not set');
    
    try {
      // Search for various EV charging related POIs
      const searchTerms = [
        'electric vehicle charging station',
        'EV charging',
        'Tesla Supercharger',
        'ChargePoint',
        'Electrify America',
        'EVgo'
      ];
      
      const allResults = [];
      
      for (const term of searchTerms) {
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(term)}.json?` +
            `access_token=${token}&proximity=${coordinates[0]},${coordinates[1]}&` +
            `bbox=${coordinates[0] - 0.5},${coordinates[1] - 0.5},${coordinates[0] + 0.5},${coordinates[1] + 0.5}&limit=10`
          );
          
          if (response.ok) {
            const data = await response.json();
            allResults.push(...(data.features || []));
          }
        } catch (searchError) {
          console.warn(`Search failed for term "${term}":`, searchError);
        }
      }
      
      // Remove duplicates and format results
      const uniqueResults = Array.from(
        new Map(allResults.map(item => [item.id, item])).values()
      );
      
      return {
        features: uniqueResults.map((feature: POIFeature) => ({
          id: feature.id,
          geometry: {
            coordinates: feature.center
          },
          properties: {
            name: feature.text || feature.place_name,
            address: feature.place_name,
            category: feature.properties?.category,
            brand: feature.properties?.brand,
            poi_category: feature.properties?.category ? [feature.properties.category] : ['charging_station']
          }
        }))
      };
    } catch (error) {
      console.error('EV station search error:', error);
      return { features: [] };
    }
  },

  // Matrix API for getting distance and time to multiple destinations
  getMatrix: async (
    origins: [number, number][],
    destinations: [number, number][]
  ): Promise<{
    durations: number[][];
    distances: number[][];
  }> => {
    const token = getMapboxToken();
    if (!token) throw new Error('Mapbox token not set');
    
    const originCoords = origins.map(coord => `${coord[0]},${coord[1]}`).join(';');
    const destCoords = destinations.map(coord => `${coord[0]},${coord[1]}`).join(';');
    
    const response = await fetch(
      `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${originCoords};${destCoords}?` +
      `sources=${origins.map((_, i) => i).join(';')}&` +
      `destinations=${destinations.map((_, i) => origins.length + i).join(';')}&` +
      `access_token=${token}`
    );
    
    if (!response.ok) {
      throw new Error(`Matrix API error: ${response.statusText}`);
    }
    
    return response.json();
  }
};

export default MapboxService;
