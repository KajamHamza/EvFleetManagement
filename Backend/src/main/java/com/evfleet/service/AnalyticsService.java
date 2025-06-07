package com.evfleet.service;

import com.evfleet.entity.Vehicle;
import com.evfleet.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

@Service
public class AnalyticsService {
    private final VehicleRepository vehicleRepository;

    @Autowired
    public AnalyticsService(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    public Map<String, Object> getVehiclePerformanceMetrics(String vin) {
        Vehicle vehicle = vehicleRepository.findByVin(vin)
            .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        Map<String, Object> metrics = new HashMap<>();
        
        // Calculate average speed
        double totalDistance = vehicle.getOdometer();
        long totalHours = ChronoUnit.HOURS.between(vehicle.getCreatedAt(), LocalDateTime.now());
        double averageSpeed = totalHours > 0 ? totalDistance / totalHours : 0;
        metrics.put("averageSpeed", averageSpeed);

        // Calculate energy efficiency
        double totalEnergyConsumed = vehicle.getTotalEnergyConsumed();
        double energyEfficiency = totalDistance > 0 ? totalEnergyConsumed / totalDistance : 0;
        metrics.put("energyEfficiency", energyEfficiency);

        // Calculate battery health
        double batteryHealth = (vehicle.getCurrentBatteryLevel() / vehicle.getBatteryCapacity()) * 100;
        metrics.put("batteryHealth", batteryHealth);

        // Calculate utilization rate
        long totalDays = ChronoUnit.DAYS.between(vehicle.getCreatedAt(), LocalDateTime.now());
        double utilizationRate = totalDays > 0 ? (vehicle.getTotalOperatingHours() / (totalDays * 24.0)) * 100 : 0;
        metrics.put("utilizationRate", utilizationRate);

        return metrics;
    }

    public Map<String, Object> getEnergyEfficiencyAnalysis(String vin) {
        Vehicle vehicle = vehicleRepository.findByVin(vin)
            .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        Map<String, Object> analysis = new HashMap<>();

        // Calculate energy consumption per kilometer
        double energyPerKm = vehicle.getTotalEnergyConsumed() / vehicle.getOdometer();
        analysis.put("energyPerKm", energyPerKm);

        // Calculate charging efficiency
        double chargingEfficiency = (vehicle.getTotalEnergyCharged() / vehicle.getTotalEnergyConsumed()) * 100;
        analysis.put("chargingEfficiency", chargingEfficiency);

        // Calculate regenerative braking efficiency
        double regenEfficiency = (vehicle.getRegenerativeEnergy() / vehicle.getTotalEnergyConsumed()) * 100;
        analysis.put("regenerativeEfficiency", regenEfficiency);

        // Calculate battery degradation
        double batteryDegradation = 100 - ((vehicle.getCurrentBatteryLevel() / vehicle.getBatteryCapacity()) * 100);
        analysis.put("batteryDegradation", batteryDegradation);

        return analysis;
    }

    public Map<String, Object> getPredictiveMaintenance(String vin) {
        Vehicle vehicle = vehicleRepository.findByVin(vin)
            .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        Map<String, Object> predictions = new HashMap<>();

        // Predict battery replacement
        double batteryHealth = (vehicle.getCurrentBatteryLevel() / vehicle.getBatteryCapacity()) * 100;
        if (batteryHealth < 80) {
            predictions.put("batteryReplacement", "Recommended within next 3 months");
        }

        // Predict maintenance based on usage
        double averageDailyDistance = vehicle.getOdometer() / 
            ChronoUnit.DAYS.between(vehicle.getCreatedAt(), LocalDateTime.now());
        if (averageDailyDistance > 200) {
            predictions.put("tireReplacement", "Recommended within next month");
        }

        // Predict component wear
        double utilizationRate = (vehicle.getTotalOperatingHours() / 
            (ChronoUnit.DAYS.between(vehicle.getCreatedAt(), LocalDateTime.now()) * 24.0)) * 100;
        if (utilizationRate > 70) {
            predictions.put("brakeSystemCheck", "Recommended within next 2 weeks");
        }

        return predictions;
    }
} 