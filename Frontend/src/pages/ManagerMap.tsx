import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Mapbox } from '@/components/ui/mapbox';
import { Search, Filter, ChevronDown, X, Bolt, Battery, Info, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ChargingStationService from '@/services/charging-station-service';
import ChargingSessionService from '@/services/charging-session-service';
import { ChargingStation, ChargingSession, StationStatus } from '@/types/api';

interface MapMarker {
  id: string;
  position: [number, number];
  type: 'charging-station';
  status: 'available' | 'occupied' | 'low-battery' | 'charging';
}

const ManagerMap = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState({
    status: [] as StationStatus[],
    power: [] as string[],
    connectorTypes: [] as string[]
  });

  // Fetch stations and sessions data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch stations
        const stationsData = await ChargingStationService.getAllStations();
        setStations(stationsData);

        // Fetch sessions for all stations
        let allSessions: ChargingSession[] = [];
        for (const station of stationsData) {
          try {
            const stationSessions = await ChargingSessionService.getStationSessions(station.id);
            allSessions = [...allSessions, ...stationSessions];
          } catch (sessionError) {
            console.warn(`Could not fetch sessions for station ${station.id}:`, sessionError);
          }
        }
        setSessions(allSessions);

      } catch (err) {
        console.error('Error fetching map data:', err);
        const error = err as { code?: string; message?: string; response?: { status: number } };
        
        let errorMessage = 'Failed to load station data. ';
        if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
          errorMessage += 'Please check if the backend server is running.';
        } else {
          errorMessage += 'Please try again later.';
        }
        setError(errorMessage);
        
        toast({
          title: "Error Loading Stations",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Convert station data to map markers
  const stationMarkers: MapMarker[] = stations.map(station => {
    // Map backend status to map marker status
    let markerStatus: 'available' | 'occupied' | 'low-battery' | 'charging';
    
    switch (station.status) {
      case 'AVAILABLE':
        markerStatus = station.availableConnectors > 0 ? 'available' : 'occupied';
        break;
      case 'IN_USE':
        markerStatus = 'charging';
        break;
      case 'MAINTENANCE':
        markerStatus = 'low-battery'; // Use low-battery to represent maintenance
        break;
      case 'OUT_OF_SERVICE':
        markerStatus = 'low-battery';
        break;
      default:
        markerStatus = 'available';
    }

    return {
      id: station.id.toString(),
      position: [station.longitude, station.latitude] as [number, number],
      type: 'charging-station' as const,
      status: markerStatus
    };
  });

  // Filter stations based on search query and active filters
  const filteredStations = stations.filter(station => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = activeFilters.status.length === 0 || 
      activeFilters.status.includes(station.status);
    
    // Power filter
    const matchesPower = activeFilters.power.length === 0 || 
      activeFilters.power.some(powerRange => {
        if (powerRange === '< 50 kW') return station.powerRating < 50;
        if (powerRange === '50-150 kW') return station.powerRating >= 50 && station.powerRating <= 150;
        if (powerRange === '> 150 kW') return station.powerRating > 150;
        return false;
      });
    
    // Connector type filter
    const matchesConnectorType = activeFilters.connectorTypes.length === 0 ||
      activeFilters.connectorTypes.some(type => 
        station.connectorTypes.toLowerCase().includes(type.toLowerCase())
      );
    
    return matchesSearch && matchesStatus && matchesPower && matchesConnectorType;
  });

  const handleMarkerClick = (markerId: string) => {
    const station = stations.find(s => s.id.toString() === markerId);
    if (station) {
      setSelectedStation(station);
      toast({
        title: station.name,
        description: `${station.availableConnectors}/${station.totalConnectors} ports available | ${station.powerRating} kW`,
      });
    }
  };

  const handleStationDetails = () => {
    if (selectedStation) {
      navigate(`/station-profile/${selectedStation.id}`);
    }
  };

  const handleAddNewStation = () => {
    navigate('/manager/stations/new');
  };
  
  const clearSearch = () => {
    setSearchQuery('');
    setSelectedStation(null);
  };

  const clearFilters = () => {
    setActiveFilters({
      status: [],
      power: [],
      connectorTypes: []
    });
    setFiltersOpen(false);
  };

  const toggleStatusFilter = (status: StationStatus) => {
    setActiveFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }));
  };

  const togglePowerFilter = (powerRange: string) => {
    setActiveFilters(prev => ({
      ...prev,
      power: prev.power.includes(powerRange)
        ? prev.power.filter(p => p !== powerRange)
        : [...prev.power, powerRange]
    }));
  };

  const toggleConnectorTypeFilter = (connectorType: string) => {
    setActiveFilters(prev => ({
      ...prev,
      connectorTypes: prev.connectorTypes.includes(connectorType)
        ? prev.connectorTypes.filter(c => c !== connectorType)
        : [...prev.connectorTypes, connectorType]
    }));
  };

  // Calculate station statistics
  const stats = {
    total: stations.length,
    available: stations.filter(s => s.status === 'AVAILABLE' && s.availableConnectors > 0).length,
    maintenance: stations.filter(s => s.status === 'MAINTENANCE').length,
    offline: stations.filter(s => s.status === 'OUT_OF_SERVICE').length,
  };

  // Get daily revenue for selected station
  const getStationDailyRevenue = (station: ChargingStation): number => {
    const today = new Date().toDateString();
    const stationSessions = sessions.filter(session => 
      session.stationId === station.id && 
      session.status === 'COMPLETED' &&
      session.cost &&
      new Date(session.startTime).toDateString() === today
    );
    
    return stationSessions.reduce((sum, session) => sum + (session.cost || 0), 0);
  };

  // Get status display info
  const getStatusDisplay = (status: StationStatus, availableConnectors: number) => {
    switch (status) {
      case 'AVAILABLE':
        return availableConnectors > 0 
          ? { icon: <Bolt className="h-4 w-4 mr-1" />, text: 'Available', color: 'text-green-500' }
          : { icon: <Battery className="h-4 w-4 mr-1" />, text: 'All Ports Occupied', color: 'text-yellow-500' };
      case 'IN_USE':
        return { icon: <Battery className="h-4 w-4 mr-1" />, text: 'In Use', color: 'text-blue-500' };
      case 'MAINTENANCE':
        return { icon: <AlertTriangle className="h-4 w-4 mr-1" />, text: 'Maintenance', color: 'text-amber-500' };
      case 'OUT_OF_SERVICE':
        return { icon: <X className="h-4 w-4 mr-1" />, text: 'Offline', color: 'text-red-500' };
      default:
        return { icon: <Bolt className="h-4 w-4 mr-1" />, text: 'Unknown', color: 'text-gray-500' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 md:ml-[70px] lg:ml-64 transition-all duration-300 relative">
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading station map...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 md:ml-[70px] lg:ml-64 transition-all duration-300 relative">
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-2">Error Loading Map</p>
              <p className="text-muted-foreground text-sm mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <main className="flex-1 md:ml-[70px] lg:ml-64 transition-all duration-300 relative">
        {/* Map Container */}
        <div className="absolute inset-0">
          <Mapbox 
            className="h-full w-full"
            initialCenter={
              stations.length > 0 
                ? [stations[0].longitude, stations[0].latitude] as [number, number]
                : [-74.006, 40.7128] as [number, number]
            } 
            initialZoom={12}
            markers={stationMarkers
              .filter(marker => {
                const station = stations.find(s => s.id.toString() === marker.id);
                return station && filteredStations.includes(station);
              })
              .map(station => ({
                id: station.id,
                position: station.position,
                type: station.type,
                status: station.status
              }))
            }
            onMarkerClick={handleMarkerClick}
          />
        </div>
        
        {/* Search and Controls Overlay - Fixed to top */}
        <div className="absolute top-4 left-4 right-4 flex flex-col md:flex-row gap-4 z-10">
          <div className="flex-grow glassmorphism rounded-xl overflow-hidden shadow-lg">
            <div className="flex items-center p-2">
              <Search className="h-5 w-5 text-muted-foreground ml-2" />
              <input
                type="text"
                placeholder="Search for your charging stations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow bg-transparent border-none p-2 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={clearSearch} className="p-2 text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="glassmorphism"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
            </Button>
            
            <Button 
              className="glassmorphism bg-primary text-primary-foreground"
              onClick={handleAddNewStation}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Station
            </Button>
          </div>
        </div>
        
        {/* Filters Panel */}
        {filtersOpen && (
          <div className="absolute top-20 left-4 right-4 glassmorphism rounded-xl p-4 shadow-lg z-10 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Filter Stations</h3>
              <button onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => toggleStatusFilter('AVAILABLE')}
                    className={`flex items-center px-2 py-1 rounded text-xs transition-colors ${
                      activeFilters.status.includes('AVAILABLE')
                        ? 'bg-green-500 text-white'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    }`}
                  >
                    Available
                  </button>
                  <button 
                    onClick={() => toggleStatusFilter('IN_USE')}
                    className={`flex items-center px-2 py-1 rounded text-xs transition-colors ${
                      activeFilters.status.includes('IN_USE')
                        ? 'bg-blue-500 text-white'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                  >
                    In Use
                  </button>
                  <button 
                    onClick={() => toggleStatusFilter('MAINTENANCE')}
                    className={`flex items-center px-2 py-1 rounded text-xs transition-colors ${
                      activeFilters.status.includes('MAINTENANCE')
                        ? 'bg-amber-500 text-white'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}
                  >
                    Maintenance
                  </button>
                  <button 
                    onClick={() => toggleStatusFilter('OUT_OF_SERVICE')}
                    className={`flex items-center px-2 py-1 rounded text-xs transition-colors ${
                      activeFilters.status.includes('OUT_OF_SERVICE')
                        ? 'bg-red-500 text-white'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    Offline
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Power</label>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => togglePowerFilter('< 50 kW')}
                    className={`flex items-center px-2 py-1 rounded text-xs transition-colors ${
                      activeFilters.power.includes('< 50 kW')
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    &lt; 50 kW
                  </button>
                  <button 
                    onClick={() => togglePowerFilter('50-150 kW')}
                    className={`flex items-center px-2 py-1 rounded text-xs transition-colors ${
                      activeFilters.power.includes('50-150 kW')
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    50-150 kW
                  </button>
                  <button 
                    onClick={() => togglePowerFilter('> 150 kW')}
                    className={`flex items-center px-2 py-1 rounded text-xs transition-colors ${
                      activeFilters.power.includes('> 150 kW')
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    &gt; 150 kW
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Port Types</label>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => toggleConnectorTypeFilter('CCS')}
                    className={`flex items-center px-2 py-1 rounded text-xs transition-colors ${
                      activeFilters.connectorTypes.includes('CCS')
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    CCS
                  </button>
                  <button 
                    onClick={() => toggleConnectorTypeFilter('CHAdeMO')}
                    className={`flex items-center px-2 py-1 rounded text-xs transition-colors ${
                      activeFilters.connectorTypes.includes('CHAdeMO')
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    CHAdeMO
                  </button>
                  <button 
                    onClick={() => toggleConnectorTypeFilter('Type 2')}
                    className={`flex items-center px-2 py-1 rounded text-xs transition-colors ${
                      activeFilters.connectorTypes.includes('Type 2')
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    Type 2
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
                {/* Selected Station Information */}
        {selectedStation && (
          <div className="absolute bottom-4 left-4 glassmorphism rounded-xl p-4 shadow-lg z-10 animate-fade-in max-w-sm">
            <div className="flex justify-between">
              <h3 className="font-medium">{selectedStation.name}</h3>
              <button 
                onClick={() => setSelectedStation(null)} 
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="mt-2 flex items-center">
              <div className={`flex items-center ${getStatusDisplay(selectedStation.status, selectedStation.availableConnectors).color}`}>
                {getStatusDisplay(selectedStation.status, selectedStation.availableConnectors).icon}
                <span className="text-sm">
                  {getStatusDisplay(selectedStation.status, selectedStation.availableConnectors).text}
                </span>
              </div>
              
              <div className="mx-2 h-4 w-px bg-border"></div>
              
              <div className="text-sm text-muted-foreground">
                {selectedStation.availableConnectors}/{selectedStation.totalConnectors} ports available
              </div>
            </div>
            
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="bg-background/50 p-2 rounded">
                <div className="text-muted-foreground">Max Power</div>
                <div className="font-medium">
                  {selectedStation.powerRating} kW
                </div>
              </div>
              
              <div className="bg-background/50 p-2 rounded">
                <div className="text-muted-foreground">Today's Revenue</div>
                <div className="font-medium">${Math.round(getStationDailyRevenue(selectedStation))}</div>
              </div>
            </div>
            
            <div className="mt-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleStationDetails}
              >
                <Info className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          </div>
        )}
        
        {/* Key Stats - Move to the top right but lower to avoid overlap */}
        <div className="absolute top-24 right-4 glassmorphism rounded-xl p-4 shadow-lg z-10 hidden md:block">
          <h3 className="font-medium mb-2">Station Overview</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Stations:</span>
              <span className="font-medium">{stats.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Available:</span>
              <span className="font-medium text-green-500">
                {stats.available}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Maintenance:</span>
              <span className="font-medium text-yellow-500">
                {stats.maintenance}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Offline:</span>
              <span className="font-medium text-red-500">
                {stats.offline}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerMap;
