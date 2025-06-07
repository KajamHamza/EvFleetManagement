
import React from 'react';
import { 
  Bolt, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Calendar,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StationProps {
  station: {
    name: string;
    address: string;
    phone: string;
    email: string;
    openHours: string;
    openSince: string;
    status: string;
  };
  onEditStation: () => void;
}

export const StationSummary: React.FC<StationProps> = ({ 
  station, 
  onEditStation 
}) => {
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

  return (
    <div className="glassmorphism rounded-xl p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bolt className="h-6 w-6 text-primary" />
        </div>
        {getStatusBadge(station.status)}
      </div>
      
      <h1 className="text-xl font-bold mb-2">{station.name}</h1>
      
      <div className="space-y-4 mt-6">
        <div className="flex items-start">
          <MapPin className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
          <div>
            <div className="text-sm text-muted-foreground">Address</div>
            <div className="font-medium">{station.address}</div>
          </div>
        </div>
        
        <div className="flex items-start">
          <Phone className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
          <div>
            <div className="text-sm text-muted-foreground">Phone</div>
            <div className="font-medium">{station.phone}</div>
          </div>
        </div>
        
        <div className="flex items-start">
          <Mail className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
          <div>
            <div className="text-sm text-muted-foreground">Email</div>
            <div className="font-medium">{station.email}</div>
          </div>
        </div>
        
        <div className="flex items-start">
          <Clock className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
          <div>
            <div className="text-sm text-muted-foreground">Hours</div>
            <div className="font-medium">{station.openHours}</div>
          </div>
        </div>
        
        <div className="flex items-start">
          <Calendar className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
          <div>
            <div className="text-sm text-muted-foreground">Operating Since</div>
            <div className="font-medium">{station.openSince}</div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex space-x-3">
        <Button onClick={onEditStation} className="flex-1">
          <Edit className="h-4 w-4 mr-2" />
          Edit Station
        </Button>
      </div>
    </div>
  );
};
