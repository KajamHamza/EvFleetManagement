
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/dashboard/sidebar';
import { BatteryWidget } from '@/components/dashboard/battery-widget';
import { ChargingHistory } from '@/components/vehicle/ChargingHistory';
import { MaintenanceHistory } from '@/components/vehicle/MaintenanceHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VehicleService from '@/services/vehicle-service';
import AuthService from '@/services/auth-service';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronsRight, 
  Car, 
  Calendar, 
  Zap, 
  Ruler, 
  Tag, 
  Clock,
  GitBranch,
  Plug,
  AlertTriangle,
  Battery,
  Check
} from 'lucide-react';

const Vehicle = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const currentUser = AuthService.getCurrentUser();
  
  // Fetch current vehicle first
  const { data: currentVehicle, isLoading: loadingCurrentVehicle } = useQuery({
    queryKey: ['currentVehicle'],
    queryFn: VehicleService.getCurrentVehicle,
  });
  
  // Fetch all vehicles as fallback
  const { data: vehicles, isLoading: loadingVehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: VehicleService.getAllVehicles,
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Error retrieving vehicles data",
          description: error.message || "Please try again later",
          variant: "destructive",
        });
      }
    }
  });
  
  // Use current vehicle or find the vehicle assigned to the current user
  const userVehicle = currentVehicle || 
    (currentUser && vehicles?.find(v => v.driverUsername === currentUser.username));
  
  // Fetch vehicle state history if we have a vehicle
  const { data: vehicleStateHistory } = useQuery({
    queryKey: ['vehicleStates', userVehicle?.id],
    queryFn: () => userVehicle ? VehicleService.getVehicleStateHistory(userVehicle.id) : Promise.resolve([]),
    enabled: !!userVehicle?.id,
  });
  
  // Calculate remaining range
  const remainingRange = userVehicle ? 
    Math.floor((userVehicle.currentBatteryLevel / 100) * userVehicle.batteryCapacity * 4) : 0; // 4 miles per kWh
  
  // Calculate charge time remaining
  const chargeTimeRemaining = userVehicle?.currentState === 'CHARGING' ? 
    "2h 15m" : "Not charging";
  
  // Battery warning level
  const isBatteryLow = userVehicle ? userVehicle.currentBatteryLevel < 20 : false;
  
  // Maintenance due soon (mock data)
  const maintenanceDueSoon = true;
  
  if (loadingVehicles || loadingCurrentVehicle) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6 md:ml-[70px] lg:ml-64">
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
          </div>
        </main>
      </div>
    );
  }
  
  if (!userVehicle) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6 md:ml-[70px] lg:ml-64">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-2">Vehicle Not Found</h2>
            <p className="text-muted-foreground mb-4">
              No vehicle is assigned to your account. Please add a vehicle or contact your administrator.
            </p>
            <button 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              onClick={() => navigate('/settings')}
            >
              Add Vehicle
            </button>
          </div>
        </main>
      </div>
    );
  }
  
  // Use the fetched vehicle data
  const vehicleInfo = userVehicle;
  
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 p-6 md:ml-[70px] lg:ml-64">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-muted-foreground">My Vehicle</span>
                <ChevronsRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{vehicleInfo.make} {vehicleInfo.model}</span>
              </div>
              <h1 className="text-3xl font-bold">{vehicleInfo.name || `${vehicleInfo.make} ${vehicleInfo.model}`}</h1>
              <p className="text-muted-foreground flex items-center gap-1">
                <Tag className="h-4 w-4" /> 
                {vehicleInfo.vin}
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end">
              <div className={`px-3 py-1 rounded-full text-sm 
                ${vehicleInfo.currentState === 'CHARGING' ? 
                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                  isBatteryLow ? 
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                }`}>
                {vehicleInfo.currentState === 'CHARGING' ? 
                  'Charging' : 
                  isBatteryLow ? 
                    'Low Battery' : 
                    vehicleInfo.currentState
                }
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${vehicleInfo.currentState === 'CHARGING' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                <span className="text-sm">{vehicleInfo.active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="col-span-1 md:col-span-2 bg-background rounded-xl border p-6 shadow-sm">
              <div className="flex justify-between mb-4">
                <h2 className="text-xl font-bold">Battery Status</h2>
                {vehicleInfo.currentState === 'CHARGING' && (
                  <span className="flex items-center gap-2 text-green-500">
                    <Plug className="h-4 w-4" />
                    Charging
                  </span>
                )}
              </div>
              
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-shrink-0">
                  <BatteryWidget 
                    level={vehicleInfo.currentBatteryLevel} 
                    capacity={vehicleInfo.batteryCapacity}
                    isCharging={vehicleInfo.currentState === 'CHARGING'} 
                  />
                </div>
                
                <div className="w-full md:w-auto flex-grow">
                  <div className="flex flex-col mb-4">
                    <span className="text-muted-foreground text-sm">Battery Level</span>
                    <div className="flex justify-between">
                      <span className="text-2xl font-bold">{vehicleInfo.currentBatteryLevel}%</span>
                      <span className="text-muted-foreground">{vehicleInfo.batteryCapacity} kWh</span>
                    </div>
                  </div>
                  
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                    <div 
                      className={`h-full rounded-full ${
                        vehicleInfo.currentBatteryLevel > 60 ? 'bg-green-500' : 
                        vehicleInfo.currentBatteryLevel > 20 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${vehicleInfo.currentBatteryLevel}%` }}
                    ></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground text-sm">Estimated Range</span>
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-primary" />
                        <span className="font-medium">{remainingRange} miles</span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground text-sm">Charge Time</span>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-medium">{chargeTimeRemaining}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-background rounded-xl border p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Vehicle Information</h2>
              <dl className="space-y-3">
                <div className="grid grid-cols-2">
                  <dt className="text-muted-foreground text-sm">VIN</dt>
                  <dd className="text-right font-medium">{vehicleInfo.vin}</dd>
                </div>
                <div className="grid grid-cols-2">
                  <dt className="text-muted-foreground text-sm">Year</dt>
                  <dd className="text-right font-medium">{vehicleInfo.year}</dd>
                </div>
                <div className="grid grid-cols-2">
                  <dt className="text-muted-foreground text-sm">Type</dt>
                  <dd className="text-right font-medium">{vehicleInfo.type || 'Electric'}</dd>
                </div>
                <div className="grid grid-cols-2">
                  <dt className="text-muted-foreground text-sm">Current Speed</dt>
                  <dd className="text-right font-medium">{vehicleInfo.currentSpeed} mph</dd>
                </div>
              </dl>
              
              <div className="mt-6 pt-4 border-t">
                <h3 className="font-medium mb-2">Maintenance</h3>
                <div className={`rounded-md p-3 flex items-start gap-3 
                  ${maintenanceDueSoon ? 
                    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 
                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  }`}
                >
                  {maintenanceDueSoon ? (
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium">
                      {maintenanceDueSoon ? 'Maintenance Due Soon' : 'No Maintenance Required'}
                    </p>
                    <p className="text-sm">
                      {maintenanceDueSoon ? (
                        <>Next service: {new Date().toLocaleDateString()}</>
                      ) : (
                        <>Last service: {new Date().toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-background rounded-xl border shadow-sm">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="border-b rounded-none p-0 h-auto">
                <div className="flex overflow-x-auto">
                  <TabsTrigger 
                    value="overview" 
                    className="py-4 px-6 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="charging" 
                    className="py-4 px-6 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    Charging History
                  </TabsTrigger>
                  <TabsTrigger 
                    value="maintenance" 
                    className="py-4 px-6 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    Maintenance
                  </TabsTrigger>
                </div>
              </TabsList>
              
              <TabsContent value="overview" className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-card rounded-lg p-4 border">
                    <h3 className="text-lg font-medium mb-2">Vehicle Specifications</h3>
                    <dl className="space-y-2">
                      <div className="grid grid-cols-2">
                        <dt className="text-muted-foreground">Make & Model</dt>
                        <dd className="text-right">{vehicleInfo.make} {vehicleInfo.model}</dd>
                      </div>
                      <div className="grid grid-cols-2">
                        <dt className="text-muted-foreground">Year</dt>
                        <dd className="text-right">{vehicleInfo.year}</dd>
                      </div>
                      <div className="grid grid-cols-2">
                        <dt className="text-muted-foreground">Battery Capacity</dt>
                        <dd className="text-right">{vehicleInfo.batteryCapacity} kWh</dd>
                      </div>
                      <div className="grid grid-cols-2">
                        <dt className="text-muted-foreground">Range (Full Charge)</dt>
                        <dd className="text-right">{vehicleInfo.batteryCapacity * 4} miles</dd>
                      </div>
                      <div className="grid grid-cols-2">
                        <dt className="text-muted-foreground">Current Range</dt>
                        <dd className="text-right">{remainingRange} miles</dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div className="bg-card rounded-lg p-4 border">
                    <h3 className="text-lg font-medium mb-2">Current Status</h3>
                    <dl className="space-y-2">
                      <div className="grid grid-cols-2">
                        <dt className="text-muted-foreground">Battery Level</dt>
                        <dd className="text-right">{vehicleInfo.currentBatteryLevel}%</dd>
                      </div>
                      <div className="grid grid-cols-2">
                        <dt className="text-muted-foreground">Charging Status</dt>
                        <dd className="text-right">{vehicleInfo.currentState === 'CHARGING' ? 'Charging' : 'Not Charging'}</dd>
                      </div>
                      <div className="grid grid-cols-2">
                        <dt className="text-muted-foreground">Current State</dt>
                        <dd className="text-right">{vehicleInfo.currentState}</dd>
                      </div>
                      <div className="grid grid-cols-2">
                        <dt className="text-muted-foreground">Last Charged Level</dt>
                        <dd className="text-right">{vehicleInfo.lastChargedLevel}%</dd>
                      </div>
                      <div className="grid grid-cols-2">
                        <dt className="text-muted-foreground">Odometer</dt>
                        <dd className="text-right">{vehicleInfo.odometer} miles</dd>
                      </div>
                    </dl>
                  </div>
                </div>
                
                {/* State History Section */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">State History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Time</th>
                          <th className="text-left p-2">State</th>
                          <th className="text-left p-2">Battery</th>
                          <th className="text-left p-2">Location</th>
                          <th className="text-left p-2">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vehicleStateHistory && vehicleStateHistory.length > 0 ? (
                          vehicleStateHistory.slice(0, 5).map((state: any) => (
                            <tr key={state.id} className="border-b hover:bg-muted/50">
                              <td className="p-2">{new Date(state.timestamp).toLocaleTimeString()}</td>
                              <td className="p-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  state.state === 'CHARGING' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                  state.state === 'LOW_BATTERY' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                  state.state === 'IN_USE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                }`}>
                                  {state.state}
                                </span>
                              </td>
                              <td className="p-2">{state.socPercentage}%</td>
                              <td className="p-2">{state.positionX.toFixed(4)}, {state.positionY.toFixed(4)}</td>
                              <td className="p-2">{state.notes || '-'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-muted-foreground">
                              No state history available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="charging" className="p-6">
                {vehicleInfo && <ChargingHistory vehicleId={vehicleInfo.id} />}
              </TabsContent>
              
              <TabsContent value="maintenance" className="p-6">
                {vehicleInfo && <MaintenanceHistory vehicleVin={vehicleInfo.vin} />}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Vehicle;
