import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/user";
import { User, UserProfile, RatingStats } from "@/types/api";
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
  Users
} from "lucide-react";

interface ProfileModalProps {
  userId?: string;
  user?: User; // For displaying minimal user data immediately
  trigger?: React.ReactNode;
  isCurrentUser?: boolean;
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

const ProfileModal = ({ userId, user, trigger, isCurrentUser = false }: ProfileModalProps) => {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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
              <TabsTrigger value="activity">Activity</TabsTrigger>
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

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Activity Feed</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Recent activity and achievements will appear here
                </p>
                {/* TODO: Implement activity feed */}
                <Badge variant="outline">Coming Soon</Badge>
              </div>
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
