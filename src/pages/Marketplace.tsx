import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useItems } from "@/hooks/useItems";
import { Header } from "@/components/Header";
import { ItemCard } from "@/components/ItemCard";
import { PostItemModal } from "@/components/PostItemModal";
import { MyItemsModal } from "@/components/MyItemsModal";
import { MyTradesModal } from "@/components/MyTradesModal";
import { ItemDetailsModal } from "@/components/ItemDetailsModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Filter,
  Plus,
  Grid3X3,
  List,
  TrendingUp,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { formatLocation, generateAvatar } from "@/utils/helpers";
import { calculateDistance, formatDistance } from "@/utils/location";
import { getImageUrl } from "@/config/env";

const categories = ["All", "Electronics", "Furniture", "Clothing", "Books", "Sports & Fitness", "Home & Garden", "Toys & Games"];

export const Marketplace = () => {
  const { user, logout, userLocation, hasLocation } = useAuth();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isMyItemsModalOpen, setIsMyItemsModalOpen] = useState(false);
  const [isMyTradesModalOpen, setIsMyTradesModalOpen] = useState(false);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<any>(null);
  const [isItemDetailsModalOpen, setIsItemDetailsModalOpen] = useState(false);

  // Fetch items from API using custom hook
  const { 
    data: items = [], 
    isLoading: itemsLoading, 
    error: itemsError,
  } = useItems({
    category: selectedCategory !== "All" ? selectedCategory : undefined,
    search: searchTerm.trim() || undefined,
  });

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleFavorite = (itemId: string) => {
    setFavorites(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
    // TODO: Implement API call to save favorites
  };

  const handleTradeRequest = (itemId: string) => {
    // TODO: Navigate to trade request modal/page
    toast.info("Trade request feature coming soon!");
    console.log("Trade request for item:", itemId);
  };

  const handleMoreInfo = (displayItem: any) => {
    console.log('handleMoreInfo called with:', displayItem);
    // Find the original API item to get all the data we need
    const apiItem = items.find(item => item.id === displayItem.id);
    console.log('Found API item:', apiItem);
    if (!apiItem) return;

    // Transform API item to match ItemDetailsModal expected structure
    const transformedItem = {
      id: apiItem.id,
      title: apiItem.title,
      description: apiItem.description,
      category: apiItem.category,
      condition: (apiItem.condition || 'GOOD').toLowerCase(),
      images: apiItem.images?.map(img => getImageUrl(img.url)) || [],
      location: displayItem.location, // Use the formatted location from display
      postedAt: apiItem.posted_at,
      latitude: apiItem.latitude,
      longitude: apiItem.longitude,
      user: {
        id: apiItem.user.id,
        name: apiItem.user.name,
        image: apiItem.user.image || generateAvatar(apiItem.user.email),
        email: apiItem.user.email,
        badge: (apiItem.user.badge || 'BRONZE').toUpperCase(), // Keep uppercase for modal
        rating: 4.5 // TODO: Get from API
      },
      tradeRequests: apiItem._count?.trade_requests_for || 0
    };

    console.log('Transformed item for modal:', transformedItem);
    setSelectedItemForDetails(transformedItem);
    setIsItemDetailsModalOpen(true);
  };

  const handlePostItem = () => {
    setIsPostModalOpen(true);
  };

  const handleMyTrades = () => {
    setIsMyTradesModalOpen(true);
  };

  const handlePostSuccess = () => {
    // Refresh items list after successful post
    // The useItems hook should automatically refetch via query invalidation
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  // Get badge color based on user badge
  const getBadgeColorClass = (badge: string) => {
    switch (badge.toUpperCase()) {
      case 'BRONZE': return 'bg-amber-600';
      case 'SILVER': return 'bg-gray-400';
      case 'GOLD': return 'bg-yellow-500';
      case 'DIAMOND': return 'bg-blue-400';
      case 'RUBY': return 'bg-red-500';
      default: return 'bg-amber-600';
    }
  };

  // Get count of user's items for display
  const myItemsCount = items.filter(item => item.user.id === user?.id).length;

  // Filter and sort items
  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime();
      case 'oldest':
        return new Date(a.posted_at).getTime() - new Date(b.posted_at).getTime();
      case 'popular':
        return (b._count?.trade_requests_for || 0) - (a._count?.trade_requests_for || 0);
      case 'distance':
        if (!userLocation) return 0;
        const distanceA = calculateDistance(
          userLocation.latitude, 
          userLocation.longitude,
          a.latitude,
          a.longitude
        );
        const distanceB = calculateDistance(
          userLocation.latitude, 
          userLocation.longitude,
          b.latitude,
          b.longitude
        );
        return distanceA - distanceB;
      default:
        return 0;
    }
  });

  // Show error if items failed to load
  if (itemsError) {
    console.error("Failed to load items:", itemsError);
    toast.error("Failed to load items. Please try again.");
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        user={user ? {
          name: user.name || 'Unknown User',
          avatar: user.image || generateAvatar(user.email || ''),
          badge: (user.badge || 'BRONZE').toLowerCase() as any,
          points: user.loyalty_points || 0
        } : undefined} 
        onLogoutClick={handleLogout}
        onPostItemClick={handlePostItem}
        onMyTradesClick={handleMyTrades}
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
          {user && (
            <div className="mt-4 flex items-center gap-4">
              <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getBadgeColorClass(user.badge || 'BRONZE')}`}>
                {user.badge || 'BRONZE'} Trader
              </div>
              <div className="text-sm text-muted-foreground">
                {user.loyalty_points} loyalty points
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {itemsLoading ? "..." : items.length}
              </div>
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
              <div className="text-2xl font-bold text-warning">
                {user?.loyalty_points || 0}
              </div>
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
                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full sm:w-48"
                  />
                </div>

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
                      {hasLocation && <SelectItem value="distance">Nearest First</SelectItem>}
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
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setIsMyItemsModalOpen(true)} 
                    variant="outline" 
                    className="shrink-0"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    My Items ({myItemsCount})
                  </Button>
                  
                  <Button onClick={handlePostItem} className="shrink-0">
                    <Plus className="h-4 w-4 mr-2" />
                    Post Item
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {itemsLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading items...</p>
            </div>
          </div>
        )}

        {/* Items Grid */}
        {!itemsLoading && (
          <div className={`grid gap-6 ${
            viewMode === "grid" 
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "grid-cols-1"
          }`}>
            {sortedItems.map(item => {
              // Calculate distance if user has location
              let locationDisplay = formatLocation(item.latitude, item.longitude);
              if (userLocation && hasLocation) {
                const distance = calculateDistance(
                  userLocation.latitude, 
                  userLocation.longitude,
                  item.latitude,
                  item.longitude
                );
                locationDisplay = formatDistance(distance);
              }

              return (
                <ItemCard
                  key={item.id}
                  item={{
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    category: item.category,
                    condition: (item.condition || 'GOOD').toLowerCase() as any,
                    images: item.images?.map(img => getImageUrl(img.url)) || [],
                    location: locationDisplay,
                    postedAt: item.posted_at,
                    owner: {
                      name: item.user.name,
                      avatar: item.user.image || generateAvatar(item.user.email),
                      badge: (item.user.badge || 'BRONZE').toLowerCase() as any,
                      rating: 4.5 // TODO: Get from API
                    },
                    tradeRequests: item._count?.trade_requests_for || 0
                  }}
                  onMoreInfo={handleMoreInfo}
                  onFavorite={handleFavorite}
                  isFavorited={favorites.includes(item.id)}
                />
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!itemsLoading && sortedItems.length === 0 && (
          <Card className="py-16">
            <CardContent className="text-center">
              <div className="mb-4">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No items found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 
                  `No items match your search "${searchTerm}". Try different keywords.` :
                  "Try adjusting your filters or check back later for new items."
                }
              </p>
              <Button 
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchTerm("");
                }} 
                variant="outline"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Post Item Modal */}
      <PostItemModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onSuccess={handlePostSuccess}
      />

      {/* My Items Modal */}
      <MyItemsModal
        isOpen={isMyItemsModalOpen}
        onClose={() => setIsMyItemsModalOpen(false)}
      />

      {/* My Trades Modal */}
      <MyTradesModal
        isOpen={isMyTradesModalOpen}
        onClose={() => setIsMyTradesModalOpen(false)}
        onViewItem={handleMoreInfo}
      />

      {/* Item Details Modal */}
      <ItemDetailsModal
        isOpen={isItemDetailsModalOpen}
        onClose={() => setIsItemDetailsModalOpen(false)}
        item={selectedItemForDetails}
      />
    </div>
  );
};
