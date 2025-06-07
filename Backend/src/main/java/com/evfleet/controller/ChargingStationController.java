package com.evfleet.controller;

import com.evfleet.dto.ChargingStationDTO;
import com.evfleet.entity.ChargingStation;
import com.evfleet.service.ChargingStationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/charging-stations")
public class ChargingStationController {
    private final ChargingStationService chargingStationService;

    public ChargingStationController(ChargingStationService chargingStationService) {
        this.chargingStationService = chargingStationService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STATION_MANAGER')")
    public ResponseEntity<ChargingStationDTO> createStation(@Valid @RequestBody ChargingStationDTO stationDTO) {
        return ResponseEntity.ok(chargingStationService.createStation(stationDTO));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChargingStationDTO> getStation(@PathVariable Long id) {
        return ResponseEntity.ok(chargingStationService.getStation(id));
    }

    @GetMapping
    public ResponseEntity<List<ChargingStationDTO>> getAllStations() {
        return ResponseEntity.ok(chargingStationService.getAllStations());
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<ChargingStationDTO>> getNearbyStations(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam(defaultValue = "10") double radius) {
        return ResponseEntity.ok(chargingStationService.getNearbyStations(latitude, longitude, radius));
    }

    @GetMapping("/available")
    public ResponseEntity<List<ChargingStationDTO>> getAvailableStations() {
        return ResponseEntity.ok(chargingStationService.getAvailableStations());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STATION_MANAGER')")
    public ResponseEntity<ChargingStationDTO> updateStation(
            @PathVariable Long id,
            @Valid @RequestBody ChargingStationDTO stationDTO) {
        return ResponseEntity.ok(chargingStationService.updateStation(id, stationDTO));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteStation(@PathVariable Long id) {
        chargingStationService.deleteStation(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STATION_MANAGER')")
    public ResponseEntity<ChargingStationDTO> updateStationStatus(
            @PathVariable Long id,
            @RequestParam ChargingStation.StationStatus status) {
        return ResponseEntity.ok(chargingStationService.updateStationStatus(id, status));
    }

    @PutMapping("/{id}/connectors")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STATION_MANAGER')")
    public ResponseEntity<ChargingStationDTO> updateAvailableConnectors(
            @PathVariable Long id,
            @RequestParam int availableConnectors) {
        return ResponseEntity.ok(chargingStationService.updateAvailableConnectors(id, availableConnectors));
    }
} 