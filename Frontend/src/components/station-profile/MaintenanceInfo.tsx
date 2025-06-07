
import React from 'react';
import { Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MaintenanceInfoProps {
  lastMaintenance: string;
  nextMaintenance: string;
  onScheduleMaintenance?: () => void;
}

export const MaintenanceInfo: React.FC<MaintenanceInfoProps> = ({
  lastMaintenance,
  nextMaintenance,
  onScheduleMaintenance = () => {}
}) => {
  return (
    <div className="glassmorphism rounded-xl p-6 mb-6">
      <h2 className="font-semibold mb-4 flex items-center">
        <Wrench className="h-5 w-5 mr-2" />
        Maintenance Info
      </h2>
      
      <div className="space-y-4">
        <div>
          <div className="text-sm text-muted-foreground">Last Maintenance</div>
          <div className="font-medium">{lastMaintenance}</div>
        </div>
        
        <div>
          <div className="text-sm text-muted-foreground">Next Scheduled</div>
          <div className="font-medium">{nextMaintenance}</div>
        </div>
        
        <div className="mt-4">
          <Button variant="outline" onClick={onScheduleMaintenance} className="w-full">
            <Wrench className="h-4 w-4 mr-2" />
            Schedule Maintenance
          </Button>
        </div>
      </div>
    </div>
  );
};
