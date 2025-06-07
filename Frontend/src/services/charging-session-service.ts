import apiClient from './api-client';
import AuthService from './auth-service';

interface ChargingSession {
  id: number;
  stationId: number;
  stationName: string;
  vehicleId: number;
  vehicleVin: string;
  startTime: string;
  endTime: string | null;
  energyDelivered: number | null;
  cost: number | null;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'INTERRUPTED';
  connectorType: string;
  initialBatteryLevel: number;
  finalBatteryLevel: number | null;
  initialSoc: number;
}

const ChargingSessionService = {
  // Start a charging session
  startSession: async (
    stationId: number,
    vehicleId: number,
    connectorType: string
  ): Promise<ChargingSession> => {
    const token = AuthService.getToken();
    if (!token) throw new Error('No authentication token found');

    try {
      const response = await apiClient.post(
        `/charging-sessions/start?stationId=${stationId}&vehicleId=${vehicleId}&connectorType=${connectorType}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error starting charging session:', error);
      throw error;
    }
  },

  // End a charging session
  endSession: async (sessionId: number): Promise<ChargingSession> => {
    const token = AuthService.getToken();
    if (!token) throw new Error('No authentication token found');

    try {
      const response = await apiClient.post(
        `/charging-sessions/${sessionId}/end`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error ending charging session:', error);
      throw error;
    }
  },

  // Get charging sessions for a vehicle
  getVehicleSessions: async (vehicleId: number): Promise<ChargingSession[]> => {
    const token = AuthService.getToken();
    if (!token) throw new Error('No authentication token found');

    try {
      const response = await apiClient.get(`/charging-sessions/vehicle/${vehicleId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle charging sessions:', error);
      throw error;
    }
  },

  // Get active charging session for a vehicle
  getActiveSession: async (vehicleId: number): Promise<ChargingSession | null> => {
    const token = AuthService.getToken();
    if (!token) throw new Error('No authentication token found');

    try {
      const response = await apiClient.get(`/charging-sessions/vehicle/${vehicleId}/active`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null; // No active session
      }
      if (error.response && error.response.status === 403) {
        console.warn(`Permission denied for vehicle ${vehicleId} charging sessions. User may not own this vehicle.`);
        return null; // No permission to access this vehicle's sessions
      }
      console.error('Error fetching active charging session:', error);
      throw error;
    }
  },

  // Get charging sessions for a station
  getStationSessions: async (stationId: number): Promise<ChargingSession[]> => {
    const token = AuthService.getToken();
    if (!token) throw new Error('No authentication token found');

    try {
      const response = await apiClient.get(`/charging-sessions/station/${stationId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching station charging sessions:', error);
      throw error;
    }
  }
};

export default ChargingSessionService;
