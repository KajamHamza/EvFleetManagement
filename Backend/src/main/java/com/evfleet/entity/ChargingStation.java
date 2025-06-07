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
@Table(name = "charging_stations")
@EntityListeners(AuditingEntityListener.class)
public class ChargingStation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "station_id", nullable = false, unique = true)
    private String stationId;

    @Column(nullable = false)
    private String name;

    @Column(name = "address", nullable = false)
    private String address;

    @Column(name = "position_x", nullable = false)
    private Double latitude;

    @Column(name = "position_y", nullable = false)
    private Double longitude;

    @Column(name = "location", nullable = false)
    private String location;

    @Column(name = "total_ports", nullable = false)
    private Integer totalConnectors;

    @Column(name = "available_connectors", nullable = false)
    private Integer availableConnectors;

    @Column(name = "power_output_kw", nullable = false)
    private Double powerRating; // in kW

    @Column(name = "price_per_kwh", nullable = false)
    private Double pricePerKwh;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StationStatus status;

    @Column(nullable = false)
    private Boolean active;

    @Column
    private String operator;

    @Column(name = "connector_types")
    private String connectorTypes; // Comma-separated list of connector types

    @OneToMany(mappedBy = "chargingStation", cascade = CascadeType.ALL)
    private List<ChargingSession> chargingSessions;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum StationStatus {
        AVAILABLE,
        IN_USE,
        MAINTENANCE,
        OUT_OF_SERVICE
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = StationStatus.AVAILABLE;
        }
        if (availableConnectors == null) {
            availableConnectors = totalConnectors;
        }
        if (active == null) {
            active = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
} 