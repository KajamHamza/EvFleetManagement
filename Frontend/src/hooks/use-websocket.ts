
import { useEffect, useState } from 'react';
import webSocketService from '@/services/websocket-service';
import { VehicleUpdate, StationUpdate } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import AuthService from '@/services/auth-service';

export function useVehicleUpdates() {
  const [vehicleUpdates, setVehicleUpdates] = useState<Map<string, VehicleUpdate>>(new Map());
  const { toast } = useToast();

  useEffect(() => {
    const handleVehicleUpdate = (update: VehicleUpdate) => {
      setVehicleUpdates(prev => {
        const newMap = new Map(prev);
        newMap.set(update.vin, update);
        return newMap;
      });
    };

    const handleConnectionError = (error: Error) => {
      console.error('Vehicle socket error:', error);
      toast({
        title: "Connection Error",
        description: "Unable to connect to vehicle updates. Retrying...",
        variant: "destructive",
      });
    };

    // Register listener and start connection
    webSocketService.addVehicleListener(handleVehicleUpdate);
    webSocketService.addVehicleErrorListener(handleConnectionError);
    
    // Start connection using the token from AuthService
    if (AuthService.isAuthenticated()) {
      webSocketService.connectVehicles();
    }

    // Cleanup
    return () => {
      webSocketService.removeVehicleListener(handleVehicleUpdate);
      webSocketService.removeVehicleErrorListener(handleConnectionError);
    };
  }, [toast]);

  return {
    vehicleUpdates: Array.from(vehicleUpdates.values()),
    getVehicleUpdate: (vin: string) => vehicleUpdates.get(vin),
  };
}

export function useStationUpdates() {
  const [stationUpdates, setStationUpdates] = useState<Map<number, StationUpdate>>(new Map());
  const { toast } = useToast();

  useEffect(() => {
    const handleStationUpdate = (update: StationUpdate) => {
      setStationUpdates(prev => {
        const newMap = new Map(prev);
        newMap.set(update.id, update);
        return newMap;
      });
    };

    const handleConnectionError = (error: Error) => {
      console.error('Station socket error:', error);
      toast({
        title: "Connection Error",
        description: "Unable to connect to station updates. Retrying...",
        variant: "destructive",
      });
    };

    // Register listener and start connection
    webSocketService.addStationListener(handleStationUpdate);
    webSocketService.addStationErrorListener(handleConnectionError);
    
    // Start connection using the token from AuthService
    if (AuthService.isAuthenticated()) {
      webSocketService.connectStations();
    }

    // Cleanup
    return () => {
      webSocketService.removeStationListener(handleStationUpdate);
      webSocketService.removeStationErrorListener(handleConnectionError);
    };
  }, [toast]);

  return {
    stationUpdates: Array.from(stationUpdates.values()),
    getStationUpdate: (id: number) => stationUpdates.get(id),
  };
}

export function useWebSockets() {
  const [isConnected, setIsConnected] = useState({
    vehicles: false,
    stations: false
  });
  const { toast } = useToast();

  useEffect(() => {
    const checkConnection = () => {
      const vehicleConnected = webSocketService.isVehicleConnected?.() || false;
      const stationConnected = webSocketService.isStationConnected?.() || false;
      
      setIsConnected({
        vehicles: vehicleConnected,
        stations: stationConnected
      });
    };
    
    // Initial check
    checkConnection();
    
    // Set up interval for checking
    const interval = setInterval(checkConnection, 2000);
    
    // Set up error handlers
    const handleVehicleError = (error: Error) => {
      toast({
        title: "Vehicle Connection Error",
        description: "Unable to connect to vehicle service",
        variant: "destructive",
      });
    };

    const handleStationError = (error: Error) => {
      toast({
        title: "Station Connection Error",
        description: "Unable to connect to station service",
        variant: "destructive",
      });
    };

    webSocketService.addVehicleErrorListener(handleVehicleError);
    webSocketService.addStationErrorListener(handleStationError);
    
    return () => {
      clearInterval(interval);
      webSocketService.removeVehicleErrorListener(handleVehicleError);
      webSocketService.removeStationErrorListener(handleStationError);
      webSocketService.disconnect();
    };
  }, [toast]);

  const connect = () => {
    if (AuthService.isAuthenticated()) {
      webSocketService.connectVehicles();
      webSocketService.connectStations();
    } else {
      console.error('Cannot connect WebSockets: User not authenticated');
    }
  };

  return {
    isConnected,
    connect,
    disconnect: () => {
      webSocketService.disconnect();
    }
  };
}
