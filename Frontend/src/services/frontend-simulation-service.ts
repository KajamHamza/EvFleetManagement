interface SimulationTrip {
  timestamp: string;
  from_location: string;
  to_location: string;
  distance_km: number;
  energy_consumed_wh: number;
  soc_percentage: number;
  start_position: {
    x: number;
    y: number;
  };
  end_position: {
    x: number;
    y: number;
  };
  path: string[];
}

interface SimulationVehicleData {
  initial_soc: number;
  trips: SimulationTrip[];
}

interface SimulationData {
  [vehicleName: string]: SimulationVehicleData;
}

interface SimulatedVehicle {
  id: string;
  name: string;
  position: [number, number];
  batteryLevel: number;
  isMoving: boolean;
  currentTrip?: SimulationTrip;
  speed: number;
}

class FrontendSimulationService {
  private simulationData: SimulationData | null = null;
  private simulatedVehicles: Map<string, SimulatedVehicle> = new Map();
  private isRunning = false;
  private animationFrame: number | null = null;
  private lastUpdateTime = 0;
  private listeners: Array<(vehicles: SimulatedVehicle[]) => void> = [];

  // Load simulation data from JSON
  loadSimulationData(data: SimulationData) {
    this.simulationData = data;
    this.initializeVehicles();
  }

  // Load simulation data from file
  async loadSimulationFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          this.loadSimulationData(data);
          resolve();
        } catch (error) {
          reject(new Error('Invalid JSON file format'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // Initialize vehicles from simulation data
  private initializeVehicles() {
    if (!this.simulationData) return;

    this.simulatedVehicles.clear();
    
    Object.entries(this.simulationData).forEach(([vehicleName, vehicleData], index) => {
      // Convert simulation coordinates to real world coordinates
      const firstTrip = vehicleData.trips[0];
      if (firstTrip) {
        const startLng = this.convertXToLng(firstTrip.start_position.x);
        const startLat = this.convertYToLat(firstTrip.start_position.y);
        
        const vehicle: SimulatedVehicle = {
          id: `sim-${index}`,
          name: vehicleName,
          position: [startLng, startLat],
          batteryLevel: vehicleData.initial_soc,
          isMoving: false,
          speed: 0
        };
        
        this.simulatedVehicles.set(vehicle.id, vehicle);
      }
    });

    this.notifyListeners();
  }

  // Convert simulation X coordinate to longitude (approximate for NYC area)
  private convertXToLng(x: number): number {
    const minLng = -74.2;
    const maxLng = -73.7;
    const simMinX = 0;
    const simMaxX = 15000;
    
    return minLng + ((x - simMinX) / (simMaxX - simMinX)) * (maxLng - minLng);
  }

  // Convert simulation Y coordinate to latitude (approximate for NYC area)
  private convertYToLat(y: number): number {
    const minLat = 40.5;
    const maxLat = 40.9;
    const simMinY = 0;
    const simMaxY = 12000;
    
    return minLat + ((y - simMinY) / (simMaxY - simMinY)) * (maxLat - minLat);
  }

  // Start simulation
  startSimulation() {
    if (this.isRunning || !this.simulationData) return;
    
    this.isRunning = true;
    this.lastUpdateTime = Date.now();
    this.animate();
    
    // Start trips for all vehicles
    this.simulatedVehicles.forEach(vehicle => {
      this.startVehicleTrip(vehicle);
    });
  }

  // Stop simulation
  stopSimulation() {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    // Reset all vehicles to stopped state
    this.simulatedVehicles.forEach(vehicle => {
      vehicle.isMoving = false;
      vehicle.speed = 0;
      vehicle.currentTrip = undefined;
    });
    
    this.notifyListeners();
  }

  // Start a trip for a vehicle
  private startVehicleTrip(vehicle: SimulatedVehicle) {
    const vehicleName = vehicle.name;
    const vehicleData = this.simulationData?.[vehicleName];
    
    if (!vehicleData || vehicleData.trips.length === 0) return;
    
    // Get a random trip from the vehicle's trips
    const randomTrip = vehicleData.trips[Math.floor(Math.random() * vehicleData.trips.length)];
    
    vehicle.currentTrip = randomTrip;
    vehicle.isMoving = true;
    vehicle.speed = 30 + Math.random() * 40; // Random speed between 30-70 km/h
    
    // Set start position
    vehicle.position = [
      this.convertXToLng(randomTrip.start_position.x),
      this.convertYToLat(randomTrip.start_position.y)
    ];
  }

  // Animation loop
  private animate = () => {
    if (!this.isRunning) return;
    
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastUpdateTime;
    
    if (deltaTime > 100) { // Update every 100ms
      this.updateVehicles(deltaTime);
      this.lastUpdateTime = currentTime;
      this.notifyListeners();
    }
    
    this.animationFrame = requestAnimationFrame(this.animate);
  };

  // Update vehicle positions
  private updateVehicles(deltaTime: number) {
    this.simulatedVehicles.forEach(vehicle => {
      if (!vehicle.isMoving || !vehicle.currentTrip) return;
      
      const trip = vehicle.currentTrip;
      const endPosition: [number, number] = [
        this.convertXToLng(trip.end_position.x),
        this.convertYToLat(trip.end_position.y)
      ];
      
      // Calculate movement towards destination
      const currentPos = vehicle.position;
      const deltaLng = endPosition[0] - currentPos[0];
      const deltaLat = endPosition[1] - currentPos[1];
      const distance = Math.sqrt(deltaLng * deltaLng + deltaLat * deltaLat);
      
      if (distance < 0.001) {
        // Reached destination, start new trip after a delay
        vehicle.isMoving = false;
        vehicle.batteryLevel = trip.soc_percentage;
        
        setTimeout(() => {
          if (this.isRunning) {
            this.startVehicleTrip(vehicle);
          }
        }, 2000 + Math.random() * 5000); // Wait 2-7 seconds before next trip
        return;
      }
      
      // Move towards destination
      const speedInDegreesPerMs = (vehicle.speed / 3600000) * (deltaTime);
      const moveRatio = Math.min(speedInDegreesPerMs / distance, 1);
      
      vehicle.position = [
        currentPos[0] + deltaLng * moveRatio,
        currentPos[1] + deltaLat * moveRatio
      ];
      
      // Update battery level gradually
      const energyPerKm = trip.energy_consumed_wh / trip.distance_km;
      const distanceMovedKm = (speedInDegreesPerMs * 111) / 1000; // Convert degrees to km
      vehicle.batteryLevel = Math.max(0, vehicle.batteryLevel - (energyPerKm * distanceMovedKm / 1000));
    });
  }

  // Add listener for vehicle updates
  addListener(callback: (vehicles: SimulatedVehicle[]) => void) {
    this.listeners.push(callback);
  }

  // Remove listener
  removeListener(callback: (vehicles: SimulatedVehicle[]) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners
  private notifyListeners() {
    const vehicles = Array.from(this.simulatedVehicles.values());
    this.listeners.forEach(listener => listener(vehicles));
  }

  // Get current simulated vehicles
  getSimulatedVehicles(): SimulatedVehicle[] {
    return Array.from(this.simulatedVehicles.values());
  }

  // Check if simulation is running
  isSimulationRunning(): boolean {
    return this.isRunning;
  }

  // Get simulation statistics
  getSimulationStats() {
    const vehicles = Array.from(this.simulatedVehicles.values());
    const movingVehicles = vehicles.filter(v => v.isMoving).length;
    const averageBattery = vehicles.length > 0 ? 
      vehicles.reduce((sum, v) => sum + v.batteryLevel, 0) / vehicles.length : 0;
    
    return {
      totalVehicles: vehicles.length,
      movingVehicles,
      stoppedVehicles: vehicles.length - movingVehicles,
      averageBatteryLevel: averageBattery
    };
  }
}

export default new FrontendSimulationService();
export type { SimulatedVehicle, SimulationData }; 