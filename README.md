# EV Fleet Management System

## 🚗 Overview

The **EV Fleet Management System** is a comprehensive, full-stack application designed to manage electric vehicle fleets, charging stations, and user operations. This system provides real-time monitoring, efficient resource management, and seamless user experiences for drivers, station managers, and administrators.

## ⚡ Key Features

### 🎯 Multi-Role Management
- **Drivers**: Vehicle monitoring, charging session management, route planning
- **Station Managers**: Charging station oversight, performance analytics, user management
- **Administrators**: Fleet-wide control, user role management, system configuration

### 📊 Real-Time Analytics
- Live vehicle tracking and status monitoring
- Charging station availability and performance metrics
- Battery level monitoring and predictive analytics
- Fleet utilization and efficiency reports

### 🗺️ Interactive Mapping
- Real-time vehicle location tracking with Mapbox integration
- Charging station discovery and navigation
- Route optimization for electric vehicles
- Geofencing and location-based services

### 🔋 Smart Charging Management
- Automated charging session tracking
- Station capacity management and load balancing
- Charging history and cost analysis
- Maintenance scheduling and alerts

## 🏗️ System Architecture

```
EV Fleet Management System/
├── Frontend/           # React + TypeScript Web Application
│   ├── User Interface & Experience
│   ├── Real-time Data Visualization
│   ├── Interactive Maps & Navigation
│   └── Multi-role Dashboards
│
└── Backend/            # Spring Boot Java API Server
    ├── REST API Endpoints
    ├── Real-time WebSocket Communication
    ├── Database Management
    └── Authentication & Authorization
```

### Technology Stack

| Component | Frontend | Backend |
|-----------|----------|---------|
| **Language** | TypeScript | Java 17 |
| **Framework** | React 18 + Vite | Spring Boot 3.2.3 |
| **UI/Styling** | Tailwind CSS + Radix UI | - |
| **Database** | - | PostgreSQL + JPA |
| **Authentication** | JWT Token | Spring Security + JWT |
| **Real-time** | WebSocket Client | WebSocket + STOMP |
| **Maps** | Mapbox GL | - |
| **Build Tool** | Vite | Maven |

## 🚀 Quick Start

### Prerequisites
- **Java 17+** (for backend)
- **Node.js 18+** or **Bun** (for frontend)
- **PostgreSQL 12+** (for database)
- **Git** (for version control)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd EvFleetManagement
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd Backend

# Set up PostgreSQL database
createdb ev_fleet_management

# Configure database connection in application.properties
# (See Backend/README.md for detailed setup)

# Build and run the backend
mvn spring-boot:run
```

The backend API will be available at `http://localhost:8080`

### 3. Frontend Setup
```bash
# Navigate to frontend directory (in a new terminal)
cd Frontend

# Install dependencies
npm install

# Set up environment variables
# Create .env.local file (See Frontend/README.md for details)

# Start development server
npm run dev
```

The frontend application will be available at `http://localhost:5173`

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/swagger-ui.html (when available)

## 📱 User Roles & Access

### 👨‍💼 Driver Dashboard
- Vehicle status and battery monitoring
- Nearby charging station finder
- Charging session management
- Route planning and navigation
- Maintenance alerts and history

### 🏢 Station Manager Portal
- Real-time station monitoring
- Charging session oversight
- Performance analytics and reporting
- Station configuration management
- Customer support tools

### 🔧 Admin Control Panel
- Fleet-wide overview and analytics
- User management and role assignment
- System configuration and settings
- Advanced reporting and insights
- Multi-station coordination

## 🛠️ Development

### Project Structure
```
EvFleetManagement/
├── Backend/
│   ├── src/main/java/com/evfleet/
│   │   ├── controller/      # REST API endpoints
│   │   ├── service/         # Business logic layer
│   │   ├── repository/      # Data access layer
│   │   ├── entity/          # JPA entities
│   │   ├── dto/             # Data transfer objects
│   │   ├── security/        # Authentication & authorization
│   │   └── config/          # Configuration classes
│   ├── pom.xml             # Maven dependencies
│   └── README.md           # Backend documentation
│
├── Frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route-based page components
│   │   ├── services/        # API service layer
│   │   ├── hooks/           # Custom React hooks
│   │   ├── types/           # TypeScript definitions
│   │   └── lib/             # Utilities and configurations
│   ├── package.json        # npm dependencies
│   └── README.md           # Frontend documentation
│
└── README.md               # This file
```

### Development Workflow

1. **Backend Development**
   - Follow Spring Boot best practices
   - Implement RESTful API design
   - Write comprehensive unit tests
   - Document API endpoints

2. **Frontend Development**
   - Use React functional components with TypeScript
   - Follow component-based architecture
   - Implement responsive design principles
   - Maintain accessibility standards

3. **Integration**
   - API-first development approach
   - Real-time data synchronization
   - Error handling and user feedback
   - Cross-platform compatibility

## 🔒 Security Features

- **Authentication**: JWT-based stateless authentication
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Encrypted passwords and sensitive data
- **API Security**: CORS configuration and request validation
- **Real-time Security**: Secure WebSocket connections

## 📊 Monitoring & Analytics

- **Real-time Dashboards**: Live fleet and station metrics
- **Performance Monitoring**: System health and response times
- **Usage Analytics**: User behavior and system utilization
- **Predictive Maintenance**: AI-driven maintenance scheduling
- **Cost Analysis**: Charging costs and operational efficiency

## 🌍 Deployment

### Development Environment
- Backend: `mvn spring-boot:run`
- Frontend: `npm run dev`
- Database: Local PostgreSQL instance

### Production Deployment
- **Backend**: Containerized Spring Boot application
- **Frontend**: Static build deployed to CDN
- **Database**: Managed PostgreSQL service
- **Infrastructure**: Cloud deployment (AWS/Azure/GCP)

## 📖 Documentation

### Individual Component Documentation
- **Backend**: [Backend/README.md] - Detailed API and server setup
- **Frontend**: [Frontend/README.md] - UI components and development guide

### API Documentation
- Interactive API documentation available at `/swagger-ui.html`
- OpenAPI 3.0 specification for all endpoints
- Authentication and authorization examples

## 🤝 Contributing

### Getting Started
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the coding standards for each component
4. Write tests for new functionality
5. Submit a pull request

### Coding Standards
- **Backend**: Follow Java coding conventions and Spring Boot best practices
- **Frontend**: Use ESLint configuration and TypeScript strict mode
- **Documentation**: Update README files for significant changes
- **Testing**: Maintain test coverage for critical functionality

## 🔧 Troubleshooting

### Common Issues

#### Backend Issues
- **Database Connection**: Verify PostgreSQL is running and credentials are correct
- **Port Conflicts**: Ensure port 8080 is available
- **Java Version**: Confirm Java 17+ is installed and configured

#### Frontend Issues
- **Node Dependencies**: Run `npm install` to resolve missing packages
- **Port Conflicts**: Frontend runs on port 5173 by default
- **API Connection**: Verify backend is running and API endpoints are accessible

#### Integration Issues
- **CORS Errors**: Check backend CORS configuration
- **Authentication**: Verify JWT token configuration matches between frontend and backend
- **WebSocket Connection**: Ensure WebSocket endpoints are properly configured

## 📧 Support

For technical support and questions:
- **Backend Issues**: Check [Backend/README.md] for detailed troubleshooting
- **Frontend Issues**: Check [Frontend/README.md] for UI-specific problems
- **General Issues**: Create an issue in the repository

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Roadmap

### Upcoming Features
- [ ] Mobile app development (React Native)
- [ ] Advanced analytics and machine learning insights
- [ ] Integration with third-party charging networks
- [ ] Multi-language support
- [ ] Advanced route optimization algorithms
- [ ] Automated billing and payment processing

### Long-term Vision
- Scalable microservices architecture
- AI-powered predictive maintenance
- IoT integration for real-time vehicle data
- Blockchain-based charging transactions
- Global fleet management capabilities

---

**EV Fleet Management System** - Powering the future of electric vehicle fleet operations 🚗⚡ 