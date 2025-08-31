import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/user";
import { User, UserProfile, RatingStats, Trade, Rating } from "@/types/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  User as UserIcon,
  Star,
  Award,
  MapPin,
  Calendar,
  Trophy,
  Package,
  Handshake,
  MessageSquare,
  TrendingUp,
  Users,
  ArrowRightLeft,
  Send
} from "lucide-react";
import { toast } from "sonner";
import { getImageUrl } from "@/config/env";

interface ProfileModalProps {
  userId?: string;
  user?: User; // For displaying minimal user data immediately
  trigger?: React.ReactNode;
  isCurrentUser?: boolean;
  completedTrades?: Trade[]; // Pass completed trades from parent
  userRatings?: Rating[]; // Pass user ratings from parent
  onFetchProfileData?: (userId: string) => void; // Callback to trigger data fetch in parent
}

// Badge configuration
const badgeConfig = {
  BRONZE: { 
    label: "Bronze Trader", 
    color: "bg-amber-600",
    icon: "🥉",
    description: "Starting your trading journey"
  },
  SILVER: { 
    label: "Silver Trader", 
    color: "bg-slate-400",
    icon: "🥈", 
    description: "Experienced community member"
  },
  GOLD: { 
    label: "Gold Trader", 
    color: "bg-yellow-500",
    icon: "🥇",
    description: "Trusted and active trader"
  },
  DIAMOND: { 
    label: "Diamond Trader", 
    color: "bg-cyan-400",
    icon: "💎",
    description: "Elite community leader"
  },
  RUBY: { 
    label: "Ruby Trader", 
    color: "bg-red-500",
    icon: "💎",
    description: "Master trader, community champion"
  }
};

const ProfileModal = ({ 
  userId, 
  user, 
  trigger, 
  isCurrentUser = false,
  completedTrades = [],
  userRatings = [],
  onFetchProfileData
}: ProfileModalProps) => {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  // Rating form state
  const [ratingForms, setRatingForms] = useState<Record<string, { rating: number; comment: string; isSubmitting: boolean }>>({});

  // Use provided user data or current user if it's the current user
  const displayUser = user || (isCurrentUser ? currentUser : null);
  const profileUserId = userId || displayUser?.id || '';

  const fetchProfileData = async () => {
    if (!profileUserId || isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      let profileData: UserProfile;
      
      if (isCurrentUser) {
        profileData = await userService.getMyProfile();
      } else {
        profileData = await userService.getUserProfile(profileUserId);
      }
      
      setProfile(profileData);

      // Fetch rating stats
      const stats = await userService.getUserRatingStats(profileUserId);
      setRatingStats(stats);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProfileData();
    }
  }, [isOpen, profileUserId]);

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const renderBadgeInfo = (badge: string) => {
    const config = badgeConfig[badge as keyof typeof badgeConfig];
    if (!config) return null;

    return (
      <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border">
        <div className="text-3xl">{config.icon}</div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <Badge className={`${config.color} text-white font-semibold`}>
              {config.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
      </div>
    );
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="h-auto p-0">
      <Avatar className="h-8 w-8">
        <AvatarImage src={displayUser?.image} alt={displayUser?.name} />
        <AvatarFallback>
          {displayUser?.name?.slice(0, 2).toUpperCase() || '??'}
        </AvatarFallback>
      </Avatar>
    </Button>
  );

  // Update the handleSubmitRating function
  const handleSubmitRating = async (tradeId: string, ratedUserId?: string) => {
    console.log('handleSubmitRating called with:', { tradeId, ratedUserId, currentUserId: currentUser?.id });
    
    if (!ratedUserId || !currentUser?.id) {
      toast.error('Unable to submit rating - missing user information');
      console.error('Missing required IDs:', { ratedUserId, currentUserId: currentUser?.id });
      return;
    }

    // Prevent rating yourself
    if (ratedUserId === currentUser.id) {
      toast.error('You cannot rate yourself');
      console.error('Attempted self-rating:', { ratedUserId, currentUserId: currentUser.id });
      return;
    }

    const ratingForm = ratingForms[tradeId];
    if (!ratingForm || ratingForm.rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    // Set submitting state
    setRatingForms(prev => ({
      ...prev,
      [tradeId]: { ...ratingForm, isSubmitting: true }
    }));

    try {
      const ratingData = {
        trade_id: tradeId,
        reviewee_id: ratedUserId,
        rating: ratingForm.rating,
        comment: ratingForm.comment.trim() || undefined
      };

      console.log('Sending rating data:', ratingData);

      // Use the rating service from our API services
      const response = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(ratingData)
      });

      const result = await response.json();
      console.log('Rating API response:', result);

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit rating');
      }

      toast.success('Rating submitted successfully!');
      
      // Clear the form
      setRatingForms(prev => {
        const newForms = { ...prev };
        delete newForms[tradeId];
        return newForms;
      });

      // Trigger profile data refresh if callback provided
      if (onFetchProfileData && ratedUserId) {
        onFetchProfileData(ratedUserId);
      }

    } catch (error: any) {
      console.error('Error submitting rating:', error);
      toast.error(error.message || 'Failed to submit rating');
    } finally {
      // Clear submitting state
      setRatingForms(prev => ({
        ...prev,
        [tradeId]: { ...ratingForm, isSubmitting: false }
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserIcon className="h-5 w-5" />
            <span>
              {isCurrentUser ? 'Your Profile' : `${displayUser?.name || 'User'}'s Profile`}
            </span>
          </DialogTitle>
          <DialogDescription>
            {isCurrentUser 
              ? 'View and manage your profile information' 
              : 'View user profile and trading history'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage 
                    src={profile?.image || displayUser?.image} 
                    alt={profile?.name || displayUser?.name} 
                  />
                  <AvatarFallback className="text-lg">
                    {(profile?.name || displayUser?.name)?.slice(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {isLoading ? (
                        <Skeleton className="h-6 w-48" />
                      ) : (
                        profile?.name || displayUser?.name || 'Unknown User'
                      )}
                    </h3>
                    {(profile?.email || displayUser?.email) && (
                      <p className="text-sm text-muted-foreground">
                        {profile?.email || displayUser?.email}
                      </p>
                    )}
                  </div>

                  {/* Badge */}
                  {isLoading ? (
                    <Skeleton className="h-12 w-full" />
                  ) : (
                    profile?.badge && renderBadgeInfo(profile.badge)
                  )}

                  {/* Join Date */}
                  {profile?.createdAt && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Member since {formatJoinDate(profile.createdAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              {profile?.bio && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm">{profile.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats & Details */}
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="stats">Statistics</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="rating">Rating</TabsTrigger>
            </TabsList>

            {/* Statistics Tab */}
            <TabsContent value="stats" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Trophy className="h-5 w-5 text-warning" />
                    </div>
                    {isLoading ? (
                      <Skeleton className="h-6 w-12 mx-auto mb-1" />
                    ) : (
                      <div className="text-2xl font-bold text-warning">
                        {profile?.loyalty_points || displayUser?.loyalty_points || 0}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">Points</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    {isLoading ? (
                      <Skeleton className="h-6 w-12 mx-auto mb-1" />
                    ) : (
                      <div className="text-2xl font-bold text-primary">
                        {profile?._count?.items || 0}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">Items</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Handshake className="h-5 w-5 text-success" />
                    </div>
                    {isLoading ? (
                      <Skeleton className="h-6 w-12 mx-auto mb-1" />
                    ) : (
                      <div className="text-2xl font-bold text-success">
                        {profile?._count?.trades || 0}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">Trades</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <MessageSquare className="h-5 w-5 text-info" />
                    </div>
                    {isLoading ? (
                      <Skeleton className="h-6 w-12 mx-auto mb-1" />
                    ) : (
                      <div className="text-2xl font-bold text-info">
                        {profile?._count?.reviews || 0}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">Reviews</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Completed Trades Tab */}
            <TabsContent value="completed" className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : completedTrades && completedTrades.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Completed Trades</h3>
                    <Badge variant="secondary">{completedTrades.length} trade{completedTrades.length !== 1 ? 's' : ''}</Badge>
                  </div>
                  
                  {completedTrades.map((trade) => {
                    const ratingForm = ratingForms[trade.id] || { rating: 0, comment: '', isSubmitting: false };
                    
                    // Get trade party information
                    const currentUserId = currentUser?.id;
                    const ownerUserId = (trade as any).owner_id;
                    const requesterUserId = (trade as any).requester_id;
                    const ownerUser = (trade as any).owner;
                    const requesterUser = (trade as any).requester;
                    
                    // Determine current user's role and the other party
                    const isCurrentUserOwner = currentUserId === ownerUserId;
                    const isCurrentUserRequester = currentUserId === requesterUserId;
                    
                    // The trade partner is the other party
                    const tradePartner = isCurrentUserOwner ? requesterUser : ownerUser;
                    
                    // IMPORTANT: For rating, we need to rate the owner of the item we RECEIVED
                    // If current user is owner -> they receive offered_item -> rate offered_item.user_id
                    // If current user is requester -> they receive requested_item -> rate requested_item.user_id
                    const itemWeReceived = isCurrentUserOwner ? (trade as any).offered_item : (trade as any).requested_item;
                    const userIdToRate = itemWeReceived?.user_id;
                    
                    // Safety check: don't allow rating yourself
                    const canRate = userIdToRate && userIdToRate !== currentUserId;
                    
                    // Check if current user has already rated this trade
                    // Handle case where userRatings might be undefined or empty
                    const hasRated = userRatings && userRatings.length > 0 ? userRatings.some(rating => 
                      rating.trade_id === trade.id && 
                      (rating.rater_id === currentUserId || rating.reviewer_id === currentUserId)
                    ) : false;
                    
                    // Items are swapped in perspective
                    const myItem = isCurrentUserOwner ? (trade as any).requested_item : (trade as any).offered_item;
                    const theirItem = isCurrentUserOwner ? (trade as any).offered_item : (trade as any).requested_item;
                    
                    return (
                      <Card key={trade.id} className="border border-green-200 bg-gradient-to-r from-green-50/50 to-emerald-50/50">
                        <CardContent className="p-6">
                          <div className="space-y-6">
                            {/* Trade Header with detailed info */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <Handshake className="h-5 w-5 text-green-600" />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-semibold text-lg">Trade Completed</h4>
                                    <Badge className="bg-green-100 text-green-800 border-green-200">
                                      <ArrowRightLeft className="h-3 w-3 mr-1" />
                                      Success
                                    </Badge>
                                  </div>
                                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                    <span className="flex items-center space-x-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>Completed: {new Date((trade as any).completed_at || trade.created_at).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                      })}</span>
                                    </span>
                                    <span className="flex items-center space-x-1">
                                      <Users className="h-3 w-3" />
                                      <span>Trade ID: {trade.id.slice(-8)}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Trading Partner Info */}
                            <div className="bg-white/60 rounded-lg p-4 border border-green-100">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium text-muted-foreground">Trading Partner</h5>
                                {tradePartner && (
                                  <div className="flex items-center space-x-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={tradePartner.image} alt={tradePartner.name} />
                                      <AvatarFallback className="text-xs">
                                        {tradePartner.name?.slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="text-right">
                                      <p className="font-medium text-sm">{tradePartner.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {tradePartner.loyalty_points || 0} points
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Trade Items - Detailed View */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* What You Gave */}
                              {(isCurrentUserOwner ? (trade as any).requested_item : (trade as any).offered_item) && (
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                      <Package className="h-3 w-3 text-red-600" />
                                    </div>
                                    <h5 className="font-semibold text-red-700">What You Gave</h5>
                                  </div>
                                  <div className="bg-red-50/80 rounded-lg p-4 border border-red-100">
                                    <div className="flex items-start space-x-4">
                                      {myItem?.images?.[0] && (
                                        <div className="flex-shrink-0">
                                          <img
                                            src={getImageUrl(myItem.images[0].url)}
                                            alt={myItem.title}
                                            className="w-20 h-20 object-cover rounded-lg border-2 border-white shadow-sm"
                                          />
                                        </div>
                                      )}
                                      <div className="flex-1 space-y-2">
                                        <h6 className="font-semibold text-lg">{myItem?.title}</h6>
                                        <div className="flex items-center space-x-3">
                                          <Badge variant="outline" className="text-xs">
                                            {myItem?.category}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground capitalize">
                                            {myItem?.condition?.toLowerCase().replace('_', ' ')} condition
                                          </span>
                                        </div>
                                        {myItem?.description && (
                                          <p className="text-sm text-muted-foreground line-clamp-2">
                                            {myItem.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* What You Received */}
                              {(isCurrentUserOwner ? (trade as any).offered_item : (trade as any).requested_item) && (
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                      <Package className="h-3 w-3 text-green-600" />
                                    </div>
                                    <h5 className="font-semibold text-green-700">What You Received</h5>
                                  </div>
                                  <div className="bg-green-50/80 rounded-lg p-4 border border-green-100">
                                    <div className="flex items-start space-x-4">
                                      {theirItem?.images?.[0] && (
                                        <div className="flex-shrink-0">
                                          <img
                                            src={getImageUrl(theirItem.images[0].url)}
                                            alt={theirItem.title}
                                            className="w-20 h-20 object-cover rounded-lg border-2 border-white shadow-sm"
                                          />
                                        </div>
                                      )}
                                      <div className="flex-1 space-y-2">
                                        <h6 className="font-semibold text-lg">{theirItem?.title}</h6>
                                        <div className="flex items-center space-x-3">
                                          <Badge variant="outline" className="text-xs">
                                            {theirItem?.category}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground capitalize">
                                            {theirItem?.condition?.toLowerCase().replace('_', ' ')} condition
                                          </span>
                                        </div>
                                        {theirItem?.description && (
                                          <p className="text-sm text-muted-foreground line-clamp-2">
                                            {theirItem.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Trade Statistics */}
                            <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                              <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                  <div className="text-lg font-bold text-blue-600">
                                    {Math.ceil(Math.abs(new Date((trade as any).completed_at || trade.created_at).getTime() - new Date(trade.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Days to Complete</div>
                                </div>
                                <div>
                                  <div className="text-lg font-bold text-blue-600">
                                    {((trade as any).ratings?.length || 0)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Ratings Given</div>
                                </div>
                                <div>
                                  <div className="text-lg font-bold text-blue-600">
                                    {trade.status === 'COMPLETED' ? '✓' : '○'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Status</div>
                                </div>
                              </div>
                            </div>

                            {/* Rating Section - Only show if not current user's profile and haven't rated yet and can rate */}
                            {!isCurrentUser && !hasRated && canRate && (
                              <div className="border-t pt-6">
                              
                                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                                  <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                      <Star className="h-8 w-8 text-yellow-500 fill-yellow-400" />
                                    </div>
                                    <h4 className="text-xl font-bold text-yellow-800 mb-2">
                                      Rate Your Trading Experience
                                    </h4>
                                    <p className="text-yellow-700">
                                      How was your experience trading with <span className="font-semibold">{tradePartner?.name}</span>?
                                    </p>
                                  </div>

                                  {/* Rating Guidelines */}
                                  <div className="bg-white/60 rounded-lg p-4 mb-6 border border-yellow-100">
                                    <h5 className="font-semibold text-sm text-yellow-800 mb-2 flex items-center">
                                      <Trophy className="h-4 w-4 mr-2" />
                                      Rating Guidelines
                                    </h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-yellow-700">
                                      <div>⭐⭐⭐⭐⭐ Excellent - Perfect trade experience</div>
                                      <div>⭐⭐⭐⭐ Very Good - Great communication & condition</div>
                                      <div>⭐⭐⭐ Good - Satisfactory trade experience</div>
                                      <div>⭐⭐ Fair - Some issues but trade completed</div>
                                      <div>⭐ Poor - Significant problems encountered</div>
                                    </div>
                                  </div>

                                  {/* Star Rating */}
                                  <div className="space-y-4">
                                    <div className="text-center">
                                      <p className="text-sm font-medium text-yellow-800 mb-3">Click on a star to rate:</p>
                                      <div className="flex items-center justify-center space-x-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRatingForms(prev => ({
                                              ...prev,
                                              [trade.id]: { ...ratingForm, rating: star }
                                            }))}
                                            className="group relative p-3 hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded-full"
                                            disabled={ratingForm.isSubmitting}
                                          >
                                            <Star
                                              className={`h-10 w-10 transition-all duration-200 ${
                                                star <= ratingForm.rating
                                                  ? 'text-yellow-400 fill-yellow-400 drop-shadow-sm'
                                                  : 'text-gray-300 hover:text-yellow-300 group-hover:scale-110'
                                              }`}
                                            />
                                            {/* Hover tooltip */}
                                            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                              {star === 1 ? 'Poor' : 
                                               star === 2 ? 'Fair' :
                                               star === 3 ? 'Good' :
                                               star === 4 ? 'Very Good' : 'Excellent'}
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Rating Display */}
                                    {ratingForm.rating > 0 && (
                                      <div className="text-center bg-yellow-100/50 rounded-lg p-4 border border-yellow-200">
                                        <div className="text-2xl font-bold text-yellow-600 mb-1">
                                          {ratingForm.rating} Star{ratingForm.rating !== 1 ? 's' : ''}
                                        </div>
                                        <p className="text-yellow-700 font-medium">
                                          {ratingForm.rating === 5 ? '🎉 Excellent Experience!' : 
                                           ratingForm.rating === 4 ? '👍 Very Good Trade!' :
                                           ratingForm.rating === 3 ? '✅ Good Trade' :
                                           ratingForm.rating === 2 ? '⚠️ Fair Experience' : '❌ Poor Experience'}
                                        </p>
                                        <p className="text-xs text-yellow-600 mt-1">
                                          Your rating helps build trust in the community
                                        </p>
                                      </div>
                                    )}

                                    {/* Comment Section */}
                                    <div className="space-y-3">
                                      <div className="flex items-center space-x-2">
                                        <MessageSquare className="h-4 w-4 text-yellow-600" />
                                        <label className="text-sm font-medium text-yellow-800">
                                          Share Your Experience {ratingForm.rating > 0 ? '(Optional)' : ''}
                                        </label>
                                      </div>
                                      <Textarea
                                        placeholder={`Tell others about your trade with ${tradePartner?.name}... Was the item as described? How was the communication? Any other feedback?`}
                                        value={ratingForm.comment}
                                        onChange={(e) => setRatingForms(prev => ({
                                          ...prev,
                                          [trade.id]: { ...ratingForm, comment: e.target.value }
                                        }))}
                                        disabled={ratingForm.isSubmitting}
                                        className="min-h-[120px] bg-white/80 border-yellow-200 focus:border-yellow-400 resize-none"
                                        maxLength={500}
                                      />
                                      <div className="flex justify-between items-center text-xs text-yellow-600">
                                        <span>Help others make informed trading decisions</span>
                                        <span>{ratingForm.comment.length}/500</span>
                                      </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex flex-col items-center space-y-3 pt-4">
                                      <Button
                                        onClick={() => handleSubmitRating(trade.id, userIdToRate)}
                                        disabled={ratingForm.rating === 0 || ratingForm.isSubmitting}
                                        className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        size="lg"
                                      >
                                        {ratingForm.isSubmitting ? (
                                          <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            Submitting Your Rating...
                                          </>
                                        ) : (
                                          <>
                                            <Send className="h-5 w-5 mr-2" />
                                            Submit {ratingForm.rating} Star Rating
                                            {ratingForm.rating > 0 && tradePartner && (
                                              <span className="ml-1 text-yellow-100">
                                                (+{ratingForm.rating * 5} loyalty points for {tradePartner.name})
                                              </span>
                                            )}
                                          </>
                                        )}
                                      </Button>
                                      
                                      {ratingForm.rating === 0 && (
                                        <p className="text-sm text-yellow-600 text-center">
                                          👆 Please select a star rating above to submit your review
                                        </p>
                                      )}
                                      
                                      {ratingForm.rating > 0 && (
                                        <div className="text-center">
                                          <p className="text-xs text-yellow-700">
                                            🎁 {tradePartner?.name} will earn <span className="font-bold">{ratingForm.rating * 5} loyalty points</span> from your rating!
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Show if already rated */}
                            {!isCurrentUser && hasRated && (
                              <div className="border-t pt-6">
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                                  <div className="text-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                      <Star className="h-8 w-8 text-green-600 fill-green-500" />
                                    </div>
                                    <h4 className="text-xl font-bold text-green-800 mb-2">
                                      Rating Submitted Successfully!
                                    </h4>
                                    <div className="flex items-center justify-center space-x-2 text-green-700 mb-3">
                                      <Trophy className="h-5 w-5" />
                                      <span className="font-medium">
                                        You've already rated your experience with {tradePartner?.name}
                                      </span>
                                    </div>
                                    <div className="bg-white/60 rounded-lg p-4 border border-green-100">
                                      <p className="text-sm text-green-700 flex items-center justify-center space-x-2">
                                        <span>✅ Thank you for helping build trust in our trading community!</span>
                                      </p>
                                      <p className="text-xs text-green-600 mt-2">
                                        🎁 Your rating contributed loyalty points to {tradePartner?.name}'s account
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Handshake className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Completed Trades</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
                    {isCurrentUser 
                      ? 'You haven\'t completed any trades yet. Start trading with other users to build your reputation and earn loyalty points!' 
                      : 'This user hasn\'t completed any trades yet. Check back later to see their trading history.'
                    }
                  </p>
                  {isCurrentUser && (
                    <div className="mt-4">
                      <Badge variant="outline" className="text-xs">
                        💡 Tip: Complete trades to earn loyalty points and build trust
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Rating Tab */}
            <TabsContent value="rating" className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : ratingStats ? (
                <div className="space-y-4">
                  {/* Overall Rating */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-lg">
                        <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                        <span>Overall Rating</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl font-bold">
                          {ratingStats.average_rating.toFixed(1)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-1 mb-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= ratingStats.average_rating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Based on {ratingStats.total_ratings} review{ratingStats.total_ratings !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rating Distribution */}
                  {Object.keys(ratingStats.rating_distribution).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Rating Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map((rating) => {
                            const count = ratingStats.rating_distribution[rating] || 0;
                            const percentage = ratingStats.total_ratings > 0 
                              ? (count / ratingStats.total_ratings) * 100 
                              : 0;
                            
                            return (
                              <div key={rating} className="flex items-center space-x-2 text-sm">
                                <span className="w-2">{rating}</span>
                                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                  <div 
                                    className="h-full bg-yellow-400 transition-all duration-300"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="w-8 text-right text-muted-foreground">
                                  {count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Ratings Yet</h3>
                  <p className="text-muted-foreground text-sm">
                    {isCurrentUser 
                      ? 'Complete trades to receive your first rating' 
                      : 'This user hasn\'t received any ratings yet'
                    }
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Error State */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="p-4">
                <p className="text-sm text-destructive">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchProfileData}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
