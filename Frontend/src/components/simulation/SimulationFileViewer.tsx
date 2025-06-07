
import React, { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FileJson, Play, Pause, Square, Upload, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimulationData {
  timestamp: string;
  vehicle: {
    vin: string;
    position: [number, number];
    batteryLevel: number;
    speed: number;
    state: string;
  };
  route?: [number, number][];
  tripData?: {
    fromLocation: string;
    toLocation: string;
    distanceKm: number;
    energyConsumedWh: number;
    socPercentage: number;
    path: string[];
  };
}

interface SimulationFileViewerProps {
  onSimulationData?: (data: SimulationData) => void;
  onRouteVisualize?: (route: [number, number][]) => void;
}

export function SimulationFileViewer({ onSimulationData, onRouteVisualize }: SimulationFileViewerProps) {
  const { toast } = useToast();
  const [simulationData, setSimulationData] = useState<SimulationData[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); // milliseconds
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load simulation data from JSON file
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        // Validate and process the simulation data
        if (Array.isArray(jsonData)) {
          setSimulationData(jsonData);
          setCurrentFrame(0);
          
          // If there's route data, visualize it immediately
          if (jsonData.length > 0 && jsonData[0].route) {
            onRouteVisualize?.(jsonData[0].route);
          }
          
          toast({
            title: "Simulation Data Loaded",
            description: `Loaded ${jsonData.length} simulation frames from ${file.name}`,
          });
        } else if (jsonData.route) {
          // Single route data
          const routeData = [{
            timestamp: new Date().toISOString(),
            vehicle: {
              vin: jsonData.vehicle?.vin || 'unknown',
              position: jsonData.route[0] || [0, 0],
              batteryLevel: jsonData.vehicle?.batteryLevel || 100,
              speed: 0,
              state: 'AVAILABLE'
            },
            route: jsonData.route,
            tripData: jsonData.tripData
          }];
          
          setSimulationData(routeData);
          onRouteVisualize?.(jsonData.route);
          
          toast({
            title: "Route Data Loaded",
            description: `Loaded route with ${jsonData.route.length} waypoints`,
          });
        } else {
          throw new Error("Invalid simulation data format");
        }
      } catch (error) {
        console.error("Error parsing simulation file:", error);
        toast({
          title: "File Load Error",
          description: "Could not parse the simulation file. Please check the format.",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsText(file);
  };

  // Start playback simulation
  const startPlayback = () => {
    if (simulationData.length === 0) {
      toast({
        title: "No Data",
        description: "Please load a simulation file first.",
        variant: "destructive",
      });
      return;
    }

    setIsPlaying(true);
    
    intervalRef.current = setInterval(() => {
      setCurrentFrame(prev => {
        const nextFrame = prev + 1;
        
        if (nextFrame >= simulationData.length) {
          // End of simulation
          setIsPlaying(false);
          toast({
            title: "Simulation Complete",
            description: "Reached the end of simulation data.",
          });
          return prev;
        }
        
        // Send current frame data to parent
        if (onSimulationData && simulationData[nextFrame]) {
          onSimulationData(simulationData[nextFrame]);
        }
        
        return nextFrame;
      });
    }, playbackSpeed);
  };

  // Pause playback
  const pausePlayback = () => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Stop playback and reset
  const stopPlayback = () => {
    pausePlayback();
    setCurrentFrame(0);
  };

  // Export current simulation data
  const exportSimulationData = () => {
    if (simulationData.length === 0) {
      toast({
        title: "No Data",
        description: "No simulation data to export.",
        variant: "destructive",
      });
      return;
    }

    const dataStr = JSON.stringify(simulationData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `simulation_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data Exported",
      description: "Simulation data has been downloaded.",
    });
  };

  // Clean up interval on unmount
  React.useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-background rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <FileJson className="h-4 w-4" />
          <span>Simulation File Viewer</span>
        </h3>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1 bg-accent hover:bg-accent/80 rounded-md text-sm"
          >
            <Upload className="h-4 w-4" />
            Load JSON
          </button>
          
          <button
            onClick={exportSimulationData}
            disabled={simulationData.length === 0}
            className="flex items-center gap-2 px-3 py-1 bg-accent hover:bg-accent/80 rounded-md text-sm disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json"
        className="hidden"
      />

      {simulationData.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={isPlaying ? pausePlayback : startPlayback}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md",
                  isPlaying 
                    ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                    : "bg-green-500 hover:bg-green-600 text-white"
                )}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Play
                  </>
                )}
              </button>
              
              <button
                onClick={stopPlayback}
                className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md"
              >
                <Square className="h-4 w-4" />
                Stop
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm">Speed:</label>
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value={2000}>0.5x</option>
                <option value={1000}>1x</option>
                <option value={500}>2x</option>
                <option value={250}>4x</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Frame: {currentFrame + 1} / {simulationData.length}</span>
              <span>
                {simulationData[currentFrame]?.timestamp 
                  ? new Date(simulationData[currentFrame].timestamp).toLocaleTimeString()
                  : 'N/A'
                }
              </span>
            </div>
            
            <div className="w-full bg-accent/30 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentFrame + 1) / simulationData.length) * 100}%` }}
              />
            </div>
            
            {simulationData[currentFrame] && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-accent/30 p-2 rounded">
                  <p className="text-xs text-muted-foreground">Vehicle</p>
                  <p className="font-medium">{simulationData[currentFrame].vehicle.vin}</p>
                </div>
                
                <div className="bg-accent/30 p-2 rounded">
                  <p className="text-xs text-muted-foreground">Battery</p>
                  <p className="font-medium">{simulationData[currentFrame].vehicle.batteryLevel}%</p>
                </div>
                
                <div className="bg-accent/30 p-2 rounded">
                  <p className="text-xs text-muted-foreground">Speed</p>
                  <p className="font-medium">{simulationData[currentFrame].vehicle.speed} mph</p>
                </div>
                
                <div className="bg-accent/30 p-2 rounded">
                  <p className="text-xs text-muted-foreground">State</p>
                  <p className="font-medium">{simulationData[currentFrame].vehicle.state}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        Load a JSON file containing simulation data from FastSim and SUMO to visualize vehicle movement on the map.
      </p>
    </div>
  );
}
