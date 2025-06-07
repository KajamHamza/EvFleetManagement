
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Zap, ChevronRight, Car, Building2, CheckCircle, PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ChargingStationService from '@/services/charging-station-service';
import AuthService from '@/services/auth-service';

type UserRole = 'driver' | 'manager';

// Define station form interface
interface StationFormData {
  stationId: string;
  name: string;
  address: string;
  location: string;
  latitude: number;
  longitude: number;
  totalConnectors: number;
  availableConnectors: number;
  powerRating: number;
  pricePerKwh: number;
  operator: string;
  connectorTypes: string;
  active: boolean;
}

const DriverOnboarding = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(1);
  const [carModel, setCarModel] = useState('');
  const [batteryCapacity, setBatteryCapacity] = useState('');
  const [preferredConnector, setPreferredConnector] = useState('');
  const [chargingSpeed, setChargingSpeed] = useState('balanced');

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= i ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              {step > i ? <CheckCircle className="h-5 w-5" /> : i}
            </div>
            {i < 3 && (
              <div className={`w-full h-1 ${
                step > i ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
              }`}></div>
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <>
          <h2 className="text-2xl font-bold">Vehicle Information</h2>
          <p className="text-muted-foreground">Tell us about your electric vehicle</p>
          
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="carModel" className="block text-sm font-medium mb-1">
                Car Model
              </label>
              <input
                id="carModel"
                type="text"
                value={carModel}
                onChange={(e) => setCarModel(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md"
                placeholder="e.g. Tesla Model 3, Nissan Leaf"
              />
            </div>
            
            <div>
              <label htmlFor="batteryCapacity" className="block text-sm font-medium mb-1">
                Battery Capacity (kWh)
              </label>
              <input
                id="batteryCapacity"
                type="text"
                value={batteryCapacity}
                onChange={(e) => setBatteryCapacity(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md"
                placeholder="e.g. 75"
              />
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-2xl font-bold">Charging Preferences</h2>
          <p className="text-muted-foreground">Select your preferred charging settings</p>
          
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="connector" className="block text-sm font-medium mb-1">
                Preferred Connector Type
              </label>
              <select
                id="connector"
                value={preferredConnector}
                onChange={(e) => setPreferredConnector(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent"
              >
                <option value="">Select connector type</option>
                <option value="Type 2">Type 2</option>
                <option value="CCS">CCS (Combined Charging System)</option>
                <option value="CHAdeMO">CHAdeMO</option>
                <option value="Tesla">Tesla Connector</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Charging Speed Preference
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="speed" 
                    value="fast" 
                    checked={chargingSpeed === 'fast'}
                    onChange={() => setChargingSpeed('fast')}
                    className="mr-2" 
                  />
                  <span>Fast Charging (Priority)</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="speed" 
                    value="balanced" 
                    checked={chargingSpeed === 'balanced'}
                    onChange={() => setChargingSpeed('balanced')}
                    className="mr-2" 
                  />
                  <span>Balanced (Cost & Speed)</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="speed" 
                    value="economic" 
                    checked={chargingSpeed === 'economic'}
                    onChange={() => setChargingSpeed('economic')}
                    className="mr-2" 
                  />
                  <span>Economic (Lowest Cost)</span>
                </label>
              </div>
            </div>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h2 className="text-2xl font-bold">All Set!</h2>
          <p className="text-muted-foreground">Your driver profile has been created</p>
          
          <div className="py-8 flex flex-col items-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">Ready to go!</h3>
            <p className="text-center text-muted-foreground mb-6">
              Your driver profile has been created successfully. You can now access all features of the ChargeFlowMap platform.
            </p>
          </div>
        </>
      )}

      <div className="pt-4 flex justify-end">
        <Button onClick={nextStep}>
          {step === 3 ? 'Go to Dashboard' : 'Continue'}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const ManagerOnboarding = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(1);
  const [stations, setStations] = useState<StationFormData[]>([]);
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  
  // Initialize with one empty station
  useEffect(() => {
    if (stations.length === 0) {
      addStation();
    }
  }, []);

  const addStation = () => {
    const newStation: StationFormData = {
      stationId: `ST${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      name: '',
      address: '',
      location: '',
      latitude: 34.0, // Default latitude (can be Morocco's approximate latitude)
      longitude: -6.0, // Default longitude
      totalConnectors: 2,
      availableConnectors: 2,
      powerRating: 50,
      pricePerKwh: 0.35,
      operator: '',
      connectorTypes: 'Type2,CCS',
      active: true
    };
    setStations([...stations, newStation]);
  };

  const removeStation = (index: number) => {
    if (stations.length > 1) {
      const updatedStations = [...stations];
      updatedStations.splice(index, 1);
      setStations(updatedStations);
    } else {
      toast({
        title: "Cannot Remove",
        description: "You need at least one charging station.",
        variant: "destructive"
      });
    }
  };

  const updateStationField = (index: number, field: keyof StationFormData, value: string | number | boolean) => {
    const updatedStations = [...stations];
    updatedStations[index] = { ...updatedStations[index], [field]: value };
    setStations(updatedStations);
  };

  const handleConnectorTypesChange = (index: number, type: string, checked: boolean) => {
    const station = stations[index];
    let types = station.connectorTypes.split(',').filter(t => t.trim() !== '');
    
    if (checked && !types.includes(type)) {
      types.push(type);
    } else if (!checked && types.includes(type)) {
      types = types.filter(t => t !== type);
    }
    
    updateStationField(index, 'connectorTypes', types.join(','));
  };

  const isTypeSelected = (index: number, type: string) => {
    return stations[index].connectorTypes.split(',').includes(type);
  };

  const validateStations = () => {
    for (let i = 0; i < stations.length; i++) {
      const station = stations[i];
      if (!station.name || !station.address || !station.operator) {
        toast({
          title: "Missing Information",
          description: `Station ${i + 1} has missing required information.`,
          variant: "destructive"
        });
        return false;
      }
    }
    return true;
  };

  const submitStations = async () => {
    if (!validateStations()) return;
    
    setSubmitting(true);
    const token = AuthService.getToken();
    const results = [];
    let hasError = false;

    for (const station of stations) {
      try {
        const result = await ChargingStationService.createStation(station);
        results.push(result);
      } catch (error) {
        console.error(`Error creating station ${station.name}:`, error);
        hasError = true;
        toast({
          title: "Registration Error",
          description: `Failed to register station ${station.name}.`,
          variant: "destructive"
        });
      }
    }
    
    setSubmitting(false);
    
    if (results.length > 0 && !hasError) {
      setStep(3); // Move to success screen
    } else if (!hasError) {
      toast({
        title: "No Stations Registered",
        description: "Please add at least one station.",
        variant: "destructive"
      });
    }
  };

  const nextStep = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      submitStations();
    } else {
      onComplete();
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= i ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              {step > i ? <CheckCircle className="h-5 w-5" /> : i}
            </div>
            {i < 3 && (
              <div className={`w-full h-1 ${
                step > i ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
              }`}></div>
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <>
          <h2 className="text-2xl font-bold">Station Registration</h2>
          <p className="text-muted-foreground">Add your charging stations to the network</p>
          
          <div className="space-y-6 py-4">
            {stations.map((station, index) => (
              <div key={index} className="border p-4 rounded-md space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Station #{index + 1}</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeStation(index)}
                    disabled={stations.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Station ID</label>
                    <input
                      type="text"
                      value={station.stationId}
                      onChange={(e) => updateStationField(index, 'stationId', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md"
                      placeholder="Unique Station ID"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Station Name*</label>
                    <input
                      type="text"
                      value={station.name}
                      onChange={(e) => updateStationField(index, 'name', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md"
                      placeholder="Downtown Charging Hub"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Address*</label>
                    <input
                      type="text"
                      value={station.address}
                      onChange={(e) => updateStationField(index, 'address', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md"
                      placeholder="123 Main St, City"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Location/City*</label>
                    <input
                      type="text"
                      value={station.location}
                      onChange={(e) => updateStationField(index, 'location', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md"
                      placeholder="Rabat"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Operator*</label>
                    <input
                      type="text"
                      value={station.operator}
                      onChange={(e) => updateStationField(index, 'operator', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md"
                      placeholder="Your Company Name"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <Button variant="outline" onClick={addStation} className="w-full">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Another Station
            </Button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-2xl font-bold">Station Specifications</h2>
          <p className="text-muted-foreground">Configure technical details for your stations</p>
          
          <div className="space-y-6 py-4">
            {stations.map((station, index) => (
              <div key={index} className="border p-4 rounded-md space-y-4">
                <h3 className="text-lg font-medium">{station.name || `Station #${index + 1}`}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Coordinates</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={station.latitude}
                        onChange={(e) => updateStationField(index, 'latitude', parseFloat(e.target.value))}
                        className="w-1/2 p-2 border border-gray-300 dark:border-gray-700 rounded-md"
                        placeholder="Latitude"
                        step="0.0001"
                      />
                      <input
                        type="number"
                        value={station.longitude}
                        onChange={(e) => updateStationField(index, 'longitude', parseFloat(e.target.value))}
                        className="w-1/2 p-2 border border-gray-300 dark:border-gray-700 rounded-md"
                        placeholder="Longitude"
                        step="0.0001"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Power Rating (kW)</label>
                    <input
                      type="number"
                      value={station.powerRating}
                      onChange={(e) => updateStationField(index, 'powerRating', parseFloat(e.target.value))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md"
                      placeholder="50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Price per kWh ($)</label>
                    <input
                      type="number"
                      value={station.pricePerKwh}
                      onChange={(e) => updateStationField(index, 'pricePerKwh', parseFloat(e.target.value))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md"
                      placeholder="0.35"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Connectors</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={station.totalConnectors}
                        onChange={(e) => {
                          const total = parseInt(e.target.value);
                          updateStationField(index, 'totalConnectors', total);
                          // Update available connectors to match total if greater
                          if (station.availableConnectors > total) {
                            updateStationField(index, 'availableConnectors', total);
                          }
                        }}
                        className="w-1/2 p-2 border border-gray-300 dark:border-gray-700 rounded-md"
                        placeholder="Total"
                        min="1"
                      />
                      <input
                        type="number"
                        value={station.availableConnectors}
                        onChange={(e) => updateStationField(index, 'availableConnectors', parseInt(e.target.value))}
                        className="w-1/2 p-2 border border-gray-300 dark:border-gray-700 rounded-md"
                        placeholder="Available"
                        min="0"
                        max={station.totalConnectors}
                      />
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Connector Types</label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center">
                        <input 
                          type="checkbox"
                          checked={isTypeSelected(index, 'Type2')}
                          onChange={(e) => handleConnectorTypesChange(index, 'Type2', e.target.checked)}
                          className="mr-2" 
                        />
                        <span>Type 2</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox"
                          checked={isTypeSelected(index, 'CCS')}
                          onChange={(e) => handleConnectorTypesChange(index, 'CCS', e.target.checked)}
                          className="mr-2" 
                        />
                        <span>CCS</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox"
                          checked={isTypeSelected(index, 'CHAdeMO')}
                          onChange={(e) => handleConnectorTypesChange(index, 'CHAdeMO', e.target.checked)}
                          className="mr-2" 
                        />
                        <span>CHAdeMO</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox"
                          checked={isTypeSelected(index, 'Tesla')}
                          onChange={(e) => handleConnectorTypesChange(index, 'Tesla', e.target.checked)}
                          className="mr-2" 
                        />
                        <span>Tesla</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h2 className="text-2xl font-bold">All Set!</h2>
          <p className="text-muted-foreground">Your station manager profile has been created</p>
          
          <div className="py-8 flex flex-col items-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">Ready to manage your stations!</h3>
            <p className="text-center text-muted-foreground mb-6">
              Your charging stations have been registered successfully. You can now access all station management features of the ChargeFlowMap platform.
            </p>
          </div>
        </>
      )}

      <div className="pt-4 flex justify-end">
        <Button 
          onClick={nextStep} 
          disabled={submitting}
          className={submitting ? "opacity-50 cursor-not-allowed" : ""}
        >
          {submitting ? "Processing..." : step === 3 ? 'Go to Dashboard' : 'Continue'}
          {!submitting && <ChevronRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

const Onboarding = () => {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    // Validate role
    if (role === 'driver' || role === 'manager') {
      setUserRole(role);
    } else {
      toast({
        title: "Invalid role",
        description: "The specified role is not valid.",
        variant: "destructive"
      });
      navigate('/signup');
    }
    setLoading(false);
  }, [role, navigate, toast]);

  const handleOnboardingComplete = () => {
    // Set onboarding completed in user data
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      localStorage.setItem('user', JSON.stringify({
        ...user,
        onboardingCompleted: true
      }));
    }

    toast({
      title: "Onboarding completed",
      description: "Your profile has been set up successfully!",
    });

    // Redirect to appropriate dashboard
    if (userRole === 'driver') {
      navigate('/dashboard');
    } else if (userRole === 'manager') {
      navigate('/manager-dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <header className="border-b py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ChargeFlowMap</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-background rounded-xl shadow-sm border p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-4">
              {userRole === 'driver' ? (
                <Car className="h-6 w-6 text-primary" />
              ) : (
                <Building2 className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {userRole === 'driver' ? 'Driver' : 'Station Manager'} Onboarding
              </h1>
              <p className="text-muted-foreground">Let's set up your account</p>
            </div>
          </div>

          {userRole === 'driver' ? (
            <DriverOnboarding onComplete={handleOnboardingComplete} />
          ) : (
            <ManagerOnboarding onComplete={handleOnboardingComplete} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
