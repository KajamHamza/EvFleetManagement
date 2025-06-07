import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StationTable } from './StationTable';
import { ChargingSessionsTable } from './ChargingSessionsTable';

interface Station {
  id: number;
  name: string;
  address: string;
  status: 'active' | 'maintenance' | 'inactive';
  chargers: number;
  availableChargers: number;
  revenue: number;
  utilization: number;
  lastMaintenance: string;
}

interface TabsSectionProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  stations: Station[];
  searchQuery: string;
}

export const TabsSection: React.FC<TabsSectionProps> = ({
  activeTab,
  setActiveTab,
  stations,
  searchQuery
}) => {
  return (
    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="all">All Stations</TabsTrigger>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        <TabsTrigger value="inactive">Inactive</TabsTrigger>
        <TabsTrigger value="sessions">Charging Sessions</TabsTrigger>
      </TabsList>
      
      <TabsContent value="sessions" className="space-y-4">
        <ChargingSessionsTable searchQuery={searchQuery} />
      </TabsContent>
      
      <TabsContent value={activeTab} className="space-y-4">
        {activeTab !== 'sessions' && (
          <StationTable 
            stations={stations}
            searchQuery={searchQuery}
            activeTab={activeTab}
          />
        )}
      </TabsContent>
    </Tabs>
  );
};
