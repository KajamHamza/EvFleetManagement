package com.evfleet.service;

import com.evfleet.dto.VehicleDTO;
import com.evfleet.dto.VehicleStateDTO;
import com.evfleet.entity.Vehicle;
import com.evfleet.entity.VehicleState;
import com.evfleet.entity.User;
import com.evfleet.repository.VehicleRepository;
import com.evfleet.repository.VehicleStateRepository;
import com.evfleet.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final VehicleStateRepository vehicleStateRepository;
    private final UserRepository userRepository;

    public VehicleService(VehicleRepository vehicleRepository, VehicleStateRepository vehicleStateRepository, UserRepository userRepository) {
        this.vehicleRepository = vehicleRepository;
        this.vehicleStateRepository = vehicleStateRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public VehicleDTO registerVehicle(VehicleDTO vehicleDTO) {
        if (vehicleRepository.existsByVin(vehicleDTO.getVin())) {
            throw new IllegalArgumentException("Vehicle with VIN " + vehicleDTO.getVin() + " already exists");
        }

        Vehicle vehicle = vehicleDTO.toEntity();
        vehicle.setCurrentState(Vehicle.VehicleState.AVAILABLE);
        vehicle = vehicleRepository.save(vehicle);

        // Create initial state record
        VehicleState state = new VehicleState();
        state.setVehicle(vehicle);
        state.setState(Vehicle.VehicleState.AVAILABLE);
        state.setTimestamp(LocalDateTime.now());
        state.setNotes("Initial state - Vehicle registered");
        state.setPositionX(vehicle.getLatitude());
        state.setPositionY(vehicle.getLongitude());
        state.setSocPercentage(vehicle.getCurrentBatteryLevel());
        vehicleStateRepository.save(state);

        return VehicleDTO.fromEntity(vehicle);
    }

    @Transactional(readOnly = true)
    public VehicleDTO getVehicle(Long id) {
        return vehicleRepository.findById(id)
                .map(VehicleDTO::fromEntity)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<VehicleDTO> getAllVehicles() {
        return vehicleRepository.findAll().stream()
                .map(VehicleDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public VehicleStateDTO updateVehicleState(Long vehicleId, VehicleStateDTO stateDTO) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found with id: " + vehicleId));

        VehicleState state = new VehicleState();
        state.setVehicle(vehicle);
        state.setState(stateDTO.getState());
        state.setTimestamp(stateDTO.getTimestamp());
        state.setNotes(stateDTO.getNotes());

        // Set the required fields from the vehicle's current position and battery
        state.setPositionX(vehicle.getLatitude());
        state.setPositionY(vehicle.getLongitude());
        state.setSocPercentage(vehicle.getCurrentBatteryLevel());

        state = vehicleStateRepository.save(state);

        // Update vehicle's current state
        vehicle.setCurrentState(state.getState());
        vehicleRepository.save(vehicle);

        return VehicleStateDTO.fromEntity(state);
    }

    @Transactional(readOnly = true)
    public List<VehicleStateDTO> getVehicleStateHistory(Long vehicleId, LocalDateTime start, LocalDateTime end) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found with id: " + vehicleId));

        return vehicleStateRepository.findByVehicleAndTimestampBetween(vehicle, start, end).stream()
                .map(VehicleStateDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VehicleStateDTO getCurrentVehicleState(Long vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found with id: " + vehicleId));

        return vehicleStateRepository.findFirstByVehicleOrderByTimestampDesc(vehicle)
                .map(VehicleStateDTO::fromEntity)
                .orElseThrow(() -> new EntityNotFoundException("No state history found for vehicle: " + vehicleId));
    }

    @Transactional
    public VehicleDTO assignVehicleToDriver(Long vehicleId, String username) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found with id: " + vehicleId));
                
        User driver = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found with username: " + username));
                
        // Check if user has DRIVER role
        if (driver.getRole() != User.UserRole.DRIVER) {
            throw new IllegalArgumentException("User must have DRIVER role to be assigned to a vehicle");
        }
        
        // Update vehicle with new driver
        vehicle.setDriver(driver);
        vehicle = vehicleRepository.save(vehicle);
        
        // Create a state change record
        VehicleState state = new VehicleState();
        state.setVehicle(vehicle);
        state.setState(vehicle.getCurrentState());
        state.setTimestamp(LocalDateTime.now());
        state.setNotes("Vehicle assigned to driver: " + username);
        state.setPositionX(vehicle.getLatitude());
        state.setPositionY(vehicle.getLongitude());
        state.setSocPercentage(vehicle.getCurrentBatteryLevel());
        vehicleStateRepository.save(state);
        
        return VehicleDTO.fromEntity(vehicle);
    }
    
    @Transactional
    public VehicleDTO unassignVehicle(Long vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found with id: " + vehicleId));
                
        // Check if vehicle is currently assigned
        if (vehicle.getDriver() == null) {
            throw new IllegalStateException("Vehicle is not currently assigned to any driver");
        }
        
        String previousDriver = vehicle.getDriver().getUsername();
        
        // Unassign the driver
        vehicle.setDriver(null);
        vehicle = vehicleRepository.save(vehicle);
        
        // Create a state change record
        VehicleState state = new VehicleState();
        state.setVehicle(vehicle);
        state.setState(vehicle.getCurrentState());
        state.setTimestamp(LocalDateTime.now());
        state.setNotes("Vehicle unassigned from driver: " + previousDriver);
        state.setPositionX(vehicle.getLatitude());
        state.setPositionY(vehicle.getLongitude());
        state.setSocPercentage(vehicle.getCurrentBatteryLevel());
        vehicleStateRepository.save(state);
        
        return VehicleDTO.fromEntity(vehicle);
    }
} 