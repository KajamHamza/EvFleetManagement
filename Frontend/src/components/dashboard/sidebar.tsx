import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Car, MapPin, BarChart2, Settings, Users, Shield, Bell, Menu, X, Bolt, Home,
  LogOut, Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import AuthService from '@/services/auth-service';

interface SidebarProps {
  className?: string;
}

// Define the user role type
type UserRole = 'driver' | 'manager' | 'admin';

export function Sidebar({ className }: SidebarProps) {
  // Use localStorage to persist the expanded state
  const getInitialState = () => {
    const savedState = localStorage.getItem('sidebar-expanded');
    // Default to expanded on desktop, collapsed on mobile
    if (savedState === null) {
      return window.innerWidth >= 768;
    }
    return savedState === 'true';
  };

  const [expanded, setExpanded] = useState(getInitialState);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Get user role from localStorage
  const getUserRole = (): UserRole => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        // Convert API role to sidebar role format
        if (user.role === 'DRIVER') return 'driver';
        if (user.role === 'STATION_MANAGER') return 'manager';
        if (user.role === 'ADMIN') return 'admin';
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
    
    // Default to driver if no valid role found
    return 'driver';
  };

  const [userRole, setUserRole] = useState<UserRole>(getUserRole());

  // Check if user is authenticated
  const isAuthenticated = () => {
    return localStorage.getItem('user') !== null;
  };

  // Update user role if localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setUserRole(getUserRole());
    };

    window.addEventListener('storage', handleStorageChange);
    // Also check on mount
    setUserRole(getUserRole());
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Save expanded state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebar-expanded', expanded.toString());
  }, [expanded]);

  // If on mobile, sidebar is collapsed by default
  useEffect(() => {
    if (isMobile) {
      setExpanded(false);
    }
  }, [isMobile]);

  const navItems = [
    {
      label: 'Driver Dashboard',
      icon: Home,
      href: '/dashboard',
      role: 'driver',
    },
    {
      label: 'Manager Dashboard',
      icon: Home,
      href: '/manager-dashboard',
      role: 'manager',
    },
    {
      label: 'Live Map',
      icon: MapPin,
      href: '/map',
      role: 'driver',
    },
    {
      label: 'Stations Map',
      icon: MapPin,
      href: '/manager-map',
      role: 'manager',
    },
    {
      label: 'My Vehicle',
      icon: Car,
      href: '/vehicle',
      role: 'driver',
    },
    {
      label: 'Charging Stations',
      icon: Bolt,
      href: '/stations',
      role: 'driver',
    },
    {
      label: 'Station Management',
      icon: BarChart2,
      href: '/station-management',
      role: 'manager',
    },
    {
      label: 'User Management',
      icon: Users,
      href: '/users',
      role: 'admin',
    },
    {
      label: 'System',
      icon: Shield,
      href: '/system',
      role: 'admin',
    },
    {
      label: 'Notifications',
      icon: Bell,
      href: '/notifications',
      role: 'all',
    },
    {
      label: 'Settings',
      icon: Settings,
      href: '/settings',
      role: 'all',
    },
  ];

  // Filter navigation items by user role
  const filteredNavItems = navItems.filter(
    item => item.role === 'all' || item.role === userRole
  );

  const handleNavigation = (href: string) => {
    navigate(href);
    
    // On mobile, collapse sidebar after navigation
    if (isMobile) {
      setExpanded(false);
    }
  };

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  const handleLogout = () => {
    AuthService.logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate('/login');
  };

  // Show a toast notification for features not yet implemented
  const showComingSoonToast = () => {
    toast({
      title: "Coming Soon",
      description: "This feature is under development.",
      duration: 3000,
    });
  };

  // Extract first name and role from user data
  const getUserInfo = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return {
          name: user.firstName || user.username || 'User',
          role: user.role || 'DRIVER'
        };
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
    return { name: 'User', role: 'DRIVER' };
  };

  const userInfo = getUserInfo();

  // If not authenticated and not on auth page, show limited sidebar
  const showFullSidebar = isAuthenticated() || 
    ['/login', '/signup', '/'].includes(location.pathname) ||
    location.pathname.startsWith('/onboarding/');

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && expanded && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm animate-fade-in" 
          onClick={() => setExpanded(false)}
        />
      )}
    
      {/* Toggle button (always visible on mobile) */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 bg-background/50 backdrop-blur-sm rounded-full shadow-md"
          onClick={toggleSidebar}
        >
          {expanded ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      )}
    
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 glassmorphism border-r border-border",
          expanded ? "w-64" : "w-[70px]",
          isMobile && !expanded && "-translate-x-full",
          isMobile && expanded && "translate-x-0",
          "transition-all duration-300 ease-in-out",
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo & collapse button */}
          <div className={cn(
            "flex items-center p-4",
            expanded ? "justify-between" : "justify-center"
          )}>
            {expanded ? (
              <div className="text-lg font-semibold text-primary">ChargeFlowMap</div>
            ) : (
              <div className="text-primary p-1">
                <Bolt size={24} />
              </div>
            )}
            
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="rounded-full hover:bg-accent"
              >
                {expanded ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          
          {/* Navigation */}
          {showFullSidebar && (
            <>
              <nav className="mt-8 flex-1 px-2 space-y-1">
                {filteredNavItems.map((item) => {
                  const isActive = location.pathname === item.href ||
                    (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                  
                  return (
                    <button
                      key={item.href}
                      onClick={() => {
                        // Check which pages have been implemented
                        if (['/map', '/dashboard', '/vehicle', '/stations', '/notifications', '/settings', '/station-management', '/manager-dashboard', '/manager-map'].includes(item.href)) {
                          handleNavigation(item.href);
                        } else {
                          showComingSoonToast();
                        }
                      }}
                      className={cn(
                        "flex items-center w-full px-3 py-2 text-left rounded-md transition-all duration-200",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        !expanded && "justify-center"
                      )}
                    >
                      <item.icon className={cn(
                        "flex-shrink-0",
                        expanded ? "mr-3 h-5 w-5" : "h-6 w-6"
                      )} />
                      
                      {expanded && (
                        <span className="text-sm font-medium">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </nav>
              
              {/* User section */}
              <div className={cn(
                "p-4 border-t border-border",
                expanded ? "flex items-center justify-between" : "flex flex-col items-center"
              )}>
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    {userRole === 'driver' && <Car size={16} />}
                    {userRole === 'manager' && <BarChart2 size={16} />}
                    {userRole === 'admin' && <Shield size={16} />}
                  </div>
                  
                  {expanded && (
                    <div className="ml-3">
                      <p className="text-sm font-medium">
                        {userInfo.name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {userRole}
                      </p>
                    </div>
                  )}
                </div>
                
                {expanded && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <LogOut size={18} />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
