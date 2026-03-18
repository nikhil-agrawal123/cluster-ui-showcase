import { Search, Bell, MessageSquare, Plus, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const { token, profile, logout } = useAuth();
  const navigate = useNavigate();

  const isLoggedIn = !!token;

  const initials = profile?.name
    ? profile.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between h-14 px-4 lg:px-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3" fill="currentColor" className="text-accent-foreground" />
              <circle cx="6" cy="16" r="3" fill="currentColor" className="text-accent-foreground" />
              <circle cx="18" cy="16" r="3" fill="currentColor" className="text-accent-foreground" />
              <line x1="12" y1="11" x2="6" y2="13" stroke="currentColor" strokeWidth="1.5" className="text-accent-foreground" />
              <line x1="12" y1="11" x2="18" y2="13" stroke="currentColor" strokeWidth="1.5" className="text-accent-foreground" />
            </svg>
          </div>
          <span className="text-lg font-bold text-foreground hidden sm:inline">Cluster</span>
        </Link>

        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clusters, windows, or members..."
              className="pl-9 h-9 bg-muted border-0 rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-accent"
            />
          </div>
        </div>

        {isLoggedIn ? (
          <div className="flex items-center gap-1">
            <Button variant="default" size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg gap-1.5 h-9 px-4 text-sm font-medium">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Window</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <Bell className="h-[18px] w-[18px]" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <MessageSquare className="h-[18px] w-[18px]" />
            </Button>
            <Link to="/profile">
              <Avatar className="h-8 w-8 border-2 border-accent cursor-pointer">
                <AvatarFallback className="bg-accent/10 text-accent text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>
            </Link>
            {profile && (
              <span className="text-xs text-muted-foreground hidden md:inline ml-1 max-w-[100px] truncate">
                {profile.name}
              </span>
            )}
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={handleLogout} title="Log out">
              <LogOut className="h-[18px] w-[18px]" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-sm">Log In</Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg text-sm">Sign Up</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
