import React, { useEffect, useState } from 'react';
import { 
  Car, 
  Clock, 
  Battery, 
  MoreHorizontal, 
  StopCircle, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import ChargingSessionService from '@/services/charging-session-service';
import ChargingStationService from '@/services/charging-station-service';
import webSocketService from '@/services/websocket-service';
import { ChargingSession, ChargingStation, StationUpdate, VehicleUpdate } from '@/types/api';

interface ChargingSessionsTableProps {
  searchQuery: string;
}

interface SessionWithDetails extends ChargingSession {
  stationName: string;
  chargingTimeMinutes: number;
  estimatedCompletionTime?: string;
}

export const ChargingSessionsTable: React.FC<ChargingSessionsTableProps> = ({ 
  searchQuery 
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectedToWebSocket, setConnectedToWebSocket] = useState(false);

  // Fetch real sessions data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // First fetch all stations
        const stationsData = await ChargingStationService.getAllStations();
        setStations(stationsData);
        
        // Then fetch sessions for each station
        let allSessions: SessionWithDetails[] = [];
        
        for (const station of stationsData) {
          try {
            const stationSessions = await ChargingSessionService.getStationSessions(station.id);
            
            // Transform sessions to include station name and calculated fields
            const sessionsWithDetails = stationSessions.map(session => {
              const now = new Date();
              const startTime = new Date(session.startTime);
              const chargingTimeMinutes = session.endTime 
                ? Math.floor((new Date(session.endTime).getTime() - startTime.getTime()) / (1000 * 60))
                : Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
              
              // Calculate estimated completion time for active sessions
              let estimatedCompletionTime;
              if (session.status === 'IN_PROGRESS') {
                // Simple estimation: assume 1 hour total charging time
                const estimatedEndTime = new Date(startTime.getTime() + 60 * 60 * 1000);
                estimatedCompletionTime = estimatedEndTime.toISOString();
              }
              
              return {
                ...session,
                stationName: station.name,
                chargingTimeMinutes,
                estimatedCompletionTime
              };
            });
            
            allSessions = [...allSessions, ...sessionsWithDetails];
          } catch (sessionError) {
            console.warn(`Could not fetch sessions for station ${station.id}:`, sessionError);
          }
        }
        
        setSessions(allSessions);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        toast({
          title: "Error",
          description: "Failed to load charging sessions. Please check if the backend is running.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    // Connect to station updates to get charging session changes
    webSocketService.connectStations();
    webSocketService.connectVehicles();

    const handleStationUpdate = (update: StationUpdate) => {
      // Update sessions when station data changes
      setSessions(prevSessions => {
        return prevSessions.map(session => {
          if (session.stationId === update.id) {
            return {
              ...session,
              // Update station name if it changed
              stationName: update.name
            };
          }
          return session;
        });
      });
    };

    const handleVehicleUpdate = (update: VehicleUpdate) => {
      // Update sessions when vehicle data changes (battery level, etc.)
      setSessions(prevSessions => {
        return prevSessions.map(session => {
          if (session.vehicleVin === update.vin && session.status === 'IN_PROGRESS') {
            // Calculate new charging time
            const now = new Date();
            const startTime = new Date(session.startTime);
            const chargingTimeMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
            
            return {
              ...session,
              chargingTimeMinutes,
              // Update current battery level if available
              finalBatteryLevel: update.batteryLevel || session.finalBatteryLevel
            };
          }
          return session;
        });
      });
    };

    webSocketService.addStationListener(handleStationUpdate);
    webSocketService.addVehicleListener(handleVehicleUpdate);

    // Check connection status
    const checkConnection = () => {
      setConnectedToWebSocket(
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

  // Filter sessions based on search query
  const filteredSessions = sessions.filter(session =>
    session.stationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.vehicleVin.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStopSession = async (sessionId: number) => {
    try {
      await ChargingSessionService.endSession(sessionId);
      toast({
        title: "Session Stopped",
        description: "Charging session has been stopped successfully",
      });
      
      // Remove session from list or mark as completed
      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, status: 'COMPLETED', endTime: new Date().toISOString() }
            : session
        )
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop charging session",
        variant: "destructive"
      });
    }
  };

  const handleViewDetails = (sessionId: number) => {
    // Navigate to session details page
    navigate(`/manager/session/${sessionId}`);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'IN_PROGRESS':
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            <Zap className="w-3 h-3 mr-1" />
            Charging
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'INTERRUPTED':
      case 'CANCELED':
      case 'FAILED':
        return (
          <Badge variant="default" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {status === 'INTERRUPTED' ? 'Interrupted' : status === 'CANCELED' ? 'Canceled' : 'Failed'}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
    }
  };

  const formatChargingTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatEstimatedCompletion = (isoString?: string) => {
    if (!isoString) return 'Unknown';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (filteredSessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted/50 h-20 w-20 rounded-full flex items-center justify-center mb-4">
          <Battery className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-1">No charging sessions found</h3>
        <p className="text-muted-foreground max-w-md">
          {searchQuery 
            ? `No sessions match your search query "${searchQuery}"`
            : "There are currently no charging sessions in your system. Sessions will appear here when users start charging at your stations."
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connectedToWebSocket ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-muted-foreground">
            {connectedToWebSocket ? 'Real-time updates active' : 'Connecting to real-time updates...'}
          </span>
        </div>
        <span className="text-muted-foreground">
          {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Sessions Table */}
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="relative overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Station
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Charging Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Energy / Cost
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Battery Level
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {filteredSessions.map((session) => (
                <tr 
                  key={session.id} 
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      <div className="h-10 w-10 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium">Vehicle {session.vehicleId}</div>
                        <div className="text-xs text-muted-foreground">
                          VIN: {session.vehicleVin}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{session.stationName}</div>
                    <div className="text-xs text-muted-foreground">{session.connectorType}</div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(session.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm font-medium">{formatChargingTime(session.chargingTimeMinutes)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium">{session.energyDelivered?.toFixed(1) || '0.0'} kWh</div>
                      <div className="text-muted-foreground">${session.cost?.toFixed(2) || '0.00'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium">
                        {session.initialBatteryLevel}% → {session.finalBatteryLevel || '?'}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        SOC: {session.initialSoc}%
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[180px]">
                        <DropdownMenuItem onClick={() => handleViewDetails(session.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {session.status === 'IN_PROGRESS' && (
                          <DropdownMenuItem 
                            onClick={() => handleStopSession(session.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <StopCircle className="mr-2 h-4 w-4" />
                            Stop Session
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}; 