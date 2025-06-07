import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  MapPin, Navigation, Square, Settings, Route, Clock, Battery, Zap, 
  AlertTriangle, Car, ArrowRight, ChevronDown, ChevronUp, Volume2, VolumeX,
  Camera, Eye, Monitor, Satellite, Map
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import RouteService, { type RouteResult } from '@/services/route-service';
import VehicleService from '@/services/vehicle-service';
import AuthService from '@/services/auth-service';
import MapboxVehicleAnimation, { type VehicleAnimationData } from '@/services/mapbox-vehicle-animation';
import VoiceNavigationService, { type NavigationInstruction } from '@/services/voice-navigation-service';
import mapboxgl from 'mapbox-gl';

interface EnhancedRouteResult extends RouteResult {
  estimatedConsumption: number;
  batteryPercentageNeeded: number;
  vehicleLocation: string;
  startCoords: [number, number];
}

interface RouteOptimizerProps {
  className?: string;
  onRouteCalculate?: (
    start: string,
    end: string,
    mode: string,
    routeData?: { route: [number, number][], distance: number, duration: number }
  ) => void;
  mapInstance?: mapboxgl.Map;
}

export function RouteOptimizer({ className, onRouteCalculate, mapInstance }: RouteOptimizerProps) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [endLocation, setEndLocation] = useState('');
  const [optimizeMode, setOptimizeMode] = useState<'fastest' | 'balanced' | 'energy'>('balanced');
  const [isCalculating, setIsCalculating] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<EnhancedRouteResult | null>(null);
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [cameraMode, setCameraMode] = useState<'overview' | 'driving' | 'chase' | 'top-down' | 'birds-eye'>('driving');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentInstructions, setCurrentInstructions] = useState<NavigationInstruction[]>([]);
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDestinationRef = useRef<string>('');

  const currentUser = AuthService.getCurrentUser();

  // Get current vehicle for the logged in user
  const { data: currentVehicle, isLoading: loadingVehicle } = useQuery({
    queryKey: ['currentVehicle'],
    queryFn: VehicleService.getCurrentVehicle,
    staleTime: 30000,
  });

  // Auto-expand if we have a vehicle and collapse after navigation
  useEffect(() => {
    if (currentVehicle && !isNavigating) {
      setExpanded(true);
    }
  }, [currentVehicle, isNavigating]);

  // Auto-expand when route is calculated
  useEffect(() => {
    if (currentRoute && showRouteDetails) {
      setExpanded(true);
    }
  }, [currentRoute, showRouteDetails]);

  // Initialize voice navigation
  useEffect(() => {
    VoiceNavigationService.initialize().catch(console.error);
  }, []);

  // Update voice navigation settings
  useEffect(() => {
    VoiceNavigationService.setEnabled(voiceEnabled);
  }, [voiceEnabled]);

  // Popular cities for autocomplete
  const popularCities = [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
    'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
    'Fort Worth', 'Columbus', 'Charlotte', 'Seattle', 'Denver', 'Washington',
    'Boston', 'Nashville', 'Baltimore', 'Portland', 'Las Vegas', 'Louisville',
    'Memphis', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento',
    'Kansas City', 'Mesa', 'Atlanta', 'Colorado Springs', 'Raleigh', 'Omaha',
    'Miami', 'Oakland', 'Tulsa', 'Minneapolis', 'Cleveland', 'Wichita',
    // International cities
    'London', 'Paris', 'Tokyo', 'Sydney', 'Toronto', 'Berlin', 'Rome',
    'Madrid', 'Barcelona', 'Amsterdam', 'Vienna', 'Zurich', 'Munich',
    'Dubai', 'Singapore', 'Hong Kong', 'Seoul', 'Mumbai', 'Delhi',
    'São Paulo', 'Mexico City', 'Buenos Aires', 'Cairo', 'Lagos',
    // Moroccan cities
    'Rabat', 'Casablanca', 'Marrakech', 'Fes', 'Tangier', 'Agadir',
    'Meknes', 'Oujda', 'Kenitra', 'Tetouan', 'Safi', 'El Jadida'
  ];

  // Handle destination input change with autocomplete
  const handleDestinationChange = (value: string) => {
    setEndLocation(value);
    
    if (value.length > 0) {
      const filtered = popularCities.filter(city =>
        city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5); // Show max 5 suggestions
      setCitySuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setCitySuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (city: string) => {
    setEndLocation(city);
    setShowSuggestions(false);
    setCitySuggestions([]);
  };

  const handleCalculateRoute = useCallback(async () => {
    if (!currentVehicle) {
      toast({
        title: "No Vehicle Available",
        description: "Please register or assign a vehicle first",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!endLocation.trim()) {
      toast({
        title: "Missing Destination",
        description: "Please enter your destination",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsCalculating(true);
    
    // Clear any existing timeout
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }

    try {
      const startCoords: [number, number] = [currentVehicle.longitude, currentVehicle.latitude];
      const vehicleLocation = `${currentVehicle.name || currentVehicle.make + ' ' + currentVehicle.model} Location`;

      console.log('Starting route calculation from vehicle position:', {
        vehicleCoords: startCoords,
        destination: endLocation,
        mode: optimizeMode
      });

      // Calculate route from current vehicle position to destination
      const routeResult = await RouteService.calculateRouteFromCoordinatesToName(
        startCoords,
        endLocation,
        optimizeMode
      );

      console.log('Route calculation completed:', routeResult);

      // Calculate battery consumption
      const distanceKm = routeResult.distance / 1000;
      const estimatedConsumption = distanceKm * (currentVehicle.efficiency / 100); // kWh
      const batteryPercentageNeeded = (estimatedConsumption / currentVehicle.batteryCapacity) * 100;

      // Store enhanced route data
      const enhancedRoute: EnhancedRouteResult = {
        ...routeResult,
        estimatedConsumption,
        batteryPercentageNeeded,
        vehicleLocation,
        startCoords
      };

      setCurrentRoute(enhancedRoute);
      setShowRouteDetails(true);

      // Check if vehicle has enough battery
      if (currentVehicle.currentBatteryLevel < batteryPercentageNeeded) {
        toast({
          title: "Battery Level Warning",
          description: `This trip requires approximately ${batteryPercentageNeeded.toFixed(0)}% battery, but your vehicle has ${currentVehicle.currentBatteryLevel}%`,
          variant: "destructive",
          duration: 5000,
        });
      }

      // Notify parent component to display route
      onRouteCalculate?.(
        vehicleLocation,
        endLocation,
        optimizeMode,
        {
          route: routeResult.route,
          distance: routeResult.distance,
          duration: routeResult.duration
        }
      );

      toast({
        title: "Route Calculated",
        description: `Found optimal route: ${distanceKm.toFixed(1)}km, ${Math.round(routeResult.duration / 60)} min`,
        duration: 5000,
      });

    } catch (error) {
      console.error('Route calculation failed:', error);
      toast({
        title: "Route Calculation Failed",
        description: error instanceof Error ? error.message : "Could not calculate route",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsCalculating(false);
    }
  }, [currentVehicle, endLocation, optimizeMode, onRouteCalculate, toast]);

  const handleStartNavigation = useCallback(async () => {
    if (!currentRoute || !currentVehicle || !mapInstance) {
      toast({
        title: "Navigation Error",
        description: "Route, vehicle, or map not ready",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsNavigating(true);
    
    try {
      // Generate turn-by-turn instructions
      const instructions = VoiceNavigationService.generateInstructions(
        currentRoute.route, 
        endLocation
      );
      setCurrentInstructions(instructions);
      setCurrentInstructionIndex(0);
      VoiceNavigationService.setInstructions(instructions);

      // Create vehicle animation data for navigation
      const vehicleAnimationData: VehicleAnimationData = {
        id: `nav-vehicle-${currentVehicle.id}`,
        name: currentVehicle.name || `${currentVehicle.make} ${currentVehicle.model}`,
        position: [currentVehicle.longitude, currentVehicle.latitude],
        batteryLevel: currentVehicle.currentBatteryLevel,
        speed: 45, // Start with reasonable speed
        isMoving: true,
        route: currentRoute.route,
        routeProgress: 0
      };

      // Initialize animation system if not already done
      await MapboxVehicleAnimation.initialize(mapInstance);
      
      // Clear any existing vehicles and add our navigation vehicle
      MapboxVehicleAnimation.clear();
      await MapboxVehicleAnimation.addVehicle(vehicleAnimationData);
      
      // Start animation and follow the vehicle in selected camera mode
      MapboxVehicleAnimation.startAnimation();
      MapboxVehicleAnimation.followVehicle(vehicleAnimationData.id, cameraMode);
      
      // Start voice navigation
      if (voiceEnabled) {
        VoiceNavigationService.speak("Navigation started. Proceed to the highlighted route.");
      }
      
      toast({
        title: "Navigation Started",
        description: `Following ${(currentRoute.distance / 1000).toFixed(1)}km route in ${cameraMode} mode`,
        duration: 3000,
      });

      console.log('Navigation started with vehicle animation:', vehicleAnimationData);
      console.log('Turn-by-turn instructions:', instructions);

      // Note: Navigation will continue until manually stopped
      // No auto-arrival timeout for real navigation experience

    } catch (error) {
      console.error('Navigation start failed:', error);
      setIsNavigating(false);
      toast({
        title: "Navigation Error",
        description: "Could not start navigation",
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [currentRoute, currentVehicle, mapInstance, endLocation, cameraMode, voiceEnabled, toast]);

  const handleStopNavigation = useCallback(() => {
    setIsNavigating(false);
    
    // Clear any running timeouts
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
      calculationTimeoutRef.current = null;
    }

    // Stop voice navigation
    VoiceNavigationService.stop();
    setCurrentInstructions([]);
    setCurrentInstructionIndex(0);

    // Stop animation and clear vehicles
    MapboxVehicleAnimation.stopAnimation();
    MapboxVehicleAnimation.stopFollowing();
    MapboxVehicleAnimation.clear();

    // Clear route from map
    onRouteCalculate?.(
      currentVehicle?.name || 'Vehicle',
      endLocation,
      optimizeMode,
      undefined
    );

    toast({
      title: "Navigation Stopped",
      description: "Route cleared and camera reset",
      duration: 2000,
    });
  }, [currentVehicle, endLocation, optimizeMode, onRouteCalculate, toast]);

  // Reset route when destination changes
  useEffect(() => {
    // Only reset if destination actually changed and we have a route and we're not navigating
    if (currentRoute && !isNavigating && endLocation !== previousDestinationRef.current && previousDestinationRef.current !== '') {
      setCurrentRoute(null);
      setShowRouteDetails(false);
    }
    
    // Update the previous destination
    previousDestinationRef.current = endLocation;
    
    // Hide suggestions when starting navigation
    if (isNavigating) {
      setShowSuggestions(false);
      setCitySuggestions([]);
    }
  }, [endLocation, currentRoute, isNavigating]);

  // Handle camera mode change
  const handleCameraModeChange = useCallback((mode: typeof cameraMode) => {
    setCameraMode(mode);
    if (isNavigating && mapInstance) {
      // Update camera immediately if already navigating
      const vehicleId = `nav-vehicle-${currentVehicle?.id}`;
      MapboxVehicleAnimation.followVehicle(vehicleId, mode);
    }
  }, [isNavigating, mapInstance, currentVehicle?.id]);

  if (!currentUser) {
    return (
      <div className={cn("glassmorphism rounded-xl p-6", className)}>
        <div className="text-center space-y-2">
          <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto" />
          <h3 className="font-semibold">Authentication Required</h3>
          <p className="text-sm text-muted-foreground">Please log in to use navigation</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("glassmorphism rounded-xl overflow-hidden", className)}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <Navigation className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Route Navigation</h3>
            <p className="text-sm text-muted-foreground">
              {currentVehicle ? `From ${currentVehicle.make} ${currentVehicle.model}` : 'Plan your route'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isNavigating && (
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          )}
          {expanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="p-4 pt-0 animate-fade-in">
          {loadingVehicle ? (
            <div className="text-center py-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto"></div>
              <p className="text-xs text-muted-foreground mt-2">Loading vehicle...</p>
            </div>
          ) : !currentVehicle ? (
            <div className="text-center py-3">
              <Car className="h-6 w-6 text-orange-500 mx-auto mb-2" />
              <h4 className="font-medium">No Vehicle Assigned</h4>
              <p className="text-xs text-muted-foreground">Please register or assign a vehicle first</p>
            </div>
          ) : (() => {
            // Show route details when we have a calculated route
            return showRouteDetails && currentRoute;
          })() ? (
            // Route details display
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-base">Route Details</h4>
                <button
                  onClick={() => setShowRouteDetails(false)}
                  className="text-xs text-primary hover:underline"
                >
                  Back
                </button>
              </div>
              
              {/* Route Overview */}
              <div className="bg-accent/30 p-4 rounded-lg">
                <div className="flex items-start space-x-3 mb-3">
                  <Car className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">From</p>
                    <p className="font-medium text-sm">{currentRoute.vehicleLocation}</p>
                    <p className="text-xs text-muted-foreground">
                      Battery: {currentVehicle.currentBatteryLevel}% • {currentVehicle.make} {currentVehicle.model}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-center my-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
                
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">To</p>
                    <p className="font-medium text-sm">{endLocation}</p>
                    <p className="text-xs text-muted-foreground">
                      Mode: {optimizeMode.charAt(0).toUpperCase() + optimizeMode.slice(1)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Route Statistics */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-accent/30 p-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Route className="h-3 w-3 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Distance</p>
                      <p className="font-medium text-sm">{(currentRoute.distance / 1000).toFixed(1)} km</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-accent/30 p-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-medium text-sm">{Math.round(currentRoute.duration / 60)} min</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-accent/30 p-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Battery className="h-3 w-3 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Battery</p>
                      <p className="font-medium text-sm">{currentRoute.batteryPercentageNeeded?.toFixed(1) || 'N/A'}%</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-accent/30 p-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-3 w-3 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Energy</p>
                      <p className="font-medium text-sm">{currentRoute.estimatedConsumption?.toFixed(1) || 'N/A'} kWh</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Battery Warning */}
              {currentVehicle && currentRoute.batteryPercentageNeeded > currentVehicle.currentBatteryLevel && (
                <div className="flex items-start space-x-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-md">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Insufficient Battery</p>
                    <p className="text-xs">
                      This trip requires {currentRoute.batteryPercentageNeeded?.toFixed(1)}% battery, 
                      but your vehicle has {currentVehicle.currentBatteryLevel}%. 
                      Consider charging before this trip.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="space-y-3">
                {/* Camera Mode Controls */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center">
                    <Camera className="h-4 w-4 mr-2" />
                    Camera View
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'driving', label: 'Driving', icon: Eye },
                      { value: 'chase', label: 'Chase', icon: Car },
                      { value: 'top-down', label: 'Top-Down', icon: Map },
                      { value: 'birds-eye', label: 'Bird\'s Eye', icon: Eye }
                    ].map((mode) => {
                      const IconComponent = mode.icon;
                      return (
                        <button
                          key={mode.value}
                          onClick={() => handleCameraModeChange(mode.value as typeof cameraMode)}
                          className={cn(
                            "p-2 rounded-md text-xs transition-colors flex items-center justify-center",
                            cameraMode === mode.value
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-accent hover:bg-accent/80'
                          )}
                        >
                          <IconComponent className="h-3 w-3 mr-1" />
                          {mode.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Voice Navigation Toggle */}
                <div className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    {voiceEnabled ? (
                      <Volume2 className="h-4 w-4 text-primary" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">Voice Navigation</span>
                  </div>
                  <button
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    className={cn(
                      "w-8 h-4 rounded-full transition-colors",
                      voiceEnabled ? 'bg-primary' : 'bg-muted'
                    )}
                  >
                    <div className={cn(
                      "w-3 h-3 rounded-full bg-white transition-transform",
                      voiceEnabled ? 'translate-x-4' : 'translate-x-0.5'
                    )} />
                  </button>
                </div>

                {/* Turn-by-Turn Directions */}
                {currentInstructions.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium flex items-center">
                      <Navigation className="h-3 w-3 mr-1" />
                      Turn-by-Turn Directions
                    </label>
                    <div className="bg-accent/30 p-2 rounded-lg max-h-24 overflow-y-auto">
                      {currentInstructions.map((instruction, index) => (
                        <div
                          key={instruction.id}
                          className={cn(
                            "flex items-start space-x-2 py-0.5 text-xs",
                            index === currentInstructionIndex && "text-primary font-medium"
                          )}
                        >
                          <div className={cn(
                            "w-3 h-3 rounded-full border flex items-center justify-center text-xs mt-0.5 flex-shrink-0",
                            index === currentInstructionIndex 
                              ? "bg-primary text-primary-foreground border-primary"
                              : index < currentInstructionIndex
                              ? "bg-green-500 text-white border-green-500"
                              : "border-muted-foreground"
                          )}>
                            {index < currentInstructionIndex ? '✓' : index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "truncate",
                              index === currentInstructionIndex && "font-medium"
                            )}>
                              {instruction.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Start/Stop Navigation Button */}
                <button
                  onClick={isNavigating ? handleStopNavigation : handleStartNavigation}
                  disabled={!mapInstance}
                  className={cn(
                    "w-full py-3 px-4 rounded-md transition-colors flex items-center justify-center font-medium",
                    isNavigating 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-green-500 hover:bg-green-600 text-white',
                    !mapInstance && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isNavigating ? (
                    <>
                      <Square className="mr-2 h-4 w-4" />
                      Stop Navigation
                    </>
                  ) : (
                    <>
                      <Navigation className="mr-2 h-4 w-4" />
                      Start Navigation
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            // Route planning form
            <div className="space-y-4">
              {/* Vehicle Info */}
              <div className="bg-accent/20 p-3 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Car className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{currentVehicle.make} {currentVehicle.model}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>Battery: {currentVehicle.currentBatteryLevel}%</span>
                      <span>Efficiency: {currentVehicle.efficiency}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Destination Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Destination</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={endLocation}
                    onChange={(e) => handleDestinationChange(e.target.value)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onFocus={() => {
                      if (endLocation.length > 0 && citySuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    placeholder="Enter destination..."
                    className="w-full pl-10 p-3 border rounded-md bg-background"
                    disabled={isNavigating}
                  />
                  
                  {/* Autocomplete Suggestions */}
                  {showSuggestions && citySuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {citySuggestions.map((city, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSuggestionSelect(city)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                        >
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span>{city}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Optimization Mode */}
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Route Optimization
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'fastest', label: 'Fastest', desc: 'Shortest time' },
                    { value: 'balanced', label: 'Balanced', desc: 'Time + efficiency' },
                    { value: 'energy', label: 'Eco-friendly', desc: 'Best efficiency' }
                  ].map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => setOptimizeMode(mode.value as 'fastest' | 'balanced' | 'energy')}
                      disabled={isNavigating}
                      className={cn(
                        "p-3 rounded-md text-sm transition-colors text-center",
                        optimizeMode === mode.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-accent hover:bg-accent/80'
                      )}
                    >
                      <div className="font-medium">{mode.label}</div>
                      <div className="text-xs opacity-75">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculate Button */}
              <button
                onClick={handleCalculateRoute}
                disabled={isCalculating || !endLocation.trim() || isNavigating}
                className={cn(
                  "w-full py-3 px-4 rounded-md transition-colors flex items-center justify-center font-medium",
                  "bg-blue-500 hover:bg-blue-600 text-white",
                  (isCalculating || !endLocation.trim() || isNavigating) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isCalculating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Calculating Route...
                  </>
                ) : (
                  <>
                    <Route className="mr-2 h-4 w-4" />
                    Calculate Route
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
