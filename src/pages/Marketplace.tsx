import { useState } from "react";
import { Header } from "@/components/Header";
import { ItemCard } from "@/components/ItemCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Filter,
  Plus,
  Grid3X3,
  List,
  TrendingUp,
  MapPin
} from "lucide-react";

interface MarketplaceProps {
  user?: {
    name: string;
    avatar?: string;
    badge: "bronze" | "silver" | "gold" | "diamond" | "ruby";
    points: number;
  };
  onLogout?: () => void;
  onPostItem?: () => void;
}

// Mock data for demonstration
const mockItems = [
  {
    id: "1",
    title: "MacBook Pro 13-inch 2020",
    description: "Excellent condition MacBook Pro with original charger and box. Perfect for students or professionals.",
    category: "Electronics",
    condition: "like-new" as const,
    images: ["https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=400&fit=crop"],
    location: "Downtown, NYC",
    postedAt: "2024-01-15T10:00:00Z",
    owner: {
      name: "Sarah Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
      badge: "gold" as const,
      rating: 4.8
    },
    tradeRequests: 12
  },
  {
    id: "2", 
    title: "Vintage Leather Armchair",
    description: "Beautiful vintage leather armchair in great condition. Adds character to any room.",
    category: "Furniture",
    condition: "good" as const,
    images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop"],
    location: "Brooklyn, NYC",
    postedAt: "2024-01-14T15:30:00Z",
    owner: {
      name: "Mike Johnson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
      badge: "silver" as const,
      rating: 4.5
    },
    tradeRequests: 8
  },
  {
    id: "3",
    title: "Nintendo Switch Console",
    description: "Nintendo Switch with extra Joy-Con controllers and popular games included.",
    category: "Electronics",
    condition: "good" as const,
    images: ["https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop"],
    location: "Queens, NYC",
    postedAt: "2024-01-13T09:15:00Z",
    owner: {
      name: "Alex Rivera",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
      badge: "bronze" as const,
      rating: 4.2
    },
    tradeRequests: 15
  },
  {
    id: "4",
    title: "Canon EOS Camera",
    description: "Professional DSLR camera with multiple lenses. Perfect for photography enthusiasts.",
    category: "Electronics", 
    condition: "like-new" as const,
    images: ["https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=400&fit=crop"],
    location: "Manhattan, NYC",
    postedAt: "2024-01-12T14:20:00Z",
    owner: {
      name: "Emma Davis",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
      badge: "diamond" as const,
      rating: 4.9
    },
    tradeRequests: 6
  },
  {
    id: "5",
    title: "Designer Bookshelf",
    description: "Modern minimalist bookshelf in excellent condition. Perfect for any home office.",
    category: "Furniture",
    condition: "new" as const,
    images: ["https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=400&fit=crop"],
    location: "Bronx, NYC",
    postedAt: "2024-01-11T11:45:00Z",
    owner: {
      name: "David Park",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
      badge: "ruby" as const,
      rating: 5.0
    },
    tradeRequests: 3
  },
  {
    id: "6",
    title: "Yoga Mat & Accessories",
    description: "Premium yoga mat with blocks, strap, and carrying bag. Barely used.",
    category: "Sports & Fitness",
    condition: "like-new" as const,
    images: ["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop"],
    location: "Staten Island, NYC",
    postedAt: "2024-01-10T16:30:00Z",
    owner: {
      name: "Lisa Wong",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lisa",
      badge: "gold" as const,
      rating: 4.7
    },
    tradeRequests: 9
  }
];

const categories = ["All", "Electronics", "Furniture", "Clothing", "Books", "Sports & Fitness", "Home & Garden", "Toys & Games"];

export const Marketplace = ({ user, onLogout, onPostItem }: MarketplaceProps) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [favorites, setFavorites] = useState<string[]>([]);

  const handleFavorite = (itemId: string) => {
    setFavorites(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleTradeRequest = (itemId: string) => {
    // This would typically open a trade request modal
    console.log("Trade request for item:", itemId);
  };

  const filteredItems = mockItems.filter(item => 
    selectedCategory === "All" || item.category === selectedCategory
  );

  return (
    <div className="min-h-screen bg-background">
      <Header 
        user={user} 
        onLogoutClick={onLogout}
        onPostItemClick={onPostItem}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.name || 'Trader'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Discover amazing items from your community and find your next treasure.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{mockItems.length}</div>
              <div className="text-sm text-muted-foreground">Available Items</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success">24</div>
              <div className="text-sm text-muted-foreground">Active Traders</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-warning">18</div>
              <div className="text-sm text-muted-foreground">Your Points</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-1">
                <TrendingUp className="h-4 w-4 text-success" />
                <div className="text-2xl font-bold text-success">+12%</div>
              </div>
              <div className="text-sm text-muted-foreground">This Week</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Controls */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort by</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="location">Near Me</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* View Mode & Post Button */}
              <div className="flex items-center gap-4">
                <div className="flex border border-border rounded-lg p-1">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button onClick={onPostItem} className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Post Item
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Grid */}
        <div className={`grid gap-6 ${
          viewMode === "grid" 
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
            : "grid-cols-1"
        }`}>
          {filteredItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onTradeRequest={handleTradeRequest}
              onFavorite={handleFavorite}
              isFavorited={favorites.includes(item.id)}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <Card className="py-16">
            <CardContent className="text-center">
              <div className="mb-4">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No items found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or check back later for new items.
              </p>
              <Button onClick={() => setSelectedCategory("All")} variant="outline">
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};