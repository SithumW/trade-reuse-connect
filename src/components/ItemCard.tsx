import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProfileModal from "@/components/ProfileModal";
import { Heart, MessageCircle, MapPin, Clock, Star, Info } from "lucide-react";
import "@/styles/components/ItemCard.css";

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

export const ItemCard = ({
  item,
  onMoreInfo,
  onFavorite,
  isFavorited = false,
}: ItemCardProps) => {
  const timeAgo = new Date(item.postedAt).toLocaleDateString();

  return (
    <Card className="item-card">
      {/* Image */}
      <div className="item-image-wrapper">
        <img
          src={item.images[0]}
          alt={item.title}
          className="item-image"
        />

        {/* Condition Badge */}
        <Badge className={`item-condition ${item.condition}`}>
          {item.condition.charAt(0).toUpperCase() +
            item.condition.slice(1).replace("-", " ")}
        </Badge>

        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="sm"
          className="item-favorite-btn"
          onClick={() => onFavorite?.(item.id)}
        >
          <Heart
            className={`item-favorite-icon ${isFavorited ? "favorited" : ""}`}
          />
        </Button>

        {/* Trade Requests Counter */}
        {item.tradeRequests && item.tradeRequests > 0 && (
          <div className="item-trade-requests">
            {item.tradeRequests} offers
          </div>
        )}
      </div>

      <CardContent className="item-content">
        {/* Title & Category */}
        <div className="item-header">
          <h3 className="item-title">{item.title}</h3>
          <Badge variant="outline" className="item-category">
            {item.category}
          </Badge>
        </div>

        {/* Description */}
        <p className="item-description">{item.description}</p>

        {/* Location & Time */}
        <div className="item-meta">
          <div className="item-location">
            <MapPin className="meta-icon" />
            <span>{item.location}</span>
          </div>
          <div className="item-time">
            <Clock className="meta-icon" />
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* Owner Info */}
        <div className="item-owner">
          <ProfileModal
            user={{
              id: item.owner.id || "",
              name: item.owner.name,
              email: "",
              image: item.owner.avatar,
              badge: item.owner.badge.toUpperCase() as any,
              loyalty_points: 0,
              createdAt: "",
              updatedAt: "",
            }}
            trigger={
              <Button variant="ghost" size="sm" className="item-owner-btn">
                <div className="item-owner-details">
                  <Avatar className="owner-avatar">
                    <AvatarImage
                      src={item.owner.avatar}
                      alt={item.owner.name}
                    />
                    <AvatarFallback className="owner-avatar-fallback">
                      {item.owner.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="owner-name">{item.owner.name}</span>
                  <div className={`owner-badge ${item.owner.badge}`} />
                </div>
              </Button>
            }
          />

          <div className="owner-rating">
            <Star className="rating-star" />
            <span>{item.owner.rating.toFixed(1)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="item-footer">
        <Button onClick={() => onMoreInfo?.(item)} className="more-info-btn">
          <Info className="info-icon" />
          View Item
        </Button>
      </CardFooter>
    </Card>
  );
};
