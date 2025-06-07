package com.evfleet.service;

import com.evfleet.dto.ChargingStationDTO;
import com.evfleet.entity.ChargingStation;
import com.evfleet.repository.ChargingStationRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChargingStationService {
    private final ChargingStationRepository chargingStationRepository;

    public ChargingStationService(ChargingStationRepository chargingStationRepository) {
        this.chargingStationRepository = chargingStationRepository;
    }

    @Transactional
    public ChargingStationDTO createStation(ChargingStationDTO stationDTO) {
        ChargingStation station = stationDTO.toEntity();
        station = chargingStationRepository.save(station);
        return ChargingStationDTO.fromEntity(station);
    }

    @Transactional(readOnly = true)
    public ChargingStationDTO getStation(Long id) {
        return chargingStationRepository.findById(id)
                .map(ChargingStationDTO::fromEntity)
                .orElseThrow(() -> new EntityNotFoundException("Charging station not found"));
    }

    @Transactional(readOnly = true)
    public List<ChargingStationDTO> getAllStations() {
        return chargingStationRepository.findAll().stream()
                .map(ChargingStationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChargingStationDTO> getNearbyStations(double latitude, double longitude, double radiusInKm) {
        return chargingStationRepository.findNearbyStations(latitude, longitude, radiusInKm).stream()
                .map(ChargingStationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChargingStationDTO> getAvailableStations() {
        return chargingStationRepository.findAvailableStations().stream()
                .map(ChargingStationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ChargingStationDTO updateStation(Long id, ChargingStationDTO stationDTO) {
        ChargingStation existingStation = chargingStationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Charging station not found"));

        existingStation.setName(stationDTO.getName());
        existingStation.setAddress(stationDTO.getAddress());
        existingStation.setLatitude(stationDTO.getLatitude());
        existingStation.setLongitude(stationDTO.getLongitude());
        existingStation.setTotalConnectors(stationDTO.getTotalConnectors());
        existingStation.setPowerRating(stationDTO.getPowerRating());
        existingStation.setPricePerKwh(stationDTO.getPricePerKwh());
        existingStation.setStatus(stationDTO.getStatus());
        existingStation.setOperator(stationDTO.getOperator());
        existingStation.setConnectorTypes(stationDTO.getConnectorTypes());

        existingStation = chargingStationRepository.save(existingStation);
        return ChargingStationDTO.fromEntity(existingStation);
    }

    @Transactional
    public void deleteStation(Long id) {
        if (!chargingStationRepository.existsById(id)) {
            throw new EntityNotFoundException("Charging station not found");
        }
        chargingStationRepository.deleteById(id);
    }

    @Transactional
    public ChargingStationDTO updateStationStatus(Long id, ChargingStation.StationStatus newStatus) {
        ChargingStation station = chargingStationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Charging station not found"));
        
        station.setStatus(newStatus);
        station = chargingStationRepository.save(station);
        return ChargingStationDTO.fromEntity(station);
    }

    @Transactional
    public ChargingStationDTO updateAvailableConnectors(Long id, int availableConnectors) {
        ChargingStation station = chargingStationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Charging station not found"));
        
        if (availableConnectors < 0 || availableConnectors > station.getTotalConnectors()) {
            throw new IllegalArgumentException("Invalid number of available connectors");
        }
        
        station.setAvailableConnectors(availableConnectors);
        station = chargingStationRepository.save(station);
        return ChargingStationDTO.fromEntity(station);
    }
} 