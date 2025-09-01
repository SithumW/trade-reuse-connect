import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  useMyTrades, 
  useReceivedRequests, 
  useSentRequests,
  useAcceptTradeRequest,
  useRejectTradeRequest,
  useCancelTradeRequest,
  useCompleteTrade
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
  Loader2,
  Phone,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { getImageUrl } from '@/config/env';
import { generateAvatar } from '@/utils/helpers';
import "@/styles/components/MyTradesModal.css";

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
  const [activeTab, setActiveTab] = useState('received');
  const [revealedContacts, setRevealedContacts] = useState<Set<string>>(new Set());

  // API hooks with safe defaults
  const { data: myTrades = [], isLoading: tradesLoading, error: tradesError } = useMyTrades();
  const { data: receivedRequests = [], isLoading: receivedLoading, error: receivedError } = useReceivedRequests();
  const { data: sentRequests = [], isLoading: sentLoading, error: sentError } = useSentRequests();

  // Ensure all data are arrays
  const safeMyTrades = Array.isArray(myTrades) ? myTrades : [];
  const safeReceivedRequests = Array.isArray(receivedRequests) ? receivedRequests : [];
  const safeSentRequests = Array.isArray(sentRequests) ? sentRequests : [];

  // Filter sent requests to exclude accepted ones
  const pendingSentRequests = safeSentRequests.filter(request => request.status !== 'ACCEPTED');

  // Filter for accepted requests (both received and sent that are accepted - show all including completed)
  const acceptedRequests = [
    ...safeReceivedRequests.filter(request => 
      request.status === 'ACCEPTED'
    ),
    ...safeSentRequests.filter(request => 
      request.status === 'ACCEPTED'
    )
  ];

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
  const completeTradeRequest = useCompleteTrade();

  const isLoading = tradesLoading || receivedLoading || sentLoading;

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

  const handleCompleteTrade = async (requestId: string) => {
    try {
      await completeTradeRequest.mutateAsync(requestId);
    } catch (error) {
      console.error('Complete trade error:', error);
    }
  };

  const handleRevealContacts = (requestId: string) => {
    setRevealedContacts(prev => new Set(prev).add(requestId));
    toast.success('Contact information revealed');
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
  const TradeRequestCard = ({ 
    request, 
    type, 
    showContacts = false, 
    onRevealContacts,
    onCompleteTrade 
  }: { 
    request: TradeRequest; 
    type: 'sent' | 'received' | 'accepted'; 
    showContacts?: boolean;
    onRevealContacts?: (requestId: string) => void;
    onCompleteTrade?: (requestId: string) => void;
  }) => {
    const isReceived = type === 'received';
    const isAccepted = type === 'accepted';
    
    // For received requests: otherUser is the requester
    // For sent requests: otherUser should be the owner of the requested item
    const otherUser = isReceived 
      ? request.requester 
      : request.requested_item?.user || request.requester;
    
    const myItem = isReceived ? request.requested_item : request.offered_item;
    const theirItem = isReceived ? request.offered_item : request.requested_item;
    const isMutating = acceptTradeMutation.isPending || rejectTradeMutation.isPending || cancelTradeMutation.isPending || completeTradeRequest.isPending;

    // Safety check - if we don't have the required data, don't render
    if (!otherUser || !myItem || !theirItem) {
      console.warn('Missing required data for trade request:', { otherUser, myItem, theirItem, request });
      return null;
    }

    // Check if the trade is completed
    const isTradeCompleted = request.trade && request.trade.status === 'COMPLETED';

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
            <Badge className={`${
              isTradeCompleted 
                ? 'bg-green-100 text-green-800' 
                : getStatusColor(request.status)
            } flex items-center space-x-1`}>
              {isTradeCompleted ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Completed</span>
                </>
              ) : (
                <>
                  {getStatusIcon(request.status)}
                  <span className="capitalize">{request.status.toLowerCase()}</span>
                </>
              )}
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
                  {/* Show phone numbers for my item if contacts are revealed */}
                  {isAccepted  && myItem.phone_number && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <Phone className="h-3 w-3" />
                        <span>Phone: {myItem.phone_number}</span>
                      </div>
                      {myItem.whatsapp_number && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <MessageCircle className="h-3 w-3" />
                          <span>WhatsApp: {myItem.whatsapp_number}</span>
                        </div>
                      )}
                    </div>
                  )}
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
                  {/* Show phone numbers for their item if contacts are revealed */}
                  {isAccepted  && theirItem.phone_number && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <Phone className="h-3 w-3" />
                        <span>Phone: {theirItem.phone_number}</span>
                      </div>
                      {theirItem.whatsapp_number && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <MessageCircle className="h-3 w-3" />
                          <span>WhatsApp: {theirItem.whatsapp_number}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {/* Buttons for accepted requests */}
            {isAccepted && (
              <>
                {/* Show "Reveal Contacts" button for all accepted requests (completed or not) */}
                {! onRevealContacts && (
                  <Button
                    onClick={() => onRevealContacts(request.id)}
                    variant="outline"
                    className="flex-1"
                    size="sm"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Reveal Contacts
                  </Button>
                )}

                {/* Show "Complete Trade" button only for non-completed trades */}
                {!isTradeCompleted && onCompleteTrade && (
                  <Button
                    onClick={() => onCompleteTrade(request.id)}
                    disabled={completeTradeRequest.isPending}
                    className="flex-1"
                    size="sm"
                  >
                    {completeTradeRequest.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Complete Trade
                  </Button>
                )}

                {/* Show completed message for completed trades */}
                {isTradeCompleted && (
                  <div className="flex-1 flex items-center justify-center p-2 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm text-green-700 font-medium">Trade completed</span>
                  </div>
                )}
              </>
            )}

            {/* Original buttons for received requests */}
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
            
            {/* Button for pending sent requests */}
            {!isReceived && !isAccepted && request.status === 'PENDING' && (
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

            {/* View Item button - always show for all requests */}
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
            <TabsTrigger value="received" className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Received ({safeReceivedRequests.length})</span>
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Sent ({pendingSentRequests.length})</span>
            </TabsTrigger>
            <TabsTrigger value="accepted" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Accepted ({acceptedRequests.length})</span>
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
                {pendingSentRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">No sent requests</h3>
                    <p className="text-muted-foreground">Trade requests you send will appear here</p>
                  </div>
                ) : (
                  pendingSentRequests.map((request) => (
                    <TradeRequestCard key={request.id} request={request} type="sent" />
                  ))
                )}
              </TabsContent>

              <TabsContent value="accepted" className="space-y-4 mt-6">
                {acceptedRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">No accepted requests</h3>
                    <p className="text-muted-foreground">Accepted trade requests will appear here</p>
                  </div>
                ) : (
                  acceptedRequests.map((request) => (
                    <TradeRequestCard 
                      key={request.id} 
                      request={request} 
                      type="accepted"
                      showContacts={true}
                      onRevealContacts={handleRevealContacts}
                      onCompleteTrade={handleCompleteTrade}
                    />
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
