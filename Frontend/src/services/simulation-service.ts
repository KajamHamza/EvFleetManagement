
import apiClient from './api-client';
import { SimulationData, SimulationTrip } from '../types/api';

interface StartSimulationRequest {
  vin: string;
  make: string;
  model: string;
  year: number;
  batteryCapacity: number;
  currentBatteryLevel: number;
  efficiency: number;
  currentSpeed: number;
  latitude: number;
  longitude: number;
  odometer: number;
}

interface SimulationFileData {
  timestamp: string;
  vehicle: {
    vin: string;
    position: [number, number];
    batteryLevel: number;
    speed: number;
    state: string;
  };
  route?: [number, number][];
  tripData?: {
    fromLocation: string;
    toLocation: string;
    distanceKm: number;
    energyConsumedWh: number;
    socPercentage: number;
    path: string[];
  };
}

interface VehicleTrip {
  timestamp: string;
  fromLocation: string;
  toLocation: string;
  distanceKm: number;
  energyConsumedWh: number;
  socPercentage: number;
  startPosition: {
    x: number;
    y: number;
  };
  endPosition: {
    x: number;
    y: number;
  };
  path: string[];
}

interface CurrentPosition {
  timestamp: string;
  fromLocation: string;
  toLocation: string;
  distanceKm: number;
  energyConsumedWh: number;
  socPercentage: number;
  startPosition: {
    x: number;
    y: number;
  };
  endPosition: {
    x: number;
    y: number;
  };
  path: string[];
}

interface SimulationStatistics {
  vehicleTypeCounts: Record<string, number>;
  tripStatistics: Record<string, {
    totalDistance: number;
    totalEnergy: number;
    avgEnergyPerKm: number;
  }>;
}

const SimulationService = {
  startSimulation: async (simulationData: StartSimulationRequest): Promise<SimulationData> => {
    const response = await apiClient.post<SimulationData>('/simulation/start', simulationData);
    return response.data;
  },
  
  stopSimulation: async (): Promise<void> => {
    await apiClient.post('/simulation/stop');
  },
  
  getSimulationTripData: async (vin: string): Promise<SimulationTrip> => {
    const response = await apiClient.get<SimulationTrip>(`/simulation/trip/${vin}`);
    return response.data;
  },
  
  // New API endpoints
  getVehicleTrips: async (vin: string): Promise<VehicleTrip[]> => {
    const response = await apiClient.get<VehicleTrip[]>(`/simulation/vehicles/${vin}/trips`);
    return response.data;
  },
  
  getCurrentPosition: async (vin: string): Promise<CurrentPosition> => {
    const response = await apiClient.get<CurrentPosition>(`/simulation/vehicles/${vin}/current-position`);
    return response.data;
  },
  
  getSimulationStatistics: async (): Promise<SimulationStatistics> => {
    const response = await apiClient.get<SimulationStatistics>('/simulation/statistics');
    return response.data;
  },
  
  // Load simulation data from JSON file
  loadSimulationFromFile: async (fileData: SimulationFileData[]): Promise<SimulationFileData[]> => {
    // Process and validate the simulation data
    return fileData.map(frame => ({
      ...frame,
      timestamp: frame.timestamp || new Date().toISOString()
    }));
  },
  
  // Export simulation data as JSON
  exportSimulationData: async (data: SimulationFileData[]): Promise<Blob> => {
    const jsonData = JSON.stringify(data, null, 2);
    return new Blob([jsonData], { type: 'application/json' });
  }
};

export default SimulationService;
