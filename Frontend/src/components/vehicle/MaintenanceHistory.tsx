
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import MaintenanceService from '@/services/maintenance-service';
import { Loader2, Wrench, Calendar, AlertTriangle, CheckCircle2, CreditCard, FileText } from 'lucide-react';

interface MaintenanceHistoryProps {
  vehicleVin: string;
}

export function MaintenanceHistory({ vehicleVin }: MaintenanceHistoryProps) {
  const { data: maintenanceHistory, isLoading } = useQuery({
    queryKey: ['maintenanceHistory', vehicleVin],
    queryFn: () => MaintenanceService.getVehicleMaintenanceHistory(vehicleVin),
    enabled: !!vehicleVin
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
      </div>
    );
  }

  if (!maintenanceHistory || maintenanceHistory.length === 0) {
    return (
      <div className="text-center py-8">
        <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <h3 className="text-lg font-medium">No Maintenance History</h3>
        <p className="text-muted-foreground">This vehicle has no maintenance records.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Maintenance History</h3>
      
      <div className="space-y-4">
        {maintenanceHistory.map(record => (
          <div key={record.id} className="bg-card border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center">
                <div className={`p-2 rounded-full mr-3 ${
                  record.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                  record.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                  record.status === 'SCHEDULED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                }`}>
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium">{record.maintenanceType}</h4>
                  <p className="text-sm text-muted-foreground">{record.description}</p>
                </div>
              </div>
              
              <div className={`px-2 py-1 rounded-full text-xs ${
                record.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                record.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                record.status === 'SCHEDULED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
              }`}>
                {record.status}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
              <div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Scheduled
                </p>
                <p className="font-medium">{new Date(record.scheduledDate).toLocaleDateString()}</p>
              </div>
              
              {record.completedDate && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </p>
                  <p className="font-medium">{new Date(record.completedDate).toLocaleDateString()}</p>
                </div>
              )}
              
              {record.cost && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <CreditCard className="h-3 w-3 mr-1" />
                    Cost
                  </p>
                  <p className="font-medium">${record.cost.toFixed(2)}</p>
                </div>
              )}
            </div>
            
            {record.notes && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-start space-x-2">
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="text-sm">{record.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
