import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { 
  Play, Square, Upload, FileJson, BarChart3, Activity, 
  Car, Battery, AlertCircle, Clock, Zap, Camera, Navigation, Eye,
  Monitor, Map, Satellite
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FrontendSimulationService, { type SimulatedVehicle } from '@/services/frontend-simulation-service';
import MapboxVehicleAnimation, { type VehicleAnimationData } from '@/services/mapbox-vehicle-animation';
import mapboxgl from 'mapbox-gl';

interface SimulationControlAdvancedProps {
  className?: string;
  onVehiclesUpdate?: (vehicles: SimulatedVehicle[]) => void;
  mapInstance?: mapboxgl.Map;
}

export function SimulationControlAdvanced({ 
  className, 
  onVehiclesUpdate,
  mapInstance
}: SimulationControlAdvancedProps) {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [simulatedVehicles, setSimulatedVehicles] = useState<SimulatedVehicle[]>([]);
  const [animationVehicles, setAnimationVehicles] = useState<VehicleAnimationData[]>([]);
  const [cameraMode, setCameraMode] = useState<'overview' | 'driving' | 'chase' | 'top-down' | 'birds-eye'>('overview');
  const [followingVehicle, setFollowingVehicle] = useState<string | null>(null);
  const [useAdvancedAnimation, setUseAdvancedAnimation] = useState(true);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    movingVehicles: 0,
    stoppedVehicles: 0,
    averageBatteryLevel: 0
  });
  const [hasData, setHasData] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize advanced animation when map is available
  useEffect(() => {
    if (mapInstance && useAdvancedAnimation) {
      MapboxVehicleAnimation.initialize(mapInstance);
      console.log('MapboxVehicleAnimation initialized with map instance');
    }
  }, [mapInstance, useAdvancedAnimation]);

  // Listen to simulation updates
  useEffect(() => {
    const handleVehicleUpdate = (vehicles: SimulatedVehicle[]) => {
      setSimulatedVehicles(vehicles);
      setStats(FrontendSimulationService.getSimulationStats());
      setHasData(vehicles.length > 0);
      
      // Convert to animation format if using advanced animation
      if (useAdvancedAnimation && vehicles.length > 0) {
        convertToAnimationVehicles(vehicles);
      } else {
        // Notify parent component for basic animation
        onVehiclesUpdate?.(vehicles);
      }
    };

    const handleAnimationUpdate = (vehicles: VehicleAnimationData[]) => {
      setAnimationVehicles(vehicles);
    };

    FrontendSimulationService.addListener(handleVehicleUpdate);
    MapboxVehicleAnimation.addListener(handleAnimationUpdate);
    
    // Initial data check
    const initialVehicles = FrontendSimulationService.getSimulatedVehicles();
    if (initialVehicles.length > 0) {
      handleVehicleUpdate(initialVehicles);
    }

    return () => {
      FrontendSimulationService.removeListener(handleVehicleUpdate);
      MapboxVehicleAnimation.removeListener(handleAnimationUpdate);
    };
  }, [onVehiclesUpdate, useAdvancedAnimation]);

  // Convert simulated vehicles to animation format
  const convertToAnimationVehicles = async (vehicles: SimulatedVehicle[]) => {
    if (!useAdvancedAnimation) return;

    for (const vehicle of vehicles) {
      const animationData: VehicleAnimationData = {
        id: vehicle.id,
        name: vehicle.name,
        position: vehicle.position,
        batteryLevel: vehicle.batteryLevel,
        speed: vehicle.speed,
        isMoving: vehicle.isMoving
      };

      await MapboxVehicleAnimation.addVehicle(animationData);
    }
  };

  // Load the default simulation data
  useEffect(() => {
    loadDefaultSimulationData();
  }, []);

  const loadDefaultSimulationData = async () => {
    try {
      // Load the ev_simulation_logs.json file from the Backend folder
      const response = await fetch('/Backend/ev_simulation_logs.json');
      if (response.ok) {
        const data = await response.json();
        FrontendSimulationService.loadSimulationData(data);
        toast({
          title: "Simulation Data Loaded",
          description: `Loaded ${Object.keys(data).length} vehicles from ev_simulation_logs.json`,
          duration: 3000,
        });
      } else {
        console.warn('Could not load default simulation data');
        loadDemoData();
      }
    } catch (error) {
      console.error('Error loading default simulation data:', error);
      loadDemoData();
    }
  };

  const loadDemoData = () => {
    const demoData = {
      "Demo Electric Vehicle 1": {
        "initial_soc": 75.5,
        "trips": [
          {
            "timestamp": "2025-01-16 08:00:00",
            "from_location": "Manhattan",
            "to_location": "Brooklyn",
            "distance_km": 12.5,
            "energy_consumed_wh": 415.6,
            "soc_percentage": 72.1,
            "start_position": { "x": 5000, "y": 8000 },
            "end_position": { "x": 8000, "y": 3000 },
            "path": []
          },
          {
            "timestamp": "2025-01-16 09:30:00",
            "from_location": "Brooklyn",
            "to_location": "Queens",
            "distance_km": 15.2,
            "energy_consumed_wh": 503.8,
            "soc_percentage": 68.9,
            "start_position": { "x": 8000, "y": 3000 },
            "end_position": { "x": 12000, "y": 7000 },
            "path": []
          }
        ]
      },
      "Demo Electric Vehicle 2": {
        "initial_soc": 45.2,
        "trips": [
          {
            "timestamp": "2025-01-16 08:15:00",
            "from_location": "Queens",
            "to_location": "Manhattan",
            "distance_km": 18.7,
            "energy_consumed_wh": 621.0,
            "soc_percentage": 41.8,
            "start_position": { "x": 12000, "y": 7000 },
            "end_position": { "x": 5000, "y": 8000 },
            "path": []
          }
        ]
      }
    };
    
    FrontendSimulationService.loadSimulationData(demoData);
    toast({
      title: "Demo Data Loaded",
      description: "Loaded demo simulation data with 2 vehicles",
      duration: 3000,
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await FrontendSimulationService.loadSimulationFile(file);
      toast({
        title: "File Loaded Successfully",
        description: `Simulation data loaded from ${file.name}`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "File Load Error",
        description: error instanceof Error ? error.message : "Could not load simulation file",
        variant: "destructive",
        duration: 5000,
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleSimulation = () => {
    if (!hasData) {
      toast({
        title: "No Simulation Data",
        description: "Please load simulation data first",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (isRunning) {
      // Stop simulation
      if (useAdvancedAnimation) {
        MapboxVehicleAnimation.stopAnimation();
        MapboxVehicleAnimation.clear();
      } else {
        FrontendSimulationService.stopSimulation();
      }
      setIsRunning(false);
      setFollowingVehicle(null);
      toast({
        title: "Simulation Stopped",
        description: "Vehicle simulation has been stopped",
        duration: 3000,
      });
    } else {
      // Start simulation
      if (useAdvancedAnimation) {
        MapboxVehicleAnimation.startAnimation();
      } else {
        FrontendSimulationService.startSimulation();
      }
      setIsRunning(true);
      toast({
        title: "Simulation Started",
        description: `${stats.totalVehicles} vehicles are now being simulated with ${useAdvancedAnimation ? 'road-following' : 'basic'} animation`,
        duration: 3000,
      });
    }
  };

  const handleFollowVehicle = (vehicleId: string) => {
    if (!useAdvancedAnimation) return;

    if (followingVehicle === vehicleId) {
      MapboxVehicleAnimation.stopFollowing();
      setFollowingVehicle(null);
      toast({
        title: "Stopped Following",
        description: "Camera returned to overview mode",
        duration: 2000,
      });
    } else {
      MapboxVehicleAnimation.followVehicle(vehicleId, cameraMode);
      setFollowingVehicle(vehicleId);
      toast({
        title: "Following Vehicle",
        description: `Camera following vehicle in ${cameraMode} mode`,
        duration: 2000,
      });
    }
  };

  const handleCameraModeChange = (mode: 'overview' | 'driving' | 'chase' | 'top-down' | 'birds-eye') => {
    setCameraMode(mode);
    if (followingVehicle && useAdvancedAnimation) {
      MapboxVehicleAnimation.followVehicle(followingVehicle, mode);
      toast({
        title: `Camera Mode: ${mode.charAt(0).toUpperCase() + mode.slice(1).replace('-', ' ')}`,
        description: `Switched to ${mode.replace('-', ' ')} view`,
        duration: 2000,
      });
    }
  };

  const loadSampleFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const displayVehicles = useAdvancedAnimation ? animationVehicles : simulatedVehicles;
  const displayStats = useAdvancedAnimation ? 
    {
      totalVehicles: animationVehicles.length,
      movingVehicles: animationVehicles.filter(v => v.isMoving).length,
      stoppedVehicles: animationVehicles.filter(v => !v.isMoving).length,
      averageBatteryLevel: animationVehicles.length > 0 ? 
        animationVehicles.reduce((sum, v) => sum + v.batteryLevel, 0) / animationVehicles.length : 0
    } : stats;

  return (
    <div className={cn("glassmorphism rounded-xl p-6", className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="h-6 w-6 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Advanced Simulation</h3>
              <p className="text-sm text-muted-foreground">
                {useAdvancedAnimation ? 'Road-following vehicle simulation' : 'Basic frontend simulation'}
              </p>
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
        </div>

        {/* Animation Mode Toggle */}
        <div className="flex items-center justify-between p-3 bg-accent/20 rounded-lg">
          <span className="text-sm font-medium">Road-Following Animation</span>
          <button
            onClick={() => setUseAdvancedAnimation(!useAdvancedAnimation)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
              useAdvancedAnimation ? 'bg-primary' : 'bg-gray-300'
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                useAdvancedAnimation ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* Camera Controls - only show if advanced animation is enabled */}
        {useAdvancedAnimation && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center">
              <Camera className="h-4 w-4 mr-2" />
              Camera Controls
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {(['overview', 'driving', 'chase', 'top-down', 'birds-eye'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleCameraModeChange(mode)}
                  className={cn(
                    "p-2 text-xs rounded-md transition-colors flex items-center justify-center",
                    cameraMode === mode 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-accent hover:bg-accent/80'
                  )}
                >
                  {mode === 'overview' && <Eye className="h-3 w-3 mr-1" />}
                  {mode === 'driving' && <Navigation className="h-3 w-3 mr-1" />}
                  {mode === 'chase' && <Camera className="h-3 w-3 mr-1" />}
                  {mode === 'top-down' && <Map className="h-3 w-3 mr-1" />}
                  {mode === 'birds-eye' && <Eye className="h-3 w-3 mr-1" />}
                  {mode.charAt(0).toUpperCase() + mode.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Vehicle List - for following */}
        {useAdvancedAnimation && displayVehicles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Follow Vehicle</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {displayVehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  onClick={() => handleFollowVehicle(vehicle.id)}
                  className={cn(
                    "w-full p-2 text-xs rounded-md text-left transition-colors flex items-center justify-between",
                    followingVehicle === vehicle.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-accent hover:bg-accent/80'
                  )}
                >
                  <span className="truncate">{vehicle.name}</span>
                  <div className="flex items-center space-x-1">
                    <Battery className="h-3 w-3" />
                    <span>{Math.round(vehicle.batteryLevel)}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Statistics Grid */}
        {hasData && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-accent/30 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <Car className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Vehicles</p>
                  <p className="font-semibold">{displayStats.totalVehicles}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-accent/30 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Moving</p>
                  <p className="font-semibold text-green-600">{displayStats.movingVehicles}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-accent/30 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Stopped</p>
                  <p className="font-semibold text-orange-600">{displayStats.stoppedVehicles}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-accent/30 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <Battery className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Avg Battery</p>
                  <p className="font-semibold text-blue-600">{displayStats.averageBatteryLevel.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="space-y-3">
          {/* Main Control Button */}
          <button
            onClick={toggleSimulation}
            disabled={!hasData}
            className={cn(
              "w-full py-3 px-4 rounded-md transition-colors flex items-center justify-center font-medium",
              isRunning 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white',
              !hasData && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isRunning ? (
              <>
                <Square className="mr-2 h-5 w-5" />
                Stop Simulation
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                Start Simulation
              </>
            )}
          </button>

          {/* File Upload Button */}
          <button
            onClick={loadSampleFile}
            className="w-full py-2 px-4 rounded-md border border-input bg-background hover:bg-accent transition-colors flex items-center justify-center"
          >
            <Upload className="mr-2 h-4 w-4" />
            Load Custom Simulation File
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Status */}
        <div className="bg-accent/20 p-3 rounded-lg">
          <div className="flex items-start space-x-2">
            {hasData ? (
              <BarChart3 className="h-4 w-4 mt-0.5 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 mt-0.5 text-orange-500" />
            )}
            <div>
              <p className="text-sm font-medium">
                {hasData ? 'Simulation Ready' : 'No Data Loaded'}
              </p>
              <p className="text-xs text-muted-foreground">
                {hasData 
                  ? `${displayStats.totalVehicles} vehicles loaded with ${useAdvancedAnimation ? 'road-following' : 'basic'} animation` 
                  : 'Load simulation data to start'}
              </p>
            </div>
          </div>
        </div>

        {/* File Format Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <div className="flex items-start space-x-2">
            <FileJson className="h-4 w-4 mt-0.5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Enhanced Simulation
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {useAdvancedAnimation 
                  ? 'Vehicles follow real roads using Mapbox routing with driving POV camera modes'
                  : 'Basic simulation with straight-line movement between points'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 