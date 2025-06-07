package com.evfleet.controller;

import com.evfleet.dto.MaintenanceDTO;
import com.evfleet.service.MaintenanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    @Autowired
    public MaintenanceController(MaintenanceService maintenanceService) {
        this.maintenanceService = maintenanceService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STATION_MANAGER')")
    public ResponseEntity<MaintenanceDTO> scheduleMaintenance(@RequestBody MaintenanceDTO maintenanceDTO) {
        return ResponseEntity.ok(maintenanceService.scheduleMaintenance(maintenanceDTO));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STATION_MANAGER')")
    public ResponseEntity<MaintenanceDTO> updateMaintenanceStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(maintenanceService.updateMaintenanceStatus(id, status));
    }

    @GetMapping("/vehicle/{vin}/history")
    @PreAuthorize("hasRole('DRIVER') or hasRole('ADMIN') or hasRole('STATION_MANAGER')")
    public ResponseEntity<List<MaintenanceDTO>> getVehicleMaintenanceHistory(@PathVariable String vin) {
        return ResponseEntity.ok(maintenanceService.getVehicleMaintenanceHistory(vin));
    }

    @GetMapping("/vehicle/{vin}/upcoming")
    @PreAuthorize("hasRole('DRIVER') or hasRole('ADMIN') or hasRole('STATION_MANAGER')")
    public ResponseEntity<List<MaintenanceDTO>> getUpcomingMaintenance(@PathVariable String vin) {
        return ResponseEntity.ok(maintenanceService.getUpcomingMaintenance(vin));
    }

    @GetMapping("/overdue")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STATION_MANAGER')")
    public ResponseEntity<List<MaintenanceDTO>> getOverdueMaintenance() {
        return ResponseEntity.ok(maintenanceService.getOverdueMaintenance());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteMaintenance(@PathVariable Long id) {
        maintenanceService.deleteMaintenance(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('DRIVER') or hasRole('ADMIN') or hasRole('STATION_MANAGER')")
    public ResponseEntity<MaintenanceDTO> getMaintenanceDetails(@PathVariable Long id) {
        return ResponseEntity.ok(maintenanceService.getMaintenanceDetails(id));
    }
} 