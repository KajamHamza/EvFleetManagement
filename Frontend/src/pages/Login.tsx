import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import AuthService from '@/services/auth-service';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Using API service for login
      const response = await AuthService.login({
        username,
        password
      });
      
      // At this point, the response should always have a valid user object
      // due to the normalization in the AuthService
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${response.user.username}!`,
      });

      // Redirect based on user role
      if (response.user.role === 'DRIVER') {
        navigate('/dashboard');
      } else if (response.user.role === 'STATION_MANAGER') {
        navigate('/station-management');
      } else if (response.user.role === 'ADMIN') {
        navigate('/manager-dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.response?.data?.message || "Invalid credentials. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Sample users for demo purposes
  const sampleUsers = [
    { username: 'driver@example.com', password: 'password', role: 'DRIVER' },
    { username: 'manager@example.com', password: 'password', role: 'STATION_MANAGER' },
    { username: 'admin@example.com', password: 'password', role: 'ADMIN' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left side - Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <Link to="/" className="flex items-center space-x-2">
                <Zap className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">ChargeFlowMap</span>
              </Link>
              <h1 className="text-3xl font-bold mt-8 mb-2">Welcome back</h1>
              <p className="text-muted-foreground">Enter your credentials to access your account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-1">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-sm font-medium">
                    Password
                  </label>
                  <a href="#" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </div>

            <div className="mt-8 border-t pt-6">
              <p className="text-sm text-center text-muted-foreground mb-4">Demo accounts:</p>
              <div className="grid gap-2">
                {sampleUsers.map((demoUser) => (
                  <button
                    key={demoUser.username}
                    type="button"
                    onClick={() => {
                      setUsername(demoUser.username);
                      setPassword(demoUser.password);
                    }}
                    className="text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800 flex justify-between items-center"
                  >
                    <span className="font-medium">{demoUser.username}</span>
                    <span className="capitalize text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {demoUser.role.toLowerCase()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Design */}
        <div className="hidden md:flex flex-1 bg-gradient-to-br from-blue-600 to-blue-800 justify-center items-center p-12 relative">
          <div className="max-w-md text-white">
            <h2 className="text-3xl font-bold mb-6">Manage your EV charging network with ease</h2>
            <p className="mb-8">
              Access real-time data, optimize charging schedules, and improve the experience for drivers and station managers alike.
            </p>
            <div className="flex space-x-4">
              <div className="flex-1 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-3">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="font-medium mb-1">Real-time monitoring</h3>
                <p className="text-sm text-blue-100">Track station status and charging sessions as they happen</p>
              </div>
              <div className="flex-1 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-3">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <h3 className="font-medium mb-1">Actionable insights</h3>
                <p className="text-sm text-blue-100">Make data-driven decisions to optimize your network</p>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-4 right-4 text-white/60 text-sm">
            Illustration: Electric Charging Network
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
