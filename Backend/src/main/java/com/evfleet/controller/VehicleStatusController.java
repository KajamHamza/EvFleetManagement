package com.evfleet.controller;

import com.evfleet.entity.Vehicle;
import com.evfleet.service.VehicleStatusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vehicles/status")
public class VehicleStatusController {

    private final VehicleStatusService vehicleStatusService;

    @Autowired
    public VehicleStatusController(VehicleStatusService vehicleStatusService) {
        this.vehicleStatusService = vehicleStatusService;
    }

    @GetMapping("/{vin}/connected")
    public ResponseEntity<Boolean> isVehicleConnected(
            @PathVariable String vin,
            Authentication authentication) {
        String username = authentication.getName();
        boolean isConnected = vehicleStatusService.isVehicleConnectedToDriver(vin, username);
        return ResponseEntity.ok(isConnected);
    }

    @GetMapping("/{vin}/current")
    public ResponseEntity<Vehicle.VehicleState> getCurrentState(@PathVariable String vin) {
        Vehicle.VehicleState state = vehicleStatusService.getCurrentVehicleState(vin);
        return ResponseEntity.ok(state);
    }

    @PostMapping("/{vin}/update")
    public ResponseEntity<Void> updateState(
            @PathVariable String vin,
            @RequestParam Vehicle.VehicleState newState) {
        vehicleStatusService.updateVehicleStatus(vin, newState);
        return ResponseEntity.ok().build();
    }
} 