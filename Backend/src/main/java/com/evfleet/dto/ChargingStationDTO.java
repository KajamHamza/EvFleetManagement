package com.evfleet.dto;

import com.evfleet.entity.ChargingStation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class ChargingStationDTO {
    private Long id;
    
    @NotBlank(message = "Station ID is required")
    private String stationId;
    
    @NotBlank(message = "Name is required")
    private String name;
    
    @NotBlank(message = "Address is required")
    private String address;
    
    @NotNull(message = "Latitude is required")
    private Double latitude;
    
    @NotNull(message = "Longitude is required")
    private Double longitude;
    
    @NotBlank(message = "Location is required")
    private String location;
    
    @NotNull(message = "Total connectors is required")
    @Positive(message = "Total connectors must be positive")
    private Integer totalConnectors;
    
    @NotNull(message = "Power rating is required")
    @Positive(message = "Power rating must be positive")
    private Double powerRating;
    
    @NotNull(message = "Price per kWh is required")
    @Positive(message = "Price per kWh must be positive")
    private Double pricePerKwh;
    
    private String operator;
    private String connectorTypes;
    private ChargingStation.StationStatus status;
    private Integer availableConnectors;
    private Boolean active;

    public static ChargingStationDTO fromEntity(ChargingStation station) {
        ChargingStationDTO dto = new ChargingStationDTO();
        dto.setId(station.getId());
        dto.setStationId(station.getStationId());
        dto.setName(station.getName());
        dto.setAddress(station.getAddress());
        dto.setLatitude(station.getLatitude());
        dto.setLongitude(station.getLongitude());
        dto.setLocation(station.getLocation());
        dto.setTotalConnectors(station.getTotalConnectors());
        dto.setAvailableConnectors(station.getAvailableConnectors());
        dto.setPowerRating(station.getPowerRating());
        dto.setPricePerKwh(station.getPricePerKwh());
        dto.setStatus(station.getStatus());
        dto.setOperator(station.getOperator());
        dto.setConnectorTypes(station.getConnectorTypes());
        dto.setActive(station.getActive());
        return dto;
    }

    public ChargingStation toEntity() {
        ChargingStation station = new ChargingStation();
        station.setStationId(this.stationId);
        station.setName(this.name);
        station.setAddress(this.address);
        station.setLatitude(this.latitude);
        station.setLongitude(this.longitude);
        station.setLocation(this.location);
        station.setTotalConnectors(this.totalConnectors);
        station.setAvailableConnectors(this.availableConnectors != null ? this.availableConnectors : this.totalConnectors);
        station.setPowerRating(this.powerRating);
        station.setPricePerKwh(this.pricePerKwh);
        station.setStatus(this.status);
        station.setOperator(this.operator);
        station.setConnectorTypes(this.connectorTypes);
        station.setActive(this.active != null ? this.active : true);
        return station;
    }
} 