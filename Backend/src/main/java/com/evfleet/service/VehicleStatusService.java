package com.evfleet.service;

import com.evfleet.entity.Vehicle;
import com.evfleet.entity.VehicleState;
import com.evfleet.repository.VehicleRepository;
import com.evfleet.repository.VehicleStateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class VehicleStatusService {
    private static final Logger logger = LoggerFactory.getLogger(VehicleStatusService.class);
    private static final String VEHICLE_STATUS_TOPIC = "/topic/vehicle-status/";

    private final VehicleRepository vehicleRepository;
    private final VehicleStateRepository vehicleStateRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public VehicleStatusService(VehicleRepository vehicleRepository,
                              VehicleStateRepository vehicleStateRepository,
                              SimpMessagingTemplate messagingTemplate) {
        this.vehicleRepository = vehicleRepository;
        this.vehicleStateRepository = vehicleStateRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public void updateVehicleStatus(String vin, Vehicle.VehicleState newState) {
        try {
            Optional<Vehicle> vehicleOpt = vehicleRepository.findByVin(vin);
            if (vehicleOpt.isEmpty()) {
                logger.warn("Vehicle with VIN {} not found", vin);
                return;
            }

            Vehicle vehicle = vehicleOpt.get();
            Vehicle.VehicleState currentState = vehicle.getCurrentState();

            if (currentState != newState) {
                // Create new state record
                VehicleState state = new VehicleState();
                state.setVehicle(vehicle);
                state.setState(newState);
                state.setTimestamp(LocalDateTime.now());
                state.setNotes("State changed from " + currentState + " to " + newState);
                vehicleStateRepository.save(state);

                // Update vehicle's current state
                vehicle.setCurrentState(newState);
                vehicleRepository.save(vehicle);

                // Broadcast status update
                broadcastVehicleStatus(vin, newState);
                logger.info("Vehicle {} state updated from {} to {}", vin, currentState, newState);
            }
        } catch (Exception e) {
            logger.error("Error updating vehicle status for VIN {}: {}", vin, e.getMessage());
            throw new RuntimeException("Failed to update vehicle status", e);
        }
    }

    public boolean isVehicleConnectedToDriver(String vin, String username) {
        return vehicleRepository.existsByVinAndDriverUsername(vin, username);
    }

    private void broadcastVehicleStatus(String vin, Vehicle.VehicleState state) {
        try {
            messagingTemplate.convertAndSend(VEHICLE_STATUS_TOPIC + vin, state);
        } catch (Exception e) {
            logger.error("Error broadcasting vehicle status for VIN {}: {}", vin, e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Vehicle.VehicleState getCurrentVehicleState(String vin) {
        return vehicleRepository.findByVin(vin)
                .map(Vehicle::getCurrentState)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
    }
} 