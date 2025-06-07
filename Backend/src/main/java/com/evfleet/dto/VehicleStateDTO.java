package com.evfleet.dto;

import com.evfleet.entity.Vehicle;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class VehicleStateDTO {
    private Long id;
    private Long vehicleId;

    @NotNull(message = "State is required")
    private Vehicle.VehicleState state;

    @NotNull(message = "Timestamp is required")
    private LocalDateTime timestamp;

    private String notes;
    
    private Double positionX;
    private Double positionY;
    private Double socPercentage;

    public static VehicleStateDTO fromEntity(com.evfleet.entity.VehicleState state) {
        VehicleStateDTO dto = new VehicleStateDTO();
        dto.setId(state.getId());
        dto.setVehicleId(state.getVehicle().getId());
        dto.setState(state.getState());
        dto.setTimestamp(state.getTimestamp());
        dto.setNotes(state.getNotes());
        dto.setPositionX(state.getPositionX());
        dto.setPositionY(state.getPositionY());
        dto.setSocPercentage(state.getSocPercentage());
        return dto;
    }

    public com.evfleet.entity.VehicleState toEntity() {
        com.evfleet.entity.VehicleState state = new com.evfleet.entity.VehicleState();
        state.setId(this.id);
        state.setState(this.state);
        state.setTimestamp(this.timestamp);
        state.setNotes(this.notes);
        if (this.positionX != null) {
            state.setPositionX(this.positionX);
        }
        if (this.positionY != null) {
            state.setPositionY(this.positionY);
        }
        if (this.socPercentage != null) {
            state.setSocPercentage(this.socPercentage);
        }
        return state;
    }
} 