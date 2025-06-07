package com.evfleet.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SimulationTripDTO {
    private LocalDateTime timestamp;
    private String fromLocation;
    private String toLocation;
    private Double distanceKm;
    private Double energyConsumedWh;
    private Double socPercentage;
    private PositionDTO startPosition;
    private PositionDTO endPosition;
    private String[] path;

    @Data
    public static class PositionDTO {
        private Double x;
        private Double y;
    }
} 