package com.evfleet.dto;

import com.evfleet.entity.ChargingSession;
import com.evfleet.entity.ChargingStation;
import com.evfleet.entity.Vehicle;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ChargingSessionDTO {
    private Long id;
    private Long stationId;
    private String stationName;
    private Long vehicleId;
    private String vehicleVin;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Double energyDelivered;
    private Double cost;
    private ChargingSession.SessionStatus status;
    private String connectorType;
    private Double initialBatteryLevel;
    private Double finalBatteryLevel;
    private Double initialSoc;

    public static ChargingSessionDTO fromEntity(ChargingSession session) {
        ChargingSessionDTO dto = new ChargingSessionDTO();
        dto.setId(session.getId());
        dto.setStationId(session.getChargingStation().getId());
        dto.setStationName(session.getChargingStation().getName());
        dto.setVehicleId(session.getVehicle().getId());
        dto.setVehicleVin(session.getVehicle().getVin());
        dto.setStartTime(session.getStartTime());
        dto.setEndTime(session.getEndTime());
        dto.setEnergyDelivered(session.getEnergyDelivered());
        dto.setCost(session.getCost());
        dto.setStatus(session.getStatus());
        dto.setConnectorType(session.getConnectorType());
        dto.setInitialBatteryLevel(session.getInitialBatteryLevel());
        dto.setFinalBatteryLevel(session.getFinalBatteryLevel());
        dto.setInitialSoc(session.getInitialSoc());
        return dto;
    }

    public ChargingSession toEntity() {
        ChargingSession session = new ChargingSession();
        session.setStartTime(this.startTime);
        session.setEndTime(this.endTime);
        session.setEnergyDelivered(this.energyDelivered);
        session.setCost(this.cost);
        session.setStatus(this.status);
        session.setConnectorType(this.connectorType);
        session.setInitialBatteryLevel(this.initialBatteryLevel);
        session.setFinalBatteryLevel(this.finalBatteryLevel);
        session.setInitialSoc(this.initialSoc);
        
        // Set the charging station relationship
        if (this.stationId != null) {
            ChargingStation station = new ChargingStation();
            station.setId(this.stationId);
            session.setChargingStation(station);
        }
        
        // Set the vehicle relationship
        if (this.vehicleId != null) {
            Vehicle vehicle = new Vehicle();
            vehicle.setId(this.vehicleId);
            session.setVehicle(vehicle);
        }
        
        return session;
    }
} 