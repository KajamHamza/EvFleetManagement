
export interface Station {
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

export const mockStations: Station[] = [
  {
    id: 1,
    name: 'Downtown Fast Charging',
    address: '123 Main St, New York, NY',
    status: 'active',
    chargers: 6,
    availableChargers: 4,
    revenue: 1250,
    utilization: 78,
    lastMaintenance: '2023-05-15'
  },
  {
    id: 2,
    name: 'Metro Hub Station',
    address: '456 Park Ave, New York, NY',
    status: 'active',
    chargers: 8,
    availableChargers: 2,
    revenue: 1850,
    utilization: 92,
    lastMaintenance: '2023-06-02'
  },
  {
    id: 3,
    name: 'Grocery Store Charging',
    address: '789 Market St, New York, NY',
    status: 'maintenance',
    chargers: 4,
    availableChargers: 0,
    revenue: 780,
    utilization: 45,
    lastMaintenance: '2023-06-18'
  },
  {
    id: 4,
    name: 'Mall Parking Chargers',
    address: '101 Shopping Ctr, New York, NY',
    status: 'active',
    chargers: 10,
    availableChargers: 5,
    revenue: 2100,
    utilization: 65,
    lastMaintenance: '2023-05-20'
  },
  {
    id: 5,
    name: 'Office Building Station',
    address: '222 Business Pkwy, New York, NY',
    status: 'inactive',
    chargers: 6,
    availableChargers: 0,
    revenue: 0,
    utilization: 0,
    lastMaintenance: '2023-04-10'
  }
];
