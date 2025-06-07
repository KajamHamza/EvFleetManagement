
import React, { useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  Bell, 
  Filter, 
  XCircle, 
  Clock, 
  Zap, 
  Settings,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';

const Notifications = () => {
  const { toast } = useToast();
  const [filter, setFilter] = useState('all');
  const location = useLocation();
  const [filterOpen, setFilterOpen] = useState(false);
  
  // Determine if we're on a manager page based on the URL
  const isManager = location.pathname.includes('manager') || 
                    localStorage.getItem('user') && 
                    JSON.parse(localStorage.getItem('user') || '{}').role === 'manager';

  // Create different notifications based on user role
  const driverNotifications = [
    {
      id: 1,
      type: 'alert',
      title: 'Battery Low',
      description: 'Your vehicle battery is below 20%. Please consider charging soon.',
      time: '10 min ago',
      read: false
    },
    {
      id: 2,
      type: 'info',
      title: 'Rate Increase',
      description: 'Charging rates at Downtown Station will increase by $0.05/kWh starting next week.',
      time: '2 hours ago',
      read: false
    },
    {
      id: 3,
      type: 'success',
      title: 'Charging Complete',
      description: 'Your vehicle has been fully charged at Metro Station.',
      time: '1 day ago',
      read: true
    },
    {
      id: 4,
      type: 'info',
      title: 'New Station Added',
      description: 'A new fast charging station has been added near your frequent routes.',
      time: '2 days ago',
      read: true
    },
    {
      id: 5,
      type: 'alert',
      title: 'Scheduled Maintenance',
      description: 'Downtown Station will be unavailable on Saturday from 2-4 PM for scheduled maintenance.',
      time: '3 days ago',
      read: true
    }
  ];

  const managerNotifications = [
    {
      id: 1,
      type: 'alert',
      title: 'Charger Offline',
      description: 'Charger #3 at Downtown Station is reporting connectivity issues.',
      time: '15 min ago',
      read: false
    },
    {
      id: 2,
      type: 'success',
      title: 'Revenue Target Reached',
      description: 'Congratulations! Your station has met the monthly revenue target.',
      time: '1 hour ago',
      read: false
    },
    {
      id: 3,
      type: 'info',
      title: 'New EV Model Support',
      description: 'Software update available to support the latest EV models.',
      time: '3 hours ago',
      read: true
    },
    {
      id: 4,
      type: 'alert',
      title: 'Maintenance Required',
      description: 'Routine maintenance is due for chargers at Metro Hub within 5 days.',
      time: '1 day ago',
      read: true
    },
    {
      id: 5,
      type: 'info',
      title: 'Usage Analytics',
      description: 'Weekly usage report is now available. Your busiest time was Tuesday 5-7 PM.',
      time: '2 days ago',
      read: true
    },
    {
      id: 6,
      type: 'success',
      title: 'New Customer Registered',
      description: '5 new customers registered to use your charging network this week.',
      time: '3 days ago',
      read: true
    },
  ];

  // Choose the correct notifications based on user role
  const notifications = isManager ? managerNotifications : driverNotifications;
  
  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const markAllAsRead = () => {
    toast({
      title: "All notifications marked as read",
      description: "You've cleared all notifications",
    });
  };
  
  const markAsRead = (id: number) => {
    toast({
      title: "Notification marked as read",
      description: "This notification has been marked as read",
    });
  };
  
  const clearAll = () => {
    toast({
      title: "All notifications cleared",
      description: "You've removed all notifications",
    });
  };
  
  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'alert':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 pl-[70px] lg:pl-64 transition-all duration-300">
        <div className="container mx-auto p-4 md:p-6 max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-muted-foreground">
                {isManager 
                  ? "Stay updated with your charging station events and alerts" 
                  : "Stay updated with your charging and vehicle status"}
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
              <div className="relative">
                <Button 
                  variant="outline" 
                  className="flex items-center w-full md:w-auto"
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
                </Button>
                
                {filterOpen && (
                  <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-card z-10 border border-border">
                    <div className="py-1">
                      <button 
                        className={`px-4 py-2 text-sm w-full text-left hover:bg-accent ${filter === 'all' ? 'bg-accent/50' : ''}`}
                        onClick={() => {
                          setFilter('all');
                          setFilterOpen(false);
                        }}
                      >
                        All
                      </button>
                      <button 
                        className={`px-4 py-2 text-sm w-full text-left hover:bg-accent ${filter === 'info' ? 'bg-accent/50' : ''}`}
                        onClick={() => {
                          setFilter('info');
                          setFilterOpen(false);
                        }}
                      >
                        Information
                      </button>
                      <button 
                        className={`px-4 py-2 text-sm w-full text-left hover:bg-accent ${filter === 'alert' ? 'bg-accent/50' : ''}`}
                        onClick={() => {
                          setFilter('alert');
                          setFilterOpen(false);
                        }}
                      >
                        Alerts
                      </button>
                      <button 
                        className={`px-4 py-2 text-sm w-full text-left hover:bg-accent ${filter === 'success' ? 'bg-accent/50' : ''}`}
                        onClick={() => {
                          setFilter('success');
                          setFilterOpen(false);
                        }}
                      >
                        Success
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <Button variant="outline" onClick={markAllAsRead}>
                Mark all as read
              </Button>
              
              <Button variant="ghost" onClick={clearAll}>
                <XCircle className="h-4 w-4 mr-2" />
                Clear all
              </Button>
            </div>
          </div>
          
          {unreadCount > 0 && (
            <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="flex items-center text-sm">
                <Bell className="h-4 w-4 mr-2 text-primary" />
                You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
          )}
          
          <div className="space-y-4">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`
                    p-4 rounded-lg border transition-all duration-200
                    ${!notification.read ? 'bg-card shadow-md border-primary/20' : 'bg-card/50 border-border'}
                  `}
                >
                  <div className="flex items-start">
                    <div className={`p-2 rounded-full ${!notification.read ? 'bg-primary/10' : 'bg-muted'}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className={`font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {notification.time}
                        </span>
                      </div>
                      
                      <p className="text-sm mt-1 text-muted-foreground">
                        {notification.description}
                      </p>
                      
                      {!notification.read && (
                        <div className="mt-3 flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Mark as read
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-muted/50 h-20 w-20 rounded-full flex items-center justify-center mb-4">
                  <Bell className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">No notifications</h3>
                <p className="text-muted-foreground max-w-sm">
                  {filter !== 'all' 
                    ? `You don't have any ${filter} notifications at the moment.` 
                    : "You're all caught up! There are no notifications to display at the moment."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
