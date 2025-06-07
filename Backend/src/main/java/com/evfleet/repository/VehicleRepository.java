package com.evfleet.repository;

import com.evfleet.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    Optional<Vehicle> findByVin(String vin);
    boolean existsByVin(String vin);
    boolean existsByVinAndDriverId(String vin, Long driverId);
    
    @Query("SELECT COUNT(v) > 0 FROM Vehicle v WHERE v.vin = :vin AND v.driver.username = :username")
    boolean existsByVinAndDriverUsername(@Param("vin") String vin, @Param("username") String username);
} 