
import React from 'react';
import { cn } from '@/lib/utils';
import { Battery, BatteryCharging } from 'lucide-react';

interface BatteryWidgetProps {
  className?: string;
  level?: number; // battery percentage level
  capacity?: number; // battery capacity in kWh
  isCharging?: boolean;
}

export function BatteryWidget({ 
  className,
  level = 70,
  capacity = 100,
  isCharging = false 
}: BatteryWidgetProps) {
  // Calculate time remaining (mock calculation)
  const remainingHours = Math.round((capacity * (level / 100)) / 7); // Assuming 7kW discharge rate
  const remainingRange = Math.round((level / 100) * capacity * 4); // Assuming 4 miles per kWh

  // Determine battery color based on level
  const getBatteryColor = (level: number) => {
    if (level <= 20) return "text-red-500";
    if (level <= 40) return "text-amber-500";
    return "text-green-500";
  };

  return (
    <div className={cn("glassmorphism p-4 rounded-xl", className)}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Battery Status</h3>
        <div className={`${isCharging ? 'text-green-500' : getBatteryColor(level)}`}>
          {isCharging ? (
            <BatteryCharging className="h-6 w-6" />
          ) : (
            <Battery className="h-6 w-6" />
          )}
        </div>
      </div>
      
      <div className="flex justify-center mb-6">
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Circular progress background */}
          <div className="absolute inset-0 rounded-full border-8 border-muted opacity-20"></div>
          
          {/* Circular progress indicator */}
          <svg className="absolute inset-0 w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke={isCharging ? "rgb(34, 197, 94)" : level <= 20 ? "rgb(239, 68, 68)" : level <= 40 ? "rgb(245, 158, 11)" : "rgb(34, 197, 94)"}
              strokeWidth="8"
              strokeDasharray="289.02652413026095"
              strokeDashoffset={289.02652413026095 - (level / 100) * 289.02652413026095}
              strokeLinecap="round"
              className="transform transition-all duration-500 ease-in-out"
            ></circle>
          </svg>
          
          {/* Percentage text */}
          <div className="z-10 text-center">
            <p className="text-3xl font-bold">{level}%</p>
            <p className="text-xs text-muted-foreground">
              {isCharging ? "Charging" : "Remaining"}
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-accent/30 p-2 rounded-lg">
          <p className="text-xs text-muted-foreground">Est. Range</p>
          <p className="font-medium">{remainingRange} mi</p>
        </div>
        <div className="bg-accent/30 p-2 rounded-lg">
          <p className="text-xs text-muted-foreground">
            {isCharging ? "Time to Full" : "Time Left"}
          </p>
          <p className="font-medium">
            {isCharging 
              ? `${Math.round((100 - level) / 20)} hr` 
              : `${remainingHours} hr`}
          </p>
        </div>
        <div className="bg-accent/30 p-2 rounded-lg col-span-2">
          <p className="text-xs text-muted-foreground">Battery Capacity</p>
          <p className="font-medium">{capacity} kWh</p>
        </div>
      </div>
    </div>
  );
}
