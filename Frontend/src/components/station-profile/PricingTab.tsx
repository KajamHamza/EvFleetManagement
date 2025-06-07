
import React from 'react';
import { Edit, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PricingTabProps {
  pricing: {
    standardRate: number;
    memberRate: number;
    peakHourRate: number;
    idleFee: number;
  };
}

export const PricingTab: React.FC<PricingTabProps> = ({ pricing }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Pricing Configuration</h3>
        <Button>
          <Edit className="h-4 w-4 mr-2" />
          Edit Pricing
        </Button>
      </div>
      
      <div className="glassmorphism rounded-xl overflow-hidden">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-muted-foreground">Standard Rate</div>
            <div className="text-2xl font-bold mt-1">${pricing.standardRate}/kWh</div>
            <div className="text-xs text-muted-foreground mt-1">
              Applied to all non-member users
            </div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground">Member Rate</div>
            <div className="text-2xl font-bold mt-1">${pricing.memberRate}/kWh</div>
            <div className="text-xs text-muted-foreground mt-1">
              Applied to registered members
            </div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground">Peak Hour Rate</div>
            <div className="text-2xl font-bold mt-1">${pricing.peakHourRate}/kWh</div>
            <div className="text-xs text-muted-foreground mt-1">
              Applied from 4PM to 8PM weekdays
            </div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground">Idle Fee</div>
            <div className="text-2xl font-bold mt-1">${pricing.idleFee}/min</div>
            <div className="text-xs text-muted-foreground mt-1">
              Applied after 10 minutes of charging completion
            </div>
          </div>
        </div>
      </div>
      
      <div className="glassmorphism rounded-xl p-6">
        <h3 className="font-semibold mb-4">Special Promotions</h3>
        <div className="text-center py-8">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <DollarSign className="h-6 w-6 text-muted-foreground" />
          </div>
          <h4 className="font-medium mb-2">No active promotions</h4>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
            You don't have any active pricing promotions. Create a promotion to attract more customers.
          </p>
          <Button>Create Promotion</Button>
        </div>
      </div>
    </div>
  );
};
