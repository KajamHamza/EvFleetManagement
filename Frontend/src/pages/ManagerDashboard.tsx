import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { StatsCard } from '@/components/dashboard/stats-card';
import { 
  Battery, BatteryCharging, Users, ArrowUpDown, 
  Zap, AlertTriangle, CheckCircle, 
  BarChart3, Clock, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChargingStationService from '@/services/charging-station-service';
import ChargingSessionService from '@/services/charging-session-service';
import { ChargingStation, ChargingSession, StationStatus } from '@/types/api';

interface DashboardStats {
  totalStations: number;
  onlineStations: number;
  totalPorts: number;
  activePorts: number;
  totalRevenue: number;
  energyDelivered: number;
  totalSessions: number;
  activeUsers: number;
  averageChargingTime: number;
  peakHours: string;
}

const ManagerDashboard = () => {
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalStations: 0,
    onlineStations: 0,
    totalPorts: 0,
    activePorts: 0,
    totalRevenue: 0,
    energyDelivered: 0,
    totalSessions: 0,
    activeUsers: 0,
    averageChargingTime: 0,
    peakHours: '00:00 - 00:00'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch stations data
        const stationsData = await ChargingStationService.getAllStations();
        setStations(stationsData);

        // Calculate station stats
        const totalStations = stationsData.length;
        const onlineStations = stationsData.filter(station => 
          station.status === 'AVAILABLE' || station.status === 'IN_USE'
        ).length;
        const totalPorts = stationsData.reduce((sum, station) => sum + station.totalConnectors, 0);
        const activePorts = stationsData.reduce((sum, station) => sum + (station.totalConnectors - station.availableConnectors), 0);

        // Fetch sessions for each station and calculate metrics
        let allSessions: ChargingSession[] = [];
        let totalRevenue = 0;
        let totalEnergyDelivered = 0;

        for (const station of stationsData) {
          try {
            const stationSessions = await ChargingSessionService.getStationSessions(station.id);
            allSessions = [...allSessions, ...stationSessions];
          } catch (sessionError) {
            console.warn(`Could not fetch sessions for station ${station.id}:`, sessionError);
          }
        }

        setSessions(allSessions);

        // Calculate session-based metrics
        const completedSessions = allSessions.filter(session => session.status === 'COMPLETED');
        totalRevenue = completedSessions.reduce((sum, session) => sum + (session.cost || 0), 0);
        totalEnergyDelivered = completedSessions.reduce((sum, session) => sum + (session.energyDelivered || 0), 0);
        
        const activeSessions = allSessions.filter(session => session.status === 'IN_PROGRESS');
        const activeUsers = activeSessions.length;

        // Calculate average charging time
        const completedSessionsWithTime = completedSessions.filter(session => 
          session.startTime && session.endTime
        );
        const averageChargingTime = completedSessionsWithTime.length > 0
          ? completedSessionsWithTime.reduce((sum, session) => {
              const start = new Date(session.startTime);
              const end = new Date(session.endTime!);
              return sum + (end.getTime() - start.getTime()) / (1000 * 60); // minutes
            }, 0) / completedSessionsWithTime.length
          : 0;

        // Calculate peak hours (simplified - would need more sophisticated analysis in real app)
        const peakHours = calculatePeakHours(allSessions);

        setStats({
          totalStations,
          onlineStations,
          totalPorts,
          activePorts,
          totalRevenue: Math.round(totalRevenue),
          energyDelivered: Math.round(totalEnergyDelivered),
          totalSessions: allSessions.length,
          activeUsers,
          averageChargingTime: Math.round(averageChargingTime),
          peakHours
        });

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        let errorMessage = 'Failed to load dashboard data. ';
        
        const error = err as { code?: string; message?: string; response?: { status: number } };
        
        if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
          errorMessage += 'Please check if the backend server is running on port 9090.';
        } else if (error.response?.status === 401) {
          errorMessage += 'Authentication failed. Please log in again.';
        } else if (error.response?.status === 403) {
          errorMessage += 'Access denied. You may not have permission to view this data.';
        } else if (error.response?.status && error.response.status >= 500) {
          errorMessage += 'Server error. Please try again later.';
        } else {
          errorMessage += 'Please check your connection and try again.';
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const calculatePeakHours = (sessions: ChargingSession[]): string => {
    if (sessions.length === 0) return '00:00 - 00:00';
    
    // Simple peak hour calculation - count sessions by hour
    const hourCounts: { [key: number]: number } = {};
    
    sessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Find the hour with most sessions
    const peakHour = Object.keys(hourCounts).reduce((a, b) => 
      hourCounts[parseInt(a)] > hourCounts[parseInt(b)] ? a : b
    );

    const peakHourNum = parseInt(peakHour);
    const endHour = (peakHourNum + 2) % 24; // 2-hour peak window
    
    return `${peakHourNum.toString().padStart(2, '0')}:00 - ${endHour.toString().padStart(2, '0')}:00`;
  };

  const getStatusColor = (status: StationStatus) => {
    switch (status) {
      case 'AVAILABLE': return 'text-green-600';
      case 'IN_USE': return 'text-blue-600';
      case 'MAINTENANCE': return 'text-amber-600';
      case 'OUT_OF_SERVICE': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBgColor = (status: StationStatus) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-500/10 border-green-500/30';
      case 'IN_USE': return 'bg-blue-500/10 border-blue-500/30';
      case 'MAINTENANCE': return 'bg-amber-500/10 border-amber-500/30';
      case 'OUT_OF_SERVICE': return 'bg-red-500/10 border-red-500/30';
      default: return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: StationStatus) => {
    switch (status) {
      case 'AVAILABLE': return <BatteryCharging className="h-5 w-5 text-green-500" />;
      case 'IN_USE': return <BatteryCharging className="h-5 w-5 text-blue-500" />;
      case 'MAINTENANCE': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'OUT_OF_SERVICE': return <Battery className="h-5 w-5 text-red-500" />;
      default: return <Battery className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:ml-[70px] lg:ml-64 transition-all duration-300">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading dashboard data...</p>
              </div>
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
        <main className="flex-1 px-4 py-6 md:ml-[70px] lg:ml-64 transition-all duration-300">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-2">Error Loading Dashboard</p>
                <p className="text-muted-foreground text-sm mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <main className="flex-1 px-4 py-6 md:ml-[70px] lg:ml-64 transition-all duration-300">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold">Station Manager Dashboard</h1>
              <p className="text-muted-foreground mt-1">Welcome back! Here's an overview of your charging stations</p>
            </div>
            
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                disabled={loading}
              >
                <Activity className="mr-2 h-4 w-4" />
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
              <Button variant="outline">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Reports
              </Button>
            </div>
          </div>
          
          {/* Main Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Stations"
              value={stats.totalStations}
              icon={<BatteryCharging className="h-5 w-5 text-primary" />}
              change={5}
              trend="up"
            />
            
            <StatsCard
              title="Online Stations"
              value={`${stats.onlineStations}/${stats.totalStations}`}
              icon={<CheckCircle className="h-5 w-5 text-primary" />}
              change={stats.onlineStations / stats.totalStations * 100}
              trend={stats.onlineStations === stats.totalStations ? "up" : "neutral"}
            />
            
            <StatsCard
              title="Active Charging Ports"
              value={`${stats.activePorts}/${stats.totalPorts}`}
              icon={<Zap className="h-5 w-5 text-primary" />}
              change={stats.activePorts / stats.totalPorts * 100}
              trend={stats.activePorts === stats.totalPorts ? "up" : "neutral"}
            />
            
            <StatsCard
              title="Monthly Revenue"
              value={stats.totalRevenue}
              metric="$"
              icon={<ArrowUpDown className="h-5 w-5 text-primary" />}
              change={12}
              trend="up"
            />
          </div>
          
          {/* Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glassmorphism p-6 rounded-xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium">Active Users</h3>
                  <p className="text-muted-foreground text-sm">Current charging sessions</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex items-end">
                <span className="text-3xl font-bold">{stats.activeUsers}</span>
                <span className="text-sm text-muted-foreground ml-2 mb-1">users</span>
              </div>
              <div className="mt-2 text-sm text-green-500 flex items-center">
                <ArrowUpDown className="h-3 w-3 mr-1" />
                <span>+5% vs last week</span>
              </div>
            </div>
            
            <div className="glassmorphism p-6 rounded-xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium">Average Charging Time</h3>
                  <p className="text-muted-foreground text-sm">Per session</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex items-end">
                <span className="text-3xl font-bold">{stats.averageChargingTime}</span>
                <span className="text-sm text-muted-foreground ml-2 mb-1">minutes</span>
              </div>
              <div className="mt-2 text-sm text-amber-500 flex items-center">
                <ArrowUpDown className="h-3 w-3 mr-1" />
                <span>+2 min vs last week</span>
              </div>
            </div>
            
            <div className="glassmorphism p-6 rounded-xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium">Peak Hours</h3>
                  <p className="text-muted-foreground text-sm">Highest utilization</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex items-end">
                <span className="text-3xl font-bold">{stats.peakHours}</span>
              </div>
              <div className="mt-2 text-sm text-blue-500 flex items-center">
                <ArrowUpDown className="h-3 w-3 mr-1" />
                <span>Same as last week</span>
              </div>
            </div>
          </div>
          
          {/* Alerts and Station Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Alerts */}
            <div className="bg-background rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Alerts</h2>
              <div className="space-y-4">
                {/* Generate alerts based on station status */}
                {stations.filter(station => station.status === 'OUT_OF_SERVICE').map((station) => (
                  <div key={`offline-${station.id}`} className="flex items-start gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                    <div className="mt-1">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">Station Offline</h3>
                      <p className="text-sm text-muted-foreground">{station.name} - All ports unavailable</p>
                      <p className="text-xs text-muted-foreground mt-1">Status: Out of service</p>
                    </div>
                  </div>
                ))}
                
                {stations.filter(station => station.status === 'MAINTENANCE').map((station) => (
                  <div key={`maintenance-${station.id}`} className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                    <div className="mt-1">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">Station Under Maintenance</h3>
                      <p className="text-sm text-muted-foreground">{station.name} - {station.availableConnectors}/{station.totalConnectors} ports available</p>
                      <p className="text-xs text-muted-foreground mt-1">Status: Maintenance in progress</p>
                    </div>
                  </div>
                ))}
                
                {/* Show low utilization alerts for stations with very few sessions */}
                {stations.filter(station => {
                  const stationSessions = sessions.filter(s => s.stationId === station.id);
                  return stationSessions.length < 5 && station.status === 'AVAILABLE';
                }).slice(0, 2).map((station) => (
                  <div key={`low-util-${station.id}`} className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                    <div className="mt-1">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">Low Utilization</h3>
                      <p className="text-sm text-muted-foreground">{station.name} - Low session count</p>
                      <p className="text-xs text-muted-foreground mt-1">Consider promotional activities</p>
                    </div>
                  </div>
                ))}
                
                {/* Show positive alerts for well-performing stations */}
                {stations.filter(station => station.status === 'AVAILABLE' && station.availableConnectors === station.totalConnectors).slice(0, 1).map((station) => (
                  <div key={`operational-${station.id}`} className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                    <div className="mt-1">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">All Systems Operational</h3>
                      <p className="text-sm text-muted-foreground">{station.name} - All ports available</p>
                      <p className="text-xs text-muted-foreground mt-1">Station running optimally</p>
                    </div>
                  </div>
                ))}
                
                {/* Show message if no alerts */}
                {stations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No alerts at this time</p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full">View All Alerts</Button>
              </div>
            </div>
            
            {/* Station Status */}
            <div className="bg-background rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Station Status</h2>
              <div className="space-y-4">
                {stations.slice(0, 4).map((station) => {
                  const stationSessions = sessions.filter(s => s.stationId === station.id);
                  const dailyRevenue = stationSessions
                    .filter(s => s.status === 'COMPLETED' && s.cost)
                    .reduce((sum, s) => sum + (s.cost || 0), 0);
                  const weeklySessions = stationSessions.length;
                  
                  return (
                    <div key={station.id} className={`flex justify-between p-3 rounded-lg border ${getStatusBgColor(station.status)}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${station.status === 'AVAILABLE' ? 'bg-green-500/20' : 
                          station.status === 'IN_USE' ? 'bg-blue-500/20' :
                          station.status === 'MAINTENANCE' ? 'bg-amber-500/20' : 'bg-red-500/20'}`}>
                          {getStatusIcon(station.status)}
                        </div>
                        <div>
                          <h3 className="font-medium">{station.name}</h3>
                          <p className={`text-sm ${getStatusColor(station.status)}`}>
                            {station.status.charAt(0) + station.status.slice(1).toLowerCase().replace('_', ' ')} - {station.availableConnectors}/{station.totalConnectors} ports available
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">${Math.round(dailyRevenue)}/day</div>
                        <div className="text-xs text-muted-foreground">{weeklySessions} sessions/week</div>
                      </div>
                    </div>
                  );
                })}
                {stations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Battery className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No stations found</p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full">View All Stations</Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
