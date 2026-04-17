import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  Calendar, MapPin, Sparkles, Clock, Users, Grid3X3,
  Pencil, Search, SlidersHorizontal, ArrowRight, Plus,
  ThumbsUp, ThumbsDown, MessageSquare, Save, X, FileText,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  getUserPosts,
  getUserPostDistribution,
  getUserTopPosts,
  getUserTopComments,
  updateMyProfile,
  fetchUserFollowers,
  fetchUserFollowing,
} from "@/lib/api";
import { Link } from "react-router-dom";

const ProfilePage = () => {
  const { token, uid, profile, login } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("posts");
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const avatarScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.7]);
  const headerY = useTransform(scrollYProgress, [0, 1], [0, 50]);

  // Data states
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [postDistribution, setPostDistribution] = useState<any[]>([]);
  const [topPosts, setTopPosts] = useState<any[]>([]);
  const [topComments, setTopComments] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);

  // Edit profile states
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [saving, setSaving] = useState(false);

  // Load data when tab changes
  useEffect(() => {
    if (!uid) return;
    setLoadingTab(true);

    const loadData = async () => {
      try {
        if (activeTab === "posts" && userPosts.length === 0) {
          const posts = await getUserPosts(uid);
          setUserPosts(posts);
        }
        if (activeTab === "analytics") {
          const [dist, top, comments] = await Promise.all([
            postDistribution.length === 0 ? getUserPostDistribution(uid) : Promise.resolve(postDistribution),
            topPosts.length === 0 ? getUserTopPosts(uid, 5) : Promise.resolve(topPosts),
            topComments.length === 0 ? getUserTopComments(uid, 5) : Promise.resolve(topComments),
          ]);
          setPostDistribution(dist);
          setTopPosts(top);
          setTopComments(comments);
        }
        if (activeTab === "followers") {
          const data = await fetchUserFollowers(uid);
          setFollowers(data);
        }
        if (activeTab === "following") {
          const data = await fetchUserFollowing(uid);
          setFollowing(data);
        }
      } catch (err: any) {
        console.error("Failed to load tab data:", err);
      } finally {
        setLoadingTab(false);
      }
    };
    loadData();
  }, [activeTab, uid]);

  const startEditing = () => {
    setEditName(profile?.name || "");
    setEditBio(profile?.bio || "");
    setEditLocation(profile?.location || "");
    setEditing(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateMyProfile({
        name: editName,
        bio: editBio,
        location: editLocation,
      });
      toast({ title: "Profile updated!", description: "Your changes have been saved." });
      setEditing(false);
      // Re-fetch profile by re-triggering auth context  
      window.location.reload();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!token || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  const initials = profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const joinedDate = new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const lastActive = new Date(profile.last_active).toLocaleString();

  const statCards = [
    { label: "Total Posts", value: userPosts.length || "—", icon: FileText },
    { label: "Last Active", value: lastActive.split(",")[0], icon: Clock },
    { label: "Post Clusters", value: postDistribution.length || "—", icon: Users },
    { label: "Member Since", value: joinedDate, icon: Calendar },
  ];

  const tabs = [
    { id: "posts", label: "My Posts", icon: Grid3X3 },
    { id: "followers", label: "Followers", icon: Users },
    { id: "following", label: "Following", icon: ArrowRight },
    { id: "analytics", label: "Analytics", icon: Sparkles },
    { id: "settings", label: "Settings", icon: SlidersHorizontal },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Profile Header */}
      <div ref={heroRef}>
        <motion.div style={{ y: headerY }} className="max-w-[1000px] mx-auto px-4 lg:px-6 pt-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            className="bg-card rounded-2xl shadow-surface p-6 lg:p-8"
          >
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <motion.div style={{ scale: avatarScale }} className="origin-top-left">
                <div className="relative">
                  <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/40 flex items-center justify-center ring-4 ring-accent/20">
                    <span className="text-3xl font-bold text-accent">{initials}</span>
                  </div>
                </div>
              </motion.div>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    {editing ? (
                      <div className="space-y-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-9 text-lg font-bold rounded-lg bg-muted border-0"
                          placeholder="Name"
                        />
                        <Input
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value)}
                          className="h-9 text-sm rounded-lg bg-muted border-0"
                          placeholder="Bio"
                        />
                        <Input
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                          className="h-9 text-sm rounded-lg bg-muted border-0"
                          placeholder="Location"
                        />
                      </div>
                    ) : (
                      <>
                        <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
                        <p className="text-sm text-muted-foreground mt-1 max-w-md">{profile.bio || "No bio yet"}</p>
                      </>
                    )}
                  </div>
                  {editing ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing(false)}
                        className="rounded-lg gap-1.5"
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={saveProfile}
                        disabled={saving}
                        className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg gap-1.5"
                      >
                        <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="hidden sm:flex items-center gap-2 rounded-xl border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                      onClick={startEditing}
                    >
                      <Pencil className="h-4 w-4" /> Edit Profile
                    </Button>
                  )}
                </div>
                {!editing && (
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Joined {joinedDate}</span>
                    {profile.location && (
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.location}</span>
                    )}
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Active {lastActive}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Stats cards */}
      <div className="max-w-[1000px] mx-auto px-4 lg:px-6 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              className="bg-card rounded-xl shadow-surface p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                <stat.icon className="h-4 w-4 text-accent" />
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tabs & content */}
      <div className="max-w-[1000px] mx-auto px-4 lg:px-6 pb-12">
        <div className="bg-card rounded-2xl shadow-surface">
          <div className="flex border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id ? "text-accent" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="profile-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Posts Tab */}
            {activeTab === "posts" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-foreground">
                    Your Posts ({userPosts.length})
                  </h2>
                </div>
                {loadingTab && <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>}
                {!loadingTab && userPosts.length === 0 && (
                  <p className="text-muted-foreground text-center py-12">You haven't posted anything yet.</p>
                )}
                <div className="space-y-3">
                  {userPosts.slice(0, 20).map((post: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="bg-muted/50 rounded-xl p-4 border border-border hover:shadow-surface transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground leading-relaxed line-clamp-2">
                            {post[2] || post.content || "(no content)"}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" /> {post[3] ?? post.likes ?? 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsDown className="h-3 w-3" /> {post[4] ?? post.dislikes ?? 0}
                            </span>
                            <span>{post[5] || post.created_at || ""}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Followers Tab */}
            {activeTab === "followers" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground mb-4">Followers ({followers.length})</h2>
                {loadingTab && <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>}
                {!loadingTab && followers.length === 0 && (
                  <p className="text-muted-foreground text-center py-10">No followers yet.</p>
                )}
                {followers.map((u: any) => (
                  <Link key={u.uid} to={`/user/${u.uid}`} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border hover:border-accent/40 hover:bg-muted transition-all">
                    <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent text-sm font-bold shrink-0">
                      {u.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{u.name}</p>
                      {u.bio && <p className="text-xs text-muted-foreground truncate">{u.bio}</p>}
                    </div>
                  </Link>
                ))}
              </motion.div>
            )}

            {/* Following Tab */}
            {activeTab === "following" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground mb-4">Following ({following.length})</h2>
                {loadingTab && <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>}
                {!loadingTab && following.length === 0 && (
                  <p className="text-muted-foreground text-center py-10">You're not following anyone yet.</p>
                )}
                {following.map((u: any) => (
                  <Link key={u.uid} to={`/user/${u.uid}`} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border hover:border-accent/40 hover:bg-muted transition-all">
                    <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent text-sm font-bold shrink-0">
                      {u.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{u.name}</p>
                      {u.bio && <p className="text-xs text-muted-foreground truncate">{u.bio}</p>}
                    </div>
                  </Link>
                ))}
              </motion.div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                {loadingTab && <p className="text-sm text-muted-foreground text-center py-8">Loading analytics…</p>}

                {/* Post Distribution */}
                {!loadingTab && postDistribution.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-accent" /> Post Distribution Across Clusters
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {postDistribution.map((item: any, i: number) => (
                        <div key={i} className="bg-muted/50 rounded-lg p-3 flex items-center justify-between border border-border">
                          <span className="text-sm text-foreground font-medium truncate">
                            {item[0] || item.cluster_name || `Cluster #${i + 1}`}
                          </span>
                          <span className="text-sm font-bold text-accent tabular-nums">
                            {item[1] || item.post_count || 0} posts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Posts */}
                {!loadingTab && topPosts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-accent" /> Top Liked Posts
                    </h3>
                    <div className="space-y-2">
                      {topPosts.map((post: any, i: number) => (
                        <div key={i} className="bg-muted/50 rounded-lg p-3 border border-border">
                          <p className="text-sm text-foreground line-clamp-1">
                            {post[1] || post.content || "(no content)"}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 text-accent font-medium">
                              <ThumbsUp className="h-3 w-3" /> {post[2] ?? post.likes ?? 0} likes
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Comments */}
                {!loadingTab && topComments.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-accent" /> Top Comments
                    </h3>
                    <div className="space-y-2">
                      {topComments.map((comment: any, i: number) => (
                        <div key={i} className="bg-muted/50 rounded-lg p-3 border border-border">
                          <p className="text-sm text-foreground line-clamp-2">
                            {comment[1] || comment.content || "(no content)"}
                          </p>
                          <span className="text-xs text-accent font-medium mt-1 inline-flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" /> {comment[2] ?? comment.likes ?? 0} likes
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!loadingTab && topPosts.length === 0 && postDistribution.length === 0 && (
                  <p className="text-muted-foreground text-center py-12">
                    Not enough data for analytics yet. Start posting!
                  </p>
                )}
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Profile Information</h3>
                  <div className="grid gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
                      <Input
                        value={editName || profile.name}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-10 rounded-lg bg-muted border-0 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Bio</label>
                      <Input
                        value={editBio || profile.bio || ""}
                        onChange={(e) => setEditBio(e.target.value)}
                        className="h-10 rounded-lg bg-muted border-0 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Location</label>
                      <Input
                        value={editLocation || profile.location || ""}
                        onChange={(e) => setEditLocation(e.target.value)}
                        className="h-10 rounded-lg bg-muted border-0 text-sm"
                      />
                    </div>
                    <Button
                      onClick={saveProfile}
                      disabled={saving}
                      className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl w-fit gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? "Saving…" : "Save Changes"}
                    </Button>
                  </div>
                </div>
                <div className="border-t border-border pt-6">
                  <h3 className="text-sm font-semibold text-destructive mb-2">Danger Zone</h3>
                  <p className="text-xs text-muted-foreground mb-3">Once you delete your account, there is no going back.</p>
                  <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 rounded-xl text-sm">
                    Delete Account
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-[1000px] mx-auto px-4 lg:px-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-accent flex items-center justify-center">
              <span className="text-[8px] text-accent-foreground font-bold">C</span>
            </div>
            <span className="font-medium">Cluster</span>
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground">Privacy Policy</a>
            <a href="#" className="hover:text-foreground">Terms of Service</a>
            <a href="#" className="hover:text-foreground">Documentation</a>
            <a href="#" className="hover:text-foreground">Support</a>
          </div>
          <span>© 2024 Cluster Inc. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default ProfilePage;
