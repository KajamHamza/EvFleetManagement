
import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface StatsCardProps {
  className?: string;
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  metric?: string;
}

export function StatsCard({
  className,
  title,
  value,
  icon,
  change,
  trend = 'neutral',
  metric,
}: StatsCardProps) {
  return (
    <div className={cn("glassmorphism p-4 rounded-xl", className)}>
      <div className="flex justify-between items-start">
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          <h4 className="text-2xl font-semibold mt-1 truncate">
            {value}
            {metric && <span className="text-sm font-normal ml-1">{metric}</span>}
          </h4>
          
          {change !== undefined && (
            <div className="flex items-center mt-1">
              {trend === 'up' && (
                <ChevronUp className="h-4 w-4 text-green-500" />
              )}
              {trend === 'down' && (
                <ChevronDown className="h-4 w-4 text-red-500" />
              )}
              <span 
                className={cn(
                  "text-sm font-medium",
                  trend === 'up' && "text-green-500",
                  trend === 'down' && "text-red-500",
                  trend === 'neutral' && "text-muted-foreground"
                )}
              >
                {change}%
              </span>
            </div>
          )}
        </div>
        
        <div className="bg-primary/10 p-2 rounded-lg shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}
