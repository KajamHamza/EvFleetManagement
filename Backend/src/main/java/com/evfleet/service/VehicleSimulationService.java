package com.evfleet.service;

import com.evfleet.dto.SimulationVehicleDTO;
import com.evfleet.dto.VehicleDTO;
import com.evfleet.entity.Vehicle;
import com.evfleet.repository.VehicleRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.ResourceUtils;

import java.io.File;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VehicleSimulationService {

    private final VehicleService vehicleService;
    private final VehicleRepository vehicleRepository;
    private final ObjectMapper objectMapper;

    @Autowired
    public VehicleSimulationService(VehicleService vehicleService, 
                                  VehicleRepository vehicleRepository,
                                  ObjectMapper objectMapper) {
        this.vehicleService = vehicleService;
        this.vehicleRepository = vehicleRepository;
        this.objectMapper = objectMapper;
    }

    public List<VehicleDTO> loadSimulationVehicles(String jsonFilePath) throws Exception {
        File file = ResourceUtils.getFile(jsonFilePath);
        List<SimulationVehicleDTO> simulationVehicles = objectMapper.readValue(file, 
            new TypeReference<List<SimulationVehicleDTO>>() {});

        return simulationVehicles.stream()
            .map(this::convertToVehicleDTO)
            .map(vehicleService::registerVehicle)
            .collect(Collectors.toList());
    }

    private VehicleDTO convertToVehicleDTO(SimulationVehicleDTO simVehicle) {
        VehicleDTO vehicleDTO = new VehicleDTO();
        vehicleDTO.setVin(simVehicle.getVin());
        vehicleDTO.setMake(simVehicle.getMake());
        vehicleDTO.setModel(simVehicle.getModel());
        vehicleDTO.setYear(simVehicle.getYear());
        vehicleDTO.setBatteryCapacity(simVehicle.getBatteryCapacity());
        vehicleDTO.setCurrentBatteryLevel(simVehicle.getCurrentBatteryLevel());
        vehicleDTO.setEfficiency(simVehicle.getEfficiency());
        vehicleDTO.setCurrentSpeed(simVehicle.getCurrentSpeed());
        vehicleDTO.setLatitude(simVehicle.getLatitude());
        vehicleDTO.setLongitude(simVehicle.getLongitude());
        vehicleDTO.setOdometer(simVehicle.getOdometer());
        vehicleDTO.setCurrentState(Vehicle.VehicleState.AVAILABLE);
        return vehicleDTO;
    }

    public boolean validateVIN(String vin) {
        // Basic VIN validation (17 characters, alphanumeric)
        if (vin == null || vin.length() != 17) {
            return false;
        }
        
        // Check if VIN contains only valid characters
        if (!vin.matches("^[A-HJ-NPR-Z0-9]{17}$")) {
            return false;
        }
        
        // Check if VIN is already registered
        return !vehicleRepository.existsByVin(vin);
    }
} 