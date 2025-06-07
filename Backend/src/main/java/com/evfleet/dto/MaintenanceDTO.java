package com.evfleet.dto;

import lombok.Data;
import java.time.LocalDateTime;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class MaintenanceDTO {
    private Long id;
    private String vehicleVin;
    
    @NotBlank(message = "Maintenance type is required")
    private String maintenanceType;
    
    @NotBlank(message = "Description is required")
    private String description;
    
    @NotNull(message = "Scheduled date is required")
    private LocalDateTime scheduledDate;
    
    private LocalDateTime completedDate;
    private String status;
    private Double cost;
    private String serviceProvider;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MaintenanceDTO fromEntity(com.evfleet.entity.Maintenance maintenance) {
        MaintenanceDTO dto = new MaintenanceDTO();
        dto.setId(maintenance.getId());
        dto.setVehicleVin(maintenance.getVehicle().getVin());
        dto.setMaintenanceType(maintenance.getType());
        dto.setDescription(maintenance.getDescription());
        dto.setScheduledDate(maintenance.getScheduledDate());
        dto.setCompletedDate(maintenance.getCompletedDate());
        dto.setStatus(maintenance.getStatus());
        dto.setCost(maintenance.getCost());
        dto.setServiceProvider(maintenance.getServiceProvider());
        dto.setNotes(maintenance.getNotes());
        dto.setCreatedAt(maintenance.getCreatedAt());
        dto.setUpdatedAt(maintenance.getUpdatedAt());
        return dto;
    }

    public com.evfleet.entity.Maintenance toEntity() {
        com.evfleet.entity.Maintenance maintenance = new com.evfleet.entity.Maintenance();
        maintenance.setType(this.maintenanceType);
        maintenance.setDescription(this.description);
        maintenance.setScheduledDate(this.scheduledDate);
        maintenance.setCompletedDate(this.completedDate);
        maintenance.setStatus(this.status);
        maintenance.setCost(this.cost);
        maintenance.setServiceProvider(this.serviceProvider);
        maintenance.setNotes(this.notes);
        return maintenance;
    }
} 