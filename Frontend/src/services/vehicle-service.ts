
import apiClient from './api-client';
import { Vehicle, VehicleStateHistory, CurrentVehicleState } from '../types/api';
import AuthService from './auth-service';

interface RegisterVehicleRequest {
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
  active: boolean;
}

interface UpdateVehicleRequest {
  name: string;
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
  currentState: string;
  lastChargedLevel: number;
  active: boolean;
  initialSoc: number;
  type: string;
}

const VehicleService = {
  registerVehicle: async (vehicleData: RegisterVehicleRequest): Promise<Vehicle> => {
    const response = await apiClient.post<Vehicle>('/vehicles', vehicleData);
    return response.data;
  },
  
  getAllVehicles: async (): Promise<Vehicle[]> => {
    const response = await apiClient.get<Vehicle[]>('/vehicles');
    return response.data;
  },
  
  getVehicleById: async (id: number): Promise<Vehicle> => {
    const response = await apiClient.get<Vehicle>(`/vehicles/${id}`);
    return response.data;
  },
  
  getCurrentVehicle: async (): Promise<Vehicle | null> => {
    // Get the current user
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Get all vehicles
    const vehicles = await VehicleService.getAllVehicles();
    
    // Find the vehicle assigned to the current user
    const userVehicle = vehicles.find(v => v.driverUsername === currentUser.username);
    
    if (!userVehicle) {
      return null; // No vehicle assigned to this user
    }
    
    return userVehicle;
  },
  
  updateVehicle: async (id: number, vehicleData: UpdateVehicleRequest): Promise<Vehicle> => {
    const response = await apiClient.put<Vehicle>(`/vehicles/${id}`, vehicleData);
    return response.data;
  },
  
  getVehicleStateHistory: async (id: number): Promise<VehicleStateHistory[]> => {
    const response = await apiClient.get<VehicleStateHistory[]>(`/vehicles/${id}/states`);
    return response.data;
  },
  
  getCurrentVehicleState: async (id: number): Promise<CurrentVehicleState> => {
    const response = await apiClient.get<CurrentVehicleState>(`/vehicles/${id}/state/current`);
    return response.data;
  },
  
  assignVehicle: async (id: number, username: string): Promise<Vehicle> => {
    const response = await apiClient.post<Vehicle>(`/vehicles/${id}/assign?username=${username}`);
    return response.data;
  },
  
  unassignVehicle: async (id: number): Promise<Vehicle> => {
    const response = await apiClient.post<Vehicle>(`/vehicles/${id}/unassign`);
    return response.data;
  }
};

export default VehicleService;
