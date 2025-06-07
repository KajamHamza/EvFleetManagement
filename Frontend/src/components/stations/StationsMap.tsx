import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Mapbox } from '@/components/ui/mapbox';
import { useToast } from '@/hooks/use-toast';
import { useStationUpdates, useVehicleUpdates } from '@/hooks/use-websocket';
import ChargingStationService from '@/services/charging-station-service';
import ChargingSessionService from '@/services/charging-session-service';
import VehicleService from '@/services/vehicle-service';
import SimulationService from '@/services/simulation-service';
import MapboxService from '@/services/mapbox-service';
import { Car, Map, Pin, X, ArrowRight, Battery, Navigation, Zap, Clock, MapPin as MapPinIcon } from 'lucide-react';
import { ChargingStation, Vehicle } from '@/types/api';
import AuthService from '@/services/auth-service';
import { cn } from '@/lib/utils';
import mapboxgl from 'mapbox-gl';

interface StationsMapProps {
  userPosition?: [number, number];
  showVehicles?: boolean;
  onStationSelect?: (stationId: number) => void;
}

interface MapboxEVStation {
  id: string;
  position: [number, number];
  name: string;
  address?: string;
  operator?: string;
  network?: string;
  connectors: Array<{
    type: string;
    power_kw: number;
    quantity: number;
    pricing?: string;
  }>;
  amenities?: string[];
  status: 'operational' | 'planned' | 'construction' | 'decommissioned';
}

interface MarkerData {
  id: string;
  position: [number, number];
  type: 'vehicle' | 'charging-station' | 'mapbox-ev-station';
  status?: 'available' | 'occupied' | 'low-battery' | 'charging';
  name: string;
  info: {
    batteryLevel?: number;
    model?: string;
    speed?: string;
    vehicleData?: Vehicle;
    chargerType?: string;
    price?: string;
    available?: string;
    address?: string;
    stationData?: ChargingStation | MapboxEVStation;
    operator?: string;
    network?: string;
    connectors?: Array<{
      type: string;
      power_kw: number;
      quantity: number;
      pricing?: string;
    }>;
    amenities?: string[];
  };
}

export function StationsMap({ userPosition = [-74.5, 40.2], showVehicles = true, onStationSelect }: StationsMapProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { vehicleUpdates } = useVehicleUpdates();
  const { stationUpdates } = useStationUpdates();
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [showRouteSimulation, setShowRouteSimulation] = useState(false);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [mapReady, setMapReady] = useState(false);
  const mapboxInstance = useRef<mapboxgl.Map | null>(null);
  const [mapboxEVStations, setMapboxEVStations] = useState<MapboxEVStation[]>([]);
  const [loadingEVStations, setLoadingEVStations] = useState(false);
  const [activeChargingSession, setActiveChargingSession] = useState<any>(null);
  const [startingSession, setStartingSession] = useState(false);
  
  // Get current user
  const currentUser = AuthService.getCurrentUser();

  // Fetch stations from the API
  const { data: stations, isLoading: loadingStations } = useQuery({
    queryKey: ['stations'],
    queryFn: ChargingStationService.getAllStations,
  });
  
  // Fetch vehicles from the API
  const { data: vehicles, isLoading: loadingVehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: VehicleService.getAllVehicles,
    enabled: showVehicles,
  });

  // Get current vehicle for the logged in user
  const { data: currentVehicle } = useQuery({
    queryKey: ['currentVehicle'],
    queryFn: VehicleService.getCurrentVehicle,
  });
  
  // Find the vehicle assigned to the current user
  const userVehicle = currentVehicle || 
    (currentUser && vehicles?.find(v => v.driverUsername === currentUser.username));

  // Get trip simulation data when navigating
  const { data: tripData, refetch: refetchTrip } = useQuery({
    queryKey: ['simulation', 'trip', selectedVehicle?.vin],
    queryFn: () => selectedVehicle ? SimulationService.getSimulationTripData(selectedVehicle.vin) : Promise.reject('No vehicle selected'),
    enabled: !!selectedVehicle?.vin && showRouteSimulation,
    refetchInterval: showRouteSimulation ? 3000 : false,
  });

  // Update route path when trip data changes
  useEffect(() => {
    if (tripData && tripData.path) {
      setRoutePath(tripData.path.map(point => {
        const [lon, lat] = point.split(',').map(Number);
        return [lon, lat] as [number, number];
      }));
    }
  }, [tripData]);

  // Initialize map objects and handlers
  const handleMapLoad = (map: mapboxgl.Map) => {
    mapboxInstance.current = map;
    setMapReady(true);
    
    // Add 3D buildings layer for enhanced visualization (only at higher zoom levels)
    map.addLayer({
      'id': '3d-buildings',
      'source': 'composite',
      'source-layer': 'building',
      'filter': ['==', 'extrude', 'true'],
      'type': 'fill-extrusion',
      'minzoom': 15,
      'paint': {
        'fill-extrusion-color': '#aaa',
        'fill-extrusion-height': [
          'interpolate', ['linear'], ['zoom'],
          15, 0,
          15.05, ['get', 'height']
        ],
        'fill-extrusion-base': [
          'interpolate', ['linear'], ['zoom'],
          15, 0,
          15.05, ['get', 'min_height']
        ],
        'fill-extrusion-opacity': 0.6
      }
    });
  };

  // Convert stations and vehicles to map markers
  const mapMarkers = React.useMemo(() => {
    const markers: Array<{
      id: string;
      position: [number, number];
      type: 'vehicle' | 'charging-station';
      status?: 'available' | 'occupied' | 'low-battery' | 'charging';
      name: string;
      info: any;
    }> = [];

    // Add stations to markers
    if (stations) {
      stations.forEach(station => {
        // Override with real-time data if available
        const stationUpdate = stationUpdates?.find(update => update.id === station.id);
        
        markers.push({
          id: `station-${station.id}`,
          position: [station.longitude, station.latitude],
          type: 'charging-station',
          status: (stationUpdate?.availableConnectors || station.availableConnectors) > 0 ? 'available' : 'occupied',
          name: station.name,
          info: {
            chargerType: station.powerRating > 40 ? 'Fast Charger' : 'Standard Charger',
            price: `$${station.pricePerKwh}/kWh`,
            available: `${stationUpdate?.availableConnectors || station.availableConnectors}/${station.totalConnectors} stations`,
            address: station.address,
            stationData: station
          }
        });
      });
    }

    // Add vehicles to markers if enabled
    if (showVehicles && vehicles) {
      vehicles.forEach(vehicle => {
        // Override with real-time data if available
        const vehicleUpdate = vehicleUpdates?.find(update => update.vin === vehicle.vin);
        
        const batteryLevel = vehicleUpdate?.batteryLevel || vehicle.currentBatteryLevel;
        const vehicleLatitude = vehicleUpdate?.latitude || vehicle.latitude;
        const vehicleLongitude = vehicleUpdate?.longitude || vehicle.longitude;
        
        markers.push({
          id: `vehicle-${vehicle.id}`,
          position: [vehicleLongitude, vehicleLatitude],
          type: 'vehicle',
          status: batteryLevel < 20 
            ? 'low-battery' 
            : vehicle.currentState === 'CHARGING' ? 'charging' : undefined,
          name: vehicle.name || `${vehicle.make} ${vehicle.model}`,
          info: {
            batteryLevel,
            model: `${vehicle.make} ${vehicle.model}`,
            speed: vehicleUpdate ? `${Math.round(vehicleUpdate.speed)} mph` : '0 mph',
            vehicleData: vehicle
          }
        });
      });
    }

    return markers;
  }, [stations, vehicles, vehicleUpdates, stationUpdates, showVehicles]);

  // Handle marker click
  const handleMarkerClick = (markerId: string) => {
    const marker = mapMarkers.find(m => m.id === markerId);
    
    if (marker) {
      setSelectedMarker(marker);
      
      if (marker.type === 'charging-station') {
        setSelectedStation(marker.info.stationData);
        setSelectedVehicle(null);
      } else if (marker.type === 'vehicle') {
        setSelectedVehicle(marker.info.vehicleData);
        setSelectedStation(null);
      }
    }
  };
  
  // Clear selected marker
  const clearSelectedMarker = () => {
    setSelectedMarker(null);
    setSelectedVehicle(null);
    setSelectedStation(null);
    setShowRouteSimulation(false);
    
    // Clear route from map
    if (mapboxInstance.current) {
      if (mapboxInstance.current.getLayer('route')) {
        mapboxInstance.current.removeLayer('route');
      }
      if (mapboxInstance.current.getSource('route')) {
        mapboxInstance.current.removeSource('route');
      }
    }
  };
  
  // Navigate to station button handler
  const handleNavigateToStation = async () => {
    if (selectedMarker?.type === 'charging-station') {
      // Use user's assigned vehicle if available, otherwise use first vehicle
      const vehicle = userVehicle || (vehicles && vehicles.length > 0 ? vehicles[0] : null);
      
      if (!vehicle) {
        toast({
          title: "No Vehicle Available",
          description: "Please register or assign a vehicle first",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedVehicle(vehicle);
      setShowRouteSimulation(true);
      
      try {
        // Get start and end coordinates
        const startCoords: [number, number] = [vehicle.longitude, vehicle.latitude];
        const endCoords: [number, number] = [selectedMarker.position[0], selectedMarker.position[1]];
        
        // Use Mapbox Directions API to get route
        const directionResult = await MapboxService.getDirections(startCoords, endCoords, 'balanced');
        
        if (directionResult.routes.length > 0) {
          const routeCoordinates = directionResult.routes[0].geometry.coordinates as [number, number][];
          
          setRoutePath(routeCoordinates);
          
          toast({
            title: "Navigation Started",
            description: "Route to charging station calculated",
            duration: 3000,
          });
          
          if (onStationSelect) {
            onStationSelect(selectedMarker.info.stationData.id);
          }
        }
      } catch (error) {
        console.error("Error calculating route:", error);
        toast({
          title: "Navigation Failed",
          description: "Could not calculate route to station.",
          variant: "destructive",
        });
      }
    }
  };
  
  // Start charging session
  const handleStartCharging = async () => {
    if (!selectedVehicle || !selectedStation) {
      toast({
        title: "Error",
        description: "Please select a vehicle and station first",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const session = await ChargingSessionService.startSession(
        selectedStation.id,
        selectedVehicle.id,
        'Type2'
      );
      
      toast({
        title: "Charging Started",
        description: `Started charging session at ${selectedStation.name}`,
      });
      
      // Navigate to vehicle page to monitor charging
      navigate('/vehicle');
    } catch (error) {
      console.error("Error starting charging session:", error);
      toast({
        title: "Error",
        description: "Could not start charging session",
        variant: "destructive",
      });
    }
  };

  // Custom marker renderer function
  const renderCustomMarker = (marker: any) => {
    if (marker.type === 'vehicle') {
      return (
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all transform hover:scale-110",
          marker.status === 'low-battery' ? "bg-red-500" : 
          marker.status === 'charging' ? "bg-green-500" : "bg-blue-500",
          "text-white"
        )}>
          <Car className="h-5 w-5" />
        </div>
      );
    } else {
      return (
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all transform hover:scale-110",
          marker.status === 'available' ? "bg-green-500" : "bg-yellow-500",
          "text-white"
        )}>
          <Battery className="h-5 w-5" />
        </div>
      );
    }
  };

  // Fetch Mapbox EV stations when map loads and user position changes
  useEffect(() => {
    const fetchEVStations = async () => {
      if (!mapReady || loadingEVStations || mapboxEVStations.length > 0) {
        // Skip if already loading or already have data
        return;
      }
      
      setLoadingEVStations(true);
      try {
        const userPos: [number, number] = userVehicle 
          ? [userVehicle.longitude, userVehicle.latitude]
          : userPosition;
          
        console.log('Fetching Mapbox EV stations near:', userPos);
        
        // Try the main EV Charge Finder API first
        let evData = await MapboxService.getEVChargingStations(userPos, 25);
        
        // If no results, try the alternative POI search
        if (evData.features.length === 0) {
          console.log('No results from EV Charge Finder, trying POI search');
          evData = await MapboxService.searchEVStations(userPos, 25);
        }
        
        const stations: MapboxEVStation[] = evData.features.map(feature => ({
          id: feature.id,
          position: feature.geometry.coordinates,
          name: feature.properties.name || 'EV Charging Station',
          address: feature.properties.address,
          operator: feature.properties.operator || feature.properties.brand,
          network: feature.properties.network,
          connectors: feature.properties.connectors || [
            {
              type: 'type_2',
              power_kw: 22,
              quantity: 2
            }
          ],
          amenities: feature.properties.amenities || [],
          status: (feature.properties.status as any) || 'operational'
        }));
        
        console.log(`Found ${stations.length} Mapbox EV stations`);
        setMapboxEVStations(stations);
      } catch (error) {
        console.error('Error fetching Mapbox EV stations:', error);
        // Don't show error toast, just log it
      } finally {
        setLoadingEVStations(false);
      }
    };

    // Only run once when map is ready and we don't have EV stations yet
    if (mapReady && mapboxEVStations.length === 0 && !loadingEVStations) {
      fetchEVStations();
    }
  }, [mapReady]); // Only depend on mapReady to prevent constant refetching

  // Check for active charging session
  useEffect(() => {
    const checkActiveSession = async () => {
      if (currentVehicle) {
        try {
          const session = await ChargingSessionService.getActiveSession(currentVehicle.id);
          setActiveChargingSession(session);
        } catch (error) {
          console.log('No active charging session');
        }
      }
    };

    checkActiveSession();
  }, [currentVehicle]);

  // Start charging session
  const startChargingSession = async (stationData: ChargingStation, connectorType: string = 'Type 2') => {
    if (!currentVehicle) {
      toast({
        title: "No Vehicle",
        description: "You need a registered vehicle to start charging",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (activeChargingSession) {
      toast({
        title: "Active Session Exists",
        description: "You already have an active charging session. End it first.",
        variant: "destructive", 
        duration: 3000,
      });
      return;
    }

    setStartingSession(true);
    try {
      const session = await ChargingSessionService.startSession(
        stationData.id,
        currentVehicle.id,
        connectorType
      );
      
      setActiveChargingSession(session);
      
      toast({
        title: "Charging Session Started",
        description: `Started charging at ${stationData.name}`,
        duration: 5000,
      });
      
      // Close the marker popup
      setSelectedMarker(null);
      setSelectedStation(null);
      
    } catch (error: any) {
      console.error('Error starting charging session:', error);
      toast({
        title: "Failed to Start Charging",
        description: error.response?.data?.message || "Could not start charging session",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setStartingSession(false);
    }
  };

  // End charging session
  const endChargingSession = async () => {
    if (!activeChargingSession) return;

    try {
      await ChargingSessionService.endSession(activeChargingSession.id);
      setActiveChargingSession(null);
      
      toast({
        title: "Charging Session Ended",
        description: "Your charging session has been completed",
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error ending charging session:', error);
      toast({
        title: "Failed to End Session",
        description: error.response?.data?.message || "Could not end charging session",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <div className="relative h-full w-full">
      <Mapbox 
        className="h-full w-full"
        initialCenter={userVehicle ? [userVehicle.longitude, userVehicle.latitude] : userPosition}
        initialZoom={12}
        markers={mapMarkers}
        onMarkerClick={handleMarkerClick}
        disableTelemetry={true}
        onMapLoad={handleMapLoad}
        renderCustomMarker={renderCustomMarker}
        routeCoordinates={routePath.length > 0 ? routePath : undefined}
        is3D={true}
      />
      
      {/* Selected marker popup */}
      {selectedMarker && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4 z-10">
          <div className="bg-background/95 backdrop-blur-sm p-4 rounded-xl shadow-lg animate-scale-in">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center">
                {selectedMarker.type === 'vehicle' ? (
                  <div className="bg-blue-500 p-2 rounded-full text-white mr-3">
                    <Car className="h-5 w-5" />
                  </div>
                ) : (
                  <div className={`p-2 rounded-full text-white mr-3 ${selectedMarker.status === 'available' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                    <Battery className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-medium">{selectedMarker.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedMarker.type === 'vehicle' 
                      ? `Battery: ${selectedMarker.info.batteryLevel}%` 
                      : selectedMarker.info.available}
                  </p>
                </div>
              </div>
              
              <button
                onClick={clearSelectedMarker}
                className="p-1 hover:bg-accent rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-4">
              {selectedMarker.type === 'vehicle' ? (
                <>
                  <div className="bg-accent/30 p-2 rounded-lg">
                    <p className="text-xs text-muted-foreground">Model</p>
                    <p className="font-medium">{selectedMarker.info.model}</p>
                  </div>
                  <div className="bg-accent/30 p-2 rounded-lg">
                    <p className="text-xs text-muted-foreground">Current Speed</p>
                    <p className="font-medium">{selectedMarker.info.speed}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-accent/30 p-2 rounded-lg">
                    <p className="text-xs text-muted-foreground">Charger Type</p>
                    <p className="font-medium">{selectedMarker.info.chargerType}</p>
                  </div>
                  <div className="bg-accent/30 p-2 rounded-lg">
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-medium">{selectedMarker.info.price}</p>
                  </div>
                  <div className="bg-accent/30 p-2 rounded-lg col-span-2">
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="font-medium">{selectedMarker.info.address}</p>
                  </div>
                </>
              )}
            </div>
            
            <div className="mt-4">
              {selectedMarker.type === 'vehicle' ? (
                <button
                  onClick={() => navigate(`/vehicle`)}
                  className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                  View Vehicle Details
                </button>
              ) : showRouteSimulation ? (
                <button
                  onClick={() => startChargingSession(selectedMarker.info.stationData)}
                  className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Battery className="h-4 w-4" />
                  <span>Start Charging Session</span>
                </button>
              ) : (
                <button
                  onClick={handleNavigateToStation}
                  className={`w-full py-2 rounded-md transition-colors flex items-center justify-center gap-2 ${
                    selectedMarker.status === 'available'
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-yellow-500 text-white hover:bg-yellow-600'
                  }`}
                >
                  <Navigation className="h-4 w-4" />
                  <span>{selectedMarker.status === 'available' ? 'Navigate to Station' : 'Notify When Available'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
