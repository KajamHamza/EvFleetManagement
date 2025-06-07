package com.evfleet.controller;

import com.evfleet.dto.VehicleDTO;
import com.evfleet.dto.VehicleStateDTO;
import com.evfleet.service.VehicleService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @PostMapping
    public ResponseEntity<VehicleDTO> registerVehicle(@Valid @RequestBody VehicleDTO vehicleDTO) {
        return ResponseEntity.ok(vehicleService.registerVehicle(vehicleDTO));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleDTO> getVehicle(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.getVehicle(id));
    }

    @GetMapping
    public ResponseEntity<List<VehicleDTO>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    @PostMapping("/{id}/states")
    public ResponseEntity<VehicleStateDTO> updateVehicleState(
            @PathVariable Long id,
            @Valid @RequestBody VehicleStateDTO stateDTO) {
        return ResponseEntity.ok(vehicleService.updateVehicleState(id, stateDTO));
    }

    @GetMapping("/{id}/state/history")
    public ResponseEntity<List<VehicleStateDTO>> getVehicleStateHistory(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(vehicleService.getVehicleStateHistory(id, start, end));
    }

    @GetMapping("/{id}/state/current")
    public ResponseEntity<VehicleStateDTO> getCurrentVehicleState(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.getCurrentVehicleState(id));
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VehicleDTO> assignVehicleToDriver(
            @PathVariable Long id,
            @RequestParam String username) {
        return ResponseEntity.ok(vehicleService.assignVehicleToDriver(id, username));
    }

    @PostMapping("/{id}/unassign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VehicleDTO> unassignVehicle(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.unassignVehicle(id));
    }
} 