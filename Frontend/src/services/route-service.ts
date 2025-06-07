import MapboxService from './mapbox-service';

interface RoutePoint {
  coordinates: [number, number];
  name?: string;
}

interface RouteResult {
  route: [number, number][];
  distance: number;
  duration: number;
  instructions?: string[];
}

class RouteService {
  // Calculate route between two points
  static async calculateRoute(
    start: RoutePoint,
    end: RoutePoint,
    mode: 'fastest' | 'balanced' | 'energy' = 'balanced'
  ): Promise<RouteResult> {
    try {
      console.log('Calculating route:', { start, end, mode });
      
      // Use MapboxService for route calculation
      const result = await MapboxService.getDirections(
        start.coordinates,
        end.coordinates,
        mode
      );

      if (result.routes.length === 0) {
        throw new Error('No route found');
      }

      const route = result.routes[0];
      const coordinates = route.geometry.coordinates as [number, number][];
      
      console.log('Route calculated successfully:', {
        distance: route.distance,
        duration: route.duration,
        points: coordinates.length
      });

      return {
        route: coordinates,
        distance: route.distance,
        duration: route.duration,
        instructions: [] // MapboxService doesn't provide detailed instructions
      };

    } catch (error) {
      console.error('Route calculation failed:', error);
      
      // Fallback to straight line route
      console.log('Using fallback straight-line route');
      return this.createStraightLineRoute(start.coordinates, end.coordinates);
    }
  }

  // Create a simple straight-line route as fallback
  private static createStraightLineRoute(
    start: [number, number],
    end: [number, number]
  ): RouteResult {
    // Calculate approximate distance using Haversine formula
    const distance = this.calculateDistance(start, end);
    
    // Create waypoints for smoother animation
    const waypoints: [number, number][] = [];
    const steps = Math.max(5, Math.floor(distance / 1000)); // One point per km minimum
    
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const lng = start[0] + (end[0] - start[0]) * ratio;
      const lat = start[1] + (end[1] - start[1]) * ratio;
      waypoints.push([lng, lat]);
    }

    return {
      route: waypoints,
      distance: distance,
      duration: distance / 50 * 3.6, // Assume 50 km/h average speed
      instructions: ['Head towards destination', 'Continue straight', 'Arrive at destination']
    };
  }

  // Calculate distance between two coordinates (Haversine formula)
  private static calculateDistance(
    coord1: [number, number],
    coord2: [number, number]
  ): number {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = coord1[1] * Math.PI / 180;
    const lat2Rad = coord2[1] * Math.PI / 180;
    const deltaLatRad = (coord2[1] - coord1[1]) * Math.PI / 180;
    const deltaLngRad = (coord2[0] - coord1[0]) * Math.PI / 180;

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Get route from location names (geocoding + routing)
  static async calculateRouteFromNames(
    startName: string,
    endName: string,
    mode: 'fastest' | 'balanced' | 'energy' = 'balanced'
  ): Promise<RouteResult> {
    try {
      console.log('Calculating route from names:', { startName, endName, mode });

      // Geocode start and end locations
      const startResult = await MapboxService.geocode(startName);
      const endResult = await MapboxService.geocode(endName);

      if (!startResult.features.length || !endResult.features.length) {
        throw new Error('Could not find one or both locations');
      }

      const start: RoutePoint = {
        coordinates: startResult.features[0].center,
        name: startResult.features[0].place_name
      };

      const end: RoutePoint = {
        coordinates: endResult.features[0].center,
        name: endResult.features[0].place_name
      };

      return await this.calculateRoute(start, end, mode);

    } catch (error) {
      console.error('Route calculation from names failed:', error);
      throw error;
    }
  }

  // Validate coordinates
  static isValidCoordinate(coord: [number, number]): boolean {
    const [lng, lat] = coord;
    return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
  }

  // Snap coordinates to road (basic implementation)
  static async snapToRoad(coordinates: [number, number][]): Promise<[number, number][]> {
    // For now, return original coordinates
    // In future, could use Mapbox Map Matching API
    return coordinates;
  }

  // Get route from coordinates to location name (mixed input)
  static async calculateRouteFromCoordinatesToName(
    startCoords: [number, number],
    endName: string,
    mode: 'fastest' | 'balanced' | 'energy' = 'balanced'
  ): Promise<RouteResult> {
    try {
      console.log('Calculating route from coordinates to name:', { startCoords, endName, mode });

      // Validate start coordinates
      if (!this.isValidCoordinate(startCoords)) {
        throw new Error('Invalid start coordinates');
      }

      // Geocode only the end location
      const endResult = await MapboxService.geocode(endName);

      if (!endResult.features.length) {
        throw new Error(`Could not find destination: ${endName}`);
      }

      const start: RoutePoint = {
        coordinates: startCoords,
        name: `Vehicle Location (${startCoords[1].toFixed(4)}, ${startCoords[0].toFixed(4)})`
      };

      const end: RoutePoint = {
        coordinates: endResult.features[0].center,
        name: endResult.features[0].place_name
      };

      console.log('Geocoded destination:', end);

      return await this.calculateRoute(start, end, mode);

    } catch (error) {
      console.error('Route calculation from coordinates to name failed:', error);
      throw error;
    }
  }
}

export default RouteService;
export type { RoutePoint, RouteResult }; 