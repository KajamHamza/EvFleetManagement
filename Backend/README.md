# EV Fleet Management - Backend

## Overview

The backend component of the EV Fleet Management System is a robust **Spring Boot** application built with **Java 17** that provides REST APIs for managing electric vehicle fleets, charging stations, and user authentication. It serves as the core business logic layer and data management system for the EV fleet operations.

## Technology Stack

- **Framework**: Spring Boot 3.2.3
- **Language**: Java 17
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Spring Security
- **ORM**: Spring Data JPA with Hibernate
- **Real-time Communication**: WebSocket with STOMP
- **Build Tool**: Maven
- **Additional Libraries**:
  - Lombok (code generation)
  - Bean Validation (input validation)

## Architecture

The backend follows a **layered architecture** pattern:

```
com.evfleet/
├── controller/     # REST API endpoints
├── service/        # Business logic layer
├── repository/     # Data access layer
├── entity/         # JPA entities/data models
├── dto/           # Data Transfer Objects
├── security/      # Authentication & authorization
└── config/        # Configuration classes
```

## Key Features

### 🚗 Vehicle Management
- Vehicle registration and profile management
- Real-time vehicle state tracking
- Maintenance scheduling and history
- Battery level monitoring

### 🔌 Charging Station Management
- Charging station registration and management
- Real-time availability tracking
- Charging session management
- Station performance analytics

### 👥 User Management
- Multi-role authentication (Driver, Station Manager, Admin)
- JWT-based secure authentication
- Role-based access control
- User profile management

### 📊 Real-time Data
- WebSocket connections for live updates
- Real-time vehicle location tracking
- Live charging status updates
- Instant notifications

## Data Models

### Core Entities
- **User**: System users with role-based permissions
- **Vehicle**: Electric vehicles with battery and location data
- **ChargingStation**: Charging infrastructure with capacity info
- **ChargingSession**: Individual charging events and history
- **Maintenance**: Vehicle maintenance records
- **VehicleState**: Real-time vehicle status and location

## API Endpoints

The backend exposes RESTful APIs for:
- Authentication and user management
- Vehicle operations and monitoring
- Charging station management
- Charging session handling
- Real-time data via WebSocket

## Prerequisites

- **Java 17** or higher
- **Maven 3.6+**
- **PostgreSQL 12+**
- **IDE**: IntelliJ IDEA (optional but recommended)

## Installation & Setup

### 1. Clone and Navigate
```bash
git clone <repository-url>
cd EvFleetManagement/Backend
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb ev_fleet_management

# Update database configuration in application.properties
```

### 3. Environment Configuration
Create `application.properties` in `src/main/resources/`:
```properties
# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/ev_fleet_management
spring.datasource.username=your_username
spring.datasource.password=your_password

# JPA Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# JWT Configuration
jwt.secret=your_jwt_secret_key
jwt.expiration=86400000

# Server Configuration
server.port=8080
```

### 4. Build and Run
```bash
# Build the project
mvn clean compile

# Run the application
mvn spring-boot:run

# Or run the JAR file
mvn clean package
java -jar target/ev-fleet-management-0.0.1-SNAPSHOT.jar
```

## Development

### Running Tests
```bash
mvn test
```

### Building for Production
```bash
mvn clean package -Pprod
```

### Code Style
- Follow Java naming conventions
- Use Lombok annotations to reduce boilerplate
- Implement proper exception handling
- Add comprehensive API documentation

## API Documentation

Once running, access the API documentation at:
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- API Docs: `http://localhost:8080/api-docs`

## Security Features

- **JWT Authentication**: Stateless authentication mechanism
- **Role-based Authorization**: Different access levels for different user types
- **Password Encryption**: BCrypt password hashing
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Input Validation**: Comprehensive request validation

## Monitoring & Logging

- Application logs for debugging and monitoring
- EV simulation logs stored in `ev_simulation_logs.json`
- Health checks and metrics endpoints
- Error tracking and exception handling

## Contributing

1. Follow the existing code structure
2. Write unit tests for new features
3. Update API documentation
4. Follow Spring Boot best practices
5. Ensure proper error handling

## Support

For backend-related issues:
- Check application logs
- Verify database connectivity
- Ensure proper environment configuration
- Review API endpoint documentation 