package com.evfleet.dto;

import com.evfleet.entity.Vehicle;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class VehicleDTO {
    private Long id;

    @NotBlank(message = "VIN is required")
    @Pattern(regexp = "^[A-HJ-NPR-Z0-9]{17}$", message = "Invalid VIN format")
    private String vin;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Make is required")
    private String make;

    @NotBlank(message = "Model is required")
    private String model;

    @NotNull(message = "Year is required")
    @Min(value = 1900, message = "Year must be after 1900")
    @Max(value = 2100, message = "Year must be before 2100")
    private Integer year;

    @NotNull(message = "Battery capacity is required")
    @Positive(message = "Battery capacity must be positive")
    private Double batteryCapacity;

    @NotNull(message = "Current battery level is required")
    @Min(value = 0, message = "Battery level must be at least 0")
    @Max(value = 100, message = "Battery level must be at most 100")
    private Double currentBatteryLevel;

    @NotNull(message = "Efficiency is required")
    @Positive(message = "Efficiency must be positive")
    private Double efficiency;

    @NotNull(message = "Current speed is required")
    @Min(value = 0, message = "Speed must be at least 0")
    private Double currentSpeed;

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;

    @NotNull(message = "Odometer is required")
    @Min(value = 0, message = "Odometer must be at least 0")
    private Double odometer;

    private Vehicle.VehicleState currentState;

    @NotNull(message = "Last charged level is required")
    @Min(value = 0, message = "Last charged level must be at least 0")
    @Max(value = 100, message = "Last charged level must be at most 100")
    private Double lastChargedLevel;

    private Boolean active;

    @NotNull(message = "Initial SOC is required")
    @Min(value = 0, message = "Initial SOC must be at least 0")
    @Max(value = 100, message = "Initial SOC must be at most 100")
    private Double initialSoc;

    private String type;
    
    // Driver information
    private Long driverId;
    private String driverUsername;
    private String driverName;

    public static VehicleDTO fromEntity(Vehicle vehicle) {
        VehicleDTO dto = new VehicleDTO();
        dto.setId(vehicle.getId());
        dto.setVin(vehicle.getVin());
        dto.setName(vehicle.getName());
        dto.setMake(vehicle.getMake());
        dto.setModel(vehicle.getModel());
        dto.setYear(vehicle.getYear());
        dto.setBatteryCapacity(vehicle.getBatteryCapacity());
        dto.setCurrentBatteryLevel(vehicle.getCurrentBatteryLevel());
        dto.setEfficiency(vehicle.getEfficiency());
        dto.setCurrentSpeed(vehicle.getCurrentSpeed());
        dto.setLatitude(vehicle.getLatitude());
        dto.setLongitude(vehicle.getLongitude());
        dto.setOdometer(vehicle.getOdometer());
        dto.setCurrentState(vehicle.getCurrentState());
        dto.setLastChargedLevel(vehicle.getLastChargedLevel());
        dto.setActive(vehicle.getActive());
        dto.setInitialSoc(vehicle.getInitialSoc());
        dto.setType(vehicle.getType());
        
        // Set driver information if available
        if (vehicle.getDriver() != null) {
            dto.setDriverId(vehicle.getDriver().getId());
            dto.setDriverUsername(vehicle.getDriver().getUsername());
            dto.setDriverName(vehicle.getDriver().getFirstName() + " " + vehicle.getDriver().getLastName());
        }
        
        return dto;
    }

    public Vehicle toEntity() {
        Vehicle vehicle = new Vehicle();
        vehicle.setVin(this.vin);
        vehicle.setName(this.name);
        vehicle.setMake(this.make);
        vehicle.setModel(this.model);
        vehicle.setYear(this.year);
        vehicle.setBatteryCapacity(this.batteryCapacity);
        vehicle.setCurrentBatteryLevel(this.currentBatteryLevel);
        vehicle.setEfficiency(this.efficiency);
        vehicle.setCurrentSpeed(this.currentSpeed);
        vehicle.setLatitude(this.latitude);
        vehicle.setLongitude(this.longitude);
        vehicle.setOdometer(this.odometer);
        vehicle.setCurrentState(this.currentState != null ? this.currentState : Vehicle.VehicleState.AVAILABLE);
        vehicle.setLastChargedLevel(this.lastChargedLevel != null ? this.lastChargedLevel : this.currentBatteryLevel);
        vehicle.setActive(this.active != null ? this.active : true);
        vehicle.setInitialSoc(this.initialSoc != null ? this.initialSoc : this.currentBatteryLevel);
        vehicle.setType(this.type);
        return vehicle;
    }
} 