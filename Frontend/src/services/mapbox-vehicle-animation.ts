import mapboxgl from 'mapbox-gl';
import MapboxService from './mapbox-service';
import MapboxCarIconService from './mapbox-car-icon';

interface VehicleAnimationData {
  id: string;
  name: string;
  position: [number, number];
  batteryLevel: number;
  speed: number;
  isMoving: boolean;
  heading?: number;
  route?: [number, number][];
  routeProgress?: number;
}

interface AnimationOptions {
  followVehicle?: string; // Vehicle ID to follow
  cameraMode?: 'overview' | 'driving' | 'chase' | 'top-down' | 'birds-eye';
  enableTraffic?: boolean;
}

class MapboxVehicleAnimation {
  private map: mapboxgl.Map | null = null;
  private vehicles: Map<string, VehicleAnimationData> = new Map();
  private animationFrame: number | null = null;
  private lastUpdateTime = 0;
  private listeners: Array<(vehicles: VehicleAnimationData[]) => void> = [];
  private options: AnimationOptions = {
    cameraMode: 'overview',
    enableTraffic: true
  };

  // Initialize with map instance
  async initialize(map: mapboxgl.Map) {
    this.map = map;
    await this.setupMapLayers();
  }

  // Setup 3D layers for vehicles
  private async setupMapLayers() {
    if (!this.map) return;

    try {
      // Add car icon first
      await MapboxCarIconService.addCarIcon(this.map);
    } catch (error) {
      console.warn('Failed to add car icon, using fallback');
      await MapboxCarIconService.addFallbackIcon(this.map);
    }

    // Add 3D building layer for realism
    if (!this.map.getLayer('3d-buildings')) {
      this.map.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': [
            'interpolate', ['linear'], ['zoom'],
            15, 0,
            15.05, ['get', 'height']
          ],
          'fill-extrusion-base': [
            'interpolate', ['linear'], ['zoom'],
            15, 0,
            15.05, ['get', 'min_height']
          ],
          'fill-extrusion-opacity': 0.6
        }
      });
    }

    // Add vehicle layer as symbols (better than markers for performance)
    if (!this.map.getSource('vehicles')) {
      this.map.addSource('vehicles', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      this.map.addLayer({
        id: 'vehicles',
        type: 'symbol',
        source: 'vehicles',
        layout: {
          'icon-image': 'car-icon',
          'icon-size': [
            'interpolate', ['linear'], ['zoom'],
            10, 0.4,
            16, 1.0,
            20, 1.5
          ],
          'icon-rotate': ['get', 'heading'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'text-field': [
            'format',
            ['get', 'speed'], {},
            ' km/h\n', {},
            ['get', 'battery'], {},
            '%', {}
          ],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 9,
          'text-offset': [0, 2.5],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': [
            'case',
            ['<', ['get', 'battery'], 20], '#ef4444',
            ['<', ['get', 'battery'], 50], '#f97316',
            '#22c55e'
          ],
          'text-halo-color': '#ffffff',
          'text-halo-width': 1
        }
      });

      // Add vehicle trails for moving vehicles
      this.map.addSource('vehicle-trails', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      this.map.addLayer({
        id: 'vehicle-trails',
        type: 'line',
        source: 'vehicle-trails',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 2,
          'line-opacity': 0.6
        }
      });
    }
  }

  // Add a vehicle to animation
  async addVehicle(vehicle: VehicleAnimationData) {
    this.vehicles.set(vehicle.id, { ...vehicle, routeProgress: 0 });
    
    // Generate a route for the vehicle if it doesn't have one
    if (!vehicle.route) {
      await this.generateRandomRoute(vehicle.id);
    }
    
    this.updateMapVehicles();
  }

  // Generate a random route for a vehicle using real roads
  private async generateRandomRoute(vehicleId: string) {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle || !this.map) return;

    try {
      // Generate random destination within map bounds
      const bounds = this.map.getBounds();
      const destLng = bounds.getWest() + Math.random() * (bounds.getEast() - bounds.getWest());
      const destLat = bounds.getSouth() + Math.random() * (bounds.getNorth() - bounds.getSouth());

      // Get route using Mapbox Directions API
      const directionResult = await MapboxService.getDirections(
        vehicle.position,
        [destLng, destLat],
        'balanced'
      );

      if (directionResult.routes.length > 0) {
        const route = directionResult.routes[0];
        vehicle.route = route.geometry.coordinates as [number, number][];
        vehicle.routeProgress = 0;
        vehicle.isMoving = true;
        
        console.log(`Generated route for ${vehicle.name}: ${route.distance}m, ${vehicle.route.length} points`);
      }
    } catch (error) {
      console.error('Error generating route for vehicle:', error);
      // Fallback to simple movement
      this.generateFallbackRoute(vehicleId);
    }
  }

  // Fallback route generation (simple random movement)
  private generateFallbackRoute(vehicleId: string) {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle || !this.map) return;

    const bounds = this.map.getBounds();
    const destLng = bounds.getWest() + Math.random() * (bounds.getEast() - bounds.getWest());
    const destLat = bounds.getSouth() + Math.random() * (bounds.getNorth() - bounds.getSouth());

    // Create simple route with waypoints
    vehicle.route = [
      vehicle.position,
      [(vehicle.position[0] + destLng) / 2, (vehicle.position[1] + destLat) / 2],
      [destLng, destLat]
    ];
    vehicle.routeProgress = 0;
  }

  // Start animation
  startAnimation() {
    if (this.animationFrame) return;
    
    this.lastUpdateTime = performance.now();
    this.animate();
  }

  // Stop animation
  stopAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  // Main animation loop
  private animate = () => {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastUpdateTime;

    if (deltaTime > 50) { // Update every 50ms for smooth animation
      this.updateVehiclePositions(deltaTime);
      this.updateCamera();
      this.updateMapVehicles();
      this.notifyListeners();
      this.lastUpdateTime = currentTime;
    }

    this.animationFrame = requestAnimationFrame(this.animate);
  };

  // Update vehicle positions along routes
  private updateVehiclePositions(deltaTime: number) {
    this.vehicles.forEach(vehicle => {
      if (!vehicle.isMoving || !vehicle.route || vehicle.route.length < 2) return;

      const progressSpeed = (vehicle.speed / 50) * (deltaTime / 1000); // Adjust speed
      vehicle.routeProgress = (vehicle.routeProgress || 0) + progressSpeed;

      if (vehicle.routeProgress >= vehicle.route.length - 1) {
        // Reached end of route, generate new route
        vehicle.routeProgress = 0;
        this.generateRandomRoute(vehicle.id);
        return;
      }

      // Interpolate position along route
      const routeIndex = Math.floor(vehicle.routeProgress);
      const segmentProgress = vehicle.routeProgress - routeIndex;
      
      if (routeIndex < vehicle.route.length - 1) {
        const startPoint = vehicle.route[routeIndex];
        const endPoint = vehicle.route[routeIndex + 1];
        
        // Smooth interpolation
        vehicle.position = [
          startPoint[0] + (endPoint[0] - startPoint[0]) * segmentProgress,
          startPoint[1] + (endPoint[1] - startPoint[1]) * segmentProgress
        ];

        // Calculate heading (direction)
        const deltaLng = endPoint[0] - startPoint[0];
        const deltaLat = endPoint[1] - startPoint[1];
        vehicle.heading = Math.atan2(deltaLng, deltaLat) * 180 / Math.PI;

        // Add some randomness to speed (traffic simulation)
        if (Math.random() < 0.1) { // 10% chance each update
          vehicle.speed = Math.max(10, Math.min(70, vehicle.speed + (Math.random() - 0.5) * 10));
        }

        // Simulate battery drain
        vehicle.batteryLevel = Math.max(0, vehicle.batteryLevel - 0.001);
      }
    });
  }

  // Update camera based on mode
  private updateCamera() {
    if (!this.map || !this.options.followVehicle) return;

    const vehicle = this.vehicles.get(this.options.followVehicle);
    if (!vehicle) return;

    const currentCenter = this.map.getCenter();
    const vehiclePos = vehicle.position;

    switch (this.options.cameraMode) {
      case 'driving':
        // First-person driving view
        this.map.easeTo({
          center: vehiclePos,
          zoom: 18,
          bearing: vehicle.heading || 0,
          pitch: 60,
          duration: 100
        });
        break;

      case 'chase': {
        // Chase cam behind vehicle
        const chaseCamOffset = 0.002; // Offset behind vehicle
        const offsetLng = vehiclePos[0] - Math.sin((vehicle.heading || 0) * Math.PI / 180) * chaseCamOffset;
        const offsetLat = vehiclePos[1] - Math.cos((vehicle.heading || 0) * Math.PI / 180) * chaseCamOffset;
        
        this.map.easeTo({
          center: [offsetLng, offsetLat],
          zoom: 16,
          bearing: vehicle.heading || 0,
          pitch: 45,
          duration: 200
        });
        break;
      }

      case 'top-down':
        // Directly overhead view (no pitch)
        this.map.easeTo({
          center: vehiclePos,
          zoom: 17,
          bearing: 0, // North up
          pitch: 0, // Completely flat
          duration: 300
        });
        break;

      case 'birds-eye':
        // High altitude angled view
        this.map.easeTo({
          center: vehiclePos,
          zoom: 14,
          bearing: vehicle.heading || 0,
          pitch: 30,
          duration: 400
        });
        break;

      case 'overview':
        // Smooth follow with overview
        if (Math.abs(currentCenter.lng - vehiclePos[0]) > 0.01 || 
            Math.abs(currentCenter.lat - vehiclePos[1]) > 0.01) {
          this.map.easeTo({
            center: vehiclePos,
            zoom: 13,
            bearing: 0,
            pitch: 0,
            duration: 1000
          });
        }
        // Use default streets style for overview
        if (this.map.getStyle().name !== 'Mapbox Streets') {
          this.map.setStyle('mapbox://styles/mapbox/streets-v11');
        }
        break;
    }
  }

  // Update map visualization
  private updateMapVehicles() {
    if (!this.map) return;

    const features = Array.from(this.vehicles.values()).map(vehicle => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: vehicle.position
      },
      properties: {
        id: vehicle.id,
        name: vehicle.name,
        speed: Math.round(vehicle.speed),
        battery: Math.round(vehicle.batteryLevel),
        heading: vehicle.heading || 0
      }
    }));

    const source = this.map.getSource('vehicles') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features
      });
    }
  }

  // Set camera options
  setCameraOptions(options: Partial<AnimationOptions>) {
    this.options = { ...this.options, ...options };
  }

  // Follow a specific vehicle
  followVehicle(vehicleId: string, mode: 'overview' | 'driving' | 'chase' | 'top-down' | 'birds-eye' = 'overview') {
    this.options.followVehicle = vehicleId;
    this.options.cameraMode = mode;
  }

  // Stop following vehicle
  stopFollowing() {
    this.options.followVehicle = undefined;
    this.options.cameraMode = 'overview';
  }

  // Get all vehicles
  getVehicles(): VehicleAnimationData[] {
    return Array.from(this.vehicles.values());
  }

  // Add listener for updates
  addListener(callback: (vehicles: VehicleAnimationData[]) => void) {
    this.listeners.push(callback);
  }

  // Remove listener
  removeListener(callback: (vehicles: VehicleAnimationData[]) => void) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  // Notify listeners
  private notifyListeners() {
    const vehicles = Array.from(this.vehicles.values());
    this.listeners.forEach(listener => listener(vehicles));
  }

  // Clear all vehicles
  clear() {
    this.vehicles.clear();
    this.updateMapVehicles();
  }
}

export default new MapboxVehicleAnimation();
export type { VehicleAnimationData, AnimationOptions }; 