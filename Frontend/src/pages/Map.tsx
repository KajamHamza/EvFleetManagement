import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Mapbox } from '@/components/ui/mapbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Car, Filter, Battery, Pin, ChevronDown, ChevronUp, X, CheckSquare, Square, 
  ArrowLeft, Search, Zap, Navigation, MapPin
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import VehicleService from '@/services/vehicle-service';
import ChargingStationService from '@/services/charging-station-service';
import AuthService from '@/services/auth-service';
import RouteService from '@/services/route-service';
import mapboxgl from 'mapbox-gl';

const MapPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [simulationRunning, setSimulationRunning] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentRoute, setCurrentRoute] = useState<[number, number][] | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [navigationTarget, setNavigationTarget] = useState<{
    name: string;
    position: [number, number];
    available: boolean;
  } | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    showVehicles: true,
    showAvailableStations: true,
    showOccupiedStations: true,
    showFastChargers: true,
    showStandardChargers: true,
  });
  
  const currentUser = AuthService.getCurrentUser();
  
  // Fetch data with reduced refetch intervals
  const { data: currentVehicle } = useQuery({
    queryKey: ['currentVehicle'],
    queryFn: VehicleService.getCurrentVehicle,
    refetchInterval: 30000, // Reduced from default to prevent constant reloading
    staleTime: 25000,
  });

  const { data: stations } = useQuery({
    queryKey: ['chargingStations'],
    queryFn: ChargingStationService.getAllStations,
    refetchInterval: 60000, // Stations don't change often
    staleTime: 50000,
  });

  // Stabilize markers with useMemo
  const mapMarkers = useMemo(() => {
    interface MarkerInfo {
      batteryLevel?: number;
      model?: string;
      speed?: string;
      vehicleData?: typeof currentVehicle;
      chargerType?: string;
      price?: string;
      available?: string;
    }
    
    const markers: Array<{
      id: string;
      position: [number, number];
      type: 'vehicle' | 'charging-station';
      status?: 'available' | 'occupied' | 'low-battery' | 'charging';
      name: string;
      info: MarkerInfo;
    }> = [];

    // Add current user's vehicle
    if (currentVehicle) {
      markers.push({
        id: `vehicle-${currentVehicle.id}`,
        position: [currentVehicle.longitude, currentVehicle.latitude],
        type: 'vehicle',
        status: currentVehicle.currentBatteryLevel < 20 
          ? 'low-battery' 
          : currentVehicle.currentState === 'CHARGING' ? 'charging' : undefined,
        name: currentVehicle.name || `${currentVehicle.make} ${currentVehicle.model}`,
        info: {
          batteryLevel: currentVehicle.currentBatteryLevel,
          model: `${currentVehicle.make} ${currentVehicle.model}`,
          speed: `${currentVehicle.currentSpeed} mph`,
          vehicleData: currentVehicle
        }
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
          info: {
            chargerType: station.connectorTypes || 'Standard',
            price: `$${station.pricePerKwh}/kWh`,
            available: `${station.availableConnectors}/${station.totalConnectors} stations`
          }
        });
      });
    }

    return markers;
  }, [currentVehicle, stations]); // Only recreate when these change

  // Memoize the map center to prevent constant updates
  const mapCenter = useMemo(() => {
    if (currentVehicle) {
      return [currentVehicle.longitude, currentVehicle.latitude] as [number, number];
    }
    return [-74.006, 40.7128] as [number, number]; // Default to NYC
  }, [currentVehicle?.longitude, currentVehicle?.latitude]);
  
  // Selected marker state
  const [selectedMarker, setSelectedMarker] = useState<(typeof mapMarkers)[0] | null>(null);
  
  // Toggle a filter
  const toggleFilter = useCallback((key: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);
  
  // Handle marker click
  const handleMarkerClick = useCallback((markerId: string) => {
    const marker = mapMarkers.find(m => m.id === markerId);
    
    if (marker) {
      setSelectedMarker(marker);
    }
  }, [mapMarkers]);
  
  // Clear selected marker
  const clearSelectedMarker = useCallback(() => {
    setSelectedMarker(null);
  }, []);
  
  // Handle map load
  const handleMapLoad = useCallback((map: mapboxgl.Map) => {
    setMapInstance(map);
  }, []);

  // Navigate to charging station
  const navigateToStation = useCallback(async (station: typeof selectedMarker) => {
    if (!station || !currentVehicle || station.type !== 'charging-station') {
      toast({
        title: "Navigation Error",
        description: "Cannot navigate without vehicle or valid station",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsNavigating(true);
    setNavigationTarget({
      name: station.name,
      position: station.position,
      available: station.status === 'available'
    });

    try {
      // Calculate route from vehicle to station
      const vehiclePosition: [number, number] = [currentVehicle.longitude, currentVehicle.latitude];
      const routeResult = await RouteService.calculateRoute(
        { coordinates: vehiclePosition, name: 'Current Location' },
        { coordinates: station.position, name: station.name },
        'fastest'
      );

      setCurrentRoute(routeResult.route);
      
      toast({
        title: station.status === 'available' ? "Route Calculated" : "Station Currently Occupied",
        description: station.status === 'available' 
          ? `Route to ${station.name}: ${(routeResult.distance / 1000).toFixed(1)}km, ${Math.round(routeResult.duration / 60)} min`
          : `${station.name} is occupied but route calculated. You'll be notified when a spot becomes available.`,
        duration: 5000,
      });

      clearSelectedMarker();
    } catch (error) {
      console.error('Navigation failed:', error);
      setIsNavigating(false);
      setNavigationTarget(null);
      toast({
        title: "Navigation Failed",
        description: "Could not calculate route to station",
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [currentVehicle, toast, clearSelectedMarker]);

  // Clear navigation
  const clearNavigation = useCallback(() => {
    setCurrentRoute(null);
    setIsNavigating(false);
    setNavigationTarget(null);
    
    toast({
      title: "Navigation Cleared",
      description: "Route removed from map",
      duration: 2000,
    });
  }, [toast]);

  // Enhanced car icon functionality
  const handleCarIconClick = useCallback(() => {
    if (currentVehicle) {
      // Center map on vehicle
      if (mapInstance) {
        mapInstance.flyTo({
          center: [currentVehicle.longitude, currentVehicle.latitude],
          zoom: 15,
          duration: 1500
        });
      }
      
      toast({
        title: "Centered on Vehicle",
        description: `${currentVehicle.make} ${currentVehicle.model} - ${currentVehicle.currentBatteryLevel}% battery`,
        duration: 3000,
      });
    } else {
      // Toggle simulation if no vehicle
      setSimulationRunning(!simulationRunning);
      toast({
        title: simulationRunning ? "Simulation Paused" : "Simulation Resumed",
        description: simulationRunning ? "Vehicle tracking paused" : "Vehicle tracking resumed",
        duration: 2000,
      });
    }
  }, [currentVehicle, mapInstance, simulationRunning, toast]);
  
  // Filter markers based on filter settings and search query - FIXED: Make this stable
  const filteredMarkers = useMemo(() => {
    return mapMarkers.filter(marker => {
      // Filter by type
      if (marker.type === 'vehicle' && !filters.showVehicles) return false;
      if (marker.type === 'charging-station') {
        if (marker.status === 'available' && !filters.showAvailableStations) return false;
        if (marker.status === 'occupied' && !filters.showOccupiedStations) return false;
        
        const isFastCharger = marker.info.chargerType === 'Fast Charger';
        if (isFastCharger && !filters.showFastChargers) return false;
        if (!isFastCharger && !filters.showStandardChargers) return false;
      }
      
      // Filter by search query
      if (searchQuery && !marker.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [mapMarkers, filters, searchQuery]);
  
  // Simulate vehicle movement (in a real app, this would be from the WebSocket/SSE data)
  useEffect(() => {
    if (!simulationRunning) return;
    
    // Real vehicle updates will come from WebSocket/backend simulation
    // No need to manually update markers anymore
    
  }, [simulationRunning]);

  // Find nearest charging station
  const findNearestStation = useCallback(async () => {
    if (!currentVehicle || !stations) {
      toast({
        title: "Error",
        description: "Vehicle or station data not available",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const vehiclePosition: [number, number] = [currentVehicle.longitude, currentVehicle.latitude];
    
    // Find nearest available station
    const availableStations = stations.filter(station => station.availableConnectors > 0);
    
    if (availableStations.length === 0) {
      toast({
        title: "No Available Stations",
        description: "All nearby charging stations are currently occupied",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Calculate distances and find nearest
    let nearestStation = null;
    let shortestDistance = Infinity;

    for (const station of availableStations) {
      const stationPosition: [number, number] = [station.longitude, station.latitude];
      const distance = Math.sqrt(
        Math.pow(vehiclePosition[0] - stationPosition[0], 2) + 
        Math.pow(vehiclePosition[1] - stationPosition[1], 2)
      );
      
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestStation = station;
      }
    }

    if (nearestStation) {
      // Create a mock marker object for the nearest station
      const stationMarker = {
        id: `station-${nearestStation.id}`,
        position: [nearestStation.longitude, nearestStation.latitude] as [number, number],
        type: 'charging-station' as const,
        status: 'available' as const,
        name: nearestStation.name,
        info: {
          chargerType: nearestStation.connectorTypes || 'Standard',
          price: `$${nearestStation.pricePerKwh}/kWh`,
          available: `${nearestStation.availableConnectors}/${nearestStation.totalConnectors} stations`
        }
      };

      await navigateToStation(stationMarker);
    }
  }, [currentVehicle, stations, navigateToStation, toast]);

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      {/* Fullscreen map without sidebar margin */}
      <main className="fixed inset-0 md:ml-[70px] lg:ml-64 transition-all duration-300">
        {/* Map takes up full height and width */}
        <Mapbox 
          className="h-full w-full"
          initialCenter={mapCenter}
          initialZoom={12}
          markers={filteredMarkers}
          onMarkerClick={handleMarkerClick}
          onMapLoad={handleMapLoad}
          routeCoordinates={currentRoute || undefined}
        />
        
        {/* Floating UI elements */}
        <div className="absolute top-4 left-4 right-4 flex flex-col space-y-4 z-10">
          {/* Top bar with back button and title */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/')}
              className="bg-background/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-background/90 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            
            <h1 className="text-xl font-bold bg-background/80 backdrop-blur-sm py-2 px-4 rounded-full shadow-lg">
              Live Map
            </h1>
            
            <button
              onClick={handleCarIconClick}
              className={`bg-background/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-background/90 transition-colors ${
                currentVehicle ? 'text-blue-500' : simulationRunning ? 'text-green-500' : 'text-red-500'
              }`}
              title={currentVehicle ? "Center on Vehicle" : simulationRunning ? "Pause Simulation" : "Resume Simulation"}
            >
              <Car className="h-5 w-5" />
            </button>
          </div>
          
          {/* Search and filters */}
          <div className="flex flex-col space-y-2">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="Search for stations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    // Find and focus on first matching station
                    const matchingStation = filteredMarkers.find(m => 
                      m.type === 'charging-station' && 
                      m.name.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                    if (matchingStation && mapInstance) {
                      mapInstance.flyTo({
                        center: matchingStation.position,
                        zoom: 16,
                        duration: 1500
                      });
                      setSelectedMarker(matchingStation);
                      toast({
                        title: "Station Found",
                        description: `Focusing on ${matchingStation.name}`,
                        duration: 2000,
                      });
                    }
                  }
                }}
                className="w-full pl-10 p-3 bg-background/90 backdrop-blur-sm rounded-full shadow-lg border border-border focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-background/95 transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {filtersOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>
            
            {filtersOpen && (
              <div className="bg-background/90 backdrop-blur-sm p-4 rounded-xl shadow-lg animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Vehicle filter */}
                  <button
                    onClick={() => toggleFilter('showVehicles')}
                    className="flex items-center space-x-2 hover:bg-muted/50 p-2 rounded-md"
                  >
                    {filters.showVehicles ? (
                      <CheckSquare className="h-5 w-5 text-primary" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                    <div className="flex items-center space-x-2">
                      <Car className="h-4 w-4" />
                      <span>Show Vehicles</span>
                    </div>
                  </button>
                  
                  {/* Available stations filter */}
                  <button
                    onClick={() => toggleFilter('showAvailableStations')}
                    className="flex items-center space-x-2 hover:bg-muted/50 p-2 rounded-md"
                  >
                    {filters.showAvailableStations ? (
                      <CheckSquare className="h-5 w-5 text-primary" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                    <div className="flex items-center space-x-2">
                      <Pin className="h-4 w-4 text-green-500" />
                      <span>Available Stations</span>
                    </div>
                  </button>
                  
                  {/* Occupied stations filter */}
                  <button
                    onClick={() => toggleFilter('showOccupiedStations')}
                    className="flex items-center space-x-2 hover:bg-muted/50 p-2 rounded-md"
                  >
                    {filters.showOccupiedStations ? (
                      <CheckSquare className="h-5 w-5 text-primary" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                    <div className="flex items-center space-x-2">
                      <Pin className="h-4 w-4 text-yellow-500" />
                      <span>Occupied Stations</span>
                    </div>
                  </button>
                  
                  {/* Fast chargers filter */}
                  <button
                    onClick={() => toggleFilter('showFastChargers')}
                    className="flex items-center space-x-2 hover:bg-muted/50 p-2 rounded-md"
                  >
                    {filters.showFastChargers ? (
                      <CheckSquare className="h-5 w-5 text-primary" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <span>Fast Chargers</span>
                    </div>
                  </button>
                  
                  {/* Standard chargers filter */}
                  <button
                    onClick={() => toggleFilter('showStandardChargers')}
                    className="flex items-center space-x-2 hover:bg-muted/50 p-2 rounded-md"
                  >
                    {filters.showStandardChargers ? (
                      <CheckSquare className="h-5 w-5 text-primary" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                    <div className="flex items-center space-x-2">
                      <Battery className="h-4 w-4 text-gray-500" />
                      <span>Standard Chargers</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Navigation Status Panel */}
        {isNavigating && navigationTarget && (
          <div className="absolute top-32 left-4 right-4 z-10">
            <div className="bg-background/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary p-2 rounded-full text-primary-foreground">
                    <Navigation className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-medium">Navigating to {navigationTarget.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {navigationTarget.available ? 'Station Available' : 'Station Occupied - Will notify when available'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearNavigation}
                  className="p-1 hover:bg-accent rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Marker details popup */}
        {selectedMarker && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4">
            <div className="glassmorphism p-4 rounded-xl shadow-lg animate-scale-in">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  {selectedMarker.type === 'vehicle' ? (
                    <div className="bg-blue-500 p-2 rounded-full text-white mr-3">
                      <Car className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className={`p-2 rounded-full text-white mr-3 ${selectedMarker.status === 'available' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                      <Zap className="h-5 w-5" />
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
                    <div className="glassmorphism p-2 rounded-lg">
                      <p className="text-xs text-muted-foreground">Model</p>
                      <p className="font-medium">{selectedMarker.info.model}</p>
                    </div>
                    <div className="glassmorphism p-2 rounded-lg">
                      <p className="text-xs text-muted-foreground">Current Speed</p>
                      <p className="font-medium">{selectedMarker.info.speed}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="glassmorphism p-2 rounded-lg">
                      <p className="text-xs text-muted-foreground">Charger Type</p>
                      <p className="font-medium">{selectedMarker.info.chargerType}</p>
                    </div>
                    <div className="glassmorphism p-2 rounded-lg">
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="font-medium">{selectedMarker.info.price}</p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-4">
                {selectedMarker.type === 'vehicle' ? (
                  <button
                    onClick={() => {
                      findNearestStation();
                      clearSelectedMarker();
                    }}
                    className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Find Nearest Charging Station
                  </button>
                ) : (
                  <button
                    onClick={() => navigateToStation(selectedMarker)}
                    className={`w-full py-2 rounded-md transition-colors ${
                      selectedMarker.status === 'available'
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-yellow-500 text-white hover:bg-yellow-600'
                    }`}
                  >
                    {selectedMarker.status === 'available' ? 'Navigate to Station' : 'Navigate (Occupied)'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MapPage;
