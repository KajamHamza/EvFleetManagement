import React from 'react';
import { 
  Bolt, 
  MapPin, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash, 
  AlertTriangle, 
  Info 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

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

interface StationTableProps {
  stations: Station[];
  searchQuery: string;
  activeTab: string;
}

export const StationTable: React.FC<StationTableProps> = ({ 
  stations,
  searchQuery,
  activeTab
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Filter stations based on tab and search query
  const filteredStations = stations
    .filter(station => 
      activeTab === 'all' || 
      (activeTab === 'active' && station.status === 'active') ||
      (activeTab === 'maintenance' && station.status === 'maintenance') ||
      (activeTab === 'inactive' && station.status === 'inactive')
    )
    .filter(station => 
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
  const handleViewDetails = (stationId: number) => {
    navigate(`/station-profile/${stationId}`);
  };
  
  const handleEditStation = (stationId: number) => {
    toast({
      title: "Edit Station",
      description: "This feature is coming soon",
    });
  };
  
  const handleDeleteStation = (stationId: number) => {
    toast({
      title: "Delete Station",
      description: "This feature is coming soon",
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1"></span>
            Active
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1"></span>
            Maintenance
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1"></span>
            Inactive
          </span>
        );
      default:
        return null;
    }
  };
  
  const calculateMaintenanceStatus = (lastMaintenance: string) => {
    const lastDate = new Date(lastMaintenance);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 30) {
      return (
        <span className="flex items-center text-red-500">
          <AlertTriangle className="h-4 w-4 mr-1" />
          Overdue
        </span>
      );
    } else if (daysDiff > 20) {
      return (
        <span className="flex items-center text-yellow-500">
          <AlertTriangle className="h-4 w-4 mr-1" />
          Due soon
        </span>
      );
    }
    
    return (
      <span className="flex items-center text-green-500">
        <Info className="h-4 w-4 mr-1" />
        OK
      </span>
    );
  };
  
  if (filteredStations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted/50 h-20 w-20 rounded-full flex items-center justify-center mb-4">
          <Bolt className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-1">No stations found</h3>
        <p className="text-muted-foreground max-w-md">
          {searchQuery 
            ? `No stations match your search query "${searchQuery}"`
            : "You don't have any stations in this category yet."
          }
        </p>
        {searchQuery && (
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {}}
          >
            Clear search
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="relative overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Station
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Chargers
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Monthly Revenue
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Utilization
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Maintenance
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {filteredStations.map((station) => (
              <tr 
                key={station.id} 
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-start">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                      <Bolt className="h-5 w-5 text-primary" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium">{station.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {station.address}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(station.status)}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">{station.availableChargers} / {station.chargers}</div>
                  <div className="w-full bg-muted/50 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-primary h-1.5 rounded-full" 
                      style={{ width: `${(station.availableChargers / station.chargers) * 100}%` }}
                    ></div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium">${station.revenue.toLocaleString()}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <span className="text-sm mr-2">{station.utilization}%</span>
                    <div className="w-16 bg-muted/50 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${
                          station.utilization > 80 ? 'bg-green-500' : 
                          station.utilization > 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} 
                        style={{ width: `${station.utilization}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {calculateMaintenanceStatus(station.lastMaintenance)}
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
                      <DropdownMenuItem onClick={() => handleViewDetails(station.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditStation(station.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Station
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteStation(station.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete Station
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
