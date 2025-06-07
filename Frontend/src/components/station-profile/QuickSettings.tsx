
import React from 'react';
import { Settings } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { StationStatus } from '@/types/api';

interface QuickSettingsProps {
  stationStatus: StationStatus;
  onStatusChange?: (status: string) => Promise<void>;
}

export const QuickSettings: React.FC<QuickSettingsProps> = ({ 
  stationStatus,
  onStatusChange = async () => {} 
}) => {
  return (
    <div className="glassmorphism rounded-xl p-6">
      <h2 className="font-semibold mb-4 flex items-center">
        <Settings className="h-5 w-5 mr-2" />
        Quick Settings
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Station Online</div>
            <div className="text-sm text-muted-foreground">Make station available for charging</div>
          </div>
          <Switch 
            checked={stationStatus === 'AVAILABLE'} 
            onCheckedChange={(checked) => onStatusChange(checked ? 'AVAILABLE' : 'OUT_OF_SERVICE')}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Public Visibility</div>
            <div className="text-sm text-muted-foreground">Show on maps and search results</div>
          </div>
          <Switch checked={true} />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Automatic Updates</div>
            <div className="text-sm text-muted-foreground">Allow automatic software updates</div>
          </div>
          <Switch checked={true} />
        </div>
      </div>
    </div>
  );
};
