
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '@/components/dashboard/sidebar';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChargingStationService from '@/services/charging-station-service';
import ChargingSessionService from '@/services/charging-session-service';
import { ChargingStation, ChargingSession, StationStatus } from '@/types/api';
import { StationsMap } from '@/components/stations/StationsMap';
import { ChargersTab } from '@/components/station-profile/ChargersTab';

// Sessions Tab Component
const SessionsTab = ({ stationId }: { stationId: number }) => {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions', stationId],
    queryFn: () => ChargingSessionService.getStationSessions(stationId),
  });
  
  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'COMPLETED':
        return (
          <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded text-xs font-medium">
            Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded text-xs font-medium">
            In Progress
          </span>
        );
      case 'CANCELED':
        return (
          <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded text-xs font-medium">
            Canceled
          </span>
        );
      case 'FAILED':
        return (
          <span className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded text-xs font-medium">
            Failed
          </span>
        );
      default:
        return status;
    }
  };
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Charging Sessions</h3>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : sessions && sessions.length > 0 ? (
        <div className="space-y-4">
          {sessions.map((session: ChargingSession) => (
            <div key={session.id} className="p-4 border rounded-lg bg-background">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">Vehicle: {session.vehicleVin}</p>
                  <p className="text-sm text-muted-foreground">
                    From: {formatDateTime(session.startTime)} 
                    {session.endTime && <span> to {formatDateTime(session.endTime)}</span>}
                  </p>
                </div>
                <div className="text-right">
                  <div>
                    {getStatusBadge(session.status)}
                  </div>
                  {session.cost && <p className="mt-1 font-medium">${session.cost.toFixed(2)}</p>}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <p>Energy: {session.energyDelivered ? `${session.energyDelivered} kWh` : 'In progress'}</p>
                <p>Connector: {session.connectorType}</p>
                <p>Initial Level: {session.initialBatteryLevel}%</p>
                <p>Final Level: {session.finalBatteryLevel ? `${session.finalBatteryLevel}%` : 'In progress'}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No charging sessions found
        </div>
      )}
    </div>
  );
};

// Pricing Tab Component
interface PricingTabProps {
  station: ChargingStation;
  onPriceChange: (newPrice: number) => void;
}

const PricingTab = ({ station, onPriceChange }: PricingTabProps) => {
  const [newPrice, setNewPrice] = useState<number>(station.pricePerKwh);
  
  const handlePriceChange = () => {
    if (newPrice !== station.pricePerKwh) {
      onPriceChange(newPrice);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="p-4 bg-background rounded-xl border">
        <h3 className="text-lg font-medium mb-4">Pricing Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Price per kWh ($)</label>
            <div className="flex">
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(parseFloat(e.target.value))}
                step="0.01"
                min="0"
                className="flex-1 p-2 border rounded-l-md"
              />
              <button
                onClick={handlePriceChange}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-r-md"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Station Profile component
const StationProfile = () => {
  const params = useParams<{ id: string }>();
  // Fix: The URL param is 'id', but in App.tsx it's defined as 'stationId'
  const stationId = Number(params.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Fetch station data
  const { data: station, isLoading, error } = useQuery({
    queryKey: ['station', stationId],
    queryFn: () => ChargingStationService.getStationById(stationId),
    enabled: !!stationId && !isNaN(stationId),
  });

  // Update station mutation
  const updateStationMutation = useMutation({
    mutationFn: (updatedData: Partial<ChargingStation>) => 
      ChargingStationService.updateStation(stationId, updatedData as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['station', stationId] });
      toast({
        title: "Station Updated",
        description: "The station has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "There was a problem updating the station.",
        variant: "destructive",
      });
      console.error("Error updating station:", error);
    },
  });

  // Handler for price change
  const handlePriceChange = (newPrice: number) => {
    updateStationMutation.mutate({ pricePerKwh: newPrice });
  };

  // Handler for status change
  const handleStatusChange = (status: StationStatus) => {
    ChargingStationService.updateStationStatus(stationId, status)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['station', stationId] });
        toast({
          title: "Status Updated",
          description: `Station status changed to ${status}.`,
        });
      })
      .catch((error) => {
        toast({
          title: "Status Update Failed",
          description: "There was a problem updating the station status.",
          variant: "destructive",
        });
        console.error("Error updating station status:", error);
      });
  };

  // Handler for connector count change
  const handleConnectorCountChange = (availableConnectors: number) => {
    ChargingStationService.updateAvailableConnectors(stationId, availableConnectors)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['station', stationId] });
        toast({
          title: "Connectors Updated",
          description: `Available connectors set to ${availableConnectors}.`,
        });
      })
      .catch((error) => {
        toast({
          title: "Connector Update Failed",
          description: "There was a problem updating the available connectors.",
          variant: "destructive",
        });
        console.error("Error updating connectors:", error);
      });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !station) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Station Not Found</h2>
              <p className="text-muted-foreground">Unable to load station data.</p>
              <button
                onClick={() => navigate('/station-management')}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Back to Stations
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Generate mock chargers data based on connector types
  const mockChargers = station.connectorTypes.split(',').map((type, index) => ({
    id: index + 1,
    type: type.trim(),
    power: type.includes('CCS') ? 50 : 22,
    status: index % 3 === 0 ? 'charging' : 'available'
  }));

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <main className="flex-1 p-6 md:ml-[70px] lg:ml-64">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-1">{station.name}</h1>
          <p className="text-muted-foreground mb-6">{station.address}</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Map with station */}
              <div className="h-[300px] bg-accent rounded-xl overflow-hidden">
                <StationsMap 
                  userPosition={[station.longitude, station.latitude]}
                  onStationSelect={() => {}}
                />
              </div>
              
              <Tabs defaultValue="info">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info">Information</TabsTrigger>
                  <TabsTrigger value="chargers">Chargers</TabsTrigger>
                  <TabsTrigger value="sessions">Sessions</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-background rounded-xl border">
                      <h3 className="text-lg font-medium mb-3">Station Details</h3>
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-sm text-muted-foreground">Station ID</dt>
                          <dd>{station.stationId}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-muted-foreground">Location</dt>
                          <dd>{station.location}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-muted-foreground">Operator</dt>
                          <dd>{station.operator}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-muted-foreground">Coordinates</dt>
                          <dd>{station.latitude}, {station.longitude}</dd>
                        </div>
                      </dl>
                    </div>
                    
                    <div className="p-4 bg-background rounded-xl border">
                      <h3 className="text-lg font-medium mb-3">Technical Specifications</h3>
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-sm text-muted-foreground">Power Rating</dt>
                          <dd>{station.powerRating} kW</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-muted-foreground">Price per kWh</dt>
                          <dd>${station.pricePerKwh}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-muted-foreground">Connector Types</dt>
                          <dd>{station.connectorTypes}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-muted-foreground">Connectors</dt>
                          <dd>{station.availableConnectors} available of {station.totalConnectors} total</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="chargers" className="pt-4">
                  <ChargersTab chargers={mockChargers} />
                </TabsContent>
                
                <TabsContent value="sessions" className="pt-4">
                  <SessionsTab stationId={station.id} />
                </TabsContent>
                
                <TabsContent value="pricing" className="pt-4">
                  <PricingTab station={station} onPriceChange={handlePriceChange} />
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="space-y-6">
              {/* Station status card */}
              <div className="p-4 bg-background rounded-xl border">
                <h3 className="text-lg font-medium mb-3">Status</h3>
                <div className={`p-3 rounded-md ${
                  station.status === 'AVAILABLE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                  station.status === 'IN_USE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                  station.status === 'MAINTENANCE' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {station.status}
                </div>
                
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-1">Connectors Available</p>
                  <div className="flex items-center">
                    <div className="h-2 rounded-full bg-muted overflow-hidden flex-1">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${(station.availableConnectors / station.totalConnectors) * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 font-medium">
                      {station.availableConnectors}/{station.totalConnectors}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Change Status</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleStatusChange('AVAILABLE')}
                      className={`py-1 px-2 text-xs rounded-md ${station.status === 'AVAILABLE' ? 
                        'bg-green-500 text-white' : 
                        'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300'}`}
                    >
                      Available
                    </button>
                    <button 
                      onClick={() => handleStatusChange('MAINTENANCE')}
                      className={`py-1 px-2 text-xs rounded-md ${station.status === 'MAINTENANCE' ? 
                        'bg-amber-500 text-white' : 
                        'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300'}`}
                    >
                      Maintenance
                    </button>
                    <button 
                      onClick={() => handleStatusChange('OUT_OF_SERVICE')}
                      className={`py-1 px-2 text-xs rounded-md ${station.status === 'OUT_OF_SERVICE' ? 
                        'bg-red-500 text-white' : 
                        'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300'}`}
                    >
                      Out of Service
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Available connectors adjustment */}
              <div className="p-4 bg-background rounded-xl border">
                <h3 className="text-lg font-medium mb-3">Connector Availability</h3>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Adjust the number of currently available connectors
                  </p>
                  
                  <div className="flex items-center">
                    <button 
                      onClick={() => {
                        const newValue = Math.max(0, station.availableConnectors - 1);
                        handleConnectorCountChange(newValue);
                      }}
                      disabled={station.availableConnectors <= 0}
                      className="border px-2 py-1 rounded-l-md bg-muted disabled:opacity-50"
                    >
                      -
                    </button>
                    <div className="border-t border-b px-4 py-1">
                      {station.availableConnectors}
                    </div>
                    <button 
                      onClick={() => {
                        const newValue = Math.min(station.totalConnectors, station.availableConnectors + 1);
                        handleConnectorCountChange(newValue);
                      }}
                      disabled={station.availableConnectors >= station.totalConnectors}
                      className="border px-2 py-1 rounded-r-md bg-muted disabled:opacity-50"
                    >
                      +
                    </button>
                    
                    <span className="ml-2 text-sm text-muted-foreground">
                      of {station.totalConnectors} total
                    </span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    Note: This should reflect the actual physical status of your charging station connectors.
                  </p>
                </div>
              </div>
              
              {/* Actions card */}
              <div className="p-4 bg-background rounded-xl border">
                <h3 className="text-lg font-medium mb-3">Actions</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => navigate(`/station-management`)}
                    className="w-full py-2 px-4 flex justify-center items-center bg-accent text-accent-foreground rounded-md"
                  >
                    Back to Station Management
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StationProfile;
