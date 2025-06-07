
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
import AuthGuard from "@/components/auth/AuthGuard";
import ErrorHandler from "@/components/error/ErrorHandler";
import Index from "./pages/Index";
import Map from "./pages/Map";
import ManagerMap from "./pages/ManagerMap";
import Vehicle from "./pages/Vehicle";
import Stations from "./pages/Stations";
import StationManagement from "./pages/StationManagement";
import ManagerDashboard from "./pages/ManagerDashboard";
import StationProfile from "./pages/StationProfile";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <ErrorHandler>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/onboarding/:role" element={<Onboarding />} />
              
              {/* Driver routes */}
              <Route 
                path="/dashboard" 
                element={
                  <AuthGuard allowedRoles={['DRIVER', 'STATION_MANAGER', 'ADMIN']}>
                    <Index />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/map" 
                element={
                  <AuthGuard allowedRoles={['DRIVER', 'STATION_MANAGER', 'ADMIN']}>
                    <Map />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/vehicle" 
                element={
                  <AuthGuard allowedRoles={['DRIVER', 'ADMIN']}>
                    <Vehicle />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/stations" 
                element={
                  <AuthGuard allowedRoles={['DRIVER', 'STATION_MANAGER', 'ADMIN']}>
                    <Stations />
                  </AuthGuard>
                } 
              />
              
              {/* Manager routes */}
              <Route 
                path="/manager-dashboard" 
                element={
                  <AuthGuard allowedRoles={['STATION_MANAGER', 'ADMIN']}>
                    <ManagerDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/manager-map" 
                element={
                  <AuthGuard allowedRoles={['STATION_MANAGER', 'ADMIN']}>
                    <ManagerMap />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/station-management" 
                element={
                  <AuthGuard allowedRoles={['STATION_MANAGER', 'ADMIN']}>
                    <StationManagement />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/station-profile/:id" 
                element={
                  <AuthGuard allowedRoles={['STATION_MANAGER', 'ADMIN']}>
                    <StationProfile />
                  </AuthGuard>
                } 
              />
              
              {/* Common routes */}
              <Route 
                path="/settings" 
                element={
                  <AuthGuard>
                    <Settings />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/notifications" 
                element={
                  <AuthGuard>
                    <Notifications />
                  </AuthGuard>
                } 
              />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ErrorHandler>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
