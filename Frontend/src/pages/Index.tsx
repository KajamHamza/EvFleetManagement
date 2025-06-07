import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { StatsCard } from '@/components/dashboard/stats-card';
import { BatteryWidget } from '@/components/dashboard/battery-widget';
import { RouteOptimizer } from '@/components/dashboard/route-optimizer';
import { NotificationPanel } from '@/components/dashboard/notification-panel';
import { SimulationControlAdvanced } from '@/components/simulation/SimulationControlAdvanced';
import { Mapbox } from '@/components/ui/mapbox';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Car, Battery, MapPin, Zap, Activity } from 'lucide-react';
import AuthService from '@/services/auth-service';
import VehicleService from '@/services/vehicle-service';
import ChargingStationService from '@/services/charging-station-service';
import type { SimulatedVehicle } from '@/services/frontend-simulation-service';
import mapboxgl from 'mapbox-gl';

const Index = () => {
  const { toast } = useToast();
  const [currentRoute, setCurrentRoute] = useState<[number, number][] | null>(null);
  const [simulatedVehicles, setSimulatedVehicles] = useState<SimulatedVehicle[]>([]);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [useAdvancedSimulation, setUseAdvancedSimulation] = useState(true);
  
  const currentUser = AuthService.getCurrentUser();

  // Fetch current vehicle (for drivers)
  const { data: currentVehicle } = useQuery({
    queryKey: ['currentVehicle'],
    queryFn: VehicleService.getCurrentVehicle,
    staleTime: 30000, // Reduce frequent refetches
  });

  // Fetch stations with reduced frequency
  const { data: stations } = useQuery({
    queryKey: ['stations'],
    queryFn: ChargingStationService.getAllStations,
    staleTime: 60000, // 1 minute stale time
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Fetch vehicles for stats with reduced frequency
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: VehicleService.getAllVehicles,
    staleTime: 60000,
    refetchInterval: 300000,
  });

  // Handle route calculation from RouteOptimizer
  const handleRouteCalculate = useCallback((
    start: string, 
    end: string, 
    mode: string, 
    routeData?: { route: [number, number][], distance: number, duration: number }
  ) => {
    console.log(`Route calculated: ${start} to ${end} (${mode})`, routeData);
    
    if (routeData?.route && routeData.route.length > 0) {
      console.log('Setting route coordinates:', routeData.route.length, 'points');
      setCurrentRoute(routeData.route);
    } else if (!routeData) {
      // Navigation stopped - clear the route
      console.log('Clearing route from map');
      setCurrentRoute(null);
    } else {
      console.warn('No valid route data received');
    }
  }, []);

  // Handle simulated vehicles updates (only for basic simulation)
  const handleSimulatedVehiclesUpdate = useCallback((vehicles: SimulatedVehicle[]) => {
    if (!useAdvancedSimulation) {
      setSimulatedVehicles(vehicles);
    }
  }, [useAdvancedSimulation]);

  // Handle map load
  const handleMapLoad = useCallback((map: mapboxgl.Map) => {
    setMapInstance(map);
    console.log('Map instance set for advanced simulation');
  }, []);

  // Create map markers - OPTIMIZED: Better memoization with stable dependencies
  const mapMarkers = useMemo(() => {
    const markers: Array<{
      id: string;
      position: [number, number];
      type: 'vehicle' | 'charging-station';
      status?: 'available' | 'occupied' | 'low-battery' | 'charging';
      name: string;
      // Animation properties for simulated vehicles
      isMoving?: boolean;
      batteryLevel?: number;
      speed?: number;
    }> = [];

    // Add current user's vehicle (for drivers)
    if (currentVehicle) {
      markers.push({
        id: `vehicle-${currentVehicle.id}`,
        position: [currentVehicle.longitude, currentVehicle.latitude],
        type: 'vehicle',
        status: currentVehicle.currentBatteryLevel < 20 
          ? 'low-battery' 
          : currentVehicle.currentState === 'CHARGING' ? 'charging' : undefined,
        name: currentVehicle.name || `${currentVehicle.make} ${currentVehicle.model}`,
        isMoving: false,
        batteryLevel: currentVehicle.currentBatteryLevel,
        speed: currentVehicle.currentSpeed || 0,
      });
    }

    // Add simulated vehicles with animation properties (only for basic simulation)
    if (!useAdvancedSimulation) {
      simulatedVehicles.forEach(vehicle => {
        markers.push({
          id: vehicle.id,
          position: vehicle.position,
          type: 'vehicle',
          status: vehicle.batteryLevel < 20 
            ? 'low-battery' 
            : vehicle.isMoving ? undefined : 'charging',
          name: vehicle.name,
          isMoving: vehicle.isMoving,
          batteryLevel: vehicle.batteryLevel,
          speed: vehicle.speed,
        });
      });
    }

    // Add charging stations
    if (stations) {
      stations.forEach(station => {
        markers.push({
          id: `station-${station.id}`,
          position: [station.longitude, station.latitude],
          type: 'charging-station',
          status: station.availableConnectors > 0 ? 'available' : 'occupied',
          name: station.name,
        });
      });
    }

    return markers;
  }, [currentVehicle, simulatedVehicles, stations, useAdvancedSimulation]);

  // Calculate total vehicles for stats
  const totalVehicles = useMemo(() => {
    if (currentUser?.role === 'DRIVER') {
      return currentVehicle ? 1 : 0;
    }
    return (vehicles?.length || 0) + (useAdvancedSimulation ? 0 : simulatedVehicles.length);
  }, [currentUser?.role, currentVehicle, vehicles?.length, simulatedVehicles.length, useAdvancedSimulation]);

  // Calculate map center - OPTIMIZED: Only change when necessary
  const mapCenter: [number, number] = useMemo(() => {
    if (currentVehicle) {
      return [currentVehicle.longitude, currentVehicle.latitude];
    }
    if (!useAdvancedSimulation && simulatedVehicles.length > 0) {
      // Center on first simulated vehicle for basic simulation
      return simulatedVehicles[0].position;
    }
    return [-74.0, 40.7]; // Default NYC
  }, [currentVehicle?.longitude, currentVehicle?.latitude, simulatedVehicles.length, useAdvancedSimulation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Sidebar />
      
      <main className="md:ml-[70px] lg:ml-64 p-4 lg:p-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              EV Fleet Management
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {currentUser?.firstName || currentUser?.username}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Vehicles"
              value={totalVehicles}
              icon={<Car className="h-6 w-6" />}
              trend="up"
            />
            <StatsCard
              title="Charging Stations"
              value={stations?.length || 0}
              icon={<Zap className="h-6 w-6" />}
              trend="up"
            />
            <StatsCard
              title="Active Sessions"
              value={stations?.reduce((acc, station) => acc + (station.totalConnectors - station.availableConnectors), 0) || 0}
              icon={<Activity className="h-6 w-6" />}
              trend="down"
            />
            <StatsCard
              title="Simulation Mode"
              value={useAdvancedSimulation ? "Road-Following" : "Basic"}
              icon={<Battery className="h-6 w-6" />}
              trend="up"
            />
          </div>

          {/* Main Dashboard Grid - Two-Row Layout */}
          <div className="space-y-6">
            {/* Top Row - Map and Primary Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map Section */}
              <div className="lg:col-span-2">
                <div className="glassmorphism rounded-xl p-4 h-[650px]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-primary" />
                      Live Vehicle Tracking
                    </h3>
                    <div className="flex items-center gap-2">
                      {currentRoute && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          Route: {currentRoute.length} points
                        </span>
                      )}
                      {!useAdvancedSimulation && (
                        <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded">
                          {simulatedVehicles.filter(v => v.isMoving).length} Moving
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {useAdvancedSimulation ? 'Advanced Simulation' : `Total: ${mapMarkers.filter(m => m.type === 'vehicle').length} vehicles`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="h-full rounded-lg overflow-hidden">
                    <Mapbox
                      className="h-full w-full"
                      initialCenter={mapCenter}
                      initialZoom={12}
                      markers={mapMarkers}
                      routeCoordinates={currentRoute || undefined}
                      disableTelemetry={true}
                      is3D={true}
                      onMapLoad={handleMapLoad}
                    />
                  </div>
                </div>
              </div>

              {/* Primary Controls Column */}
              <div className="lg:col-span-1 space-y-4">
                {/* Battery Widget - only for drivers with vehicles */}
                {currentVehicle && (
                  <BatteryWidget
                    level={currentVehicle.currentBatteryLevel}
                    capacity={currentVehicle.batteryCapacity}
                    isCharging={currentVehicle.currentState === 'CHARGING'}
                  />
                )}

                {/* Route Optimizer */}
                <RouteOptimizer 
                  onRouteCalculate={handleRouteCalculate}
                  mapInstance={mapInstance}
                />
              </div>
            </div>

            {/* Bottom Row - Secondary Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Advanced Simulation Control */}
              <SimulationControlAdvanced 
                onVehiclesUpdate={handleSimulatedVehiclesUpdate}
                mapInstance={mapInstance}
              />

              {/* Notifications */}
              <NotificationPanel />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
