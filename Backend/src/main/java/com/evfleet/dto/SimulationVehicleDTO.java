package com.evfleet.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class SimulationVehicleDTO {
    @JsonProperty("vin")
    private String vin;

    @JsonProperty("make")
    private String make;

    @JsonProperty("model")
    private String model;

    @JsonProperty("year")
    private Integer year;

    @JsonProperty("battery_capacity")
    private Double batteryCapacity;

    @JsonProperty("current_battery_level")
    private Double currentBatteryLevel;

    @JsonProperty("efficiency")
    private Double efficiency;

    @JsonProperty("current_speed")
    private Double currentSpeed;

    @JsonProperty("latitude")
    private Double latitude;

    @JsonProperty("longitude")
    private Double longitude;

    @JsonProperty("odometer")
    private Double odometer;
} 