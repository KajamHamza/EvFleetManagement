package com.evfleet.service;

import com.evfleet.entity.Vehicle;
import com.evfleet.entity.VehicleState;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class VehicleRecommendationService {

    private static final double CRITICAL_BATTERY_LEVEL = 20.0;
    private static final double WARNING_BATTERY_LEVEL = 30.0;
    private static final double HIGH_SPEED_THRESHOLD = 100.0; // km/h
    private static final double HIGH_TRAFFIC_SPEED_REDUCTION = 0.7; // 30% speed reduction in high traffic

    public Map<String, Object> generateRecommendations(Vehicle vehicle) {
        Map<String, Object> recommendations = new HashMap<>();

        // Battery level recommendations
        if (vehicle.getCurrentBatteryLevel() <= CRITICAL_BATTERY_LEVEL) {
            recommendations.put("batteryAlert", "CRITICAL");
            recommendations.put("batteryRecommendation", "IMMEDIATE_CHARGING");
        } else if (vehicle.getCurrentBatteryLevel() <= WARNING_BATTERY_LEVEL) {
            recommendations.put("batteryAlert", "WARNING");
            recommendations.put("batteryRecommendation", "PLAN_CHARGING");
        }

        // Speed recommendations
        if (vehicle.getCurrentSpeed() > HIGH_SPEED_THRESHOLD) {
            double recommendedSpeed = vehicle.getCurrentSpeed() * HIGH_TRAFFIC_SPEED_REDUCTION;
            recommendations.put("speedRecommendation", "REDUCE_SPEED");
            recommendations.put("recommendedSpeed", recommendedSpeed);
        }

        // Range estimation
        double remainingRange = calculateRemainingRange(vehicle);
        recommendations.put("estimatedRemainingRange", remainingRange);

        return recommendations;
    }

    private double calculateRemainingRange(Vehicle vehicle) {
        // Calculate remaining range based on current battery level and vehicle efficiency
        double availableEnergy = (vehicle.getCurrentBatteryLevel() / 100.0) * vehicle.getBatteryCapacity();
        return (availableEnergy / vehicle.getEfficiency()) * 100; // km
    }

    public String generateNotification(Vehicle vehicle) {
        StringBuilder notification = new StringBuilder();

        // Battery notifications
        if (vehicle.getCurrentBatteryLevel() <= CRITICAL_BATTERY_LEVEL) {
            notification.append("CRITICAL: Battery level at ")
                    .append(vehicle.getCurrentBatteryLevel())
                    .append("%. Immediate charging required.\n");
        } else if (vehicle.getCurrentBatteryLevel() <= WARNING_BATTERY_LEVEL) {
            notification.append("WARNING: Battery level at ")
                    .append(vehicle.getCurrentBatteryLevel())
                    .append("%. Plan charging soon.\n");
        }

        // Speed notifications
        if (vehicle.getCurrentSpeed() > HIGH_SPEED_THRESHOLD) {
            notification.append("High speed detected: ")
                    .append(vehicle.getCurrentSpeed())
                    .append(" km/h. Consider reducing speed for better efficiency.\n");
        }

        return notification.toString().trim();
    }
} 