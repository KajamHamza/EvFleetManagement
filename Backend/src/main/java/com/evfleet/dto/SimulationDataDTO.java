package com.evfleet.dto;

import com.evfleet.entity.Vehicle;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SimulationDataDTO {
    private String vin;
    private Vehicle.VehicleState state;
    private Double batteryLevel;
    private Double latitude;
    private Double longitude;
    private Double speed;
    private Double odometer;
    private LocalDateTime timestamp;
    private String trafficCondition;
    private String recommendation;
    private Long nearestChargingStationId;
    private Double distanceToNearestStation;
    private Double estimatedBatteryAtDestination;
} 