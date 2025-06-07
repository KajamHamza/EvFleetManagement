package com.evfleet.repository;

import com.evfleet.entity.ChargingStation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChargingStationRepository extends JpaRepository<ChargingStation, Long> {
    List<ChargingStation> findByAddress(String address);
    List<ChargingStation> findByAvailableConnectorsGreaterThan(int minAvailableConnectors);
    List<ChargingStation> findByStatus(ChargingStation.StationStatus status);
    
    @Query("SELECT cs FROM ChargingStation cs WHERE " +
           "6371 * acos(cos(radians(:lat)) * cos(radians(cs.latitude)) * " +
           "cos(radians(cs.longitude) - radians(:lng)) + " +
           "sin(radians(:lat)) * sin(radians(cs.latitude))) <= :radius")
    List<ChargingStation> findNearbyStations(@Param("lat") double latitude,
                                           @Param("lng") double longitude,
                                           @Param("radius") double radiusInKm);

    List<ChargingStation> findByOperator(String operator);
    
    @Query("SELECT cs FROM ChargingStation cs WHERE cs.availableConnectors > 0")
    List<ChargingStation> findAvailableStations();
    
    Optional<ChargingStation> findByStationId(String stationId);

    boolean existsByStationId(String stationId);
} 