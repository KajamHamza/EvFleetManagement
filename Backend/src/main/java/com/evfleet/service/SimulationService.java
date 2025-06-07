package com.evfleet.service;

import com.evfleet.dto.SimulationDataDTO;
import com.evfleet.dto.SimulationTripDTO;
import com.evfleet.dto.VehicleDTO;
import com.evfleet.entity.Vehicle;
import com.evfleet.repository.VehicleRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SimulationService {
    private static final Logger logger = LoggerFactory.getLogger(SimulationService.class);
    private static final String SIMULATION_TOPIC = "/topic/simulation/";
    private static final DateTimeFormatter TIMESTAMP_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    
    private final Map<String, List<SimulationTripDTO>> vehicleTrips = new ConcurrentHashMap<>();
    private final Map<String, Integer> currentTripIndex = new ConcurrentHashMap<>();
    private final Map<String, Integer> currentPathIndex = new ConcurrentHashMap<>();
    private final Map<String, LocalDateTime> lastUpdateTime = new ConcurrentHashMap<>();
    private final Map<String, Double> simulationSpeeds = new ConcurrentHashMap<>();

    private final VehicleRepository vehicleRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;
    private final VehicleService vehicleService;
    private Map<String, Map<String, Object>> simulationData;

    @Autowired
    public SimulationService(VehicleRepository vehicleRepository, 
                           SimpMessagingTemplate messagingTemplate,
                           ObjectMapper objectMapper,
                           VehicleService vehicleService) {
        this.vehicleRepository = vehicleRepository;
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = objectMapper;
        this.vehicleService = vehicleService;
        loadSimulationData();
    }

    private void loadSimulationData() {
        try {
            ClassPathResource resource = new ClassPathResource("ev_simulation_logs.json");
            simulationData = objectMapper.readValue(resource.getInputStream(), Map.class);
            
            // Initialize trips for each vehicle type
            for (Map.Entry<String, Map<String, Object>> entry : simulationData.entrySet()) {
                String vehicleType = entry.getKey();
                Map<String, Object> vehicleData = entry.getValue();
                
                // Initialize trips list for this vehicle type
                List<SimulationTripDTO> trips = new ArrayList<>();
                vehicleTrips.put(vehicleType, trips);
                
                // Load trips from the simulation data
                if (vehicleData.containsKey("trips")) {
                    List<Map<String, Object>> tripData = (List<Map<String, Object>>) vehicleData.get("trips");
                    for (Map<String, Object> trip : tripData) {
                        SimulationTripDTO tripDTO = new SimulationTripDTO();
                        tripDTO.setTimestamp(LocalDateTime.parse((String) trip.get("timestamp"), 
                            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
                        tripDTO.setFromLocation((String) trip.get("from_location"));
                        tripDTO.setToLocation((String) trip.get("to_location"));
                        tripDTO.setDistanceKm((Double) trip.get("distance_km"));
                        tripDTO.setEnergyConsumedWh((Double) trip.get("energy_consumed_wh"));
                        tripDTO.setSocPercentage((Double) trip.get("soc_percentage"));
                        
                        // Set start position
                        Map<String, Double> startPos = (Map<String, Double>) trip.get("start_position");
                        SimulationTripDTO.PositionDTO startPosition = new SimulationTripDTO.PositionDTO();
                        startPosition.setX(startPos.get("x"));
                        startPosition.setY(startPos.get("y"));
                        tripDTO.setStartPosition(startPosition);
                        
                        // Set end position
                        Map<String, Double> endPos = (Map<String, Double>) trip.get("end_position");
                        SimulationTripDTO.PositionDTO endPosition = new SimulationTripDTO.PositionDTO();
                        endPosition.setX(endPos.get("x"));
                        endPosition.setY(endPos.get("y"));
                        tripDTO.setEndPosition(endPosition);
                        
                        // Set path
                        List<String> pathList = (List<String>) trip.get("path");
                        tripDTO.setPath(pathList.toArray(new String[0]));
                        
                        trips.add(tripDTO);
                    }
                }
                
                // Initialize tracking indices
                currentTripIndex.put(vehicleType, 0);
                currentPathIndex.put(vehicleType, 0);
                lastUpdateTime.put(vehicleType, LocalDateTime.now());
                simulationSpeeds.put(vehicleType, 1.0);
            }
            
            // Log the number of trips loaded for each vehicle type
            vehicleTrips.forEach((type, trips) -> 
                logger.info("Loaded {} trips for vehicle type: {}", trips.size(), type));
            
            registerVehiclesFromSimulation();
        } catch (IOException e) {
            logger.error("Failed to load simulation data: {}", e.getMessage());
            throw new RuntimeException("Failed to load simulation data", e);
        }
    }

    private String determineVehicleTypeFromTrip(SimulationTripDTO trip) {
        // Determine vehicle type based on energy consumption characteristics
        double energyPerKm = trip.getEnergyConsumedWh() / trip.getDistanceKm();
        
        if (energyPerKm > 40) {
            return "SUV électrique";
        } else if (energyPerKm > 30) {
            return "Véhicule électrique premium";
        } else if (energyPerKm > 20) {
            return "Véhicule électrique compact";
        } else {
            return "Véhicule électrique urbain";
        }
    }

    @Transactional
    public void registerVehiclesFromSimulation() {
        int vinCounter = 1;
        for (Map.Entry<String, Map<String, Object>> entry : simulationData.entrySet()) {
            String vehicleType = entry.getKey();
            Map<String, Object> vehicleData = entry.getValue();
            double initialSoc = (double) vehicleData.get("initial_soc");

            String vin = "VIN" + String.format("%03d", vinCounter);
            
            // Skip if vehicle already exists
            if (vehicleRepository.existsByVin(vin)) {
                logger.info("Vehicle with VIN {} already exists, skipping registration", vin);
                vinCounter++;
                continue;
            }

            VehicleDTO vehicleDTO = new VehicleDTO();
            vehicleDTO.setVin(vin);
            vehicleDTO.setName(vehicleType + " " + String.format("%03d", vinCounter));
            vehicleDTO.setType(vehicleType);
            vehicleDTO.setMake("Tesla"); // Default make, can be customized
            vehicleDTO.setModel(vehicleType);
            vehicleDTO.setYear(2024);
            vehicleDTO.setBatteryCapacity(75.0); // Default capacity, can be customized
            vehicleDTO.setCurrentBatteryLevel(initialSoc);
            vehicleDTO.setInitialSoc(initialSoc);
            vehicleDTO.setEfficiency(15.0); // Default efficiency
            vehicleDTO.setCurrentSpeed(0.0);
            vehicleDTO.setLatitude(51.5074); // Default location
            vehicleDTO.setLongitude(-0.1278);
            vehicleDTO.setOdometer(0.0);
            vehicleDTO.setActive(true);

            try {
                vehicleService.registerVehicle(vehicleDTO);
                
                // Initialize simulation tracking maps for this vehicle type
                if (!vehicleTrips.containsKey(vehicleType)) {
                    vehicleTrips.put(vehicleType, new ArrayList<>());
                    currentTripIndex.put(vehicleType, 0);
                    currentPathIndex.put(vehicleType, 0);
                    lastUpdateTime.put(vehicleType, LocalDateTime.now());
                    simulationSpeeds.put(vin, 1.0); // Default speed multiplier
                }
                
                logger.info("Successfully registered vehicle with VIN {}", vin);
            } catch (IllegalArgumentException e) {
                logger.warn("Failed to register vehicle with VIN {}: {}", vin, e.getMessage());
            }
            
            vinCounter++;
        }
    }

    @Scheduled(fixedRate = 5000) // Update every 5 seconds
    public void generateAndBroadcastSimulationData() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        for (Vehicle vehicle : vehicles) {
            String vehicleType = determineVehicleType(vehicle);
            if (vehicleTrips.containsKey(vehicleType)) {
                SimulationDataDTO simulationData = generateSimulationData(vehicle, vehicleType);
                broadcastSimulationData(vehicle.getVin(), simulationData);
            }
        }
    }

    public SimulationDataDTO getCurrentSimulationData(String vin) {
        Vehicle vehicle = vehicleRepository.findByVin(vin)
            .orElseThrow(() -> new RuntimeException("Vehicle not found: " + vin));
        return generateSimulationData(vehicle, determineVehicleType(vehicle));
    }

    public List<SimulationTripDTO> getVehicleTrips(String vin, Integer limit) {
        Vehicle vehicle = vehicleRepository.findByVin(vin)
            .orElseThrow(() -> new RuntimeException("Vehicle not found: " + vin));
        String vehicleType = determineVehicleType(vehicle);
        List<SimulationTripDTO> trips = vehicleTrips.getOrDefault(vehicleType, new ArrayList<>());
        return limit != null ? trips.subList(0, Math.min(limit, trips.size())) : trips;
    }

    public SimulationTripDTO getCurrentPosition(String vin) {
        Vehicle vehicle = vehicleRepository.findByVin(vin)
            .orElseThrow(() -> new RuntimeException("Vehicle not found: " + vin));
        String vehicleType = determineVehicleType(vehicle);
        
        List<SimulationTripDTO> trips = vehicleTrips.getOrDefault(vehicleType, new ArrayList<>());
        if (trips.isEmpty()) {
            throw new RuntimeException("No trips found for vehicle: " + vin);
        }

        int currentTripIdx = currentTripIndex.getOrDefault(vehicleType, 0);
        SimulationTripDTO currentTrip = trips.get(currentTripIdx);
        
        // Create a copy of the current trip with updated timestamp
        SimulationTripDTO currentPosition = new SimulationTripDTO();
        currentPosition.setTimestamp(LocalDateTime.now());
        currentPosition.setFromLocation(currentTrip.getFromLocation());
        currentPosition.setToLocation(currentTrip.getToLocation());
        currentPosition.setDistanceKm(currentTrip.getDistanceKm());
        currentPosition.setEnergyConsumedWh(currentTrip.getEnergyConsumedWh());
        currentPosition.setSocPercentage(currentTrip.getSocPercentage());
        currentPosition.setStartPosition(currentTrip.getStartPosition());
        currentPosition.setEndPosition(currentTrip.getEndPosition());
        currentPosition.setPath(currentTrip.getPath());
        
        return currentPosition;
    }

    public List<String> getCurrentPath(String vin) {
        Vehicle vehicle = vehicleRepository.findByVin(vin)
            .orElseThrow(() -> new RuntimeException("Vehicle not found: " + vin));
        String vehicleType = determineVehicleType(vehicle);
        
        // Initialize maps if they don't exist for this vehicle type
        if (!vehicleTrips.containsKey(vehicleType)) {
            vehicleTrips.put(vehicleType, new ArrayList<>());
            currentTripIndex.put(vehicleType, 0);
            currentPathIndex.put(vehicleType, 0);
            lastUpdateTime.put(vehicleType, LocalDateTime.now());
            simulationSpeeds.put(vin, 1.0);
        }
        
        List<SimulationTripDTO> trips = vehicleTrips.get(vehicleType);
        if (trips.isEmpty()) {
            logger.info("No trips available for vehicle type: {}", vehicleType);
            return Collections.emptyList();
        }
        
        int tripIndex = currentTripIndex.get(vehicleType);
        if (tripIndex >= trips.size()) {
            logger.warn("Trip index {} out of bounds for vehicle type: {}", tripIndex, vehicleType);
            return Collections.emptyList();
        }
        
        SimulationTripDTO currentTrip = trips.get(tripIndex);
        if (currentTrip.getPath() == null || currentTrip.getPath().length == 0) {
            logger.warn("No path available for current trip of vehicle type: {}", vehicleType);
            return Collections.emptyList();
        }
        
        return Arrays.asList(currentTrip.getPath());
    }

    public Map<String, Object> getSimulationStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        // Vehicle type statistics
        Map<String, Integer> vehicleTypeCounts = new HashMap<>();
        vehicleTrips.keySet().forEach(type -> 
            vehicleTypeCounts.put(type, vehicleTrips.get(type).size()));
        stats.put("vehicleTypeCounts", vehicleTypeCounts);
        
        // Trip statistics
        Map<String, Object> tripStats = new HashMap<>();
        vehicleTrips.forEach((type, trips) -> {
            double totalDistance = trips.stream()
                .mapToDouble(SimulationTripDTO::getDistanceKm)
                .sum();
            double totalEnergy = trips.stream()
                .mapToDouble(SimulationTripDTO::getEnergyConsumedWh)
                .sum();
            
            Map<String, Double> typeStats = new HashMap<>();
            typeStats.put("totalDistance", totalDistance);
            typeStats.put("totalEnergy", totalEnergy);
            typeStats.put("avgEnergyPerKm", totalEnergy / totalDistance);
            
            tripStats.put(type, typeStats);
        });
        stats.put("tripStatistics", tripStats);
        
        return stats;
    }

    public void setSimulationSpeed(String vin, Double multiplier) {
        Vehicle vehicle = vehicleRepository.findByVin(vin)
            .orElseThrow(() -> new RuntimeException("Vehicle not found: " + vin));
        simulationSpeeds.put(vin, Math.max(0.1, Math.min(10.0, multiplier)));
    }

    public void resetSimulation() {
        vehicleTrips.keySet().forEach(type -> {
            currentTripIndex.put(type, 0);
            currentPathIndex.put(type, 0);
            lastUpdateTime.put(type, LocalDateTime.now());
        });
        simulationSpeeds.clear();
    }

    private SimulationDataDTO generateSimulationData(Vehicle vehicle, String vehicleType) {
        SimulationDataDTO data = new SimulationDataDTO();
        data.setVin(vehicle.getVin());
        data.setTimestamp(LocalDateTime.now());

        // Initialize maps if they don't exist for this vehicle type
        if (!vehicleTrips.containsKey(vehicleType)) {
            vehicleTrips.put(vehicleType, new ArrayList<>());
            currentTripIndex.put(vehicleType, 0);
            currentPathIndex.put(vehicleType, 0);
            lastUpdateTime.put(vehicleType, LocalDateTime.now());
            simulationSpeeds.put(vehicle.getVin(), 1.0);
        }

        List<SimulationTripDTO> trips = vehicleTrips.get(vehicleType);
        int tripIndex = currentTripIndex.get(vehicleType);
        int pathIndex = currentPathIndex.get(vehicleType);

        // If no trips exist, return basic vehicle data
        if (trips.isEmpty()) {
            data.setLatitude(vehicle.getLatitude());
            data.setLongitude(vehicle.getLongitude());
            data.setSpeed(vehicle.getCurrentSpeed());
            data.setBatteryLevel(vehicle.getCurrentBatteryLevel());
            data.setOdometer(vehicle.getOdometer());
            data.setState(vehicle.getCurrentState());
            data.setTrafficCondition("NORMAL");
            data.setRecommendation("NORMAL");
            return data;
        }

        if (tripIndex < trips.size()) {
            SimulationTripDTO currentTrip = trips.get(tripIndex);
            String[] path = currentTrip.getPath();

            if (pathIndex < path.length) {
                // Calculate position based on path progress
                double progress = (double) pathIndex / path.length;
                data.setLatitude(interpolate(
                    currentTrip.getStartPosition().getX(),
                    currentTrip.getEndPosition().getX(),
                    progress
                ));
                data.setLongitude(interpolate(
                    currentTrip.getStartPosition().getY(),
                    currentTrip.getEndPosition().getY(),
                    progress
                ));

                // Calculate speed based on distance and time
                double timeElapsed = java.time.Duration.between(
                    lastUpdateTime.get(vehicleType),
                    LocalDateTime.now()
                ).toSeconds();
                double speed = (currentTrip.getDistanceKm() / path.length) / (timeElapsed / 3600.0);
                data.setSpeed(speed);

                // Update battery level based on energy consumption
                double energyPerSegment = currentTrip.getEnergyConsumedWh() / path.length;
                data.setBatteryLevel(currentTrip.getSocPercentage() - (energyPerSegment * pathIndex / 100.0));

                // Update indices
                currentPathIndex.put(vehicleType, pathIndex + 1);
                if (pathIndex + 1 >= path.length) {
                    currentTripIndex.put(vehicleType, (tripIndex + 1) % trips.size());
                    currentPathIndex.put(vehicleType, 0);
                }
            }

            data.setOdometer(vehicle.getOdometer() + (currentTrip.getDistanceKm() * pathIndex / path.length));
            data.setState(vehicle.getCurrentState());
            data.setTrafficCondition(calculateTrafficCondition(data.getSpeed()));
            data.setRecommendation(generateRecommendation(data.getBatteryLevel(), data.getSpeed()));
        }

        lastUpdateTime.put(vehicleType, LocalDateTime.now());
        return data;
    }

    private double interpolate(double start, double end, double progress) {
        return start + (end - start) * progress;
    }

    private String calculateTrafficCondition(double speed) {
        if (speed < 20) return "CONGESTED";
        if (speed < 40) return "HEAVY";
        if (speed < 60) return "MODERATE";
        return "LIGHT";
    }

    private String generateRecommendation(Double batteryLevel, Double speed) {
        if (batteryLevel < 20) return "LOW_BATTERY_WARNING";
        if (speed > 100) return "SPEED_WARNING";
        return "NORMAL";
    }

    private String determineVehicleType(Vehicle vehicle) {
        // This is a simple mapping - you might want to make this more sophisticated
        if (vehicle.getModel().contains("SUV")) return "SUV électrique";
        if (vehicle.getModel().contains("Premium")) return "Véhicule électrique premium";
        if (vehicle.getModel().contains("Compact")) return "Véhicule électrique compact";
        return "Véhicule électrique urbain";
    }

    private void broadcastSimulationData(String vin, SimulationDataDTO data) {
        try {
            messagingTemplate.convertAndSend(SIMULATION_TOPIC + vin, data);
            logger.debug("Broadcasted simulation data for vehicle {}", vin);
        } catch (Exception e) {
            logger.error("Error broadcasting simulation data for vehicle {}: {}", vin, e.getMessage());
        }
    }

    public Map<String, Object> getVehicleSimulationData(String vin) {
        Vehicle vehicle = vehicleRepository.findByVin(vin)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        
        String vehicleType = vehicle.getModel();
        return simulationData.get(vehicleType);
    }

    public void updateVehicleStateFromSimulation(String vin) {
        Map<String, Object> vehicleData = getVehicleSimulationData(vin);
        // TODO: Implement state update logic based on simulation data
    }

    public void trackVehicleTrips(String vin) {
        Map<String, Object> vehicleData = getVehicleSimulationData(vin);
        // TODO: Implement trip tracking logic
    }

    public Vehicle createVehicle(String vin, String name, String make, String model, String type, double initialSoc) {
        Vehicle vehicle = new Vehicle();
        vehicle.setVin(vin);
        vehicle.setName(name);
        vehicle.setMake(make);
        vehicle.setModel(model);
        vehicle.setType(type);
        vehicle.setYear(2023); // Default year
        vehicle.setBatteryCapacity(75.0); // Default battery capacity in kWh
        vehicle.setCurrentBatteryLevel(initialSoc);
        vehicle.setEfficiency(0.2); // Default efficiency in kWh/km
        vehicle.setCurrentSpeed(0.0);
        vehicle.setLatitude(0.0); // Default coordinates
        vehicle.setLongitude(0.0);
        vehicle.setOdometer(0.0);
        vehicle.setCurrentState(Vehicle.VehicleState.AVAILABLE);
        vehicle.setLastChargedLevel(initialSoc);
        vehicle.setActive(true);
        vehicle.setInitialSoc(initialSoc);
        
        return vehicleRepository.save(vehicle);
    }
} 