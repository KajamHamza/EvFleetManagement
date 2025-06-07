package com.evfleet.service;

import com.evfleet.dto.ChargingSessionDTO;
import com.evfleet.entity.ChargingSession;
import com.evfleet.entity.ChargingStation;
import com.evfleet.entity.Vehicle;
import com.evfleet.repository.ChargingSessionRepository;
import com.evfleet.repository.ChargingStationRepository;
import com.evfleet.repository.VehicleRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChargingSessionService {
    private final ChargingSessionRepository chargingSessionRepository;
    private final ChargingStationRepository chargingStationRepository;
    private final VehicleRepository vehicleRepository;

    public ChargingSessionService(ChargingSessionRepository chargingSessionRepository,
                                ChargingStationRepository chargingStationRepository,
                                VehicleRepository vehicleRepository) {
        this.chargingSessionRepository = chargingSessionRepository;
        this.chargingStationRepository = chargingStationRepository;
        this.vehicleRepository = vehicleRepository;
    }

    @Transactional
    public ChargingSessionDTO startSession(Long stationId, Long vehicleId, String connectorType) {
        ChargingStation station = chargingStationRepository.findById(stationId)
                .orElseThrow(() -> new EntityNotFoundException("Charging station not found"));
        
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found"));

        if (station.getAvailableConnectors() <= 0) {
            throw new IllegalStateException("No available connectors at this station");
        }

        if (chargingSessionRepository.findActiveSessionByVehicle(vehicle) != null) {
            throw new IllegalStateException("Vehicle is already in a charging session");
        }

        // Create new charging session
        ChargingSession session = new ChargingSession();
        session.setChargingStation(station);
        session.setVehicle(vehicle);
        session.setStartTime(LocalDateTime.now());
        session.setStatus(ChargingSession.SessionStatus.IN_PROGRESS);
        session.setConnectorType(connectorType);
        session.setInitialBatteryLevel(vehicle.getCurrentBatteryLevel());
        session.setInitialSoc(vehicle.getCurrentBatteryLevel());
        session.setActive(true);

        // Update station's available connectors
        station.setAvailableConnectors(station.getAvailableConnectors() - 1);
        chargingStationRepository.save(station);

        // Save the session first to get the ID
        session = chargingSessionRepository.save(session);
        
        // Update the station's charging sessions list
        station.getChargingSessions().add(session);
        chargingStationRepository.save(station);
        
        return ChargingSessionDTO.fromEntity(session);
    }

    @Transactional
    public ChargingSessionDTO endSession(Long sessionId) {
        ChargingSession session = chargingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Charging session not found"));

        if (session.getStatus() != ChargingSession.SessionStatus.IN_PROGRESS) {
            throw new IllegalStateException("Session is not in progress");
        }

        // Calculate charging duration in hours
        LocalDateTime endTime = LocalDateTime.now();
        long durationMinutes = java.time.Duration.between(session.getStartTime(), endTime).toMinutes();
        double durationHours = durationMinutes / 60.0;

        // Calculate energy delivered based on charging station power rating and duration
        double powerRating = session.getChargingStation().getPowerRating(); // in kW
        double energyDelivered = powerRating * durationHours; // in kWh

        // Calculate new battery level
        double batteryCapacity = session.getVehicle().getBatteryCapacity(); // in kWh
        double initialLevel = session.getInitialBatteryLevel();
        double energyIncrease = (energyDelivered / batteryCapacity) * 100; // percentage increase
        double newBatteryLevel = Math.min(100.0, initialLevel + energyIncrease);

        // Update vehicle's battery level
        Vehicle vehicle = session.getVehicle();
        vehicle.setCurrentBatteryLevel(newBatteryLevel);
        vehicle.setLastChargedLevel(newBatteryLevel);
        vehicle.setLastChargedTime(endTime);
        vehicle.setCurrentState(Vehicle.VehicleState.AVAILABLE);
        vehicleRepository.save(vehicle);

        // Update session details
        session.setEndTime(endTime);
        session.setStatus(ChargingSession.SessionStatus.COMPLETED);
        session.setFinalBatteryLevel(newBatteryLevel);
        session.setEnergyDelivered(energyDelivered);
        session.setCost(calculateCost(session.getChargingStation().getPricePerKwh(), energyDelivered));

        // Update station's available connectors
        ChargingStation station = session.getChargingStation();
        station.setAvailableConnectors(station.getAvailableConnectors() + 1);
        chargingStationRepository.save(station);

        session = chargingSessionRepository.save(session);
        return ChargingSessionDTO.fromEntity(session);
    }

    @Transactional(readOnly = true)
    public List<ChargingSessionDTO> getVehicleSessions(Long vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found"));
        
        return chargingSessionRepository.findByVehicle(vehicle).stream()
                .map(ChargingSessionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChargingSessionDTO> getStationSessions(Long stationId) {
        return chargingSessionRepository.findByChargingStationId(stationId).stream()
                .map(ChargingSessionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ChargingSessionDTO getActiveSession(Long vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found"));
        
        ChargingSession session = chargingSessionRepository.findActiveSessionByVehicle(vehicle);
        if (session == null) {
            throw new EntityNotFoundException("No active charging session found");
        }
        return ChargingSessionDTO.fromEntity(session);
    }

    private double calculateEnergyDelivered(ChargingSession session) {
        // This is a simplified calculation. In a real system, you would get this data from the charging station
        double batteryCapacity = session.getVehicle().getBatteryCapacity();
        double initialLevel = session.getInitialBatteryLevel();
        double finalLevel = session.getFinalBatteryLevel();
        return batteryCapacity * (finalLevel - initialLevel) / 100.0;
    }

    private double calculateCost(double pricePerKwh, double energyDelivered) {
        return pricePerKwh * energyDelivered;
    }
} 