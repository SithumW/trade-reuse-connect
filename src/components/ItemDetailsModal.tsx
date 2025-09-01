import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useItemsByUser } from '@/hooks/useItems';
import { useCreateTradeRequest } from '@/hooks/useTradeRequests';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Calendar,
  User,
  Package,
  MessageSquare,
  Star,
  ArrowLeftRight,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { formatLocation, generateAvatar } from '@/utils/helpers';
import { calculateDistance } from '@/utils/location';
import "@/styles/components/ItemDetailsModal.css";

interface ItemDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  tradeRequestMode?: 'none' | 'accept-reject'; // New prop for trade request mode
  tradeRequestId?: string; // ID of the trade request if in trade mode
  onAcceptTrade?: (tradeId: string) => void;
  onRejectTrade?: (tradeId: string) => void;
}

export const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  item,
  tradeRequestMode = 'none',
  tradeRequestId,
  onAcceptTrade,
  onRejectTrade
}) => {
  console.log('ItemDetailsModal rendered with:', { isOpen, item });
  const { user, userLocation } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedTradeItem, setSelectedTradeItem] = useState<string>('');
  const [hasRequested, setHasRequested] = useState(false);

  // Trade request mutation
  const createTradeRequestMutation = useCreateTradeRequest();

  // Fetch user's own items for trade selection using the dedicated endpoint
  const { data: userItemsData } = useItemsByUser(user?.id || '');
  const myItems = userItemsData?.items?.filter(myItem => myItem.id !== item?.id) || [];

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentImageIndex(0);
      setSelectedTradeItem('');
      setHasRequested(false);
    }
  }, [isOpen, item?.id]);

  // Check if user has already requested trade for this item
  useEffect(() => {
    // TODO: Check if user has already made a trade request for this item
    // This would require an API call to check existing trade requests
    setHasRequested(false);
  }, [item?.id, user?.id]);

  const handlePreviousImage = () => {
    if (!item?.images || item.images.length === 0) return;
    setCurrentImageIndex((prev) => 
      prev === 0 ? item.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!item?.images || item.images.length === 0) return;
    setCurrentImageIndex((prev) => 
      prev === item.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleTradeRequest = async () => {
    if (!selectedTradeItem) {
      toast.error('Please select an item to offer for trade');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to request trades');
      return;
    }

    try {
      await createTradeRequestMutation.mutateAsync({
        requested_item_id: item.id,
        offered_item_id: selectedTradeItem
      });
      
      setHasRequested(true);
      setSelectedTradeItem('');
    } catch (error: any) {
      console.error('Failed to send trade request:', error);
      // Error handling is done in the mutation hook
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition?.toUpperCase()) {
      case 'NEW': return 'bg-green-100 text-green-800';
      case 'GOOD': return 'bg-blue-100 text-blue-800';
      case 'FAIR': return 'bg-yellow-100 text-yellow-800';
      case 'POOR': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDistance = () => {
    if (userLocation && item?.latitude && item?.longitude) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        item.latitude,
        item.longitude
      );
      return `${distance.toFixed(1)} km away`;
    }
    return formatLocation(item?.latitude, item?.longitude);
  };

  const getBadgeColorClass = (badge: string) => {
    switch (badge?.toUpperCase()) {
      case 'BRONZE': return 'bg-amber-600';
      case 'SILVER': return 'bg-gray-400';
      case 'GOLD': return 'bg-yellow-500';
      case 'DIAMOND': return 'bg-blue-400';
      case 'RUBY': return 'bg-red-500';
      default: return 'bg-amber-600';
    }
  };

  if (!item) return null;

  console.log('Rendering modal for item:', item);

  const images = item.images || [];
  const hasImages = images.length > 0;
  const isOwnItem = item.user?.id === user?.id;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {item.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Slideshow */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              {hasImages ? (
                <>
                  <img
                    src={images[currentImageIndex]}
                    alt={`${item.title} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {images.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                        onClick={handlePreviousImage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                        onClick={handleNextImage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Image Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((image: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                      currentImageIndex === index ? 'border-primary' : 'border-border'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Details */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={getConditionColor(item.condition)}>
                  {item.condition}
                </Badge>
                <Badge variant="outline">
                  {item.category}
                </Badge>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Owner Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={item.user.image || generateAvatar(item.user.email)}
                      alt={item.user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-medium ${getBadgeColorClass(item.user.badge || 'BRONZE')}`}>
                      {(item.user.badge || 'B')[0]}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.user.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.user.badge || 'BRONZE'} Trader
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">4.5</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location & Date */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{getDistance()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Posted on {formatDate(item.posted_at)}</span>
              </div>
            </div>

            {/* Trade Requests Count */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold text-primary">
                      {item._count?.trade_requests_for || 0} Trade Requests
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item._count?.trade_requests_for === 0 
                        ? 'Be the first to request a trade!' 
                        : 'This item is in demand!'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trade Request Section */}
            {!isOwnItem && tradeRequestMode === 'none' && (
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5" />
                  Request Trade
                </h3>

                {hasRequested ? (
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-8 w-8 text-yellow-600" />
                        <div>
                          <p className="font-semibold text-yellow-800">Trade Requested</p>
                          <p className="text-sm text-yellow-700">
                            You've already requested a trade for this item. The owner will review your request.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : myItems.length === 0 ? (
                  <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-8 w-8 text-orange-600" />
                        <div>
                          <p className="font-semibold text-orange-800">No Items to Trade</p>
                          <p className="text-sm text-orange-700">
                            You need to post at least one item before you can request trades.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Select an item to offer for trade:
                      </label>
                      <Select value={selectedTradeItem} onValueChange={setSelectedTradeItem}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose one of your items..." />
                        </SelectTrigger>
                        <SelectContent>
                          {myItems.map((myItem) => (
                            <SelectItem key={myItem.id} value={myItem.id}>
                              <div className="flex items-center gap-2">
                                <span className="truncate">{myItem.title}</span>
                                <Badge variant="outline" className="text-xs">
                                  {myItem.condition}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      onClick={handleTradeRequest}
                      disabled={!selectedTradeItem || createTradeRequestMutation.isPending}
                      className="w-full"
                      size="lg"
                    >
                      {createTradeRequestMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending Request...
                        </>
                      ) : (
                        <>
                          <ArrowLeftRight className="h-4 w-4 mr-2" />
                          Send Trade Request
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Trade Request Accept/Reject Section */}
            {tradeRequestMode === 'accept-reject' && tradeRequestId && (
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5" />
                  Trade Request Actions
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => onAcceptTrade?.(tradeRequestId)}
                    disabled={createTradeRequestMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {createTradeRequestMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Accept Request
                  </Button>
                  
                  <Button
                    onClick={() => onRejectTrade?.(tradeRequestId)}
                    disabled={createTradeRequestMutation.isPending}
                    variant="outline"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50"
                    size="lg"
                  >
                    {createTradeRequestMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mr-2" />
                    )}
                    Reject Request
                  </Button>
                </div>
              </div>
            )}

            {/* Own Item Notice */}
            {isOwnItem && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <User className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-800">This is your item</p>
                      <p className="text-sm text-blue-700">
                        You can manage this item from your "My Items" section.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
