package com.evfleet.controller;

import com.evfleet.dto.VehicleDTO;
import com.evfleet.service.VehicleSimulationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/simulation/vehicles")
public class VehicleSimulationController {

    private final VehicleSimulationService vehicleSimulationService;

    @Autowired
    public VehicleSimulationController(VehicleSimulationService vehicleSimulationService) {
        this.vehicleSimulationService = vehicleSimulationService;
    }

    @PostMapping("/load")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DRIVER')")
    public ResponseEntity<List<VehicleDTO>> loadSimulationVehicles(@RequestParam String jsonFilePath) {
        try {
            List<VehicleDTO> vehicles = vehicleSimulationService.loadSimulationVehicles(jsonFilePath);
            return ResponseEntity.ok(vehicles);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/validate-vin/{vin}")
    @PreAuthorize("hasRole('DRIVER') or hasRole('ADMIN') or hasRole('STATION_MANAGER')")
    public ResponseEntity<Boolean> validateVIN(@PathVariable String vin) {
        boolean isValid = vehicleSimulationService.validateVIN(vin);
        return ResponseEntity.ok(isValid);
    }
} 