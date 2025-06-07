package com.evfleet.repository;

import com.evfleet.entity.ChargingSession;
import com.evfleet.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChargingSessionRepository extends JpaRepository<ChargingSession, Long> {
    List<ChargingSession> findByVehicle(Vehicle vehicle);
    
    List<ChargingSession> findByChargingStationId(Long stationId);
    
    @Query("SELECT cs FROM ChargingSession cs WHERE cs.startTime >= :start AND cs.endTime <= :end")
    List<ChargingSession> findSessionsBetweenDates(@Param("start") LocalDateTime start,
                                                 @Param("end") LocalDateTime end);
    
    @Query("SELECT cs FROM ChargingSession cs WHERE cs.status = 'IN_PROGRESS'")
    List<ChargingSession> findActiveSessions();
    
    @Query("SELECT cs FROM ChargingSession cs WHERE cs.vehicle = :vehicle AND cs.status = 'IN_PROGRESS'")
    ChargingSession findActiveSessionByVehicle(@Param("vehicle") Vehicle vehicle);
    
    @Query("SELECT SUM(cs.energyDelivered) FROM ChargingSession cs WHERE cs.chargingStation.id = :stationId")
    Double getTotalEnergyDeliveredByStation(@Param("stationId") Long stationId);
} 