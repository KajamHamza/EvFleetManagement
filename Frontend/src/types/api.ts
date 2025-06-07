
// Auth types
export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

export type UserRole = 'DRIVER' | 'STATION_MANAGER' | 'ADMIN';

export interface LoginResponse {
  token: string;
  user: User;
}

// We need a direct API response interface that matches the actual API structure
export interface ApiLoginResponse {
  token: string;
  username: string;
  role: UserRole;
  user?: User;
}

export interface RegisterResponse {
  token: string;
  username: string;
  role: UserRole;
}

// Vehicle types
export interface Vehicle {
  id: number;
  vin: string;
  name: string;
  make: string;
  model: string;
  year: number;
  batteryCapacity: number;
  currentBatteryLevel: number;
  currentState: VehicleState;
  latitude: number;
  longitude: number;
  efficiency: number;
  currentSpeed: number;
  odometer: number;
  active: boolean;
  lastChargedLevel: number;
  initialSoc: number;
  type: string;
  driverId: number | null;
  driverUsername: string | null;
  driverName: string | null;
}

export type VehicleState = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'CHARGING' | 'LOW_BATTERY';

export interface VehicleStateHistory {
  id: number;
  vehicleId: number;
  state: VehicleState;
  timestamp: string;
  notes: string;
  positionX: number;
  positionY: number;
  socPercentage: number;
}

export interface CurrentVehicleState {
  id: number;
  state: VehicleState;
  timestamp: string;
  notes: string;
}

// Charging station types
export interface ChargingStation {
  id: number;
  stationId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  location: string;
  totalConnectors: number;
  availableConnectors: number;
  powerRating: number;
  pricePerKwh: number;
  operator: string;
  connectorTypes: string;
  status: StationStatus;
  active: boolean;
}

export type StationStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';

// Charging session types
export interface ChargingSession {
  id: number;
  stationId: number;
  stationName: string;
  vehicleId: number;
  vehicleVin: string;
  startTime: string;
  endTime: string | null;
  energyDelivered: number | null;
  cost: number | null;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'INTERRUPTED' | 'CANCELED' | 'FAILED';
  connectorType: string;
  initialBatteryLevel: number;
  finalBatteryLevel: number | null;
  initialSoc: number;
}

export type SessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'FAILED' | 'INTERRUPTED';

// Maintenance types
export interface Maintenance {
  id: number;
  vehicleVin: string;
  maintenanceType: MaintenanceType;
  description: string;
  scheduledDate: string;
  completedDate: string | null;
  status: MaintenanceStatus;
  cost: number | null;
  serviceProvider: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type MaintenanceType = 'ROUTINE' | 'REPAIR' | 'INSPECTION';
export type MaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';

// Simulation types
export interface SimulationData {
  vin: string;
  state: VehicleState;
  batteryLevel: number;
  latitude: number;
  longitude: number;
  speed: number;
  odometer: number;
  timestamp: string;
  trafficCondition: string;
  recommendation: string;
  nearestChargingStationId: number;
  distanceToNearestStation: number;
  estimatedBatteryAtDestination: number;
}

export interface SimulationTrip {
  timestamp: string;
  fromLocation: string;
  toLocation: string;
  distanceKm: number;
  energyConsumedWh: number;
  socPercentage: number;
  startPosition: {
    x: number;
    y: number;
  };
  endPosition: {
    x: number;
    y: number;
  };
  path: string[];
}

// WebSocket message types
export interface VehicleUpdate {
  vin: string;
  state: VehicleState;
  batteryLevel: number;
  latitude: number;
  longitude: number;
  speed: number;
  odometer: number;
  timestamp: string;
}

export interface StationUpdate {
  id: number;
  stationId: string;
  name: string;
  status: StationStatus;
  availableConnectors: number;
  totalConnectors: number;
  timestamp: string;
}

// Error response
export interface ApiError {
  error: string;
  message: string;
  timestamp: string;
}
