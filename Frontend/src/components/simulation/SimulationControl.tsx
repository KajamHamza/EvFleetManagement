
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Play, X, Car } from 'lucide-react';
import SimulationService from '@/services/simulation-service';
import VehicleService from '@/services/vehicle-service';
import { useVehicleUpdates } from '@/hooks/use-websocket';

interface SimulationControlProps {
  vehicleId: number;
  vehicleVin: string;
}

export function SimulationControl({ vehicleId, vehicleVin }: SimulationControlProps) {
  const { toast } = useToast();
  const [isSimulating, setIsSimulating] = useState(false);
  const { vehicleUpdates } = useVehicleUpdates();
  
  // Get vehicle data
  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => VehicleService.getVehicleById(vehicleId),
    enabled: !!vehicleId,
  });
  
  // Get trip data if simulating
  const { data: tripData, refetch: refetchTrip } = useQuery({
    queryKey: ['simulation', 'trip', vehicleVin],
    queryFn: () => SimulationService.getSimulationTripData(vehicleVin),
    enabled: !!vehicleVin && isSimulating,
    refetchInterval: isSimulating ? 3000 : false,
  });
  
  // Start simulation mutation
  const startSimulationMutation = useMutation({
    mutationFn: () => {
      if (vehicle) {
        return SimulationService.startSimulation({
          vin: vehicle.vin,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          batteryCapacity: vehicle.batteryCapacity,
          currentBatteryLevel: vehicle.currentBatteryLevel,
          efficiency: vehicle.efficiency,
          currentSpeed: vehicle.currentSpeed,
          latitude: vehicle.latitude,
          longitude: vehicle.longitude,
          odometer: vehicle.odometer
        });
      }
      throw new Error("Vehicle data not available");
    },
    onSuccess: () => {
      setIsSimulating(true);
      toast({
        title: "Simulation Started",
        description: "Vehicle simulation has started. The vehicle will move on the map.",
      });
      // Start polling for trip data
      refetchTrip();
    },
    onError: (error) => {
      toast({
        title: "Simulation Failed",
        description: "Could not start simulation.",
        variant: "destructive",
      });
      console.error("Simulation error:", error);
    },
  });
  
  const startSimulation = () => {
    startSimulationMutation.mutate();
  };
  
  const stopSimulation = () => {
    setIsSimulating(false);
    toast({
      title: "Simulation Stopped",
      description: "Vehicle simulation has been stopped.",
    });
  };

  return (
    <div className="flex flex-col space-y-4 p-4 bg-background rounded-lg border">
      <h3 className="font-medium flex items-center gap-2">
        <Car className="h-4 w-4" />
        <span>Simulation Control</span>
      </h3>
      
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            {isSimulating ? 'Simulation running...' : 'Simulation not active'}
          </p>
          {tripData && (
            <p className="text-sm mt-1">
              Trip: {tripData.fromLocation} → {tripData.toLocation} ({tripData.distanceKm.toFixed(1)} km)
            </p>
          )}
        </div>
        
        <button
          onClick={isSimulating ? stopSimulation : startSimulation}
          className={`flex items-center gap-2 px-4 py-2 rounded-md ${
            isSimulating 
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
          disabled={startSimulationMutation.isPending}
        >
          {startSimulationMutation.isPending ? (
            <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2" />
          ) : isSimulating ? (
            <X className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isSimulating ? 'Stop' : 'Start'} Simulation
        </button>
      </div>
      
      {vehicleVin && vehicleUpdates.find(update => update.vin === vehicleVin) && (
        <div className="text-sm text-green-600 animate-pulse">
          Receiving live vehicle updates...
        </div>
      )}
    </div>
  );
}
