import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from '@/hooks/use-toast';
import { getMapboxToken, setMapboxToken } from '@/services/mapbox-service';

// Default mapbox token - you can add a permanent one here if you have it
const DEFAULT_MAPBOX_TOKEN = 'REPLACE_WITH_YOUR_MAPBOX_TOKEN';

interface MapboxProps {
  className?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  markers?: Array<{
    id: string;
    position: [number, number];
    type: 'vehicle' | 'charging-station';
    status?: 'available' | 'occupied' | 'low-battery' | 'charging';
    // Additional properties for animated vehicles
    isMoving?: boolean;
    batteryLevel?: number;
    speed?: number;
  }>;
  onMarkerClick?: (markerId: string) => void;
  disableTelemetry?: boolean;
  is3D?: boolean;
  onMapLoad?: (map: mapboxgl.Map) => void;
  renderCustomMarker?: (marker: {
    id: string;
    position: [number, number];
    type: 'vehicle' | 'charging-station';
    status?: 'available' | 'occupied' | 'low-battery' | 'charging';
    isMoving?: boolean;
    batteryLevel?: number;
    speed?: number;
  }) => React.ReactNode;
  routeCoordinates?: [number, number][];
  onMapClick?: (coords: [number, number]) => void;
}

export function Mapbox({
  className = '',
  initialCenter = [-74.5, 40],
  initialZoom = 9,
  markers = [],
  onMarkerClick,
  disableTelemetry = true,
  is3D = true,
  onMapLoad,
  renderCustomMarker,
  routeCoordinates,
  onMapClick
}: MapboxProps) {
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRefs = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const routeLayerRef = useRef<string | null>(null);
  const isInitialized = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  
  const [mapboxToken, setMapboxTokenState] = useState(() => {
    return getMapboxToken() || DEFAULT_MAPBOX_TOKEN;
  });
  
  const [isTokenValid, setIsTokenValid] = useState(
    mapboxToken !== 'REPLACE_WITH_YOUR_MAPBOX_TOKEN' && 
    mapboxToken !== null &&
    mapboxToken !== ''
  );
  
  const [mapLoaded, setMapLoaded] = useState(false);

  // Cleanup function with better error handling
  const cleanupMap = useCallback(() => {
    console.log('Cleaning up Mapbox map...');
    
    // Clear all markers first
    Object.values(markerRefs.current).forEach(marker => {
      try {
        if (marker && marker.remove) {
          marker.remove();
        }
      } catch (error) {
        console.warn('Error removing marker:', error);
      }
    });
    markerRefs.current = {};
    
    // Remove map instance with better error handling
    if (map.current) {
      try {
        // Check if map instance is still valid
        if (map.current.remove && typeof map.current.remove === 'function') {
          map.current.remove();
        }
      } catch (error) {
        console.warn('Error removing map:', error);
      }
      map.current = null;
    }
    
    setMapLoaded(false);
    isInitialized.current = false;
  }, []);

  // Stable reference to prevent recreation
  const stableInitialCenter = useMemo(() => initialCenter, [initialCenter[0], initialCenter[1]]);
  const stableInitialZoom = useMemo(() => initialZoom, [initialZoom]);

  // Initialize map once with better stability
  useEffect(() => {
    if (!mapContainer.current || !isTokenValid || isInitialized.current) {
      return;
    }

    mapboxgl.accessToken = mapboxToken;
    
    try {
      // Disable telemetry more safely
      if (disableTelemetry) {
        try {
          if (mapboxgl.config) {
            mapboxgl.config.EVENTS_URL = '';
          }
        } catch (e) {
          // Silently continue
        }
      }
      
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: stableInitialCenter,
        zoom: stableInitialZoom,
        trackResize: true,
        attributionControl: false,
        collectResourceTiming: false,
        pitch: is3D ? 45 : 0,
        bearing: 0,
        antialias: true,
        preserveDrawingBuffer: true,
        failIfMajorPerformanceCaveat: false,
        // Additional stability options
        refreshExpiredTiles: false,
        fadeDuration: 0,
        crossSourceCollisions: false
      });

      map.current = mapInstance;
      isInitialized.current = true;

      // Add navigation controls
      mapInstance.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      // Add scale
      mapInstance.addControl(new mapboxgl.ScaleControl());

      // Enhanced WebGL context loss handling
      mapInstance.on('webglcontextlost', (e: mapboxgl.MapContextEvent) => {
        console.warn('WebGL context lost, preventing default...');
        if (e.originalEvent?.preventDefault) {
          e.originalEvent.preventDefault();
        }
        setMapLoaded(false);
        
        // Delay recovery to give browser time to recover
        setTimeout(() => {
          if (map.current && !isInitialized.current) {
            console.log('Attempting to recreate map after context loss...');
            cleanupMap();
            isInitialized.current = false;
          }
        }, 2000);
      });

      mapInstance.on('webglcontextrestored', () => {
        console.log('WebGL context restored');
        if (map.current && map.current.isStyleLoaded()) {
          setMapLoaded(true);
        }
      });

      // Add click handler for location selection
      if (onMapClick) {
        mapInstance.on('click', (e) => {
          onMapClick([e.lngLat.lng, e.lngLat.lat]);
        });
      }

      // Wait for map to load
      mapInstance.on('load', () => {
        console.log('Map loaded successfully');
        setMapLoaded(true);
        
        // Add 3D building layer if 3D mode is enabled
        if (is3D) {
          try {
            if (!mapInstance.getLayer('3d-buildings')) {
              mapInstance.addLayer({
                'id': '3d-buildings',
                'source': 'composite',
                'source-layer': 'building',
                'filter': ['==', 'extrude', 'true'],
                'type': 'fill-extrusion',
                'minzoom': 15,
                'paint': {
                  'fill-extrusion-color': '#aaa',
                  'fill-extrusion-height': [
                    'interpolate', ['linear'], ['zoom'],
                    15, 0,
                    15.05, ['get', 'height']
                  ],
                  'fill-extrusion-base': [
                    'interpolate', ['linear'], ['zoom'],
                    15, 0,
                    15.05, ['get', 'min_height']
                  ],
                  'fill-extrusion-opacity': 0.6
                }
              });
            }
          } catch (error) {
            console.warn('Could not add 3D effects:', error);
          }
        }
        
        // Call onMapLoad callback if provided
        if (onMapLoad) {
          onMapLoad(mapInstance);
        }
      });

      // Handle map errors but don't crash
      mapInstance.on('error', (e) => {
        console.warn('Map error (non-critical):', e);
      });

    } catch (error) {
      console.error('Error initializing Mapbox:', error);
      setIsTokenValid(false);
      localStorage.removeItem('mapbox_token');
      toast({
        title: "Map Error",
        description: "Failed to initialize map. Please check your token and try again.",
        variant: "destructive",
      });
    }

    // Return cleanup function
    return cleanupMap;
  }, [isTokenValid, mapboxToken, stableInitialCenter, stableInitialZoom, disableTelemetry, is3D, onMapLoad, onMapClick, toast, cleanupMap]);

  // Update markers effect - separate from initialization
  useEffect(() => {
    if (!map.current || !mapLoaded || !isInitialized.current) {
      return;
    }

    // Clear existing markers
    Object.values(markerRefs.current).forEach(marker => {
      try {
        marker.remove();
      } catch (error) {
        console.warn('Error removing marker:', error);
      }
    });
    markerRefs.current = {};

    // Add new markers
    markers.forEach(marker => {
      const { id, position, type, status } = marker;
      
      try {
        // Verify map is still valid
        if (!map.current || !map.current.getCanvas()) {
          return;
        }

        // Create marker element
        const el = document.createElement('div');
        el.className = 'flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer';
        
        if (renderCustomMarker) {
          // Use custom rendering if provided
          const customContent = renderCustomMarker(marker);
          el.appendChild(document.createElement('div'));
        } else {
          // Default marker styling
          if (type === 'vehicle') {
            // Create a realistic car-shaped icon with enhanced animations
            const isMoving = marker.isMoving || false;
            const batteryLevel = marker.batteryLevel || 50;
            const speed = marker.speed || 0;
            
            el.innerHTML = `
              <div class="relative transition-all duration-300 ${isMoving ? 'animate-pulse' : ''}">
                <svg width="40" height="28" viewBox="0 0 40 28" class="drop-shadow-lg">
                  <!-- Car shadow -->
                  <ellipse cx="20" cy="25" rx="16" ry="3" fill="currentColor" opacity="0.2"/>
                  
                  <!-- Car body with gradient -->
                  <defs>
                    <linearGradient id="carGradient-${marker.id}" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="currentColor" stop-opacity="1"/>
                      <stop offset="100%" stop-color="currentColor" stop-opacity="0.7"/>
                    </linearGradient>
                  </defs>
                  
                  <path 
                    d="M8 20 L32 20 Q35 20 35 17 L35 13 Q35 11 32 11 L28 11 L26 7 Q25 5 23 5 L17 5 Q15 5 14 7 L12 11 L8 11 Q5 11 5 13 L5 17 Q5 20 8 20 Z" 
                    fill="url(#carGradient-${marker.id})"
                  />
                  
                  <!-- Car windows with reflection -->
                  <path 
                    d="M14.5 7.5 L25.5 7.5 Q26.5 7.5 26.5 8.5 L26.5 10.5 L13.5 10.5 L13.5 8.5 Q13.5 7.5 14.5 7.5 Z" 
                    fill="rgba(135,206,235,0.9)"
                  />
                  <path 
                    d="M15 8 L25 8 Q25.5 8 25.5 8.5 L25.5 9.5 L14.5 9.5 L14.5 8.5 Q14.5 8 15 8 Z" 
                    fill="rgba(255,255,255,0.3)"
                  />
                  
                  <!-- Car wheels with rotation animation -->
                  <g class="${isMoving ? 'animate-spin' : ''}">
                    <circle cx="12" cy="20" r="3.5" fill="#333" stroke="#666" stroke-width="1"/>
                    <circle cx="12" cy="20" r="2" fill="#888"/>
                    <circle cx="12" cy="20" r="1" fill="#444"/>
                  </g>
                  
                  <g class="${isMoving ? 'animate-spin' : ''}">
                    <circle cx="28" cy="20" r="3.5" fill="#333" stroke="#666" stroke-width="1"/>
                    <circle cx="28" cy="20" r="2" fill="#888"/>
                    <circle cx="28" cy="20" r="1" fill="#444"/>
                  </g>
                  
                  <!-- Car headlights -->
                  <circle cx="32" cy="14" r="1.5" fill="white" opacity="0.9"/>
                  <circle cx="32" cy="16" r="1.5" fill="white" opacity="0.9"/>
                  
                  <!-- Car grille -->
                  <rect x="31" y="13" width="3" height="4" rx="1" fill="#444"/>
                  
                  ${isMoving ? `
                    <!-- Movement trail effect -->
                    <circle cx="5" cy="14" r="1" fill="currentColor" opacity="0.1" class="animate-ping"/>
                    <circle cx="3" cy="16" r="0.5" fill="currentColor" opacity="0.2" class="animate-ping"/>
                  ` : ''}
                </svg>
                
                <!-- Battery indicator -->
                <div class="absolute -top-2 -right-2 w-4 h-4 rounded-full border border-white flex items-center justify-center ${batteryLevel < 20 ? 'animate-pulse' : ''}">
                  <div class="w-3 h-3 rounded-full ${batteryLevel < 20 ? 'bg-red-500' : batteryLevel < 50 ? 'bg-orange-500' : 'bg-green-500'}">
                    <div 
                      class="bg-white rounded-full transition-all duration-500"
                      style="height: ${Math.max(10, batteryLevel)}%; width: 100%; margin-top: ${100 - Math.max(10, batteryLevel)}%"
                    ></div>
                  </div>
                </div>
                
                ${isMoving && speed > 0 ? `
                  <!-- Speed indicator -->
                  <div class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs bg-blue-500/20 text-blue-600 px-2 py-1 rounded-full ${speed > 50 ? 'animate-pulse' : speed > 20 ? 'animate-bounce' : ''}">
                    ${Math.round(speed)} km/h
                  </div>
                ` : ''}
                
                ${isMoving ? `
                  <!-- Movement particles -->
                  <div class="absolute inset-0 pointer-events-none">
                    <div class="absolute w-1 h-1 bg-blue-400 rounded-full animate-ping" style="left: 10%; top: 20%; animation-delay: 0ms;"></div>
                    <div class="absolute w-1 h-1 bg-blue-400 rounded-full animate-ping" style="left: 15%; top: 60%; animation-delay: 200ms;"></div>
                    <div class="absolute w-1 h-1 bg-blue-400 rounded-full animate-ping" style="left: 5%; top: 40%; animation-delay: 400ms;"></div>
                  </div>
                ` : ''}
              </div>
            `;
            
            if (status === 'low-battery') {
              el.classList.add('text-red-600');
            } else if (status === 'charging') {
              el.classList.add('text-green-600');
            } else if (isMoving) {
              el.classList.add('text-blue-500');
            } else {
              el.classList.add('text-blue-600');
            }
          } else if (type === 'charging-station') {
            el.innerHTML = `
              <div class="w-8 h-8 rounded-full shadow-lg flex items-center justify-center">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L13.09 8.26L22 9L13.09 15.74L12 22L10.91 15.74L2 9L10.91 8.26L12 2Z" 
                    stroke="currentColor" stroke-width="1" fill="currentColor"/>
                </svg>
              </div>
            `;
            
            if (status === 'available') {
              el.classList.add('bg-green-500', 'text-white');
            } else if (status === 'occupied') {
              el.classList.add('bg-yellow-500', 'text-white');
            } else {
              el.classList.add('bg-gray-500', 'text-white');
            }
          }
        }
        
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onMarkerClick?.(id);
        });
        
        // Create and add marker
        const newMarker = new mapboxgl.Marker({
          element: el,
          anchor: 'center'
        })
          .setLngLat(position)
          .addTo(map.current);
          
        markerRefs.current[id] = newMarker;
      } catch (error) {
        console.warn('Error creating marker:', error);
      }
    });
    
  }, [markers, onMarkerClick, renderCustomMarker, mapLoaded]);

  // Draw route effect - separate from markers with better stability
  useEffect(() => {
    if (!map.current || !mapLoaded || !routeCoordinates || routeCoordinates.length < 2) {
      // Only log when debugging is needed
      if (routeCoordinates && routeCoordinates.length > 0 && routeCoordinates.length < 2) {
        console.log('Route drawing skipped: insufficient coordinates');
      }
      return;
    }

    console.log('Starting route drawing with', routeCoordinates.length, 'coordinates');

    // Debounce route drawing to prevent rapid redrawing
    const timeoutId = setTimeout(() => {
      const drawRoute = () => {
        if (!map.current || !map.current.isStyleLoaded()) {
          console.warn('Map not ready for route drawing, retrying...');
          setTimeout(drawRoute, 200);
          return;
        }
        
        try {
          const routeSourceId = 'route-source';
          const routeLayerId = 'route-layer';
          const routeOutlineId = 'route-outline';

          console.log('Drawing route with', routeCoordinates.length, 'coordinates');

          // Remove existing route layers and source safely
          try {
            if (map.current.getLayer(routeLayerId)) {
              map.current.removeLayer(routeLayerId);
            }
            if (map.current.getLayer(routeOutlineId)) {
              map.current.removeLayer(routeOutlineId);
            }
            if (map.current.getSource(routeSourceId)) {
              map.current.removeSource(routeSourceId);
            }
          } catch (error) {
            console.warn('Error removing existing route (normal during cleanup):', error);
          }
          
          // Validate coordinates before drawing
          const validCoordinates = routeCoordinates.filter(coord => 
            Array.isArray(coord) && 
            coord.length === 2 && 
            typeof coord[0] === 'number' && 
            typeof coord[1] === 'number' &&
            !isNaN(coord[0]) && !isNaN(coord[1])
          );

          if (validCoordinates.length < 2) {
            console.warn('Invalid route coordinates, skipping draw');
            return;
          }
          
          // Add new route
          const routeGeoJSON = {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: validCoordinates
            }
          };
          
          map.current.addSource(routeSourceId, {
            type: 'geojson',
            data: routeGeoJSON as GeoJSON.Feature<GeoJSON.LineString>,
            lineMetrics: true
          });
          
          // Add route outline for better visibility (goes behind main route)
          map.current.addLayer({
            id: routeOutlineId,
            type: 'line',
            source: routeSourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#ffffff',
              'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                8, 6,
                15, 14
              ],
              'line-opacity': 0.8
            }
          });

          // Add main route line (goes on top)
          map.current.addLayer({
            id: routeLayerId,
            type: 'line',
            source: routeSourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                8, 4,
                15, 10
              ],
              'line-opacity': 1.0
            }
          });
          
          routeLayerRef.current = routeLayerId;
          console.log('Route successfully drawn on map');
          
          // Fit to bounds with better animation
          const bounds = new mapboxgl.LngLatBounds();
          
          validCoordinates.forEach(coord => {
            bounds.extend(coord);
          });
          
          // Always fit to route bounds for navigation
          if (!bounds.isEmpty()) {
            map.current.fitBounds(bounds, {
              padding: { top: 50, bottom: 50, left: 50, right: 50 },
              duration: 1500,
              maxZoom: 15
            });
            console.log('Map fitted to route bounds');
          }
          
        } catch (error) {
          console.error('Error drawing route:', error);
        }
      };
      
      drawRoute();
    }, 300); // Slightly increased debounce for better stability

    return () => {
      clearTimeout(timeoutId);
    };
  }, [routeCoordinates, mapLoaded]);

  // Handle token input
  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mapboxToken && mapboxToken !== 'REPLACE_WITH_YOUR_MAPBOX_TOKEN') {
      setMapboxToken(mapboxToken);
      setIsTokenValid(true);
      
      toast({
        title: "Mapbox Token Set",
        description: "The map will now load with your API token",
        duration: 3000,
      });
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMapboxTokenState(e.target.value);
  };

  if (!isTokenValid) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 border rounded-lg ${className}`}>
        <div className="w-full max-w-md p-6 glass-panel animate-fade-in">
          <h3 className="text-lg font-medium mb-4">Mapbox API Token Required</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Please enter your Mapbox API token to display the map. You can get a token from the 
            <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noreferrer" className="text-primary underline ml-1">
              Mapbox Dashboard
            </a>.
          </p>
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <input
              type="text"
              value={mapboxToken}
              onChange={handleTokenChange}
              placeholder="pk.eyJ1IjoieW91..."
              className="w-full p-2 border rounded"
            />
            <button 
              type="submit" 
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Load Map
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapContainer} className={`relative ${className}`}>
      {/* Loading indicator */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}
