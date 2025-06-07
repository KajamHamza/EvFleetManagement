import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/dashboard/sidebar';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/station-management/PageHeader';
import { SearchAndFilters } from '@/components/station-management/SearchAndFilters';
import { TabsSection } from '@/components/station-management/TabsSection';
import ChargingStationService from '@/services/charging-station-service';
import ChargingSessionService from '@/services/charging-session-service';
import webSocketService from '@/services/websocket-service';
import { ChargingStation, StationStatus, ChargingSession, StationUpdate, VehicleUpdate } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bolt, 
  Battery, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Zap,
  Clock,
  Car,
  Activity
} from 'lucide-react';

// Define a mapping between API station status and UI station status
const mapStationStatus = (apiStatus: StationStatus): 'active' | 'maintenance' | 'inactive' => {
  switch (apiStatus) {
    case 'AVAILABLE':
    case 'IN_USE':
      return 'active';
    case 'MAINTENANCE':
      return 'maintenance';
    case 'OUT_OF_SERVICE':
      return 'inactive';
    default:
      return 'inactive';
  }
};

// Define Station interface specifically for UI components
interface UiStation {
  id: number;
  name: string;
  address: string;
  status: 'active' | 'maintenance' | 'inactive';
  chargers: number;
  availableChargers: number;
  revenue: number;
  utilization: number;
  lastMaintenance: string;
}

const StationManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [isConnectedToWebSocket, setIsConnectedToWebSocket] = useState(false);
  
  // Fetch stations from API
  const { data: apiStations, isLoading, error } = useQuery({
    queryKey: ['stations'],
    queryFn: ChargingStationService.getAllStations,
  });
  
  // Transform ChargingStation[] to UiStation[] with additional properties
  const stations: UiStation[] = React.useMemo(() => {
    if (!apiStations) return [];
    
    return apiStations.map((station: ChargingStation) => {
      // Calculate utilization based on available and total connectors
      const utilization = station.totalConnectors > 0 
        ? Math.round(((station.totalConnectors - station.availableConnectors) / station.totalConnectors) * 100)
        : 0;
      
      // Map API station status to UI station status
      const uiStatus = mapStationStatus(station.status);
      
      return {
        id: station.id,
        name: station.name,
        address: station.address,
        status: uiStatus,
        chargers: station.totalConnectors,
        availableChargers: station.availableConnectors,
        revenue: Math.random() * 5000 + 1000, // Mock data for revenue
        utilization: utilization,
        lastMaintenance: "2 months ago" // Mock data for maintenance
      };
    });
  }, [apiStations]);

  // Fetch charging sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        let allSessions: ChargingSession[] = [];
        
        // Fetch sessions for each station
        for (const station of apiStations || []) {
          try {
            const stationSessions = await ChargingSessionService.getStationSessions(station.id);
            allSessions = [...allSessions, ...stationSessions];
          } catch (sessionError) {
            console.warn(`Could not fetch sessions for station ${station.id}:`, sessionError);
          }
        }
        
        setSessions(allSessions);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };

    if (apiStations && apiStations.length > 0) {
      fetchSessions();
    }
  }, [apiStations]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    webSocketService.connectStations();
    webSocketService.connectVehicles();

    const handleStationUpdate = (update: StationUpdate) => {
      // Handle real-time station updates
      console.log('Station update received:', update);
    };

    const handleVehicleUpdate = (update: VehicleUpdate) => {
      // Handle real-time vehicle updates
      console.log('Vehicle update received:', update);
    };

    webSocketService.addStationListener(handleStationUpdate);
    webSocketService.addVehicleListener(handleVehicleUpdate);

    // Check connection status
    const checkConnection = () => {
      setIsConnectedToWebSocket(
        webSocketService.isStationConnected() && webSocketService.isVehicleConnected()
      );
    };

    const connectionInterval = setInterval(checkConnection, 2000);
    checkConnection();

    return () => {
      webSocketService.removeStationListener(handleStationUpdate);
      webSocketService.removeVehicleListener(handleVehicleUpdate);
      clearInterval(connectionInterval);
    };
  }, []);

  // Calculate summary statistics
  const summaryStats = React.useMemo(() => {
    const totalStations = stations.length;
    const activeStations = stations.filter(s => s.status === 'active').length;
    const maintenanceStations = stations.filter(s => s.status === 'maintenance').length;
    const inactiveStations = stations.filter(s => s.status === 'inactive').length;
    const totalChargers = stations.reduce((sum, s) => sum + s.chargers, 0);
    const availableChargers = stations.reduce((sum, s) => sum + s.availableChargers, 0);
    const totalRevenue = stations.reduce((sum, s) => sum + s.revenue, 0);
    const avgUtilization = stations.length > 0 
      ? Math.round(stations.reduce((sum, s) => sum + s.utilization, 0) / stations.length)
      : 0;

    // Session statistics
    const activeSessions = sessions.filter(s => s.status === 'IN_PROGRESS').length;
    const completedSessions = sessions.filter(s => s.status === 'COMPLETED').length;
    const sessionRevenue = sessions
      .filter(s => s.status === 'COMPLETED' && s.cost)
      .reduce((sum, s) => sum + (s.cost || 0), 0);

    return {
      totalStations,
      activeStations,
      maintenanceStations,
      inactiveStations,
      totalChargers,
      availableChargers,
      totalRevenue,
      avgUtilization,
      activeSessions,
      completedSessions,
      sessionRevenue
    };
  }, [stations, sessions]);
  
  const handleAddStation = () => {
    navigate('/onboarding/manager');
  };
  
  // Handle API errors outside of render
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load stations. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 pl-[70px] lg:pl-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 pl-[70px] lg:pl-64 transition-all duration-300">
        <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6">
          <PageHeader 
            title="Station Management"
            description="Manage and monitor your charging stations and sessions"
            onAddStation={handleAddStation}
          />

          {/* Real-time Connection Status */}
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnectedToWebSocket ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-muted-foreground">
              {isConnectedToWebSocket ? 'Real-time updates active' : 'Connecting to real-time updates...'}
            </span>
          </div>

          {/* Summary Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Stations</CardTitle>
                <Bolt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.totalStations}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                  {summaryStats.activeStations} active
                  {summaryStats.maintenanceStations > 0 && (
                    <>
                      <AlertTriangle className="h-3 w-3 ml-2 mr-1 text-amber-500" />
                      {summaryStats.maintenanceStations} maintenance
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Chargers</CardTitle>
                <Battery className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.totalChargers}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Zap className="h-3 w-3 mr-1 text-blue-500" />
                  {summaryStats.availableChargers} available now
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.activeSessions}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Activity className="h-3 w-3 mr-1 text-green-500" />
                  {summaryStats.completedSessions} completed today
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Session Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${Math.round(summaryStats.sessionRevenue).toLocaleString()}</div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  From charging sessions
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.avgUtilization}%</div>
                <div className="w-full bg-muted/50 rounded-full h-1.5 mt-2">
                  <div 
                    className={`h-1.5 rounded-full ${
                      summaryStats.avgUtilization > 70 ? 'bg-green-500' : 
                      summaryStats.avgUtilization > 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} 
                    style={{ width: `${summaryStats.avgUtilization}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <SearchAndFilters 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filtersOpen={filtersOpen}
            setFiltersOpen={setFiltersOpen}
          />
          
          <TabsSection 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            stations={stations}
            searchQuery={searchQuery}
          />
        </div>
      </div>
    </div>
  );
};

export default StationManagement;
