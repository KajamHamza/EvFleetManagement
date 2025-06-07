# EV Fleet Management System

A Spring Boot backend application for managing electric vehicles, charging stations, and user interactions.

## Prerequisites

- Java 17 or higher
- Maven 3.6 or higher
- PostgreSQL 12 or higher
- Postman (for API testing)

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd ev-fleet-management
   ```

2. **Configure Database**
   - Create a PostgreSQL database named `ev_fleet_management`
   - Update database credentials in `src/main/resources/application.properties`

3. **Build the Project**
   ```bash
   mvn clean install
   ```

4. **Run the Application**
   ```bash
   mvn spring-boot:run
   ```

5. **Access the API**
   - The application will be available at `http://localhost:8080`
   - API documentation will be available at `http://localhost:8080/swagger-ui.html`

## Project Structure

```
src/main/java/com/evfleet/
├── config/           # Configuration classes
├── controller/       # REST controllers
├── dto/             # Data Transfer Objects
├── entity/          # JPA entities
├── repository/      # JPA repositories
├── security/        # Security configuration
├── service/         # Business logic
└── util/            # Utility classes
```

## Development Phases

1. Project Setup and Basic Infrastructure
2. Authentication System
3. Simulation Data Loading
4. Core Vehicle Management
5. Charging Station Management
6. Route Optimization
7. Notification System
8. Admin Features

## API Documentation

API documentation will be available after running the application at:
`http://localhost:8080/swagger-ui.html`

## Testing

- Unit tests: `mvn test`
- Integration tests: `mvn verify`
- Postman collection: Available in the `postman` directory

## Contributing

1. Create a feature branch
2. Implement your changes
3. Run tests
4. Submit a pull request

## License

[License information] 