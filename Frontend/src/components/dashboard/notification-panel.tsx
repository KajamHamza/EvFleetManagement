
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Bell,
  BatteryWarning,
  MapPin,
  Zap,
  X,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success';
  time: string;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationPanelProps {
  className?: string;
}

export function NotificationPanel({ className }: NotificationPanelProps) {
  const { toast } = useToast();
  
  // Mock notifications
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Low Battery Alert',
      message: 'Your vehicle battery is below 20%. Find a charging station soon.',
      type: 'warning',
      time: '5 minutes ago',
      read: false,
      action: {
        label: 'Find Station',
        onClick: () => {
          toast({
            title: "Navigating to Charging Stations",
            description: "Finding the nearest charging station...",
            duration: 3000,
          });
        }
      }
    },
    {
      id: '2',
      title: 'New Station Available',
      message: 'A new charging station has been added near your frequent route.',
      type: 'info',
      time: '2 hours ago',
      read: false,
      action: {
        label: 'View Details',
        onClick: () => {
          toast({
            title: "Station Details",
            description: "Opening station information...",
            duration: 3000,
          });
        }
      }
    },
    {
      id: '3',
      title: 'Charging Complete',
      message: 'Your vehicle is fully charged and ready to go.',
      type: 'success',
      time: '1 day ago',
      read: true,
    },
  ]);

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  // Remove a notification
  const removeNotification = (id: string) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return <BatteryWarning className="h-5 w-5 text-amber-500" />;
      case 'info':
        return <MapPin className="h-5 w-5 text-blue-500" />;
      case 'success':
        return <Zap className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={cn("glassmorphism p-4 rounded-xl", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <div className="ml-2 bg-primary text-primary-foreground text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </div>
          )}
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
            className="text-xs text-primary hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification.id}
              className={cn(
                "glassmorphism p-3 rounded-lg relative transition-all duration-200",
                !notification.read && "border-l-4 border-primary"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium">{notification.title}</h4>
                    <span className="text-xs text-muted-foreground">{notification.time}</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                  
                  {notification.action && (
                    <button 
                      onClick={notification.action.onClick}
                      className="flex items-center text-xs text-primary hover:underline mt-2"
                    >
                      {notification.action.label}
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </button>
                  )}
                </div>
                
                <div className="flex gap-1">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-1 hover:bg-accent rounded"
                      title="Mark as read"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="p-1 hover:bg-accent rounded"
                    title="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
