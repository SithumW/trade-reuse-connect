import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentLocation, storeUserLocation } from '@/utils/location';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationGranted: (location: { latitude: number; longitude: number }) => void;
  onLocationDenied: () => void;
}

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  isOpen,
  onClose,
  onLocationGranted,
  onLocationDenied,
}) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleAllowLocation = async () => {
    setIsGettingLocation(true);

    try {
      const location = await getCurrentLocation();
      storeUserLocation(location);
      onLocationGranted({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      toast.success('Location access granted! Items will be sorted by distance.');
      onClose();
    } catch (error: any) {
      console.error('Failed to get location:', error);
      
      if (error.message.includes('denied')) {
        toast.error('Location permission denied. You can enable it later in your browser settings.');
      } else {
        toast.error('Failed to get your location. Please try again or continue without location.');
      }
      
      onLocationDenied();
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSkipLocation = () => {
    onLocationDenied();
    onClose();
    toast.info('Continuing without location. Items will show coordinates instead of distances.');
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !isGettingLocation && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Enable Location Services
          </DialogTitle>
          <DialogDescription>
            Help us show you items sorted by distance and display how far items are from you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Benefits */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-medium text-sm">Benefits of sharing your location:</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-green-500" />
                  <span>Items sorted by distance to you</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <span>See "2.5km away" instead of coordinates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span>Find nearby traders faster</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Note */}
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <strong>Privacy:</strong> Your location is only used to calculate distances and is stored locally on your device. 
            It's not shared with other users or sent to our servers.
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleAllowLocation}
              disabled={isGettingLocation}
              className="w-full"
            >
              {isGettingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  Allow Location Access
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleSkipLocation}
              disabled={isGettingLocation}
              className="w-full"
            >
              Continue Without Location
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            You can change this setting later in your browser preferences.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
