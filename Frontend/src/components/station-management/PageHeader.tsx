
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PageHeaderProps {
  title: string;
  description: string;
  onAddStation: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  onAddStation
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      
      <Button 
        className="mt-4 md:mt-0 bg-primary text-primary-foreground"
        onClick={onAddStation}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Station
      </Button>
    </div>
  );
};
