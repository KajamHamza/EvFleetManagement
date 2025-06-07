-- Drop existing tables and types
DROP TABLE IF EXISTS charging_sessions CASCADE;
DROP TABLE IF EXISTS vehicle_states CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS charging_stations CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Create enum type for user roles
CREATE TYPE user_role AS ENUM ('ADMIN', 'STATION_MANAGER', 'DRIVER');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(255) NOT NULL,
    initial_soc DOUBLE PRECISION NOT NULL,
    battery_capacity_wh DOUBLE PRECISION,
    max_range_km DOUBLE PRECISION,
    average_consumption_wh_per_km DOUBLE PRECISION,
    assigned_driver_id BIGINT REFERENCES users(id),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create charging_stations table
CREATE TABLE IF NOT EXISTS charging_stations (
    id BIGSERIAL PRIMARY KEY,
    station_id VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    total_connectors INTEGER NOT NULL,
    available_connectors INTEGER NOT NULL,
    power_rating DOUBLE PRECISION NOT NULL,
    price_per_kwh DOUBLE PRECISION NOT NULL,
    status VARCHAR(50) NOT NULL,
    operator VARCHAR(255),
    connector_types VARCHAR(255),
    manager_id BIGINT REFERENCES users(id),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create vehicle_states table
CREATE TABLE IF NOT EXISTS vehicle_states (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id BIGINT NOT NULL REFERENCES vehicles(id),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    soc_percentage DOUBLE PRECISION NOT NULL,
    position_x DOUBLE PRECISION NOT NULL,
    position_y DOUBLE PRECISION NOT NULL,
    speed_kmh DOUBLE PRECISION,
    energy_consumed_wh DOUBLE PRECISION,
    distance_traveled_km DOUBLE PRECISION,
    is_charging BOOLEAN DEFAULT false,
    charging_station_id BIGINT REFERENCES charging_stations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create charging_sessions table
CREATE TABLE IF NOT EXISTS charging_sessions (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id BIGINT NOT NULL REFERENCES vehicles(id),
    charging_station_id BIGINT NOT NULL REFERENCES charging_stations(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    initial_soc DOUBLE PRECISION NOT NULL,
    final_soc DOUBLE PRECISION,
    energy_charged_kwh DOUBLE PRECISION,
    cost DOUBLE PRECISION,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vehicle_states_vehicle_id ON vehicle_states(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_states_timestamp ON vehicle_states(timestamp);
CREATE INDEX IF NOT EXISTS idx_charging_sessions_vehicle_id ON charging_sessions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_charging_sessions_station_id ON charging_sessions(charging_station_id);
CREATE INDEX IF NOT EXISTS idx_charging_sessions_start_time ON charging_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_vehicles_assigned_driver ON vehicles(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_charging_stations_manager ON charging_stations(manager_id); 