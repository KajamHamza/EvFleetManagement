
import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ChevronRight, BatteryCharging, Clock, MapPin, ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ChargeFlowMap</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Log in
            </Link>
            <Link to="/signup">
              <Button size="sm">
                Sign up
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Streamline Your EV Charging Experience
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            ChargeFlowMap connects drivers with charging stations for seamless management
            and optimal efficiency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Log in
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-4 mt-8">
            <div className="flex items-center gap-2 text-sm">
              <BatteryCharging className="h-4 w-4 text-primary" />
              <span>Smart charging</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              <span>Real-time data</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-primary" />
              <span>Secure platform</span>
            </div>
          </div>
        </div>
        <div className="flex-1 max-w-lg">
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-1 rounded-2xl">
            <img 
              src="/tesla.jpg" 
              alt="EV Charging Dashboard" 
              className="rounded-xl w-full h-auto"
            />
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 bg-accent/50 rounded-3xl my-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Powerful Features for Everyone</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Whether you're a driver looking for the nearest charging station or a station manager
            optimizing your network, ChargeFlowMap has you covered.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-background p-6 rounded-xl hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <BatteryCharging className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">For Drivers</h3>
            <p className="text-muted-foreground mb-4">
              Find charging stations, check availability, and manage your charging sessions all in one place.
            </p>
            <Link to="/signup" className="flex items-center text-primary font-medium story-link">
              <span>Start driving smarter</span>
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          {/* Feature 2 */}
          <div className="bg-background p-6 rounded-xl hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">For Station Managers</h3>
            <p className="text-muted-foreground mb-4">
              Monitor your charging stations, view real-time data, and optimize your operation.
            </p>
            <Link to="/signup" className="flex items-center text-primary font-medium story-link">
              <span>Manage your stations</span>
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          {/* Feature 3 */}
          <div className="bg-background p-6 rounded-xl hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">For Administrators</h3>
            <p className="text-muted-foreground mb-4">
              Oversee the entire charging network, manage users, and ensure system security.
            </p>
            <Link to="/signup" className="flex items-center text-primary font-medium story-link">
              <span>Administer with confidence</span>
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Testimonials - removed the map section */}
      
      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="bg-primary/10 rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to transform your EV charging experience?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of drivers and station managers who are already using ChargeFlowMap to streamline their EV charging experience.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/signup">
              <Button size="lg">
                Sign up now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">
                Log in
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">ChargeFlowMap</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Contact Us</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">About</a>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground mt-8">
            &copy; {new Date().getFullYear()} ChargeFlowMap. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
