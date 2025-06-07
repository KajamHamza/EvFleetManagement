package com.evfleet.repository;

import com.evfleet.entity.Maintenance;
import com.evfleet.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MaintenanceRepository extends JpaRepository<Maintenance, Long> {
    List<Maintenance> findByVehicle(Vehicle vehicle);
    List<Maintenance> findByVehicleAndStatus(Vehicle vehicle, String status);
    List<Maintenance> findByScheduledDateBetween(LocalDateTime start, LocalDateTime end);
    List<Maintenance> findByVehicleAndScheduledDateBetween(Vehicle vehicle, LocalDateTime start, LocalDateTime end);
    List<Maintenance> findByStatusAndScheduledDateBefore(String status, LocalDateTime date);
} 