import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {
  Users, Calendar, Share2, Code2, Trash2, Shield, UserPlus, X, Check,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import PostCard from "@/components/feed/PostCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  getClusterDetail,
  getUserProfile,
  fetchPosts,
  fetchCommentsForPost,
  joinCluster,
  leaveCluster,
  checkMyClusterMembership,
  addClusterModerator,
  deletePost,
  fetchClusterMembers,
  type ClusterDetailResponse,
  type PostResponse,
  type ClusterMembershipStatus,
} from "@/lib/api";

const timeAgo = (iso: string) => {
  const then = new Date(iso).getTime();
  const diffMs = Math.max(0, Date.now() - then);
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const ClusterPage = () => {
  const { id } = useParams<{ id: string }>();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const { token, uid } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [cluster, setCluster] = useState<ClusterDetailResponse | null>(null);
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [membership, setMembership] = useState<ClusterMembershipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [joiningLeaving, setJoiningLeaving] = useState(false);

  // Add moderator modal
  const [showAddMod, setShowAddMod] = useState(false);
  const [modUid, setModUid] = useState("");
  const [addingMod, setAddingMod] = useState(false);
  const [members, setMembers] = useState<{ uid: string; name: string; role: string }[]>([]);

  // Load cluster details
  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const loadCluster = async () => {
      try {
        const clusterData = await getClusterDetail(id);
        setCluster(clusterData);

        // Load posts for this cluster — use cid filter directly
        const clusterPosts = await fetchPosts(0, 100, id);
        setPosts(clusterPosts);

        // Comment counts
        const counts: Record<string, number> = {};
        await Promise.all(
          clusterPosts.map(async (post) => {
            try {
              const comments = await fetchCommentsForPost(post.pid);
              counts[post.pid] = comments.length;
            } catch {
              counts[post.pid] = 0;
            }
          })
        );
        setCommentCounts(counts);

        // Resolve user names
        const uniqueUids = [...new Set(clusterPosts.map((p) => p.uid))];
        const userMap: Record<string, string> = {};
        await Promise.allSettled(
          uniqueUids.map(async (u) => {
            try {
              const profile = await getUserProfile(u);
              userMap[u] = profile.name;
            } catch {
              userMap[u] = u.slice(0, 8);
            }
          })
        );
        setUserNames(userMap);
      } catch (err: any) {
        toast({ title: "Error loading cluster", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    loadCluster();
  }, [id]);

  // Background poll for posts
  useEffect(() => {
    if (!id) return;
    const pollPosts = async () => {
      try {
        const clusterPosts = await fetchPosts(0, 100, id);
        setPosts(clusterPosts);

        const counts: Record<string, number> = {};
        await Promise.all(
          clusterPosts.map(async (post) => {
            try {
              const comments = await fetchCommentsForPost(post.pid);
              counts[post.pid] = comments.length;
            } catch {
              counts[post.pid] = 0;
            }
          })
        );
        setCommentCounts(counts);

        const uniqueUids = [...new Set(clusterPosts.map((p) => p.uid))];
        const userMap: Record<string, string> = {};
        await Promise.allSettled(
          uniqueUids.map(async (u) => {
            try {
              const profile = await getUserProfile(u);
              userMap[u] = profile.name;
            } catch {
              userMap[u] = u.slice(0, 8);
            }
          })
        );
        setUserNames(userMap);
      } catch {}
    };

    const iv = setInterval(pollPosts, 10000);
    return () => clearInterval(iv);
  }, [id]);

  // Check membership status
  useEffect(() => {
    if (!id || !token) {
      setMembership(null);
      return;
    }
    checkMyClusterMembership(id)
      .then(setMembership)
      .catch(() => setMembership(null));
  }, [id, token]);

  const handleJoin = async () => {
    if (!token) {
      toast({ title: "Not logged in", description: "Please log in to join clusters.", variant: "destructive" });
      return;
    }
    setJoiningLeaving(true);
    try {
      await joinCluster(id!);
      const updated = await checkMyClusterMembership(id!);
      setMembership(updated);
      toast({ title: "Joined!", description: `You're now a member of ${cluster?.name}.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setJoiningLeaving(false);
    }
  };

  const handleLeave = async () => {
    setJoiningLeaving(true);
    try {
      await leaveCluster(id!);
      setMembership((prev) => prev ? { ...prev, is_member: false, role: null, is_moderator: false } : null);
      toast({ title: "Left cluster", description: `You are no longer a member of ${cluster?.name}.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setJoiningLeaving(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: cluster?.name, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Cluster link copied to clipboard." });
    }
  };

  const handleAddModerator = async () => {
    if (!modUid.trim()) return;
    setAddingMod(true);
    try {
      await addClusterModerator(id!, modUid.trim());
      toast({ title: "Moderator added!", description: "The user has been promoted to moderator." });
      setModUid("");
      setShowAddMod(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setAddingMod(false);
    }
  };

  const openAddMod = async () => {
    setShowAddMod(true);
    if (id && members.length === 0) {
      fetchClusterMembers(id)
        .then((m) => setMembers(m.filter((x) => x.role !== "MODERATOR")))
        .catch(() => {});
    }
  };

  const handleDeletePost = async (pid: string) => {
    try {
      await deletePost(pid);
      setPosts((prev) => prev.filter((p) => p.pid !== pid));
      toast({ title: "Post deleted", description: "The post has been removed." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const isCreator = membership?.is_creator ?? false;
  const isModerator = membership?.is_moderator ?? false;
  const isMember = membership?.is_member ?? false;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <p className="text-muted-foreground">Loading cluster…</p>
        </div>
      </div>
    );
  }

  if (!cluster) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-muted-foreground text-lg">Cluster not found.</p>
          <Button onClick={() => navigate("/explore")}>Browse Clusters</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero with parallax */}
      <div ref={heroRef} className="relative overflow-hidden">
        <motion.div
          style={{ y: heroY }}
          className="absolute inset-0 bg-gradient-to-b from-accent/10 via-accent/5 to-background h-[280px]"
        />
        <motion.div style={{ opacity: heroOpacity as any }} className="relative max-w-[1000px] mx-auto px-4 lg:px-6 pt-8 pb-6">
          <div className="bg-card rounded-2xl shadow-surface overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary/10 via-accent/20 to-accent/10 relative">
              <div className="absolute bottom-0 left-6 translate-y-1/2">
                <div className="w-24 h-24 rounded-2xl bg-accent flex items-center justify-center shadow-surface">
                  <Code2 className="h-10 w-10 text-accent-foreground" />
                </div>
              </div>
            </div>
            <div className="pt-16 px-6 pb-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{cluster.name}</h1>
                  {cluster.description && (
                    <p className="text-sm text-muted-foreground mt-1 max-w-lg">{cluster.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {cluster.member_count.toLocaleString()} members
                    </span>
                    {cluster.category && (
                      <span className="text-accent font-medium">#{cluster.category}</span>
                    )}
                    {cluster.created_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Created {new Date(cluster.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {/* Moderator/Creator badges */}
                  <div className="flex gap-2 mt-2">
                    {isCreator && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                        👑 CREATOR
                      </span>
                    )}
                    {!isCreator && isModerator && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        🛡️ MODERATOR
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {isMember ? (
                    <Button
                      variant="outline"
                      className="rounded-xl h-10 px-6 font-medium border-green-500 text-green-500 hover:bg-green-500/10"
                      onClick={handleLeave}
                      disabled={joiningLeaving}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {joiningLeaving ? "Leaving…" : "Joined"}
                    </Button>
                  ) : (
                    <Button
                      className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl h-10 px-6 font-medium"
                      onClick={handleJoin}
                      disabled={joiningLeaving}
                    >
                      {joiningLeaving ? "Joining…" : "Join Cluster"}
                    </Button>
                  )}
                  {isCreator && (
                    <Button
                      variant="outline"
                      className="rounded-xl h-10 px-4 gap-2 border-accent/40 text-accent"
                      onClick={openAddMod}
                    >
                      <UserPlus className="h-4 w-4" />
                      <span className="hidden sm:inline">Add Moderator</span>
                    </Button>
                  )}
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Tags */}
              {cluster.tags && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {cluster.tags.split(",").map((tag) => (
                    <span key={tag} className="text-xs text-accent font-medium bg-accent/10 px-2.5 py-1 rounded-md">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-[1000px] mx-auto px-4 lg:px-6 py-6">
        <div className="flex gap-6">
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Posts <span className="text-sm font-normal text-muted-foreground">({posts.length})</span>
              </h2>
            </div>

            {posts.length === 0 && (
              <div className="bg-card rounded-xl shadow-surface p-8 text-center text-muted-foreground">
                <p className="text-sm">No posts yet in this cluster.</p>
                {isMember && (
                  <p className="text-xs mt-2 text-accent">Be the first to post!</p>
                )}
              </div>
            )}

            <div className="space-y-4">
              {posts.map((post, i) => (
                <motion.div
                  key={post.pid}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="relative group"
                >
                  <PostCard
                    post={{
                      id: post.pid,
                      cid: post.cid,
                      uid: post.uid,
                      viewerUid: uid ?? undefined,
                      community: cluster.name,
                      author: userNames[post.uid] ?? post.uid.slice(0, 8),
                      timeAgo: timeAgo(post.created_at),
                      title: post.content?.slice(0, 80) ?? "(no content)",
                      excerpt: post.content && post.content.length > 80 ? post.content.slice(80, 260) : undefined,
                      votes: (post.likes ?? 0) - (post.dislikes ?? 0),
                      comments: commentCounts[post.pid] ?? 0,
                      type: post.type,
                      megaphone: post.megaphone,
                      window_origin: post.window_origin,
                    }}
                  />
                  {/* Moderator delete button */}
                  {(isModerator || isCreator) && (
                    <button
                      onClick={() => handleDeletePost(post.pid)}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full bg-destructive/10 hover:bg-destructive flex items-center justify-center text-destructive hover:text-destructive-foreground"
                      title="Delete post (moderator)"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </main>

          <aside className="w-72 shrink-0 hidden lg:block space-y-4">
            {/* Cluster Stats */}
            <div className="bg-card rounded-xl shadow-surface p-4">
              <h3 className="font-semibold text-foreground mb-3">Cluster Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Members</span>
                  <span className="font-medium tabular-nums">{cluster.member_count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Posts</span>
                  <span className="font-medium tabular-nums">{posts.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium">{cluster.category ?? "General"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Visibility</span>
                  <span className="font-medium">{cluster.is_private ? "Private" : "Public"}</span>
                </div>
              </div>
            </div>

            {/* Your role */}
            {token && (
              <div className="bg-card rounded-xl shadow-surface p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent" /> Your Role
                </h3>
                {!isMember ? (
                  <p className="text-sm text-muted-foreground">Not a member</p>
                ) : isCreator ? (
                  <p className="text-sm font-medium text-accent">👑 Creator</p>
                ) : isModerator ? (
                  <p className="text-sm font-medium text-blue-400">🛡️ Moderator</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Member</p>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Add Moderator Modal */}
      {showAddMod && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddMod(false); }}
        >
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" /> Add Moderator
              </h2>
              <button onClick={() => setShowAddMod(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Select a cluster member to promote to moderator.
              </p>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Loading members…</p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {members.map((m) => (
                    <button
                      key={m.uid}
                      onClick={() => setModUid(m.uid)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
                        modUid === m.uid ? "bg-accent/10 border border-accent/30" : "hover:bg-muted border border-transparent"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold shrink-0">
                        {m.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.role}</p>
                      </div>
                      {modUid === m.uid && <Check className="h-4 w-4 text-accent ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => setShowAddMod(false)}>Cancel</Button>
              <Button
                size="sm"
                disabled={addingMod || !modUid.trim()}
                onClick={handleAddModerator}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {addingMod ? "Adding…" : "Add Moderator"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClusterPage;
