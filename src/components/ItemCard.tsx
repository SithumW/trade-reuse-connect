import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProfileModal from "@/components/ProfileModal";
import { 
  Heart,
  MessageCircle,
  MapPin,
  Clock,
  Star,
  Info
} from "lucide-react";

interface ItemCardProps {
  item: {
    id: string;
    title: string;
    description: string;
    category: string;
    condition: "new" | "like-new" | "good" | "fair";
    images: string[];
    location: string;
    postedAt: string;
    owner: {
      id?: string;
      name: string;
      avatar?: string;
      badge: "bronze" | "silver" | "gold" | "diamond" | "ruby";
      rating: number;
    };
    tradeRequests?: number;
  };
  onMoreInfo?: (item: any) => void;
  onFavorite?: (itemId: string) => void;
  isFavorited?: boolean;
}

const conditionColors = {
  "new": "bg-success text-success-foreground",
  "like-new": "bg-primary text-primary-foreground", 
  "good": "bg-warning text-warning-foreground",
  "fair": "bg-muted text-muted-foreground"
};

const badgeColors = {
  bronze: "bg-amber-600",
  silver: "bg-slate-400", 
  gold: "bg-yellow-500",
  diamond: "bg-cyan-400",
  ruby: "bg-red-500"
};

export const ItemCard = ({ 
  item, 
  onMoreInfo, 
  onFavorite, 
  isFavorited = false 
}: ItemCardProps) => {
  const timeAgo = new Date(item.postedAt).toLocaleDateString();

  return (
    <Card className="group hover:shadow-medium transition-all duration-300 overflow-hidden">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={item.images[0]} 
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Condition Badge */}
        <Badge 
          className={`absolute top-3 left-3 ${conditionColors[item.condition]}`}
        >
          {item.condition.charAt(0).toUpperCase() + item.condition.slice(1).replace('-', ' ')}
        </Badge>
        
        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 bg-background/80 hover:bg-background"
          onClick={() => onFavorite?.(item.id)}
        >
          <Heart 
            className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
          />
        </Button>
        
        {/* Trade Requests Counter */}
        {item.tradeRequests && item.tradeRequests > 0 && (
          <div className="absolute bottom-3 right-3 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
            {item.tradeRequests} offers
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Title & Category */}
        <div className="space-y-1">
          <h3 className="font-semibold text-lg line-clamp-1">{item.title}</h3>
          <Badge variant="outline" className="text-xs">
            {item.category}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {item.description}
        </p>

        {/* Location & Time */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <MapPin className="h-3 w-3" />
            <span>{item.location}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* Owner Info */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <ProfileModal
            user={{
              id: item.owner.id || '',
              name: item.owner.name,
              email: '',
              image: item.owner.avatar,
              badge: item.owner.badge.toUpperCase() as any,
              loyalty_points: 0, // Will be fetched from API
              createdAt: '',
              updatedAt: ''
            }}
            trigger={
              <Button variant="ghost" size="sm" className="h-auto p-1 -ml-1 hover:bg-muted/50">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={item.owner.avatar} alt={item.owner.name} />
                    <AvatarFallback className="text-xs">
                      {item.owner.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{item.owner.name}</span>
                  <div className={`w-2 h-2 rounded-full ${badgeColors[item.owner.badge]}`} />
                </div>
              </Button>
            }
          />
          
          <div className="flex items-center space-x-1 text-xs">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{item.owner.rating.toFixed(1)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button 
          onClick={() => onMoreInfo?.(item)}
          className="w-full"
          variant="default"
        >
          <Info className="h-4 w-4 mr-2" />
          More Info
        </Button>
      </CardFooter>
    </Card>
  );
};