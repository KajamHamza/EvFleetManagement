package com.evfleet.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@Entity
@Table(name = "vehicles")
@EntityListeners(AuditingEntityListener.class)
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String vin; // Vehicle Identification Number

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String make;

    @Column(nullable = false)
    private String model;

    @Column(nullable = false)
    private Integer year;

    @Column(nullable = false)
    private Double batteryCapacity; // in kWh

    @Column(nullable = false)
    private Double currentBatteryLevel; // in percentage

    @Column(nullable = false)
    private Double efficiency; // kWh per 100km

    @Column(nullable = false)
    private Double currentSpeed; // in km/h

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false)
    private Double odometer; // in km

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private User driver;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleState currentState;

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL)
    private List<com.evfleet.entity.VehicleState> stateHistory;

    @Column(nullable = false)
    private Double lastChargedLevel; // in percentage

    @Column
    private LocalDateTime lastChargedTime;

    @Column
    private LocalDateTime lastMaintenanceDate;

    @Column
    private Double nextMaintenanceOdometer;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    private Double currentLatitude;
    private Double currentLongitude;

    // New fields for analytics
    @Column
    private Double totalEnergyConsumed;

    @Column
    private Double totalEnergyCharged;

    @Column
    private Double regenerativeEnergy;

    @Column
    private Double totalOperatingHours;

    @Column(nullable = false)
    private Boolean active;

    @Column(name = "initial_soc", nullable = false)
    private Double initialSoc;

    @Column
    private String type;

    @Column
    private Double currentSoc;

    @Column
    private LocalDateTime lastUpdated;

    public enum VehicleState {
        AVAILABLE,
        IN_USE,
        CHARGING,
        MAINTENANCE,
        OUT_OF_SERVICE
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        currentState = VehicleState.AVAILABLE;
        totalEnergyConsumed = 0.0;
        totalEnergyCharged = 0.0;
        regenerativeEnergy = 0.0;
        totalOperatingHours = 0.0;
        active = true;
        initialSoc = currentBatteryLevel;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and setters for new fields
    public Double getTotalEnergyConsumed() {
        return totalEnergyConsumed;
    }

    public void setTotalEnergyConsumed(Double totalEnergyConsumed) {
        this.totalEnergyConsumed = totalEnergyConsumed;
    }

    public Double getTotalEnergyCharged() {
        return totalEnergyCharged;
    }

    public void setTotalEnergyCharged(Double totalEnergyCharged) {
        this.totalEnergyCharged = totalEnergyCharged;
    }

    public Double getRegenerativeEnergy() {
        return regenerativeEnergy;
    }

    public void setRegenerativeEnergy(Double regenerativeEnergy) {
        this.regenerativeEnergy = regenerativeEnergy;
    }

    public Double getTotalOperatingHours() {
        return totalOperatingHours;
    }

    public void setTotalOperatingHours(Double totalOperatingHours) {
        this.totalOperatingHours = totalOperatingHours;
    }

    public void setType(String type) {
        this.type = type;
    }

    public void setCurrentSoc(double currentSoc) {
        this.currentSoc = currentSoc;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
} 