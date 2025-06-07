import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/dashboard/sidebar';
import { StationsMap } from '@/components/stations/StationsMap';
import { useToast } from '@/hooks/use-toast';
import ChargingStationService from '@/services/charging-station-service';
import ChargingSessionService from '@/services/charging-session-service';
import VehicleService from '@/services/vehicle-service';
import { 
  Search, Filter, CheckSquare, Square, Map as MapIcon,
  List, ChevronDown, ChevronUp, X, Zap, Clock, MapPin, 
  Battery, Car, Navigation
} from 'lucide-react';

const StationsPage = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [startingSession, setStartingSession] = useState<number | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    showAvailableStations: true,
    showOccupiedStations: true,
    showFastChargers: true,
    showStandardChargers: true,
  });
  
  // Fetch stations data
  const { data: stations, isLoading, error, refetch: refetchStations } = useQuery({
    queryKey: ['stations'],
    queryFn: ChargingStationService.getAllStations,
  });

  // Fetch current vehicle
  const { data: currentVehicle } = useQuery({
    queryKey: ['currentVehicle'],
    queryFn: VehicleService.getCurrentVehicle,
  });

  // Fetch active charging session
  const { data: activeSession, refetch: refetchSession } = useQuery({
    queryKey: ['activeSession', currentVehicle?.id],
    queryFn: () => {
      if (!currentVehicle?.id) {
        return Promise.resolve(null);
      }
      return ChargingSessionService.getActiveSession(currentVehicle.id);
    },
    enabled: !!currentVehicle?.id,
    refetchInterval: (data) => {
      // Only refresh if there's an active session to avoid unnecessary API calls
      return data ? 5000 : false;
    },
    retry: (failureCount, error: any) => {
      // Don't retry on 403 errors (permission denied)
      if (error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Toggle a filter
  const toggleFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Filter stations based on criteria
  const filteredStations = stations?.filter(station => {
    // Filter by availability
    const isAvailable = station.availableConnectors > 0;
    if (isAvailable && !filters.showAvailableStations) return false;
    if (!isAvailable && !filters.showOccupiedStations) return false;
    
    // Filter by charger type (fast or standard)
    const isFastCharger = station.powerRating > 40;
    if (isFastCharger && !filters.showFastChargers) return false;
    if (!isFastCharger && !filters.showStandardChargers) return false;
    
    // Filter by search query
    if (searchQuery && !station.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Handle station selection
  const handleStationSelect = (stationId: number) => {
    setSelectedStation(stationId);
    
    const station = stations?.find(s => s.id === stationId);
    if (station) {
      toast({
        title: "Station Selected",
        description: `Selected ${station.name}`,
        duration: 3000,
      });
    }
  };

  // Start charging session
  const handleStartCharging = async (stationId: number) => {
    if (!currentVehicle) {
      toast({
        title: "No Vehicle Available",
        description: "You need a registered vehicle to start charging",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (activeSession) {
      toast({
        title: "Active Session Exists",
        description: "You already have an active charging session. End it first.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const station = stations?.find(s => s.id === stationId);
    if (!station) {
      toast({
        title: "Station Not Found",
        description: "Could not find the selected station",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (station.availableConnectors <= 0) {
      toast({
        title: "No Available Connectors",
        description: "This station has no available connectors",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setStartingSession(stationId);
    try {
      const session = await ChargingSessionService.startSession(
        stationId,
        currentVehicle.id,
        'Type 2' // Default connector type
      );

      // Refresh both session data and stations data to update slot counts
      await Promise.all([refetchSession(), refetchStations()]);

      toast({
        title: "Charging Session Started",
        description: `Started charging at ${station.name}. Slot reserved successfully.`,
        duration: 5000,
      });

    } catch (error: unknown) {
      console.error('Error starting charging session:', error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.message 
        : "Could not start charging session. You may need to be closer to the station.";
      
      toast({
        title: "Failed to Start Charging",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setStartingSession(null);
    }
  };

  // End charging session with summary
  const handleEndCharging = async () => {
    if (!activeSession) return;

    try {
      const completedSession = await ChargingSessionService.endSession(activeSession.id);
      
      // Calculate session details
      const startTime = new Date(activeSession.startTime);
      const endTime = new Date();
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100;
      const energyDelivered = completedSession.energyDelivered || 0;
      const cost = completedSession.cost || 0;

      // Refresh both session data and stations data to update slot counts
      await Promise.all([refetchSession(), refetchStations()]);

      toast({
        title: "Charging Session Completed",
        description: `Duration: ${durationHours}h • Energy: ${energyDelivered} kWh • Cost: $${cost.toFixed(2)}`,
        duration: 8000,
      });
    } catch (error: unknown) {
      console.error('Error ending charging session:', error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.message 
        : "Could not end charging session";
        
      toast({
        title: "Failed to End Session",
        description: errorMessage,
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <main className="flex-1 md:ml-[70px] lg:ml-64 transition-all duration-300">
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          {/* No Vehicle Warning */}
          {!currentVehicle && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-2 rounded-full">
                  <Car className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-medium text-yellow-900">No Vehicle Assigned</h3>
                  <p className="text-sm text-yellow-700">
                    You need a registered vehicle to start charging sessions. Please contact your fleet manager to assign a vehicle to your account.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Active Session Banner */}
          {activeSession && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Zap className="h-5 w-5 text-green-600 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-medium text-green-900">Charging Session Active</h3>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>Station: {activeSession.stationName} • Connector: {activeSession.connectorType}</p>
                      <div className="flex items-center gap-4">
                        <span>Started: {new Date(activeSession.startTime).toLocaleTimeString()}</span>
                        <span>Energy: {activeSession.energyDelivered || 0} kWh</span>
                        <span>Battery: {activeSession.initialBatteryLevel}% → {activeSession.finalBatteryLevel || '..'}%</span>
                        {activeSession.cost && <span>Cost: ${activeSession.cost.toFixed(2)}</span>}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleEndCharging()}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  End Session
                </button>
              </div>
            </div>
          )}
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Charging Stations</h1>
              <p className="text-muted-foreground">Find and navigate to charging stations</p>
              {currentVehicle && (
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Car className="h-4 w-4" />
                    {currentVehicle.make} {currentVehicle.model}
                  </span>
                  <span className="flex items-center gap-1">
                    <Battery className="h-4 w-4" />
                    {currentVehicle.currentBatteryLevel}%
                  </span>
                  {activeSession && (
                    <span className="flex items-center gap-1 text-green-600">
                      <Zap className="h-4 w-4" />
                      Charging at {activeSession.stationName}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setViewMode('map')}
                className={`px-3 py-2 rounded-md flex items-center gap-1 ${
                  viewMode === 'map' ? 'bg-primary text-primary-foreground' : 'bg-accent'
                }`}
              >
                <MapIcon className="h-4 w-4" />
                <span>Map</span>
              </button>
              
              <button 
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-md flex items-center gap-1 ${
                  viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-accent'
                }`}
              >
                <List className="h-4 w-4" />
                <span>List</span>
              </button>
            </div>
          </div>
          
          {/* Filters and search */}
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="Search for stations by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 p-3 bg-background rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-transparent"
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
                className="bg-accent px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-accent/80 transition-colors"
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
              <div className="bg-background p-4 rounded-xl border border-border animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    <span>Available Stations</span>
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
                    <span>Occupied Stations</span>
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
                    <span>Standard Chargers</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Main content - map or list view */}
          {isLoading ? (
            <div className="flex items-center justify-center h-[60vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Error Loading Stations</h3>
                <p className="text-muted-foreground">Could not retrieve charging stations.</p>
              </div>
            </div>
          ) : viewMode === 'map' ? (
            <div className="h-[70vh] rounded-xl border border-border overflow-hidden">
              <StationsMap 
                onStationSelect={handleStationSelect} 
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredStations && filteredStations.length > 0 ? (
                filteredStations.map(station => (
                  <div key={station.id} className="py-4 flex justify-between items-center">
                    <div>
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          station.availableConnectors > 0 ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                        <h3 className="font-medium">{station.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{station.address}</p>
                      <div className="mt-1 flex items-center gap-4 text-sm">
                        <span>{station.powerRating} kW</span>
                        <span>${station.pricePerKwh}/kWh</span>
                        <span>{station.availableConnectors}/{station.totalConnectors} Available</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!currentVehicle ? (
                        // No vehicle assigned
                        <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-md flex items-center gap-1">
                          <Car className="h-4 w-4" />
                          No Vehicle Assigned
                        </div>
                      ) : activeSession && activeSession.stationId === station.id ? (
                        // Currently charging at this station
                        <button
                          onClick={() => handleEndCharging()}
                          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center gap-1 animate-pulse"
                        >
                          <Zap className="h-4 w-4" />
                          Charging... Click to End
                        </button>
                      ) : activeSession ? (
                        // Charging at another station
                        <div className="px-4 py-2 bg-gray-200 text-gray-600 rounded-md flex items-center gap-1">
                          <Battery className="h-4 w-4" />
                          Charging Elsewhere
                        </div>
                      ) : station.availableConnectors > 0 ? (
                        // Station available for charging
                        <button
                          onClick={() => handleStartCharging(station.id)}
                          disabled={startingSession === station.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-1 disabled:bg-green-400 disabled:cursor-wait"
                        >
                          {startingSession === station.id ? (
                            <>
                              <Clock className="h-4 w-4 animate-spin" />
                              Starting Session...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4" />
                              Start Charging ({station.availableConnectors} slots)
                            </>
                          )}
                        </button>
                      ) : (
                        // Station fully occupied
                        <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          All Slots Occupied
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleStationSelect(station.id)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                      >
                        <Navigation className="h-4 w-4" />
                        Navigate
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">No stations match your filters.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StationsPage;
