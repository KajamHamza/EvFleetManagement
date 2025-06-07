package com.evfleet.repository;

import com.evfleet.entity.Vehicle;
import com.evfleet.entity.VehicleState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleStateRepository extends JpaRepository<VehicleState, Long> {
    List<VehicleState> findByVehicleAndTimestampBetween(Vehicle vehicle, LocalDateTime start, LocalDateTime end);
    Optional<VehicleState> findFirstByVehicleOrderByTimestampDesc(Vehicle vehicle);
} 