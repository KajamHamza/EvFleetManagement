package com.evfleet.controller;

import com.evfleet.dto.SimulationTripDTO;
import com.evfleet.dto.VehicleDTO;
import com.evfleet.service.SimulationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/simulation")
public class SimulationController {

    private final SimulationService simulationService;

    @Autowired
    public SimulationController(SimulationService simulationService) {
        this.simulationService = simulationService;
    }

    @PostMapping("/start")
    @PreAuthorize("hasRole('DRIVER') or hasRole('ADMIN') or hasRole('STATION_MANAGER')")
    public ResponseEntity<Map<String, Object>> startSimulation(@RequestBody VehicleDTO vehicleData) {
        try {
            // Initialize simulation for the vehicle
            simulationService.resetSimulation();
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Simulation started successfully",
                "vin", vehicleData.getVin()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Failed to start simulation: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/stop")
    @PreAuthorize("hasRole('DRIVER') or hasRole('ADMIN') or hasRole('STATION_MANAGER')")
    public ResponseEntity<Map<String, Object>> stopSimulation() {
        try {
            // Reset simulation to stop updates
            simulationService.resetSimulation();
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Simulation stopped successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Failed to stop simulation: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/statistics")
    @PreAuthorize("hasRole('DRIVER') or hasRole('ADMIN') or hasRole('STATION_MANAGER')")
    public ResponseEntity<Map<String, Object>> getSimulationStatistics() {
        return ResponseEntity.ok(simulationService.getSimulationStatistics());
    }

    @GetMapping("/vehicles/{vin}/trips")
    @PreAuthorize("hasRole('DRIVER') or hasRole('ADMIN') or hasRole('STATION_MANAGER')")
    public ResponseEntity<List<SimulationTripDTO>> getVehicleTrips(@PathVariable String vin) {
        return ResponseEntity.ok(simulationService.getVehicleTrips(vin, null));
    }

    @GetMapping("/vehicles/{vin}/current-position")
    @PreAuthorize("hasRole('DRIVER') or hasRole('ADMIN') or hasRole('STATION_MANAGER')")
    public ResponseEntity<SimulationTripDTO> getCurrentPosition(@PathVariable String vin) {
        return ResponseEntity.ok(simulationService.getCurrentPosition(vin));
    }

    @PostMapping("/vehicles/{vin}/speed")
    @PreAuthorize("hasRole('DRIVER') or hasRole('ADMIN') or hasRole('STATION_MANAGER')")
    public ResponseEntity<Map<String, Object>> setSimulationSpeed(
            @PathVariable String vin, 
            @RequestParam Double multiplier) {
        try {
            simulationService.setSimulationSpeed(vin, multiplier);
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Simulation speed updated",
                "vin", vin,
                "speedMultiplier", multiplier
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Failed to set simulation speed: " + e.getMessage()
            ));
        }
    }
} 