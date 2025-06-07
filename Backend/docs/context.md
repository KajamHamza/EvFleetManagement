Fleet-Management/Specification
1. Application Overview
The Electric Vehicle (EV) and Charging Station Management Platform is a centralized system designed to manage electric vehicles, charging stations, and user interactions. The platform provides real-time data, predictive analytics, and management tools for drivers, station managers, and administrators.  
Key Features

Driver Features:  
Real-time vehicle data (battery level, speed, location) based on simulation timestamps.  
Route optimization and charging station recommendations computed from the current simulation state.  
Notifications for low battery, station availability, and traffic alerts.


Station Manager Features:  
Manage charging stations (add, update, delete).  
Monitor station occupancy and revenue based on simulation data.


Admin Features:  
System-wide monitoring and user management.  
View all vehicles and stations on a map.



Technologies

Backend: Spring Boot (MVC architecture).  
Database: Neon (PostgreSQL).  
Authentication: JWT.  
Simulation Data: Provided via ev_simulation_logs.json, containing pre-generated simulation data for 5 EVs over an average 10km trip in Sala Al Jadida.

2. Backend Architecture
The backend follows a Clean MVC (Model-View-Controller) architecture to ensure separation of concerns, maintainability, and scalability.  
Layers

Controller Layer:  

Handles HTTP requests and responses.  
Maps incoming requests to the appropriate service methods.  
Validates input data, including simulation timestamps for retrieving data.


Service Layer:  

Contains business logic.  
Interacts with the repository layer to fetch or persist data.  
Computes recommendations (e.g., route optimization, charging station suggestions) based on simulation data.


Repository Layer:  

Manages database operations.  
Uses Spring Data JPA to interact with the Neon database.


Model Layer:  

Represents the data entities (e.g., User, Vehicle, ChargingStation, VehicleState).  
Maps to database tables using JPA annotations.


DTOs (Data Transfer Objects):  

Used to transfer data between layers.  
Ensures that sensitive data (e.g., passwords) is not exposed.


Configuration Layer:  

Manages application configuration (e.g., Neon credentials, API keys, JSON file path).  
Uses Spring Boot’s @Configuration and @Bean annotations.



Simulation Data Handling

The simulation data is sourced from the ev_simulation_logs.json file instead of direct integration with FASTSim and SUMO.  
A service loads the JSON data into the Neon database on application startup or via an admin API.  
The JsonSimulationDataProvider class implements the SimulationDataProvider interface to facilitate loading and parsing the JSON data into the database.

3. Neon Integration
Authentication (OAuth)

Users (drivers, station managers, admins) authenticate using email/password or OAuth.  
JWT tokens are used for session management and API security.

Database

Neon (PostgreSQL) is used as the primary database.  
Tables include:  
User: Stores user information (drivers, station managers, admins).  
Vehicle: Stores static vehicle information (e.g., vehicle ID, name, initial SOC).  
ChargingStation: Stores charging station details (e.g., location, capacity).  
ChargingSession: Stores charging events (e.g., vehicle ID, station ID, start/end times).  
Trip: Stores trip details (if applicable).  
Notification: Stores user notifications.  
RouteOptimization: Stores route optimization results.  
RevenueReport: Stores station revenue data.  
SystemHealth: Stores system health metrics.  
VehicleState: Stores time-series simulation data for vehicles (e.g., timestamp, vehicle_id, x, y, speed, battery_level).



4. Simulation Data Handling
Simulation Data JSON Format
The simulation data is provided in the ev_simulation_logs.json file, which contains data for multiple vehicles, each with an initial SOC and a list of trips. Below is the structure:
{
  "Vehicle Name": {
    "initial_soc": float,
    "trips": [
      {
        "timestamp": "YYYY-MM-DD HH:MM:SS",
        "from_location": "start",
        "to_location": "end",
        "distance_km": float,
        "energy_consumed_wh": float,
        "soc_percentage": float,
        "start_position": {
          "x": float,
          "y": float
        },
        "end_position": {
          "x": float,
          "y": float
        },
        "path": [string, ...]
      },
      // Additional trips...
    ]
  },
  // Additional vehicles...
}

Fields

Vehicle Name: Unique identifier for the vehicle (e.g., "Véhicule électrique urbain").  
initial_soc: Initial state of charge (SOC) percentage at the start of the simulation.  
trips: Array of trip objects representing the vehicle's journeys.  
timestamp: Start time of the trip in "YYYY-MM-DD HH:MM:SS" format.  
from_location: Starting location name (currently "start", may be placeholder).  
to_location: Ending location name (currently "end", may be placeholder).  
distance_km: Distance traveled during the trip in kilometers.  
energy_consumed_wh: Energy consumed during the trip in watt-hours.  
soc_percentage: SOC percentage at the end of the trip.  
start_position: Starting coordinates with x and y values (assumed to be in a projected coordinate system, e.g., meters).  
end_position: Ending coordinates with x and y values.  
path: List of node IDs representing the route taken (not used for state generation due to lack of node coordinates).



Loading Simulation Data

The JSON file is parsed and loaded into the database as follows:  
Vehicle Data: Insert vehicle names and initial SOC into the Vehicle table.  
Trip Data: For each trip, calculate the duration and end time using an assumed average speed of 50 km/h:  
Duration (hours) = distance_km / 50  
Duration (seconds) = Duration (hours) * 3600  
End time = timestamp + Duration (seconds)


Generate Vehicle States:  
Time steps are generated at 60-second intervals from the start of the first trip to the end of the last trip for each vehicle.  
For each time step:  
Within a Trip: If the time step falls between a trip's start and end time:  
Position: Linearly interpolate x and y coordinates between start_position and end_position based on the fraction of time elapsed.  
SOC: Linearly interpolate between the start SOC (initial SOC for the first trip, or previous trip's end SOC for subsequent trips) and the trip's soc_percentage.  
Speed: Calculate average speed as distance_km / Duration (hours), assumed constant during the trip.


Between Trips: If the time step falls between the end of one trip and the start of the next, assume the vehicle is stationary at the previous trip's end_position with SOC equal to the previous trip's soc_percentage.




Store States: Insert generated VehicleState records into the database.



Assumptions

Average Speed: 50 km/h is used to estimate trip durations due to the absence of explicit end times or speed data.  
No Charging Events: The provided JSON lacks charging_events, so SOC changes are based solely on trip data. Any SOC increases (e.g., from regenerative braking or unrecorded charging) are accepted as provided in soc_percentage.  
Path Usage: The path field is not used for state generation, as node coordinates are unavailable; interpolation relies on start_position and end_position.

APIs for Simulation

APIs accept a timestamp parameter to retrieve simulation data at specific times:  
GET /vehicles?timestamp={YYYY-MM-DDTHH:MM:SS}: Returns the state of all vehicles at the specified timestamp.  
GET /vehicles/{id}/state?timestamp={YYYY-MM-DDTHH:MM:SS}: Returns the state of a specific vehicle at the specified timestamp.  
GET /charging-stations: Returns all charging stations (static data).  
GET /charging-stations/{id}/occupancy?timestamp={YYYY-MM-DDTHH:MM:SS}: Returns occupancy of a station at the specified timestamp, derived from ChargingSession data.  
POST /recommendations/route: Takes vehicle state (position, battery level) and destination at a given timestamp, returns an optimized route.  
POST /recommendations/charging: Takes vehicle state at a given timestamp, returns the nearest available charging station based on ChargingSession occupancy.



5. Future Integration with Real Cars

The system is designed to switch from simulation to real car data seamlessly.  
The RealCarDataProvider and RealStationDataProvider interfaces will replace JsonSimulationDataProvider, feeding real-time data into the same database tables (VehicleState, ChargingSession).  
APIs will drop the timestamp parameter, returning the latest real-time data instead of simulation states.

