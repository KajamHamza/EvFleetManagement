# EV Fleet Management API Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [Vehicles](#vehicles)
3. [Charging Stations](#charging-stations)
4. [Charging Sessions](#charging-sessions)
5. [Maintenance](#maintenance)
6. [Simulation](#simulation)
7. [WebSocket](#websocket)

## Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "username": "string",
    "email": "string",
    "role": "ADMIN"
  }
}
```

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "DRIVER"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "username": "newuser",
  "role": "DRIVER"
}
```

Available roles:
- `DRIVER`
- `STATION_MANAGER`
- `ADMIN`

## Vehicles

### Register Vehicle
```http
POST /api/vehicles
Content-Type: application/json
Authorization: Bearer <token>

{
  "vin": "VIN001",
  "make": "Tesla",
  "model": "Model 3",
  "year": 2024,
  "batteryCapacity": 75.0,
  "currentBatteryLevel": 85.0,
  "efficiency": 15.0,
  "currentSpeed": 0.0,
  "latitude": 51.5074,
  "longitude": -0.1278,
  "odometer": 0.0,
  "active": true
}
```

Response:
```json
{
  "id": 1,
  "vin": "VIN001",
  "name": "Tesla Model 3",
  "make": "Tesla",
  "model": "Model 3",
  "year": 2024,
  "batteryCapacity": 75.0,
  "currentBatteryLevel": 85.0,
  "currentState": "AVAILABLE",
  "latitude": 51.5074,
  "longitude": -0.1278,
  "efficiency": 15.0,
  "currentSpeed": 0.0,
  "odometer": 0.0,
  "active": true,
  "lastChargedLevel": 85.0,
  "initialSoc": 85.0,
  "type": "Electric",
  "driverId": null,
  "driverUsername": null,
  "driverName": null
}
```

### Get All Vehicles
```http
GET /api/vehicles
Authorization: Bearer <token>
```

Response:
```json
[
  {
    "id": 1,
    "vin": "VIN001",
    "name": "Tesla Model 3",
    "make": "Tesla",
    "model": "Model 3",
    "year": 2024,
    "batteryCapacity": 75.0,
    "currentBatteryLevel": 85.0,
    "currentState": "AVAILABLE",
    "latitude": 51.5074,
    "longitude": -0.1278,
    "efficiency": 15.0,
    "currentSpeed": 0.0,
    "odometer": 0.0,
    "active": true,
    "lastChargedLevel": 85.0,
    "initialSoc": 85.0,
    "type": "Electric",
    "driverId": null,
    "driverUsername": null,
    "driverName": null
  }
]
```

### Get Vehicle by ID
```http
GET /api/vehicles/{id}
Authorization: Bearer <token>
```

Response: Same as single vehicle object above

### Update Vehicle
```http
PUT /api/vehicles/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Tesla Model 3",
  "make": "Tesla",
  "model": "Model 3",
  "year": 2024,
  "batteryCapacity": 75.0,
  "currentBatteryLevel": 85.0,
  "efficiency": 15.0,
  "currentSpeed": 0.0,
  "latitude": 51.5074,
  "longitude": -0.1278,
  "odometer": 0.0,
  "currentState": "AVAILABLE",
  "lastChargedLevel": 85.0,
  "active": true,
  "initialSoc": 85.0,
  "type": "Electric"
}
```

Response: Updated vehicle object

### Get Vehicle State History
```http
GET /api/vehicles/{id}/states
Authorization: Bearer <token>
```

Response:
```json
[
  {
    "id": 1,
    "vehicleId": 1,
    "state": "AVAILABLE",
    "timestamp": "2024-03-20T10:00:00",
    "notes": "Vehicle ready for use",
    "positionX": 51.5074,
    "positionY": -0.1278,
    "socPercentage": 85.0
  }
]
```

### Get Current Vehicle State
```http
GET /api/vehicles/{id}/state/current
Authorization: Bearer <token>
```

Response:
```json
{
  "id": 1,
  "state": "AVAILABLE",
  "timestamp": "2024-03-20T10:00:00",
  "notes": "Vehicle ready for use"
}
```

### Assign Vehicle to Driver
```http
POST /api/vehicles/{id}/assign?username=driver123
Authorization: Bearer <token>
```

This endpoint requires ADMIN role.

Response:
```json
{
  "id": 1,
  "vin": "VIN001",
  "name": "Tesla Model 3",
  "make": "Tesla",
  "model": "Model 3",
  "year": 2024,
  "batteryCapacity": 75.0,
  "currentBatteryLevel": 85.0,
  "currentState": "AVAILABLE",
  "latitude": 51.5074,
  "longitude": -0.1278,
  "driverId": 5,
  "driverUsername": "driver123",
  "driverName": "John Doe"
}
```

### Unassign Vehicle
```http
POST /api/vehicles/{id}/unassign
Authorization: Bearer <token>
```

This endpoint requires ADMIN role.

Response:
```json
{
  "id": 1,
  "vin": "VIN001",
  "name": "Tesla Model 3",
  "make": "Tesla",
  "model": "Model 3",
  "year": 2024,
  "batteryCapacity": 75.0,
  "currentBatteryLevel": 85.0,
  "currentState": "AVAILABLE",
  "latitude": 51.5074,
  "longitude": -0.1278
}
```

## Charging Stations

### Create Charging Station
```http
POST /api/charging-stations
Authorization: Bearer <token>
Content-Type: application/json

{
  "stationId": "CS001",
  "name": "Downtown Charging Hub",
  "address": "123 Main St",
  "latitude": 51.5074,
  "longitude": -0.1278,
  "location": "Rabat",
  "totalConnectors": 10,
  "availableConnectors": 10,
  "powerRating": 150.0,
  "pricePerKwh": 0.35,
  "operator": "City Power",
  "connectorTypes": "CCS,Type2",
  "active": true
}
```

Response:
```json
{
  "id": 1,
  "stationId": "CS001",
  "name": "Downtown Charging Hub",
  "address": "123 Main St",
  "latitude": 51.5074,
  "longitude": -0.1278,
  "location": "Rabat",
  "totalConnectors": 10,
  "availableConnectors": 10,
  "powerRating": 150.0,
  "pricePerKwh": 0.35,
  "operator": "City Power",
  "connectorTypes": "CCS,Type2",
  "status": "AVAILABLE",
  "active": true
}
```

Available station statuses:
- `AVAILABLE`
- `IN_USE`
- `MAINTENANCE`
- `OUT_OF_SERVICE`

### Get All Stations
```http
GET /api/charging-stations
Authorization: Bearer <token>
```

Response:
```json
[
  {
    "id": 1,
    "stationId": "CS001",
    "name": "Downtown Charging Hub",
    "address": "123 Main St",
    "latitude": 51.5074,
    "longitude": -0.1278,
    "location": "Rabat",
    "totalConnectors": 10,
    "availableConnectors": 10,
    "powerRating": 150.0,
    "pricePerKwh": 0.35,
    "operator": "City Power",
    "connectorTypes": "CCS,Type2",
    "status": "AVAILABLE",
    "active": true
  }
]
```

### Get Station by ID
```http
GET /api/charging-stations/{id}
Authorization: Bearer <token>
```

Response: Same as single station object above

### Get Nearby Stations
```http
GET /api/charging-stations/nearby?latitude=51.5074&longitude=-0.1278&radius=10
Authorization: Bearer <token>
```

Response: Array of station objects as above.

### Get Available Stations
```http
GET /api/charging-stations/available
Authorization: Bearer <token>
```

Response: Array of available station objects.

### Update Station
```http
PUT /api/charging-stations/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Downtown Charging Hub Updated",
  "address": "123 Main St",
  "latitude": 51.5074,
  "longitude": -0.1278,
  "location": "Rabat",
  "totalConnectors": 12,
  "powerRating": 150.0,
  "pricePerKwh": 0.35,
  "operator": "City Power",
  "connectorTypes": "CCS,Type2",
  "status": "AVAILABLE"
}
```

Response: Updated station object.

### Update Station Status
```http
PUT /api/charging-stations/{id}/status?status=MAINTENANCE
Authorization: Bearer <token>
```

Response: Updated station object.

### Update Available Connectors
```http
PUT /api/charging-stations/{id}/connectors?availableConnectors=5
Authorization: Bearer <token>
```

Response: Updated station object.

### Delete Station
```http
DELETE /api/charging-stations/{id}
Authorization: Bearer <token>
```

Response: 200 OK

## Charging Sessions

### Start Session
```http
POST /api/charging-sessions/start?stationId=1&vehicleId=1&connectorType=Type2
Authorization: Bearer <token>
```

Response:
```json
{
  "id": 1,
  "stationId": 1,
  "stationName": "Downtown Charging Hub",
  "vehicleId": 1,
  "vehicleVin": "VIN001",
  "startTime": "2024-03-20T10:00:00",
  "endTime": null,
  "energyDelivered": null,
  "cost": null,
  "status": "IN_PROGRESS",
  "connectorType": "Type2",
  "initialBatteryLevel": 85.0,
  "finalBatteryLevel": null,
  "initialSoc": 85.0
}
```

### End Session
```http
POST /api/charging-sessions/{id}/end
Authorization: Bearer <token>
```

Response:
```json
{
  "id": 1,
  "stationId": 1,
  "stationName": "Downtown Charging Hub",
  "vehicleId": 1,
  "vehicleVin": "VIN001",
  "startTime": "2024-03-20T10:00:00",
  "endTime": "2024-03-20T11:30:00",
  "energyDelivered": 45.0,
  "cost": 15.75,
  "status": "COMPLETED",
  "connectorType": "Type2",
  "initialBatteryLevel": 85.0,
  "finalBatteryLevel": 95.0,
  "initialSoc": 85.0
}
```

### Get Vehicle Sessions
```http
GET /api/charging-sessions/vehicle/{vehicleId}
Authorization: Bearer <token>
```

Response:
```json
[
  {
    "id": 1,
    "stationId": 1,
    "stationName": "Downtown Charging Hub",
    "vehicleId": 1,
    "vehicleVin": "VIN001",
    "startTime": "2024-03-20T10:00:00",
    "endTime": "2024-03-20T11:30:00",
    "energyDelivered": 45.0,
    "cost": 15.75,
    "status": "COMPLETED",
    "connectorType": "Type2",
    "initialBatteryLevel": 85.0,
    "finalBatteryLevel": 95.0,
    "initialSoc": 85.0
  },
  {
    "id": 2,
    "stationId": 2,
    "stationName": "City Center Station",
    "vehicleId": 1,
    "vehicleVin": "VIN001",
    "startTime": "2024-03-21T14:00:00",
    "endTime": null,
    "energyDelivered": null,
    "cost": null,
    "status": "IN_PROGRESS",
    "connectorType": "CCS",
    "initialBatteryLevel": 65.0,
    "finalBatteryLevel": null,
    "initialSoc": 65.0
  }
]
```

### Get Station Sessions
```http
GET /api/charging-sessions/station/{stationId}
Authorization: Bearer <token>
```

Response:
```json
[
  {
    "id": 1,
    "stationId": 1,
    "stationName": "Downtown Charging Hub",
    "vehicleId": 1,
    "vehicleVin": "VIN001",
    "startTime": "2024-03-20T10:00:00",
    "endTime": "2024-03-20T11:30:00",
    "energyDelivered": 45.0,
    "cost": 15.75,
    "status": "COMPLETED",
    "connectorType": "Type2",
    "initialBatteryLevel": 85.0,
    "finalBatteryLevel": 95.0,
    "initialSoc": 85.0
  },
  {
    "id": 3,
    "stationId": 1,
    "stationName": "Downtown Charging Hub",
    "vehicleId": 2,
    "vehicleVin": "VIN002",
    "startTime": "2024-03-20T12:00:00",
    "endTime": "2024-03-20T13:15:00",
    "energyDelivered": 35.0,
    "cost": 12.25,
    "status": "COMPLETED",
    "connectorType": "CCS",
    "initialBatteryLevel": 70.0,
    "finalBatteryLevel": 90.0,
    "initialSoc": 70.0
  }
]
```

### Get Active Charging Session
```http
GET /api/charging-sessions/vehicle/{vehicleId}/active
Authorization: Bearer <token>
```

Response:
```json
{
  "id": 2,
  "stationId": 2,
  "stationName": "City Center Station",
  "vehicleId": 1,
  "vehicleVin": "VIN001",
  "startTime": "2024-03-21T14:00:00",
  "endTime": null,
  "energyDelivered": null,
  "cost": null,
  "status": "IN_PROGRESS",
  "connectorType": "CCS",
  "initialBatteryLevel": 65.0,
  "finalBatteryLevel": null,
  "initialSoc": 65.0
}
```

## Maintenance

### Schedule Maintenance
```http
POST /api/maintenance
Authorization: Bearer <token>
Content-Type: application/json

{
  "vehicleVin": "VIN001",
  "maintenanceType": "ROUTINE",
  "description": "Regular vehicle check",
  "scheduledDate": "2024-03-20T10:00:00",
  "serviceProvider": "City Maintenance",
  "notes": "Scheduled for today at 10:00 AM"
}
```

Response:
```json
{
  "id": 1,
  "vehicleVin": "VIN001",
  "maintenanceType": "ROUTINE",
  "description": "Regular vehicle check",
  "scheduledDate": "2024-03-20T10:00:00",
  "completedDate": null,
  "status": "SCHEDULED",
  "cost": null,
  "serviceProvider": "City Maintenance",
  "notes": "Scheduled for today at 10:00 AM",
  "createdAt": "2024-03-20T10:00:00",
  "updatedAt": "2024-03-20T10:00:00"
}
```

### Update Maintenance Status
```http
PUT /api/maintenance/{id}/status?status=COMPLETED
Authorization: Bearer <token>
```

Response:
```json
{
  "id": 1,
  "vehicleVin": "VIN001",
  "maintenanceType": "ROUTINE",
  "description": "Regular vehicle check",
  "scheduledDate": "2024-03-20T10:00:00",
  "completedDate": "2024-03-20T11:30:00",
  "status": "COMPLETED",
  "cost": 150.0,
  "serviceProvider": "City Maintenance",
  "notes": "Maintenance completed successfully",
  "createdAt": "2024-03-20T10:00:00",
  "updatedAt": "2024-03-20T11:30:00"
}
```

### Get Vehicle Maintenance History
```http
GET /api/maintenance/vehicle/{vin}/history
Authorization: Bearer <token>
```

Response:
```json
[
  {
    "id": 1,
    "vehicleVin": "VIN001",
    "maintenanceType": "ROUTINE",
    "description": "Regular vehicle check",
    "scheduledDate": "2024-03-20T10:00:00",
    "completedDate": "2024-03-20T11:30:00",
    "status": "COMPLETED",
    "cost": 150.0,
    "serviceProvider": "City Maintenance",
    "notes": "Maintenance completed successfully",
    "createdAt": "2024-03-20T10:00:00",
    "updatedAt": "2024-03-20T11:30:00"
  },
  {
    "id": 2,
    "vehicleVin": "VIN001",
    "maintenanceType": "REPAIR",
    "description": "Battery system check",
    "scheduledDate": "2024-03-25T09:00:00",
    "completedDate": null,
    "status": "SCHEDULED",
    "cost": null,
    "serviceProvider": "City Maintenance",
    "notes": "Scheduled for next week",
    "createdAt": "2024-03-20T10:00:00",
    "updatedAt": "2024-03-20T10:00:00"
  }
]
```

### Get Upcoming Maintenance
```http
GET /api/maintenance/vehicle/{vin}/upcoming
Authorization: Bearer <token>
```

Response:
```json
[
  {
    "id": 2,
    "vehicleVin": "VIN001",
    "maintenanceType": "REPAIR",
    "description": "Battery system check",
    "scheduledDate": "2024-03-25T09:00:00",
    "completedDate": null,
    "status": "SCHEDULED",
    "cost": null,
    "serviceProvider": "City Maintenance",
    "notes": "Scheduled for next week",
    "createdAt": "2024-03-20T10:00:00",
    "updatedAt": "2024-03-20T10:00:00"
  },
  {
    "id": 3,
    "vehicleVin": "VIN001",
    "maintenanceType": "INSPECTION",
    "description": "Annual safety inspection",
    "scheduledDate": "2024-04-01T10:00:00",
    "completedDate": null,
    "status": "SCHEDULED",
    "cost": null,
    "serviceProvider": "City Maintenance",
    "notes": "Annual inspection",
    "createdAt": "2024-03-20T10:00:00",
    "updatedAt": "2024-03-20T10:00:00"
  }
]
```

### Get Overdue Maintenance
```http
GET /api/maintenance/overdue
Authorization: Bearer <token>
```

Response:
```json
[
  {
    "id": 4,
    "vehicleVin": "VIN002",
    "maintenanceType": "ROUTINE",
    "description": "Regular vehicle check",
    "scheduledDate": "2024-03-15T10:00:00",
    "completedDate": null,
    "status": "SCHEDULED",
    "cost": null,
    "serviceProvider": "City Maintenance",
    "notes": "Overdue maintenance",
    "createdAt": "2024-03-10T10:00:00",
    "updatedAt": "2024-03-10T10:00:00"
  }
]
```

### Delete Maintenance
```http
DELETE /api/maintenance/{id}
Authorization: Bearer <token>
```

Response: 200 OK

### Get Maintenance Details
```http
GET /api/maintenance/{id}
Authorization: Bearer <token>
```

Response:
```json
{
  "id": 1,
  "vehicleVin": "VIN001",
  "maintenanceType": "ROUTINE",
  "description": "Regular vehicle check",
  "scheduledDate": "2024-03-20T10:00:00",
  "completedDate": "2024-03-20T11:30:00",
  "status": "COMPLETED",
  "cost": 150.0,
  "serviceProvider": "City Maintenance",
  "notes": "Maintenance completed successfully",
  "createdAt": "2024-03-20T10:00:00",
  "updatedAt": "2024-03-20T11:30:00"
}
```

## Simulation

### Get Vehicle Trips
```http
GET /api/simulation/vehicles/{vin}/trips
Authorization: Bearer <token>
```

Response:
```json
[
  {
    "timestamp": "2024-03-20T10:00:00",
    "fromLocation": "Start Point",
    "toLocation": "End Point",
    "distanceKm": 12.5,
    "energyConsumedWh": 2800.0,
    "socPercentage": 85.0,
    "startPosition": {
      "x": 51.5074,
      "y": -0.1278
    },
    "endPosition": {
      "x": 51.5206,
      "y": -0.1347
    },
    "path": ["51.5074,-0.1278", "51.5100,-0.1300", "51.5206,-0.1347"]
  }
]
```

### Get Current Position
```http
GET /api/simulation/vehicles/{vin}/current-position
Authorization: Bearer <token>
```

Response:
```json
{
  "timestamp": "2024-03-20T10:00:00",
  "fromLocation": "Start Point",
  "toLocation": "End Point",
  "distanceKm": 12.5,
  "energyConsumedWh": 2800.0,
  "socPercentage": 85.0,
  "startPosition": {
    "x": 51.5074,
    "y": -0.1278
  },
  "endPosition": {
    "x": 51.5206,
    "y": -0.1347
  },
  "path": ["51.5074,-0.1278", "51.5100,-0.1300", "51.5206,-0.1347"]
}
```

### Get Simulation Statistics
```http
GET /api/simulation/statistics
Authorization: Bearer <token>
```

Response:
```json
{
  "vehicleTypeCounts": {
    "Tesla Model 3": 5,
    "Nissan Leaf": 3
  },
  "tripStatistics": {
    "Tesla Model 3": {
      "totalDistance": 150.5,
      "totalEnergy": 22500.0,
      "avgEnergyPerKm": 149.5
    },
    "Nissan Leaf": {
      "totalDistance": 75.2,
      "totalEnergy": 11280.0,
      "avgEnergyPerKm": 150.0
    }
  }
}
```

### Set Simulation Speed
```http
POST /api/simulation/vehicles/{vin}/speed/{multiplier}
Authorization: Bearer <token>
```

Parameters:
- multiplier: Speed multiplier (0.1x to 10x)

Response: 200 OK

### Reset Simulation
```http
POST /api/simulation/reset
Authorization: Bearer <token>
```

Response: 200 OK

### Register Vehicles from Simulation
```http
POST /api/simulation/register-vehicles
Authorization: Bearer <token>
```

Response:
```json
{
  "message": "Vehicles registered successfully from simulation data"
}
```

### Load Simulation Vehicles
```http
POST /api/simulation/vehicles/load
Authorization: Bearer <token>
Query Parameters:
- jsonFilePath: Path to the JSON file containing vehicle data
```

Response:
```json
[
  {
    "id": 1,
    "vin": "VIN001",
    "name": "Tesla Model 3",
    "make": "Tesla",
    "model": "Model 3",
    "year": 2024,
    "batteryCapacity": 75.0,
    "currentBatteryLevel": 85.0,
    "currentState": "AVAILABLE",
    "latitude": 51.5074,
    "longitude": -0.1278,
    "efficiency": 15.0,
    "currentSpeed": 0.0,
    "odometer": 0.0,
    "active": true
  }
]
```

### Validate VIN
```http
GET /api/simulation/vehicles/validate-vin/{vin}
Authorization: Bearer <token>
```

Response:
```json
true
```

### Update Vehicle State
```http
POST /api/simulation/vehicles/{vin}/update-state
Authorization: Bearer <token>
```

Response:
```json
{
  "message": "Vehicle state updated successfully"
}
```

### Track Vehicle Trips
```http
POST /api/simulation/vehicles/{vin}/track-trips
Authorization: Bearer <token>
```

Response:
```json
{
  "message": "Vehicle trips tracking started"
}
```

## WebSocket

### Real-time Vehicle Updates
```http
WebSocket /ws/vehicles
```

Message Format:
```json
{
  "vin": "VIN001",
  "state": "AVAILABLE",
  "batteryLevel": 85.0,
  "latitude": 51.5074,
  "longitude": -0.1278,
  "speed": 0.0,
  "odometer": 0.0,
  "timestamp": "2024-03-20T10:00:00"
}
```

### Real-time Charging Station Updates
```http
WebSocket /ws/stations
```

Message Format:
```json
{
  "id": 1,
  "stationId": "CS001",
  "name": "Downtown Charging Hub",
  "status": "AVAILABLE",
  "availableConnectors": 10,
  "totalConnectors": 10,
  "timestamp": "2024-03-20T10:00:00"
}
```

## Error Responses

All endpoints may return the following error responses:

```json
{
  "error": "string",
  "message": "string",
  "timestamp": "2024-03-20T10:00:00"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error 
