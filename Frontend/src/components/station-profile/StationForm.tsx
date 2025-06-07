
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChargingStation } from '@/types/api';

interface StationFormProps {
  station?: Partial<ChargingStation>;
  onSubmit: (stationData: Partial<ChargingStation>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const StationForm: React.FC<StationFormProps> = ({
  station,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Partial<ChargingStation>>(station || {
    stationId: '',
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    location: '',
    totalConnectors: 2,
    availableConnectors: 2,
    powerRating: 50,
    pricePerKwh: 0.35,
    operator: '',
    connectorTypes: 'Type2,CCS',
    active: true
  });

  const [connectorTypesArray, setConnectorTypesArray] = useState<string[]>(
    formData.connectorTypes ? formData.connectorTypes.split(',') : ['Type2', 'CCS']
  );

  const handleChange = (field: keyof ChargingStation, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleConnectorChange = (type: string, checked: boolean) => {
    const updatedTypes = [...connectorTypesArray];
    
    if (checked && !updatedTypes.includes(type)) {
      updatedTypes.push(type);
    } else if (!checked) {
      const index = updatedTypes.indexOf(type);
      if (index !== -1) {
        updatedTypes.splice(index, 1);
      }
    }
    
    setConnectorTypesArray(updatedTypes);
    handleChange('connectorTypes', updatedTypes.join(','));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Station ID</label>
          <input
            type="text"
            value={formData.stationId || ''}
            onChange={(e) => handleChange('stationId', e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md"
            placeholder="Unique Station ID"
            required
          />
        </div>
          
        <div>
          <label className="block text-sm font-medium mb-1">Station Name</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md"
            placeholder="Downtown Charging Hub"
            required
          />
        </div>
          
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Address</label>
          <input
            type="text"
            value={formData.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md"
            placeholder="123 Main St, City"
            required
          />
        </div>
          
        <div>
          <label className="block text-sm font-medium mb-1">Location/City</label>
          <input
            type="text"
            value={formData.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md"
            placeholder="Rabat"
            required
          />
        </div>
          
        <div>
          <label className="block text-sm font-medium mb-1">Operator</label>
          <input
            type="text"
            value={formData.operator || ''}
            onChange={(e) => handleChange('operator', e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md"
            placeholder="Your Company Name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Coordinates (Latitude)</label>
          <input
            type="number"
            value={formData.latitude || 0}
            onChange={(e) => handleChange('latitude', parseFloat(e.target.value))}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md"
            placeholder="Latitude"
            step="0.0001"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Coordinates (Longitude)</label>
          <input
            type="number"
            value={formData.longitude || 0}
            onChange={(e) => handleChange('longitude', parseFloat(e.target.value))}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md"
            placeholder="Longitude"
            step="0.0001"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Power Rating (kW)</label>
          <input
            type="number"
            value={formData.powerRating || 50}
            onChange={(e) => handleChange('powerRating', parseFloat(e.target.value))}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md"
            placeholder="50"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Price per kWh ($)</label>
          <input
            type="number"
            value={formData.pricePerKwh || 0.35}
            onChange={(e) => handleChange('pricePerKwh', parseFloat(e.target.value))}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md"
            placeholder="0.35"
            step="0.01"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Total Connectors</label>
          <input
            type="number"
            value={formData.totalConnectors || 2}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              handleChange('totalConnectors', value);
              if ((formData.availableConnectors || 0) > value) {
                handleChange('availableConnectors', value);
              }
            }}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md"
            placeholder="Total"
            min="1"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Available Connectors</label>
          <input
            type="number"
            value={formData.availableConnectors || 2}
            onChange={(e) => handleChange('availableConnectors', parseInt(e.target.value))}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md"
            placeholder="Available"
            min="0"
            max={formData.totalConnectors || 1}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Connector Types</label>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center">
            <input 
              type="checkbox"
              checked={connectorTypesArray.includes('Type2')}
              onChange={(e) => handleConnectorChange('Type2', e.target.checked)}
              className="mr-2" 
            />
            <span>Type 2</span>
          </label>
          <label className="flex items-center">
            <input 
              type="checkbox"
              checked={connectorTypesArray.includes('CCS')}
              onChange={(e) => handleConnectorChange('CCS', e.target.checked)}
              className="mr-2" 
            />
            <span>CCS</span>
          </label>
          <label className="flex items-center">
            <input 
              type="checkbox"
              checked={connectorTypesArray.includes('CHAdeMO')}
              onChange={(e) => handleConnectorChange('CHAdeMO', e.target.checked)}
              className="mr-2" 
            />
            <span>CHAdeMO</span>
          </label>
          <label className="flex items-center">
            <input 
              type="checkbox"
              checked={connectorTypesArray.includes('Tesla')}
              onChange={(e) => handleConnectorChange('Tesla', e.target.checked)}
              className="mr-2" 
            />
            <span>Tesla</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        {onCancel && (
          <Button 
            type="button" 
            onClick={onCancel} 
            variant="outline"
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Station'}
        </Button>
      </div>
    </form>
  );
};
