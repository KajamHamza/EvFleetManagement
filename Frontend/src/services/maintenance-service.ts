import apiClient from './api-client';
import AuthService from './auth-service';

interface MaintenanceRecord {
  id: number;
  vehicleVin: string;
  maintenanceType: string;
  description: string;
  scheduledDate: string;
  completedDate: string | null;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  cost: number | null;
  serviceProvider: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const MaintenanceService = {
  // Get maintenance history for a vehicle
  getVehicleMaintenanceHistory: async (vin: string): Promise<MaintenanceRecord[]> => {
    const token = AuthService.getToken();
    if (!token) throw new Error('No authentication token found');

    try {
      const response = await apiClient.get(`/maintenance/vehicle/${vin}/history`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching maintenance history:', error);
      throw error;
    }
  },

  // Get upcoming maintenance for a vehicle
  getUpcomingMaintenance: async (vin: string): Promise<MaintenanceRecord[]> => {
    const token = AuthService.getToken();
    if (!token) throw new Error('No authentication token found');

    try {
      const response = await apiClient.get(`/maintenance/vehicle/${vin}/upcoming`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming maintenance:', error);
      throw error;
    }
  },

  // Schedule new maintenance
  scheduleMaintenance: async (maintenanceData: {
    vehicleVin: string;
    maintenanceType: string;
    description: string;
    scheduledDate: string;
    serviceProvider: string;
    notes?: string;
  }): Promise<MaintenanceRecord> => {
    const token = AuthService.getToken();
    if (!token) throw new Error('No authentication token found');

    try {
      const response = await apiClient.post('/maintenance', maintenanceData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      throw error;
    }
  },

  // Update maintenance status
  updateMaintenanceStatus: async (
    id: number, 
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  ): Promise<MaintenanceRecord> => {
    const token = AuthService.getToken();
    if (!token) throw new Error('No authentication token found');

    try {
      const response = await apiClient.put(`/maintenance/${id}/status?status=${status}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating maintenance status:', error);
      throw error;
    }
  }
};

export default MaintenanceService;
