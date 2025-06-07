
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import AuthService from '@/services/auth-service';

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [selectedRole, setSelectedRole] = useState<'DRIVER' | 'STATION_MANAGER' | 'ADMIN' | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role: 'DRIVER' | 'STATION_MANAGER' | 'ADMIN') => {
    setSelectedRole(role);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole || !username || !password || !email || !firstName || !lastName) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      // Call the actual registration API
      const response = await AuthService.register({
        username,
        password,
        email,
        firstName,
        lastName,
        role: selectedRole
      });

      toast({
        title: "Account created",
        description: "Your account has been created successfully!",
      });

      // Redirect to onboarding or dashboard based on role
      if (selectedRole === 'DRIVER' || selectedRole === 'STATION_MANAGER') {
        navigate(`/onboarding/${selectedRole === 'DRIVER' ? 'driver' : 'manager'}`);
      } else {
        navigate('/system'); // Admin goes directly to dashboard
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: "Failed to create your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
              
              {step === 1 ? (
                <>
                  <h1 className="text-3xl font-bold mt-8 mb-2">Create an account</h1>
                  <p className="text-muted-foreground">Choose your account type to get started</p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold mt-8 mb-2">Complete your profile</h1>
                  <p className="text-muted-foreground">
                    Setting up your {selectedRole === 'DRIVER' ? 'driver' : 'station manager'} account
                  </p>
                </>
              )}
            </div>

            {step === 1 ? (
              <div className="space-y-4">
                <button
                  className="w-full p-4 border rounded-lg flex items-center hover:border-primary hover:bg-primary/5 transition-colors"
                  onClick={() => handleRoleSelect('DRIVER')}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-4">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-medium">EV Driver</h3>
                    <p className="text-sm text-muted-foreground">Find charging stations and manage your vehicle</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
                
                <button
                  className="w-full p-4 border rounded-lg flex items-center hover:border-primary hover:bg-primary/5 transition-colors"
                  onClick={() => handleRoleSelect('STATION_MANAGER')}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-4">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-medium">Station Manager</h3>
                    <p className="text-sm text-muted-foreground">Manage charging stations and monitor performance</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
                
                <div className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="First name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Last name"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Create a password"
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating account...' : 'Create account'}
                  </Button>
                </div>

                <div className="pt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm text-primary hover:underline"
                  >
                    Go back
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right side - Design */}
        <div className="hidden md:flex flex-1 bg-gradient-to-br from-blue-600 to-blue-800 justify-center items-center p-12 relative">
          <div className="max-w-md text-white">
            <h2 className="text-3xl font-bold mb-6">Join the electric revolution</h2>
            <p className="mb-8">
              Create an account to access the largest network of electric vehicle charging stations.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-white/20 rounded-full p-1 mt-0.5">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium">Real-time station availability</h3>
                  <p className="text-sm text-blue-100">Never wait in line for a charging spot again</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-white/20 rounded-full p-1 mt-0.5">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium">Smart route planning</h3>
                  <p className="text-sm text-blue-100">Optimize your journey with charging stops included</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-white/20 rounded-full p-1 mt-0.5">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium">{selectedRole === 'STATION_MANAGER' ? 'Station analytics' : 'Battery insights'}</h3>
                  <p className="text-sm text-blue-100">
                    {selectedRole === 'STATION_MANAGER' 
                      ? 'Track performance and revenue of your charging network' 
                      : 'Get detailed reports about your charging habits and battery health'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-4 right-4 text-white/60 text-sm">
            Join thousands of users worldwide
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
