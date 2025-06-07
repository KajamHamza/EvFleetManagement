package com.evfleet.controller;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/database")
public class DatabaseController {

    @PersistenceContext
    private EntityManager entityManager;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> checkDatabaseStatus() {
        Map<String, Object> response = new HashMap<>();
        try {
            // Try to execute a simple query to check connection
            entityManager.createNativeQuery("SELECT 1").getSingleResult();
            response.put("status", "connected");
            response.put("message", "Database connection is successful");
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "Database connection failed: " + e.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/schema")
    public ResponseEntity<Map<String, Object>> checkSchema() {
        Map<String, Object> response = new HashMap<>();
        try {
            // Check if tables exist
            String[] tables = {"users", "vehicles", "charging_stations", "vehicle_states", "charging_sessions"};
            Map<String, Boolean> tableStatus = new HashMap<>();
            
            for (String table : tables) {
                try {
                    entityManager.createNativeQuery("SELECT 1 FROM " + table + " LIMIT 1").getSingleResult();
                    tableStatus.put(table, true);
                } catch (Exception e) {
                    tableStatus.put(table, false);
                }
            }
            
            response.put("status", "success");
            response.put("tables", tableStatus);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "Error checking schema: " + e.getMessage());
        }
        return ResponseEntity.ok(response);
    }
} 