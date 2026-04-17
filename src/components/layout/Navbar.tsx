import { useState, useRef, useEffect } from "react";
import { Search, Bell, MessageSquare, Plus, LogOut, FileText, Users2, Megaphone, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";

const Navbar = () => {
  const { token, profile, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const isLoggedIn = !!token;

  const initials = profile?.name
    ? profile.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  // Close create menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
        setShowCreateMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const createItems = [
    {
      id: "post",
      label: "Post",
      desc: "Share in a cluster",
      icon: FileText,
      color: "text-accent",
      href: "/feed?create=post",
    },
    {
      id: "megaphone",
      label: "Megaphone",
      desc: "Cluster-wide announcement",
      icon: Megaphone,
      color: "text-amber-500",
      href: "/feed?create=megaphone",
    },
    {
      id: "cluster",
      label: "Cluster",
      desc: "Start a new community",
      icon: Users2,
      color: "text-purple-400",
      href: "/feed?create=cluster",
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between h-14 px-4 lg:px-6">
        {/* Logo */}
        <Link to={isLoggedIn ? "/feed" : "/"} className="flex items-center gap-2 shrink-0">
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

        {/* Search */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search clusters, posts, or members..."
              className="pl-9 h-9 bg-muted border-0 rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-accent"
            />
          </div>
        </div>

        {/* Right actions */}
        {isLoggedIn ? (
          <div className="flex items-center gap-1">
            {/* Unified Create dropdown */}
            <div className="relative" ref={createMenuRef}>
              <Button
                variant="default"
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg gap-1.5 h-9 px-3 text-sm font-medium"
                onClick={() => setShowCreateMenu((p) => !p)}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create</span>
                <ChevronDown
                  className={`h-3 w-3 transition-transform duration-200 ${showCreateMenu ? "rotate-180" : ""}`}
                />
              </Button>

              <AnimatePresence>
                {showCreateMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-11 bg-card border border-border rounded-xl shadow-2xl w-60 z-50 overflow-hidden"
                  >
                    <div className="p-1.5">
                      {createItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setShowCreateMenu(false);
                            navigate(item.href);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-left text-sm transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <item.icon className={`h-4 w-4 ${item.color}`} />
                          </div>
                          <div className="min-w-0">
                            <p className={`font-semibold text-sm ${item.color}`}>{item.label}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => toast({ title: "Notifications", description: "No new notifications." })}
              title="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => toast({ title: "Messages", description: "Messaging coming soon." })}
              title="Messages"
            >
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
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
              title="Log out"
            >
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
