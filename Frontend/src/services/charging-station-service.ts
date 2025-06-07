
import apiClient from './api-client';
import { ChargingStation, StationStatus } from '../types/api';

interface CreateStationRequest {
  stationId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  location: string;
  totalConnectors: number;
  availableConnectors: number;
  powerRating: number;
  pricePerKwh: number;
  operator: string;
  connectorTypes: string;
  active: boolean;
}

interface UpdateStationRequest {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  location: string;
  totalConnectors: number;
  powerRating: number;
  pricePerKwh: number;
  operator: string;
  connectorTypes: string;
  status: StationStatus;
}

const ChargingStationService = {
  createStation: async (stationData: CreateStationRequest): Promise<ChargingStation> => {
    const response = await apiClient.post<ChargingStation>('/charging-stations', stationData);
    return response.data;
  },
  
  getAllStations: async (): Promise<ChargingStation[]> => {
    const response = await apiClient.get<ChargingStation[]>('/charging-stations');
    return response.data;
  },
  
  getStationById: async (id: number): Promise<ChargingStation> => {
    const response = await apiClient.get<ChargingStation>(`/charging-stations/${id}`);
    return response.data;
  },
  
  getNearbyStations: async (latitude: number, longitude: number, radius: number): Promise<ChargingStation[]> => {
    const response = await apiClient.get<ChargingStation[]>(
      `/charging-stations/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`
    );
    return response.data;
  },
  
  getAvailableStations: async (): Promise<ChargingStation[]> => {
    const response = await apiClient.get<ChargingStation[]>('/charging-stations/available');
    return response.data;
  },
  
  updateStation: async (id: number, stationData: UpdateStationRequest): Promise<ChargingStation> => {
    const response = await apiClient.put<ChargingStation>(`/charging-stations/${id}`, stationData);
    return response.data;
  },
  
  updateStationStatus: async (id: number, status: StationStatus): Promise<ChargingStation> => {
    const response = await apiClient.put<ChargingStation>(`/charging-stations/${id}/status?status=${status}`);
    return response.data;
  },
  
  updateAvailableConnectors: async (id: number, availableConnectors: number): Promise<ChargingStation> => {
    const response = await apiClient.put<ChargingStation>(
      `/charging-stations/${id}/connectors?availableConnectors=${availableConnectors}`
    );
    return response.data;
  },
  
  deleteStation: async (id: number): Promise<void> => {
    await apiClient.delete(`/charging-stations/${id}`);
  }
};

export default ChargingStationService;
