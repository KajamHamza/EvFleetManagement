package com.evfleet.service;

import com.evfleet.dto.MaintenanceDTO;
import com.evfleet.entity.Maintenance;
import com.evfleet.entity.Vehicle;
import com.evfleet.repository.MaintenanceRepository;
import com.evfleet.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MaintenanceService {
    private final MaintenanceRepository maintenanceRepository;
    private final VehicleRepository vehicleRepository;

    @Autowired
    public MaintenanceService(MaintenanceRepository maintenanceRepository, VehicleRepository vehicleRepository) {
        this.maintenanceRepository = maintenanceRepository;
        this.vehicleRepository = vehicleRepository;
    }

    @Transactional
    public MaintenanceDTO scheduleMaintenance(MaintenanceDTO maintenanceDTO) {
        if (maintenanceDTO.getMaintenanceType() == null || maintenanceDTO.getMaintenanceType().trim().isEmpty()) {
            throw new IllegalArgumentException("Maintenance type is required");
        }

        Vehicle vehicle = vehicleRepository.findByVin(maintenanceDTO.getVehicleVin())
            .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        Maintenance maintenance = maintenanceDTO.toEntity();
        maintenance.setVehicle(vehicle);
        maintenance.setStatus("SCHEDULED");

        Maintenance savedMaintenance = maintenanceRepository.save(maintenance);
        return MaintenanceDTO.fromEntity(savedMaintenance);
    }

    @Transactional
    public MaintenanceDTO updateMaintenanceStatus(Long id, String status) {
        Maintenance maintenance = maintenanceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Maintenance record not found"));

        maintenance.setStatus(status);
        if ("COMPLETED".equals(status)) {
            maintenance.setCompletedDate(LocalDateTime.now());
        }

        Maintenance updatedMaintenance = maintenanceRepository.save(maintenance);
        return MaintenanceDTO.fromEntity(updatedMaintenance);
    }

    public List<MaintenanceDTO> getVehicleMaintenanceHistory(String vin) {
        Vehicle vehicle = vehicleRepository.findByVin(vin)
            .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        return maintenanceRepository.findByVehicle(vehicle).stream()
            .map(MaintenanceDTO::fromEntity)
            .collect(Collectors.toList());
    }

    public List<MaintenanceDTO> getUpcomingMaintenance(String vin) {
        Vehicle vehicle = vehicleRepository.findByVin(vin)
            .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime nextMonth = now.plusMonths(1);

        return maintenanceRepository.findByVehicleAndScheduledDateBetween(vehicle, now, nextMonth).stream()
            .map(MaintenanceDTO::fromEntity)
            .collect(Collectors.toList());
    }

    public List<MaintenanceDTO> getOverdueMaintenance() {
        LocalDateTime now = LocalDateTime.now();
        return maintenanceRepository.findByStatusAndScheduledDateBefore("SCHEDULED", now).stream()
            .map(MaintenanceDTO::fromEntity)
            .collect(Collectors.toList());
    }

    @Transactional
    public void deleteMaintenance(Long id) {
        if (!maintenanceRepository.existsById(id)) {
            throw new RuntimeException("Maintenance record not found");
        }
        maintenanceRepository.deleteById(id);
    }

    public MaintenanceDTO getMaintenanceDetails(Long id) {
        return maintenanceRepository.findById(id)
            .map(MaintenanceDTO::fromEntity)
            .orElseThrow(() -> new RuntimeException("Maintenance record not found"));
    }
} 