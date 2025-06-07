
import React from 'react';
import { Search, Filter, ChevronDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchAndFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
}

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  filtersOpen,
  setFiltersOpen
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-grow">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <input
          type="text"
          placeholder="Search stations by name or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>
      
      <div className="relative">
        <Button 
          variant="outline" 
          className="w-full md:w-auto flex items-center justify-between"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
        </Button>
        
        {filtersOpen && (
          <div className="absolute right-0 mt-2 w-60 rounded-md shadow-lg bg-card z-10 border border-border">
            <div className="p-4">
              <h3 className="font-medium mb-2">Filter options</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary mr-2" />
                  <span className="text-sm">High utilization</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary mr-2" />
                  <span className="text-sm">Maintenance needed</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary mr-2" />
                  <span className="text-sm">Low revenue</span>
                </label>
              </div>
              <div className="mt-4 flex justify-between">
                <Button variant="outline" size="sm">Clear</Button>
                <Button size="sm">Apply</Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Button variant="ghost" className="w-full md:w-auto">
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
    </div>
  );
};
