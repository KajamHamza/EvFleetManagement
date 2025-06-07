
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import ChargingSessionService from '@/services/charging-session-service';
import { Loader2, Battery, MapPin, Calendar, Clock, Zap, CreditCard } from 'lucide-react';

interface ChargingHistoryProps {
  vehicleId: number;
}

export function ChargingHistory({ vehicleId }: ChargingHistoryProps) {
  const { data: chargingSessions, isLoading } = useQuery({
    queryKey: ['chargingSessions', vehicleId],
    queryFn: () => ChargingSessionService.getVehicleSessions(vehicleId),
    enabled: !!vehicleId
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
      </div>
    );
  }

  if (!chargingSessions || chargingSessions.length === 0) {
    return (
      <div className="text-center py-8">
        <Battery className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <h3 className="text-lg font-medium">No Charging History</h3>
        <p className="text-muted-foreground">This vehicle hasn't been charged yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Charging History</h3>
      
      <div className="space-y-4">
        {chargingSessions.map(session => (
          <div key={session.id} className="bg-card border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center">
                <div className={`p-2 rounded-full mr-3 ${
                  session.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                  session.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                }`}>
                  <Battery className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium">{session.stationName}</h4>
                  <p className="text-sm text-muted-foreground">{session.connectorType}</p>
                </div>
              </div>
              
              <div className={`px-2 py-1 rounded-full text-xs ${
                session.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                session.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
              }`}>
                {session.status}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Date
                </p>
                <p className="font-medium">{new Date(session.startTime).toLocaleDateString()}</p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Duration
                </p>
                <p className="font-medium">
                  {session.endTime ? 
                    formatDuration(new Date(session.startTime), new Date(session.endTime)) : 
                    'In progress'}
                </p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <Zap className="h-3 w-3 mr-1" />
                  Energy
                </p>
                <p className="font-medium">{session.energyDelivered ? `${session.energyDelivered} kWh` : '-'}</p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <CreditCard className="h-3 w-3 mr-1" />
                  Cost
                </p>
                <p className="font-medium">{session.cost ? `$${session.cost.toFixed(2)}` : '-'}</p>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm">{session.stationName}</p>
                  <div className="flex space-x-3 mt-1">
                    <p className="text-xs text-muted-foreground">
                      Initial: {session.initialBatteryLevel}%
                    </p>
                    {session.finalBatteryLevel && (
                      <p className="text-xs text-muted-foreground">
                        Final: {session.finalBatteryLevel}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to format duration
function formatDuration(start: Date, end: Date): string {
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) {
    return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  
  return `${hours} hr${hours !== 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}`;
}
