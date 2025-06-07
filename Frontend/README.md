# EV Fleet Management - Frontend

## Overview

The frontend component of the EV Fleet Management System is a modern, responsive **React** application built with **TypeScript** and **Vite**. It provides an intuitive user interface for drivers, station managers, and administrators to interact with the EV fleet management system, featuring real-time data visualization, interactive maps, and comprehensive dashboard analytics.

## Technology Stack

- **Framework**: React 18.3.1
- **Language**: TypeScript 5.5.3
- **Build Tool**: Vite 5.4.1
- **Styling**: Tailwind CSS 3.4.11
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM 6.26.2
- **HTTP Client**: Axios 1.9.0
- **Maps**: Mapbox GL 3.10.0
- **Charts**: Recharts 2.12.7
- **Form Handling**: React Hook Form + Zod validation
- **Development**: ESLint, TypeScript ESLint

## Architecture

The frontend follows a **component-based architecture** with clear separation of concerns:

```
src/
├── components/     # Reusable UI components
├── pages/         # Route-based page components
├── services/      # API service layer
├── hooks/         # Custom React hooks
├── types/         # TypeScript type definitions
├── lib/           # Utility functions and configurations
└── data/          # Static data and constants
```

## Key Features

### 🎯 Multi-Role Dashboard
- **Driver Dashboard**: Vehicle status, charging history, nearby stations
- **Manager Dashboard**: Station management, analytics, performance metrics
- **Admin Dashboard**: Fleet overview, user management, system analytics

### 🗺️ Interactive Maps
- Real-time vehicle tracking with Mapbox integration
- Charging station locations and availability
- Route planning and navigation assistance
- Geofencing and location-based services

### 🔐 Authentication & Authorization
- Role-based access control (Driver, Station Manager, Admin)
- JWT token-based authentication
- Protected routes with auth guards
- Secure user onboarding flow

### 📊 Data Visualization
- Real-time charts and analytics with Recharts
- Battery level monitoring and trends
- Charging session analytics
- Fleet performance metrics

### 🎨 Modern UI/UX
- Responsive design for all device sizes
- Dark/Light theme support
- Accessible components with Radix UI
- Smooth animations and transitions
- Toast notifications and loading states

## User Roles & Features

### 👨‍💼 Driver Features
- Vehicle dashboard with real-time status
- Battery level and range monitoring
- Find nearby charging stations
- Charging session management
- Route planning and navigation
- Maintenance alerts and history

### 🏢 Station Manager Features
- Station management dashboard
- Real-time station status monitoring
- Charging session oversight
- Performance analytics and reporting
- Station configuration and settings
- User activity monitoring

### 🔧 Admin Features
- Complete fleet overview
- User management and role assignment
- System configuration
- Advanced analytics and reporting
- Multi-station management
- System health monitoring

## Component Library

The application uses **shadcn/ui components** built on **Radix UI primitives**:

- Form components with validation
- Data tables and grids
- Navigation and menus
- Modals and dialogs
- Charts and visualizations
- Loading states and skeletons

## Prerequisites

- **Node.js 18+** or **Bun**
- **Package Manager**: npm, yarn, or bun
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

## Installation & Setup

### 1. Clone and Navigate
```bash
git clone <repository-url>
cd EvFleetManagement/Frontend
```

### 2. Install Dependencies
```bash
# Using npm
npm install

# Using yarn
yarn install

# Using bun
bun install
```

### 3. Environment Configuration
Create `.env.local` file in the root directory:
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token
VITE_APP_NAME=EV Fleet Management
```

### 4. Development Server
```bash
# Using npm
npm run dev

# Using yarn
yarn dev

# Using bun
bun run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:dev    # Build for development
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Production Build
```bash
npm run build
npm run preview
```

## Project Structure

### Pages
- **Landing**: Public landing page
- **Authentication**: Login, Signup, Onboarding
- **Dashboard**: Role-specific dashboards
- **Map**: Interactive fleet and station maps
- **Vehicle**: Vehicle management and monitoring
- **Stations**: Charging station directory
- **Settings**: User preferences and configuration
- **Notifications**: System alerts and messages

### Components
- **UI Components**: Reusable design system components
- **Auth Components**: Authentication guards and forms
- **Map Components**: Mapbox integration and overlays
- **Dashboard Components**: Charts, widgets, and analytics
- **Form Components**: Input validation and submission

### Services
- **API Service**: HTTP client configuration and endpoints
- **Auth Service**: Authentication and token management
- **Map Service**: Mapbox utilities and helpers
- **WebSocket Service**: Real-time data connections

## Styling & Theming

### Tailwind CSS Configuration
- Custom color palette for EV theme
- Responsive breakpoints
- Dark mode support
- Custom component styles
- Animation utilities

### Design System
- Consistent spacing and typography
- Color schemes for different states
- Icon library with Lucide React
- Accessible contrast ratios
- Mobile-first responsive design

## State Management

### TanStack Query (React Query)
- Server state management
- Caching and synchronization
- Background refetching
- Optimistic updates
- Error handling

### Local State
- React hooks for component state
- Context API for shared state
- Form state with React Hook Form
- Theme state management

## Performance Optimizations

- **Code Splitting**: Route-based lazy loading
- **Bundle Optimization**: Vite's tree shaking and minification
- **Image Optimization**: Lazy loading and responsive images
- **Caching**: React Query caching strategies
- **Memoization**: React.memo and useMemo for expensive operations

## Browser Support

- **Modern Browsers**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **Mobile Browsers**: iOS Safari 14+, Chrome Mobile 88+
- **ES6+ Features**: Full support for modern JavaScript

## Testing

```bash
# Run tests (when configured)
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel/Netlify
```bash
# The dist/ folder contains the built application
# Configure your deployment platform to serve from dist/
```

## Contributing

1. Follow React and TypeScript best practices
2. Use the established component patterns
3. Maintain consistent code style with ESLint
4. Add TypeScript types for all new features
5. Test components across different screen sizes
6. Update documentation for new features

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React functional component patterns
- Implement proper error boundaries
- Use custom hooks for reusable logic
- Maintain consistent file naming

### Component Development
- Create reusable components in `/components`
- Use proper prop typing with TypeScript
- Implement loading and error states
- Add accessibility attributes
- Test responsive behavior

## Support

For frontend-related issues:
- Check browser console for errors
- Verify API endpoint connectivity
- Review network requests in developer tools
- Check responsive design across devices
- Validate environment variables
