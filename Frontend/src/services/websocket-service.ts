
import { VehicleUpdate, StationUpdate } from '../types/api';
import AuthService from './auth-service';

type VehicleListener = (update: VehicleUpdate) => void;
type StationListener = (update: StationUpdate) => void;
type ErrorListener = (error: Error) => void;

class WebSocketService {
  private vehicleSocket: WebSocket | null = null;
  private stationSocket: WebSocket | null = null;
  private vehicleListeners: VehicleListener[] = [];
  private stationListeners: StationListener[] = [];
  private vehicleErrorListeners: ErrorListener[] = [];
  private stationErrorListeners: ErrorListener[] = [];
  private reconnectTimeout: number = 2000; // Start with 2s timeout
  private maxReconnectTimeout: number = 30000; // Max 30s timeout
  private isConnecting: boolean = false;
  
  // Initialize connections with auth token
  public connectVehicles(): void {
    if (this.vehicleSocket !== null || this.isConnecting) return;
    
    // Get the current auth token
    const authToken = AuthService.getToken();
    if (!authToken) {
      console.error('No authentication token available for WebSocket connection');
      this.notifyVehicleErrorListeners(new Error('Authentication required'));
      return;
    }
    
    this.isConnecting = true;
    
    // Use the current hostname instead of hardcoded localhost
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const hostname = window.location.hostname;
    const port = window.location.port === '8081' ? '9090' : window.location.port || '9090'; // Adjust port based on environment
    
    let wsUrl = `${protocol}//${hostname}:${port}/ws/vehicles`;
    
    // Add token if available
    wsUrl += `?token=${authToken}`;
    
    try {
      console.log('Connecting to vehicle WebSocket:', wsUrl);
      this.vehicleSocket = new WebSocket(wsUrl);
      
      this.vehicleSocket.onopen = () => {
        console.log('Vehicle WebSocket connected');
        this.reconnectTimeout = 2000; // Reset timeout on successful connection
        this.isConnecting = false;
      };
      
      this.vehicleSocket.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data) as VehicleUpdate;
          this.notifyVehicleListeners(update);
        } catch (error) {
          console.error('Error parsing vehicle update:', error);
        }
      };
      
      this.vehicleSocket.onclose = (event) => {
        console.log('Vehicle WebSocket disconnected, attempting to reconnect...', event.code, event.reason);
        this.vehicleSocket = null;
        this.isConnecting = false;
        
        // If it's a 403 error, we might have an auth issue
        if (event.code === 1003 || event.code === 1008 || event.code === 1011 || event.code === 403) {
          this.notifyVehicleErrorListeners(
            new Error(`Authorization failed: ${event.reason || 'Access denied'}`)
          );
          return; // Don't reconnect on auth failure
        }
        
        // Attempt to reconnect with backoff
        setTimeout(() => {
          this.connectVehicles();
        }, this.reconnectTimeout);
        
        // Increase reconnect timeout for next attempt
        this.reconnectTimeout = Math.min(this.reconnectTimeout * 1.5, this.maxReconnectTimeout);
      };
      
      this.vehicleSocket.onerror = (error) => {
        console.error('Vehicle WebSocket error:', error);
        this.notifyVehicleErrorListeners(new Error('Connection error'));
        // The onclose handler will be called after this
      };
    } catch (error) {
      console.error('Error creating vehicle WebSocket:', error);
      this.isConnecting = false;
      this.notifyVehicleErrorListeners(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
  
  public connectStations(): void {
    if (this.stationSocket !== null || this.isConnecting) return;
    
    // Get the current auth token
    const authToken = AuthService.getToken();
    if (!authToken) {
      console.error('No authentication token available for WebSocket connection');
      this.notifyStationErrorListeners(new Error('Authentication required'));
      return;
    }
    
    this.isConnecting = true;
    
    // Use the current hostname instead of hardcoded localhost
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const hostname = window.location.hostname;
    const port = window.location.port === '8081' ? '9090' : window.location.port || '9090'; // Adjust port based on environment
    
    let wsUrl = `${protocol}//${hostname}:${port}/ws/stations`;
    
    // Add token if available
    wsUrl += `?token=${authToken}`;
    
    try {
      console.log('Connecting to station WebSocket:', wsUrl);
      this.stationSocket = new WebSocket(wsUrl);
      
      this.stationSocket.onopen = () => {
        console.log('Station WebSocket connected');
        this.reconnectTimeout = 2000;
        this.isConnecting = false;
      };
      
      this.stationSocket.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data) as StationUpdate;
          this.notifyStationListeners(update);
        } catch (error) {
          console.error('Error parsing station update:', error);
        }
      };
      
      this.stationSocket.onclose = (event) => {
        console.log('Station WebSocket disconnected, attempting to reconnect...', event.code, event.reason);
        this.stationSocket = null;
        this.isConnecting = false;
        
        // If it's a 403 error, we might have an auth issue
        if (event.code === 1003 || event.code === 1008 || event.code === 1011 || event.code === 403) {
          this.notifyStationErrorListeners(
            new Error(`Authorization failed: ${event.reason || 'Access denied'}`)
          );
          return; // Don't reconnect on auth failure
        }
        
        setTimeout(() => {
          this.connectStations();
        }, this.reconnectTimeout);
        
        this.reconnectTimeout = Math.min(this.reconnectTimeout * 1.5, this.maxReconnectTimeout);
      };
      
      this.stationSocket.onerror = (error) => {
        console.error('Station WebSocket error:', error);
        this.notifyStationErrorListeners(new Error('Connection error'));
      };
    } catch (error) {
      console.error('Error creating station WebSocket:', error);
      this.isConnecting = false;
      this.notifyStationErrorListeners(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
  
  // Disconnect sockets
  public disconnect(): void {
    if (this.vehicleSocket) {
      this.vehicleSocket.close();
      this.vehicleSocket = null;
    }
    
    if (this.stationSocket) {
      this.stationSocket.close();
      this.stationSocket = null;
    }
  }
  
  // Add connection status methods
  public isVehicleConnected(): boolean {
    return this.vehicleSocket !== null && this.vehicleSocket.readyState === WebSocket.OPEN;
  }
  
  public isStationConnected(): boolean {
    return this.stationSocket !== null && this.stationSocket.readyState === WebSocket.OPEN;
  }
  
  // Add listeners
  public addVehicleListener(listener: VehicleListener): void {
    this.vehicleListeners.push(listener);
  }
  
  public addStationListener(listener: StationListener): void {
    this.stationListeners.push(listener);
  }
  
  // Add error listeners
  public addVehicleErrorListener(listener: ErrorListener): void {
    this.vehicleErrorListeners.push(listener);
  }
  
  public addStationErrorListener(listener: ErrorListener): void {
    this.stationErrorListeners.push(listener);
  }
  
  // Remove listeners
  public removeVehicleListener(listener: VehicleListener): void {
    this.vehicleListeners = this.vehicleListeners.filter(l => l !== listener);
  }
  
  public removeStationListener(listener: StationListener): void {
    this.stationListeners = this.stationListeners.filter(l => l !== listener);
  }
  
  // Remove error listeners
  public removeVehicleErrorListener(listener: ErrorListener): void {
    this.vehicleErrorListeners = this.vehicleErrorListeners.filter(l => l !== listener);
  }
  
  public removeStationErrorListener(listener: ErrorListener): void {
    this.stationErrorListeners = this.stationErrorListeners.filter(l => l !== listener);
  }
  
  // Notify listeners
  private notifyVehicleListeners(update: VehicleUpdate): void {
    this.vehicleListeners.forEach(listener => {
      try {
        listener(update);
      } catch (error) {
        console.error('Error in vehicle listener:', error);
      }
    });
  }
  
  private notifyStationListeners(update: StationUpdate): void {
    this.stationListeners.forEach(listener => {
      try {
        listener(update);
      } catch (error) {
        console.error('Error in station listener:', error);
      }
    });
  }
  
  // Notify error listeners
  private notifyVehicleErrorListeners(error: Error): void {
    this.vehicleErrorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('Error in vehicle error listener:', err);
      }
    });
  }
  
  private notifyStationErrorListeners(error: Error): void {
    this.stationErrorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('Error in station error listener:', err);
      }
    });
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;
