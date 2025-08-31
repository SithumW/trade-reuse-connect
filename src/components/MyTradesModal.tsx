import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  useMyTrades, 
  useReceivedRequests, 
  useSentRequests,
  useAcceptTradeRequest,
  useRejectTradeRequest,
  useCancelTradeRequest
} from '@/hooks/useTradeRequests';
import { TradeRequest, Trade } from '@/types/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ProfileModal from '@/components/ProfileModal';
import { 
  ArrowRightLeft,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Calendar,
  Package,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { getImageUrl } from '@/config/env';
import { generateAvatar } from '@/utils/helpers';

interface MyTradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewItem?: (item: any) => void;
}

export const MyTradesModal: React.FC<MyTradesModalProps> = ({
  isOpen,
  onClose,
  onViewItem
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');

  // API hooks with safe defaults
  const { data: myTrades = [], isLoading: tradesLoading, error: tradesError } = useMyTrades();
  const { data: receivedRequests = [], isLoading: receivedLoading, error: receivedError } = useReceivedRequests();
  const { data: sentRequests = [], isLoading: sentLoading, error: sentError } = useSentRequests();

  // Ensure all data are arrays
  const safeMyTrades = Array.isArray(myTrades) ? myTrades : [];
  const safeReceivedRequests = Array.isArray(receivedRequests) ? receivedRequests : [];
  const safeSentRequests = Array.isArray(sentRequests) ? sentRequests : [];

  // Log errors for debugging
  React.useEffect(() => {
    if (tradesError) console.error('Trades error:', tradesError);
    if (receivedError) console.error('Received requests error:', receivedError);
    if (sentError) console.error('Sent requests error:', sentError);
  }, [tradesError, receivedError, sentError]);

  // Mutation hooks
  const acceptTradeMutation = useAcceptTradeRequest();
  const rejectTradeMutation = useRejectTradeRequest();
  const cancelTradeMutation = useCancelTradeRequest();

  const isLoading = tradesLoading || receivedLoading || sentLoading;

  // Combine different types of data for "All Trades" tab
  // Convert trade requests to a common format for display
  const allTradesData: Array<
    | { type: 'trade'; data: Trade }
    | { type: 'request_received'; data: TradeRequest }
    | { type: 'request_sent'; data: TradeRequest }
  > = [
    ...safeMyTrades.map((trade): { type: 'trade'; data: Trade } => ({ type: 'trade', data: trade })),
    ...safeReceivedRequests.map((req): { type: 'request_received'; data: TradeRequest } => ({ type: 'request_received', data: req })),
    ...safeSentRequests.map((req): { type: 'request_sent'; data: TradeRequest } => ({ type: 'request_sent', data: req }))
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'accepted': case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': case 'failed': return <XCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleAcceptTrade = async (tradeId: string) => {
    try {
      await acceptTradeMutation.mutateAsync(tradeId);
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Accept trade error:', error);
    }
  };

  const handleRejectTrade = async (tradeId: string) => {
    try {
      await rejectTradeMutation.mutateAsync(tradeId);
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Reject trade error:', error);
    }
  };

  const handleCancelTrade = async (tradeId: string) => {
    try {
      await cancelTradeMutation.mutateAsync(tradeId);
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Cancel trade error:', error);
    }
  };

  const handleViewItem = (item: any) => {
    if (onViewItem) {
      // Transform the item data to match the expected structure
      const transformedItem = {
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        condition: item.condition.toLowerCase(),
        images: item.images?.map((img: any) => img.url) || [],
        location: 'Location not available',
        postedAt: new Date().toISOString(),
        user: item.user || {
          id: '1',
          name: 'Unknown User',
          image: null,
          badge: 'BRONZE',
          rating: 4.5
        },
        tradeRequests: 0
      };
      onViewItem(transformedItem);
    }
  };

  // Trade Request Card Component
  const TradeRequestCard = ({ request, type }: { request: TradeRequest; type: 'sent' | 'received' }) => {
    const isReceived = type === 'received';
    
    // For received requests: otherUser is the requester
    // For sent requests: otherUser should be the owner of the requested item
    const otherUser = isReceived 
      ? request.requester 
      : request.requested_item?.user || request.requester;
    
    const myItem = isReceived ? request.requested_item : request.offered_item;
    const theirItem = isReceived ? request.offered_item : request.requested_item;
    const isMutating = acceptTradeMutation.isPending || rejectTradeMutation.isPending || cancelTradeMutation.isPending;

    // Safety check - if we don't have the required data, don't render
    if (!otherUser || !myItem || !theirItem) {
      console.warn('Missing required data for trade request:', { otherUser, myItem, theirItem, request });
      return null;
    }

    return (
      <Card className="mb-4">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ProfileModal 
                user={otherUser}
                trigger={
                  <Button variant="ghost" size="sm" className="h-auto p-1 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={otherUser.image || undefined} />
                      <AvatarFallback>
                        {(otherUser.name || 'Unknown').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                }
              />
              <div>
                <p className="font-semibold">{otherUser.name || 'Unknown User'}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(request.requested_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Badge className={`${getStatusColor(request.status)} flex items-center space-x-1`}>
              {getStatusIcon(request.status)}
              <span className="capitalize">{request.status.toLowerCase()}</span>
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* My Item */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">
                {isReceived ? 'Your Item' : 'Your Offer'}
              </h4>
              <div className="flex space-x-3 p-3 border rounded-lg">
                <img
                  src={getImageUrl(myItem.images?.[0]?.url) || '/placeholder.svg'}
                  alt={myItem.title || 'Item'}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h5 className="font-semibold text-sm">{myItem.title || 'Unknown Item'}</h5>
                  <Badge variant="outline" className="text-xs mt-1">
                    {myItem.category || 'Unknown'}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {(myItem.condition || 'GOOD').toLowerCase().replace('_', ' ')} condition
                  </p>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center">
              <ArrowRightLeft className="h-6 w-6 text-muted-foreground" />
            </div>

            {/* Their Item */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">
                {isReceived ? 'Their Offer' : 'Requested Item'}
              </h4>
              <div className="flex space-x-3 p-3 border rounded-lg">
                <img
                  src={getImageUrl(theirItem.images?.[0]?.url) || '/placeholder.svg'}
                  alt={theirItem.title || 'Item'}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h5 className="font-semibold text-sm">{theirItem.title || 'Unknown Item'}</h5>
                  <Badge variant="outline" className="text-xs mt-1">
                    {theirItem.category || 'Unknown'}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {(theirItem.condition || 'GOOD').toLowerCase().replace('_', ' ')} condition
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {isReceived && request.status === 'PENDING' && (
              <>
                <Button
                  onClick={() => handleAcceptTrade(request.id)}
                  disabled={isMutating}
                  className="flex-1"
                  size="sm"
                >
                  {acceptTradeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Accept Request
                </Button>
                <Button
                  onClick={() => handleRejectTrade(request.id)}
                  disabled={isMutating}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  {rejectTradeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject Request
                </Button>
              </>
            )}
            
            {!isReceived && request.status === 'PENDING' && (
              <Button
                onClick={() => handleCancelTrade(request.id)}
                disabled={isMutating}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                {cancelTradeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Cancel Request
              </Button>
            )}

            <Button
              onClick={() => handleViewItem(isReceived ? theirItem : theirItem)}
              variant="outline"
              size="sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Item
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Trade Card Component (for completed trades)
  const TradeCard = ({ trade }: { trade: Trade }) => {
    const isRequester = trade.requester_id === user?.id;
    const otherUser = isRequester ? trade.owner : trade.requester;
    const myItem = isRequester ? trade.offered_item : trade.requested_item;
    const theirItem = isRequester ? trade.requested_item : trade.offered_item;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ProfileModal 
                user={otherUser}
                trigger={
                  <Button variant="ghost" size="sm" className="h-auto p-1 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={otherUser.image} />
                      <AvatarFallback>
                        {otherUser.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                }
              />
              <div>
                <p className="font-semibold">{otherUser.name}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(trade.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Badge className={`${getStatusColor(trade.status)} flex items-center space-x-1`}>
              {getStatusIcon(trade.status)}
              <span className="capitalize">{trade.status.toLowerCase()}</span>
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* My Item */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Your Item</h4>
              <div className="flex space-x-3 p-3 border rounded-lg">
                <img
                  src={getImageUrl(myItem.images?.[0]?.url) || '/placeholder.svg'}
                  alt={myItem.title || 'Item'}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h5 className="font-semibold text-sm">{myItem.title || 'Unknown Item'}</h5>
                  <Badge variant="outline" className="text-xs mt-1">
                    {myItem.category || 'Unknown'}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {(myItem.condition || 'GOOD').toLowerCase().replace('_', ' ')} condition
                  </p>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center">
              <ArrowRightLeft className="h-6 w-6 text-muted-foreground" />
            </div>

            {/* Their Item */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Their Item</h4>
              <div className="flex space-x-3 p-3 border rounded-lg">
                <img
                  src={getImageUrl(theirItem.images?.[0]?.url) || '/placeholder.svg'}
                  alt={theirItem.title || 'Item'}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h5 className="font-semibold text-sm">{theirItem.title || 'Unknown Item'}</h5>
                  <Badge variant="outline" className="text-xs mt-1">
                    {theirItem.category || 'Unknown'}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {(theirItem.condition || 'GOOD').toLowerCase().replace('_', ' ')} condition
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* View Button */}
          <div className="flex space-x-2">
            <Button
              onClick={() => handleViewItem(theirItem)}
              variant="outline"
              size="sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Item
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ArrowRightLeft className="h-5 w-5" />
            <span>My Trades</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>All Trades ({allTradesData.length})</span>
            </TabsTrigger>
            <TabsTrigger value="received" className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Received ({safeReceivedRequests.length})</span>
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Sent ({safeSentRequests.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your trades...</p>
            </div>
          )}

          {/* Error State */}
          {(tradesError || receivedError || sentError) && !isLoading && (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Failed to load trades</h3>
              <p className="text-muted-foreground">Please try again later</p>
            </div>
          )}

          {/* Tab Contents - only show when not loading and no errors */}
          {!isLoading && !tradesError && !receivedError && !sentError && (
            <>
              <TabsContent value="all" className="space-y-4 mt-6">
                {allTradesData.length === 0 ? (
                  <div className="text-center py-8">
                    <ArrowRightLeft className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">No trades yet</h3>
                    <p className="text-muted-foreground">Your trade requests will appear here</p>
                  </div>
                ) : (
                  allTradesData.map((item) => 
                    item.type === 'trade' ? (
                      <TradeCard key={`trade-${item.data.id}`} trade={item.data} />
                    ) : (
                      <TradeRequestCard 
                        key={`request-${item.data.id}`} 
                        request={item.data} 
                        type={item.type === 'request_received' ? 'received' : 'sent'} 
                      />
                    )
                  )
                )}
              </TabsContent>

              <TabsContent value="received" className="space-y-4 mt-6">
                {safeReceivedRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">No received requests</h3>
                    <p className="text-muted-foreground">Trade requests you receive will appear here</p>
                  </div>
                ) : (
                  safeReceivedRequests.map((request) => (
                    <TradeRequestCard key={request.id} request={request} type="received" />
                  ))
                )}
              </TabsContent>

              <TabsContent value="sent" className="space-y-4 mt-6">
                {safeSentRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">No sent requests</h3>
                    <p className="text-muted-foreground">Trade requests you send will appear here</p>
                  </div>
                ) : (
                  safeSentRequests.map((request) => (
                    <TradeRequestCard key={request.id} request={request} type="sent" />
                  ))
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
