import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedVehicleMarkerProps {
  isMoving: boolean;
  batteryLevel: number;
  speed: number;
  className?: string;
}

export function AnimatedVehicleMarker({ 
  isMoving, 
  batteryLevel, 
  speed, 
  className 
}: AnimatedVehicleMarkerProps) {
  const [rotation, setRotation] = useState(0);

  // Animate rotation when moving
  useEffect(() => {
    if (!isMoving) return;

    const interval = setInterval(() => {
      setRotation(prev => (prev + 5) % 360);
    }, 100);

    return () => clearInterval(interval);
  }, [isMoving]);

  const getBatteryColor = () => {
    if (batteryLevel < 20) return 'text-red-600';
    if (batteryLevel < 50) return 'text-orange-600';
    return 'text-green-600';
  };

  const getSpeedIndicator = () => {
    if (speed > 50) return 'animate-pulse';
    if (speed > 20) return 'animate-bounce';
    return '';
  };

  return (
    <div className={cn("relative transition-all duration-300", className)}>
      {/* Vehicle body with smooth rotation */}
      <div 
        className={cn(
          "transition-transform duration-300",
          isMoving && "animate-pulse"
        )}
        style={{
          transform: isMoving ? `rotate(${rotation}deg)` : 'rotate(0deg)'
        }}
      >
        <svg width="40" height="28" viewBox="0 0 40 28" className="drop-shadow-lg">
          {/* Car shadow */}
          <ellipse cx="20" cy="25" rx="16" ry="3" fill="currentColor" opacity="0.2"/>
          
          {/* Car body with gradient */}
          <defs>
            <linearGradient id="carGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="1"/>
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.7"/>
            </linearGradient>
          </defs>
          
          <path 
            d="M8 20 L32 20 Q35 20 35 17 L35 13 Q35 11 32 11 L28 11 L26 7 Q25 5 23 5 L17 5 Q15 5 14 7 L12 11 L8 11 Q5 11 5 13 L5 17 Q5 20 8 20 Z" 
            fill="url(#carGradient)"
          />
          
          {/* Car windows with reflection */}
          <path 
            d="M14.5 7.5 L25.5 7.5 Q26.5 7.5 26.5 8.5 L26.5 10.5 L13.5 10.5 L13.5 8.5 Q13.5 7.5 14.5 7.5 Z" 
            fill="rgba(135,206,235,0.9)"
          />
          <path 
            d="M15 8 L25 8 Q25.5 8 25.5 8.5 L25.5 9.5 L14.5 9.5 L14.5 8.5 Q14.5 8 15 8 Z" 
            fill="rgba(255,255,255,0.3)"
          />
          
          {/* Car wheels with rotation animation */}
          <g className={isMoving ? "animate-spin" : ""}>
            <circle cx="12" cy="20" r="3.5" fill="#333" stroke="#666" strokeWidth="1"/>
            <circle cx="12" cy="20" r="2" fill="#888"/>
            <circle cx="12" cy="20" r="1" fill="#444"/>
          </g>
          
          <g className={isMoving ? "animate-spin" : ""}>
            <circle cx="28" cy="20" r="3.5" fill="#333" stroke="#666" strokeWidth="1"/>
            <circle cx="28" cy="20" r="2" fill="#888"/>
            <circle cx="28" cy="20" r="1" fill="#444"/>
          </g>
          
          {/* Car headlights */}
          <circle cx="32" cy="14" r="1.5" fill="white" opacity="0.9"/>
          <circle cx="32" cy="16" r="1.5" fill="white" opacity="0.9"/>
          
          {/* Car grille */}
          <rect x="31" y="13" width="3" height="4" rx="1" fill="#444"/>
          
          {/* Movement trail effect */}
          {isMoving && (
            <>
              <circle cx="5" cy="14" r="1" fill="currentColor" opacity="0.1" className="animate-ping"/>
              <circle cx="3" cy="16" r="0.5" fill="currentColor" opacity="0.2" className="animate-ping"/>
            </>
          )}
        </svg>
      </div>

      {/* Battery indicator */}
      <div className={cn(
        "absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold",
        getBatteryColor(),
        batteryLevel < 20 && "animate-pulse"
      )}>
        <div className={cn(
          "w-3 h-3 rounded-full",
          batteryLevel < 20 ? "bg-red-500" : batteryLevel < 50 ? "bg-orange-500" : "bg-green-500"
        )}>
          {/* Battery level indicator */}
          <div 
            className="bg-white rounded-full transition-all duration-500"
            style={{
              height: `${Math.max(10, batteryLevel)}%`,
              width: '100%',
              marginTop: `${100 - Math.max(10, batteryLevel)}%`
            }}
          />
        </div>
      </div>

      {/* Speed indicator */}
      {isMoving && speed > 0 && (
        <div className={cn(
          "absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs bg-blue-500/20 text-blue-600 px-2 py-1 rounded-full",
          getSpeedIndicator()
        )}>
          {Math.round(speed)} km/h
        </div>
      )}

      {/* Movement particles */}
      {isMoving && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{
            left: '10%',
            top: '20%',
            animationDelay: '0ms'
          }} />
          <div className="absolute w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{
            left: '15%',
            top: '60%',
            animationDelay: '200ms'
          }} />
          <div className="absolute w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{
            left: '5%',
            top: '40%',
            animationDelay: '400ms'
          }} />
        </div>
      )}
    </div>
  );
} 