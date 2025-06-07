
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChargersTabProps {
  chargers: Array<{
    id: number;
    type: string;
    power: number;
    status: string;
  }>;
  onChargerStatusChange?: (id: number, status: string) => void;
}

export const ChargersTab: React.FC<ChargersTabProps> = ({ 
  chargers,
  onChargerStatusChange = () => {}
}) => {
  const getChargerStatusBadge = (status: string) => {
    switch(status) {
      case 'available':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Available
          </span>
        );
      case 'charging':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            In Use
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            Maintenance
          </span>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      <Button className="mb-4">
        <Plus className="h-4 w-4 mr-2" />
        Add New Charger
      </Button>
      
      <div className="glassmorphism rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Power
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {chargers.map(charger => (
                <tr key={charger.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    #{charger.id}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {charger.type}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {charger.power} kW
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getChargerStatusBadge(charger.status)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <Button variant="ghost" size="sm">
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
