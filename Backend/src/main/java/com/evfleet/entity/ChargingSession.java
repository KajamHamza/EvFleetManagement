package com.evfleet.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "charging_sessions")
@EntityListeners(AuditingEntityListener.class)
public class ChargingSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id", nullable = false)
    private ChargingStation chargingStation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column
    private LocalDateTime endTime;

    @Column
    private Double energyDelivered; // in kWh

    @Column
    private Double cost;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status;

    @Column
    private String connectorType;

    @Column
    private Double initialBatteryLevel; // in percentage

    @Column
    private Double finalBatteryLevel; // in percentage

    @Column(name = "initial_soc", nullable = false)
    private Double initialSoc;

    @Column(nullable = false)
    private Boolean active;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum SessionStatus {
        IN_PROGRESS,
        COMPLETED,
        CANCELLED,
        ERROR
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = SessionStatus.IN_PROGRESS;
        }
        if (startTime == null) {
            startTime = LocalDateTime.now();
        }
        if (active == null) {
            active = true;
        }
        if (initialSoc == null && vehicle != null) {
            initialSoc = vehicle.getCurrentBatteryLevel();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
} 