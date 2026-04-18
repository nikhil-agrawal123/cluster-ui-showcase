import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Trash2, Flag, MessageSquare, SlidersHorizontal,
  CheckCircle, Loader2, RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  fetchMyJoinedClusterIds,
  getClusterDetail,
  fetchPosts,
  deletePost,
  getUserProfile,
  type PostResponse,
} from "@/lib/api";

interface ModPost extends PostResponse {
  clusterName: string;
  authorName: string;
}

const timeAgo = (iso: string) => {
  const then = new Date(iso).getTime();
  const mins = Math.floor(Math.max(0, Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

type ActiveView = "queue" | "settings";

const ModerationPage = () => {
  const { token, uid } = useAuth();
  const { toast } = useToast();

  const [posts, setPosts] = useState<ModPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingPid, setDeletingPid] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>("queue");
  const [clusterCount, setClusterCount] = useState(0);

  const loadModQueue = async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      // Get all clusters the user is a member of (they may be moderator there)
      const joinedIds = await fetchMyJoinedClusterIds();
      setClusterCount(joinedIds.length);

      // Fetch posts across all joined clusters in parallel, then show them all
      const allPosts: ModPost[] = [];

      await Promise.allSettled(
        joinedIds.map(async (cid) => {
          try {
            const [clusterData, clusterPosts] = await Promise.all([
              getClusterDetail(cid),
              fetchPosts(0, 20, cid),  // filtered by cid
            ]);
            const uniqueUids = [...new Set(clusterPosts.map((p) => p.uid))];
            const nameMap: Record<string, string> = {};
            await Promise.allSettled(
              uniqueUids.map(async (u) => {
                try { const p = await getUserProfile(u); nameMap[u] = p.name; }
                catch { nameMap[u] = u.slice(0, 8); }
              })
            );
            clusterPosts.forEach((p) => {
              allPosts.push({
                ...p,
                clusterName: clusterData.name,
                authorName: nameMap[p.uid] ?? p.uid.slice(0, 8),
              });
            });
          } catch { /* skip failed clusters */ }
        })
      );

      // Sort by newest first
      allPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setPosts(allPosts);
    } catch (err: any) {
      toast({ title: "Failed to load queue", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadModQueue(); }, [token]);

  const handleDelete = async (pid: string) => {
    setDeletingPid(pid);
    try {
      await deletePost(pid);
      setPosts((prev) => prev.filter((p) => p.pid !== pid));
      toast({ title: "Post removed", description: "The post has been deleted from the cluster." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDeletingPid(null);
    }
  };

  const sidebarItems = [
    { icon: Flag, label: "Posts Queue", view: "queue" as ActiveView },
    { icon: SlidersHorizontal, label: "Settings", view: "settings" as ActiveView },
  ];

  if (!token) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Please log in to access moderation tools.</p>
            <Link to="/login">
              <Button className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl">
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-52 border-r border-border min-h-[calc(100vh-56px)] p-4 hidden md:flex flex-col gap-1">
          {sidebarItems.map((item) => (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeView === item.view
                  ? "bg-sidebar-accent text-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </button>
          ))}

          <div className="mt-auto pt-4 border-t border-border">
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Stats</p>
              <p className="text-sm font-bold text-foreground mt-1">{clusterCount} Clusters</p>
              <p className="text-xs text-muted-foreground">{posts.length} posts visible</p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 max-w-[1100px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Shield className="h-6 w-6 text-accent" />
                Moderation
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Review and manage posts across your clusters
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadModQueue}
              disabled={loading}
              className="gap-2 rounded-xl"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: "📋", label: "Total Posts", value: posts.length },
              { icon: "🏘️", label: "Clusters", value: clusterCount },
              { icon: "✅", label: "Actions Taken", value: 0 },
            ].map((s) => (
              <div key={s.label} className="bg-card rounded-xl shadow-surface p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeView === "queue" && (
              <motion.div key="queue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {loading && (
                  <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Loading posts…</span>
                  </div>
                )}

                {!loading && posts.length === 0 && (
                  <div className="text-center py-16">
                    <CheckCircle className="h-12 w-12 text-accent/30 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">All clear!</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      No posts in your clusters, or you haven't joined any clusters yet.
                    </p>
                    <Link to="/explore">
                      <Button className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl">
                        Explore Clusters
                      </Button>
                    </Link>
                  </div>
                )}

                <div className="space-y-3">
                  {posts.map((post, i) => (
                    <motion.div
                      key={post.pid}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.03 }}
                      className="bg-card rounded-xl shadow-surface p-4"
                    >
                      <div className="flex gap-4">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-accent/10 text-accent text-xs font-bold">
                            {post.authorName[0]?.toUpperCase() ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Link to={`/user/${post.uid}`} className="text-sm font-semibold text-foreground hover:text-accent">
                              {post.authorName}
                            </Link>
                            <span className="text-xs text-muted-foreground">in</span>
                            <Link to={`/cluster/${post.cid}`} className="text-xs text-accent hover:underline font-medium">
                              c/{post.clusterName}
                            </Link>
                            <span className="text-xs text-muted-foreground ml-auto">{timeAgo(post.created_at)}</span>
                          </div>
                          <Link to={`/post/${post.pid}`}>
                            <p className="text-sm text-foreground leading-relaxed line-clamp-3 hover:text-accent transition-colors">
                              {post.content || "(no content)"}
                            </p>
                          </Link>
                          <div className="flex items-center gap-3 mt-3">
                            <span className="text-xs text-muted-foreground">
                              👍 {post.likes ?? 0} · 👎 {post.dislikes ?? 0}
                            </span>
                            <div className="ml-auto flex items-center gap-2">
                              <Link to={`/post/${post.pid}`}>
                                <Button variant="ghost" size="sm" className="h-7 px-3 text-xs gap-1.5 text-muted-foreground hover:text-foreground">
                                  <MessageSquare className="h-3.5 w-3.5" /> View
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(post.pid)}
                                disabled={deletingPid === post.pid}
                                className="h-7 px-3 text-xs gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                {deletingPid === post.pid
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <Trash2 className="h-3.5 w-3.5" />}
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeView === "settings" && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-card rounded-xl shadow-surface p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Moderation Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">Moderating</p>
                        <p className="text-xs text-muted-foreground">{clusterCount} cluster{clusterCount !== 1 ? "s" : ""} you are a member of</p>
                      </div>
                      <Link to="/explore">
                        <Button variant="outline" size="sm" className="rounded-lg text-xs">
                          Explore More
                        </Button>
                      </Link>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">Manage Your Clusters</p>
                        <p className="text-xs text-muted-foreground">Visit cluster pages to add moderators and set rules</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default ModerationPage;
