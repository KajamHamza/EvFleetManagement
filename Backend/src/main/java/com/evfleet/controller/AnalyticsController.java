package com.evfleet.controller;

import com.evfleet.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @Autowired
    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/vehicles/{vin}/performance")
    public ResponseEntity<Map<String, Object>> getVehiclePerformanceMetrics(@PathVariable String vin) {
        return ResponseEntity.ok(analyticsService.getVehiclePerformanceMetrics(vin));
    }

    @GetMapping("/vehicles/{vin}/energy-efficiency")
    public ResponseEntity<Map<String, Object>> getEnergyEfficiencyAnalysis(@PathVariable String vin) {
        return ResponseEntity.ok(analyticsService.getEnergyEfficiencyAnalysis(vin));
    }

    @GetMapping("/vehicles/{vin}/predictive-maintenance")
    public ResponseEntity<Map<String, Object>> getPredictiveMaintenance(@PathVariable String vin) {
        return ResponseEntity.ok(analyticsService.getPredictiveMaintenance(vin));
    }
} 