
import React from 'react';
import { Sidebar } from "@/components/dashboard/sidebar";
import { 
  Shield, 
  User, 
  CreditCard, 
  Car, 
  Bell, 
  Monitor, 
  Moon, 
  Sun, 
  ChevronRight, 
  ToggleLeft,
  ToggleRight,
  MapPin,
  Lock,
  LogOut,
  HelpCircle,
  Building2
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { useLocation } from 'react-router-dom';

const Settings = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [notifications, setNotifications] = React.useState(true);
  const [locationTracking, setLocationTracking] = React.useState(true);
  const [batteryAlerts, setBatteryAlerts] = React.useState(true);
  const [stationUpdates, setStationUpdates] = React.useState(true);
  const [maintenanceAlerts, setMaintenanceAlerts] = React.useState(true);
  const [revenueReports, setRevenueReports] = React.useState(true);
  
  // Determine if we're on a manager page based on the URL or localStorage
  const isManager = location.pathname.includes('manager') || 
                    localStorage.getItem('user') && 
                    JSON.parse(localStorage.getItem('user') || '{}').role === 'manager';
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
      duration: 3000,
    });
    window.location.href = '/login';
  };
  
  const showComingSoonToast = () => {
    toast({
      title: "Coming Soon",
      description: "This feature is under development.",
      duration: 3000,
    });
  };
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    toast({
      title: `${theme === 'dark' ? 'Light' : 'Dark'} Mode Activated`,
      description: `The app is now in ${theme === 'dark' ? 'light' : 'dark'} mode.`,
      duration: 3000,
    });
  };

  // Different settings sections based on user role
  const driverSettingsSections = [
    {
      title: "Account",
      items: [
        {
          icon: User,
          label: "Personal Information",
          onClick: showComingSoonToast,
          description: "Update your name, email, and phone number"
        },
        {
          icon: Lock,
          label: "Security",
          onClick: showComingSoonToast,
          description: "Manage your password and 2FA settings"
        },
        {
          icon: CreditCard,
          label: "Payment Methods",
          onClick: showComingSoonToast,
          description: "Add or manage payment cards"
        }
      ]
    },
    {
      title: "Vehicle",
      items: [
        {
          icon: Car,
          label: "Vehicle Details",
          onClick: () => window.location.href = "/vehicle",
          description: "Update your vehicle model and specifications"
        },
        {
          icon: MapPin,
          label: "Default Locations",
          onClick: showComingSoonToast,
          description: "Set home, work, and favorite locations"
        }
      ]
    },
    {
      title: "Preferences",
      items: [
        {
          icon: theme === 'dark' ? Sun : Moon,
          label: "Dark Mode",
          toggle: true,
          value: theme === 'dark',
          onChange: toggleTheme,
          description: "Toggle between dark and light mode"
        }
      ]
    },
    {
      title: "Notifications",
      items: [
        {
          icon: Bell,
          label: "All Notifications",
          toggle: true,
          value: notifications,
          onChange: () => setNotifications(!notifications),
          description: "Enable or disable all notifications"
        },
        {
          icon: Car,
          label: "Battery Alerts",
          toggle: true,
          value: batteryAlerts,
          onChange: () => setBatteryAlerts(!batteryAlerts),
          description: "Receive alerts for low battery levels",
          disabled: !notifications
        },
        {
          icon: MapPin,
          label: "Station Updates",
          toggle: true,
          value: stationUpdates,
          onChange: () => setStationUpdates(!stationUpdates),
          description: "Get notified about charging station availability",
          disabled: !notifications
        },
        {
          icon: MapPin,
          label: "Location Tracking",
          toggle: true,
          value: locationTracking,
          onChange: () => setLocationTracking(!locationTracking),
          description: "Allow the app to track your location"
        }
      ]
    },
    {
      title: "Support",
      items: [
        {
          icon: HelpCircle,
          label: "Help Center",
          onClick: showComingSoonToast,
          description: "View FAQs and support articles"
        },
        {
          icon: LogOut,
          label: "Log Out",
          onClick: handleLogout,
          description: "Sign out of your account",
          danger: true
        }
      ]
    }
  ];

  const managerSettingsSections = [
    {
      title: "Account",
      items: [
        {
          icon: User,
          label: "Personal Information",
          onClick: showComingSoonToast,
          description: "Update your name, email, and phone number"
        },
        {
          icon: Lock,
          label: "Security",
          onClick: showComingSoonToast,
          description: "Manage your password and 2FA settings"
        },
        {
          icon: CreditCard,
          label: "Billing Information",
          onClick: showComingSoonToast,
          description: "View and update your billing details"
        }
      ]
    },
    {
      title: "Station Management",
      items: [
        {
          icon: Building2,
          label: "Station Details",
          onClick: () => window.location.href = "/station-management",
          description: "Update your charging station information"
        },
        {
          icon: MapPin,
          label: "Location Settings",
          onClick: showComingSoonToast,
          description: "Manage station locations and visibility"
        }
      ]
    },
    {
      title: "Preferences",
      items: [
        {
          icon: theme === 'dark' ? Sun : Moon,
          label: "Dark Mode",
          toggle: true,
          value: theme === 'dark',
          onChange: toggleTheme,
          description: "Toggle between dark and light mode"
        }
      ]
    },
    {
      title: "Notifications",
      items: [
        {
          icon: Bell,
          label: "All Notifications",
          toggle: true,
          value: notifications,
          onChange: () => setNotifications(!notifications),
          description: "Enable or disable all notifications"
        },
        {
          icon: Building2,
          label: "Maintenance Alerts",
          toggle: true,
          value: maintenanceAlerts,
          onChange: () => setMaintenanceAlerts(!maintenanceAlerts),
          description: "Receive alerts for station maintenance needs",
          disabled: !notifications
        },
        {
          icon: CreditCard,
          label: "Revenue Reports",
          toggle: true,
          value: revenueReports,
          onChange: () => setRevenueReports(!revenueReports),
          description: "Get regular reports on station revenue",
          disabled: !notifications
        },
        {
          icon: MapPin,
          label: "Location Tracking",
          toggle: true,
          value: locationTracking,
          onChange: () => setLocationTracking(!locationTracking),
          description: "Allow the app to track station locations"
        }
      ]
    },
    {
      title: "Support",
      items: [
        {
          icon: HelpCircle,
          label: "Help Center",
          onClick: showComingSoonToast,
          description: "View FAQs and support articles"
        },
        {
          icon: LogOut,
          label: "Log Out",
          onClick: handleLogout,
          description: "Sign out of your account",
          danger: true
        }
      ]
    }
  ];

  // Choose the correct settings based on user role
  const settingsSections = isManager ? managerSettingsSections : driverSettingsSections;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden pl-[70px] transition-all duration-300">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-semibold mb-6">Settings</h1>
            
            <div className="space-y-6">
              {settingsSections.map((section, index) => (
                <div key={index} className="glassmorphism rounded-xl p-5">
                  <h2 className="text-lg font-medium mb-4">{section.title}</h2>
                  
                  <div className="space-y-2">
                    {section.items.map((item, itemIndex) => (
                      <div 
                        key={itemIndex}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg transition-colors", 
                          item.danger ? "hover:bg-red-50 dark:hover:bg-red-900/10" : "hover:bg-accent",
                          item.disabled && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={!item.disabled && !item.toggle ? item.onClick : undefined}
                      >
                        <div className="flex items-center">
                          <div className={cn(
                            "p-2 rounded-full mr-3",
                            item.danger ? "text-red-500 bg-red-100 dark:bg-red-900/20" : "text-primary bg-primary/10"
                          )}>
                            <item.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className={cn(
                              "font-medium",
                              item.danger && "text-red-600 dark:text-red-400"
                            )}>
                              {item.label}
                            </div>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                            )}
                          </div>
                        </div>
                        
                        {item.toggle ? (
                          <Switch 
                            checked={item.value} 
                            onCheckedChange={!item.disabled ? item.onChange : undefined}
                            disabled={item.disabled}
                          />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
