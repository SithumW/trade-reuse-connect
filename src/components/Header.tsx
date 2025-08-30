import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  LogOut, 
  Plus, 
  Search, 
  Menu,
  X,
  Recycle
} from "lucide-react";

interface HeaderProps {
  user?: {
    name: string;
    avatar?: string;
    badge: "bronze" | "silver" | "gold" | "diamond" | "ruby";
    points: number;
  };
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onPostItemClick?: () => void;
}

const badgeConfig = {
  bronze: { label: "Bronze Trader", color: "bg-amber-600" },
  silver: { label: "Silver Trader", color: "bg-slate-400" },
  gold: { label: "Gold Trader", color: "bg-yellow-500" },
  diamond: { label: "Diamond Trader", color: "bg-cyan-400" },
  ruby: { label: "Ruby Trader", color: "bg-red-500" }
};

export const Header = ({ user, onLoginClick, onLogoutClick, onPostItemClick }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-card border-b border-border shadow-soft sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-hero p-2 rounded-lg">
            <Recycle className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-primary">Swappo</span>
        </div>

        {/* Desktop Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search items..."
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              <Button onClick={onPostItemClick} variant="default" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Post Item
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{user.name}</span>
                    <Badge variant="secondary" className={`${badgeConfig[user.badge].color} text-white`}>
                      {badgeConfig[user.badge].label}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{user.points} points</div>
                </div>
                
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <Button onClick={onLogoutClick} variant="ghost" size="sm">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <Button onClick={onLoginClick} variant="default">
              Login
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card p-4 space-y-4">
          {/* Mobile Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search items..."
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {user ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{user.name}</span>
                    <Badge variant="secondary" className={`${badgeConfig[user.badge].color} text-white text-xs`}>
                      {badgeConfig[user.badge].label}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{user.points} points</div>
                </div>
              </div>
              
              <Button onClick={onPostItemClick} variant="default" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Post Item
              </Button>
              
              <Button onClick={onLogoutClick} variant="outline" className="w-full">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            <Button onClick={onLoginClick} variant="default" className="w-full">
              Login
            </Button>
          )}
        </div>
      )}
    </header>
  );
};