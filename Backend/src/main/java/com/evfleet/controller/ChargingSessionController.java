package com.evfleet.controller;

import com.evfleet.dto.ChargingSessionDTO;
import com.evfleet.service.ChargingSessionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/charging-sessions")
public class ChargingSessionController {
    private final ChargingSessionService chargingSessionService;

    public ChargingSessionController(ChargingSessionService chargingSessionService) {
        this.chargingSessionService = chargingSessionService;
    }

    @PostMapping("/start")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ChargingSessionDTO> startSession(
            @RequestParam Long stationId,
            @RequestParam Long vehicleId,
            @RequestParam String connectorType) {
        return ResponseEntity.ok(chargingSessionService.startSession(stationId, vehicleId, connectorType));
    }

    @PostMapping("/{id}/end")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ChargingSessionDTO> endSession(@PathVariable Long id) {
        return ResponseEntity.ok(chargingSessionService.endSession(id));
    }

    @GetMapping("/vehicle/{vehicleId}")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<List<ChargingSessionDTO>> getVehicleSessions(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(chargingSessionService.getVehicleSessions(vehicleId));
    }

    @GetMapping("/station/{stationId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STATION_MANAGER')")
    public ResponseEntity<List<ChargingSessionDTO>> getStationSessions(@PathVariable Long stationId) {
        return ResponseEntity.ok(chargingSessionService.getStationSessions(stationId));
    }

    @GetMapping("/vehicle/{vehicleId}/active")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ChargingSessionDTO> getActiveSession(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(chargingSessionService.getActiveSession(vehicleId));
    }
} 