
import React from 'react';
import { 
  RefreshCw, 
  BarChart2, 
  Users, 
  Clock 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalyticsTabProps {
  stationId?: number;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ stationId }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Performance Analytics {stationId ? `(Station #${stationId})` : ''}</h3>
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>
      
      <div className="glassmorphism rounded-xl p-6 h-64 flex items-center justify-center">
        <div className="text-center">
          <BarChart2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            Detailed charts and statistics will be displayed here.
          </p>
          <Button>Generate Report</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glassmorphism rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            User Demographics
          </h3>
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              User demographics data will be displayed here.
            </p>
          </div>
        </div>
        
        <div className="glassmorphism rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Usage Patterns
          </h3>
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              Station usage patterns will be displayed here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
