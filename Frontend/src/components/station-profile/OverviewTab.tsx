
import React, { useState } from 'react';
import { 
  ChevronUp,
  ChevronDown,
  Battery,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OverviewTabProps {
  revenue: {
    monthly: number;
    trending?: string;
  };
  utilization: number;
  totalSessions: number;
  chargers: Array<{
    id: number;
    type: string;
    power: number;
    status: string;
  }>;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ 
  revenue, 
  utilization, 
  totalSessions, 
  chargers 
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  const toggleSection = (sectionName: string) => {
    if (expandedSection === sectionName) {
      setExpandedSection(null);
    } else {
      setExpandedSection(sectionName);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glassmorphism rounded-xl p-5">
          <div className="text-sm text-muted-foreground">Monthly Revenue</div>
          <div className="text-2xl font-bold mt-1">${revenue.monthly.toLocaleString()}</div>
          <div className="text-xs text-green-500 flex items-center mt-1">
            <ChevronUp className="h-3 w-3 mr-1" />
            8.2% from last month
          </div>
        </div>
        
        <div className="glassmorphism rounded-xl p-5">
          <div className="text-sm text-muted-foreground">Utilization Rate</div>
          <div className="text-2xl font-bold mt-1">{utilization}%</div>
          <div className="text-xs text-green-500 flex items-center mt-1">
            <ChevronUp className="h-3 w-3 mr-1" />
            5.3% from last month
          </div>
        </div>
        
        <div className="glassmorphism rounded-xl p-5">
          <div className="text-sm text-muted-foreground">Total Charging Sessions</div>
          <div className="text-2xl font-bold mt-1">{totalSessions}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Lifetime
          </div>
        </div>
      </div>
      
      <div className="glassmorphism rounded-xl p-6">
        <h3 className="font-semibold mb-4">Charger Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {chargers.map(charger => (
            <div 
              key={charger.id} 
              className={`
                p-4 rounded-lg border text-center
                ${charger.status === 'available' ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800/30' : 
                  charger.status === 'charging' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800/30' : 
                  'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800/30'}
              `}
            >
              <div className="h-8 w-8 mx-auto mb-2">
                <Battery className={`
                  h-8 w-8
                  ${charger.status === 'available' ? 'text-green-500' : 
                    charger.status === 'charging' ? 'text-blue-500' : 'text-yellow-500'}
                `} />
              </div>
              <div className="font-medium">#{charger.id}</div>
              <div className="text-xs mt-1">{charger.type}</div>
              <div className="text-xs mt-1">{charger.power} kW</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="glassmorphism rounded-xl p-6">
        <button 
          className="flex items-center justify-between w-full font-semibold"
          onClick={() => toggleSection('alerts')}
        >
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
            Active Alerts
          </div>
          {expandedSection === 'alerts' ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>
        
        {expandedSection === 'alerts' && (
          <div className="mt-4 space-y-3">
            <div className="flex items-start p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
              <div>
                <div className="font-medium">Charger #5 Maintenance Required</div>
                <div className="text-sm text-muted-foreground">
                  Error code E-201: Connection issue detected
                </div>
                <Button variant="outline" size="sm" className="mt-2">
                  View Details
                </Button>
              </div>
            </div>
            
            <div className="flex items-start p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
              <div>
                <div className="font-medium">Charger #6 Firmware Update Available</div>
                <div className="text-sm text-muted-foreground">
                  New firmware v3.2.1 is ready to install
                </div>
                <Button variant="outline" size="sm" className="mt-2">
                  Update Now
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
