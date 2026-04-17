import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar, MapPin, Clock, UserPlus, UserCheck, FileText,
  MessageSquare, Users, ThumbsUp, Grid3X3, ArrowRight, Info,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  getUserProfile,
  getUserRecentPosts,
  getUserRecentComments,
  followUser,
  unfollowUser,
  checkFollowStatus,
  getClusterDetail,
  fetchCommentsForPost,
  fetchUserFollowers,
  fetchUserFollowing,
  type UserProfileResponse,
  type PostResponse,
} from "@/lib/api";
import PostCard from "@/components/feed/PostCard";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const timeAgo = (iso: string) => {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const mins = Math.floor(Math.max(0, now - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

type Tab = "posts" | "comments" | "about" | "followers" | "following";

const UserPublicProfilePage = () => {
  const { uid: targetUid } = useParams<{ uid: string }>();
  const { uid: myUid, token } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [clusterNames, setClusterNames] = useState<Record<string, string>>({});
  const [postCommentCounts, setPostCommentCounts] = useState<Record<string, number>>({});
  const [followersList, setFollowersList] = useState<{ uid: string; name: string; bio: string | null }[]>([]);
  const [followingList, setFollowingList] = useState<{ uid: string; name: string; bio: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingSocial, setLoadingSocial] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("posts");

  const isMyProfile = String(myUid) === String(targetUid);

  useEffect(() => {
    if (!targetUid) return;
    setLoading(true);
    getUserProfile(targetUid)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [targetUid]);

  useEffect(() => {
    if (profile?.follower_count != null) setFollowerCount(profile.follower_count);
  }, [profile]);

  useEffect(() => {
    if (!targetUid || !token) return;
    checkFollowStatus(targetUid)
      .then((d) => {
        setIsFollowing(d.is_following);
        setFollowerCount(d.follower_count);
      })
      .catch(() => {});
  }, [targetUid, token]);

  useEffect(() => {
    if (!targetUid) return;
    setLoadingPosts(true);
    getUserRecentPosts(targetUid, 30)
      .then(async (data) => {
        setPosts(data);
        const counts: Record<string, number> = {};
        await Promise.all(
          data.map(async (p) => {
            try {
              const c = await fetchCommentsForPost(p.pid);
              counts[p.pid] = c.length;
            } catch {
              counts[p.pid] = 0;
            }
          })
        );
        setPostCommentCounts(counts);
        const uniqueCids = [...new Set(data.map((p) => p.cid))];
        const nameMap: Record<string, string> = {};
        await Promise.allSettled(
          uniqueCids.map(async (cid) => {
            try {
              const c = await getClusterDetail(cid);
              nameMap[cid] = c.name;
            } catch {
              nameMap[cid] = cid.slice(0, 8);
            }
          })
        );
        setClusterNames((prev) => ({ ...prev, ...nameMap }));
      })
      .catch(() => setPosts([]))
      .finally(() => setLoadingPosts(false));
  }, [targetUid]);

  useEffect(() => {
    if (!targetUid || activeTab !== "followers") return;
    setLoadingSocial(true);
    fetchUserFollowers(targetUid)
      .then(setFollowersList)
      .catch(() => setFollowersList([]))
      .finally(() => setLoadingSocial(false));
  }, [targetUid, activeTab]);

  useEffect(() => {
    if (!targetUid || activeTab !== "following") return;
    setLoadingSocial(true);
    fetchUserFollowing(targetUid)
      .then(setFollowingList)
      .catch(() => setFollowingList([]))
      .finally(() => setLoadingSocial(false));
  }, [targetUid, activeTab]);

  useEffect(() => {
    if (!targetUid) return;
    setLoadingComments(true);
    getUserRecentComments(targetUid, 20)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoadingComments(false));
  }, [targetUid]);

  const handleFollow = async () => {
    if (!token) {
      toast({ title: "Not logged in", description: "Please log in to follow users.", variant: "destructive" });
      return;
    }
    if (!targetUid) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        const res = await unfollowUser(targetUid);
        setIsFollowing(false);
        setFollowerCount(res.follower_count ?? Math.max(0, followerCount - 1));
        toast({ title: "Unfollowed", description: `You unfollowed ${profile?.name ?? "this user"}.` });
      } else {
        const res = await followUser(targetUid);
        setIsFollowing(true);
        setFollowerCount(res.follower_count ?? followerCount + 1);
        toast({ title: "Following!", description: `You are now following ${profile?.name ?? "this user"}.` });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-muted-foreground text-sm animate-pulse">Loading profile…</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">User not found.</p>
        </div>
      </div>
    );
  }

  const initials = profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const joinedDate = new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "posts", label: "Posts", icon: Grid3X3 },
    { id: "comments", label: "Comments", icon: MessageSquare },
    { id: "followers", label: "Followers", icon: Users },
    { id: "following", label: "Following", icon: ArrowRight },
    { id: "about", label: "About", icon: Info },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        <div className="flex gap-6">
          <Sidebar />
          <main className="flex-1 min-w-0 space-y-6">
            {/* Profile Header */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl shadow-surface p-6 lg:p-8"
            >
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/40 flex items-center justify-center ring-4 ring-accent/20 shrink-0">
                  <span className="text-2xl font-bold text-accent">{initials}</span>
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
                      {profile.bio && (
                        <p className="text-sm text-muted-foreground mt-1 max-w-md">{profile.bio}</p>
                      )}
                    </div>
                    {!isMyProfile && (
                      <Button
                        size="sm"
                        variant={isFollowing ? "outline" : "default"}
                        onClick={handleFollow}
                        disabled={followLoading}
                        className={`shrink-0 rounded-full h-9 px-5 gap-2 ${
                          isFollowing
                            ? "border-accent text-accent hover:bg-accent/10"
                            : "bg-accent text-accent-foreground hover:bg-accent/90"
                        }`}
                      >
                        {isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                        {followLoading ? "…" : isFollowing ? "Following" : "Follow"}
                      </Button>
                    )}
                    {isMyProfile && (
                      <Link to="/profile">
                        <Button variant="outline" size="sm" className="rounded-full h-9 px-5 border-accent text-accent hover:bg-accent/10">
                          Edit Profile
                        </Button>
                      </Link>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Joined {joinedDate}</span>
                    {profile.location && (
                      <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{profile.location}</span>
                    )}
                    <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{followerCount} Followers</span>
                  </div>
                </div>
              </div>

              {/* Stat chips */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                {[
                  { label: "Posts", value: posts.length, icon: FileText },
                  { label: "Comments", value: comments.length, icon: MessageSquare },
                  { label: "Total Likes", value: posts.reduce((s, p) => s + (p.likes ?? 0), 0), icon: ThumbsUp },
                ].map((stat) => (
                  <div key={stat.label} className="bg-muted/50 rounded-xl p-3 text-center">
                    <stat.icon className="h-4 w-4 text-accent mx-auto mb-1" />
                    <p className="text-xl font-bold text-foreground tabular-nums">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Tabs */}
            <div className="bg-card rounded-2xl shadow-surface">
              <div className="flex border-b border-border overflow-x-auto scrollbar-thin">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex-1 min-w-[5.5rem] shrink-0 flex items-center justify-center gap-1.5 py-3 sm:py-4 px-1 text-xs sm:text-sm font-medium transition-colors relative ${
                      activeTab === t.id ? "text-accent" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <t.icon className="h-4 w-4" />
                    {t.label}
                    {activeTab === t.id && (
                      <motion.div layoutId="user-profile-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Posts Tab */}
                {activeTab === "posts" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {loadingPosts && <p className="text-muted-foreground text-sm text-center py-8 animate-pulse">Loading posts…</p>}
                    {!loadingPosts && posts.length === 0 && (
                      <p className="text-muted-foreground text-center py-12">No posts yet.</p>
                    )}
                    <div className="space-y-4">
                      {posts.map((post, i) => (
                        <motion.div
                          key={post.pid}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                        >
                          <PostCard
                            post={{
                              id: post.pid,
                              cid: post.cid,
                              uid: post.uid,
                              viewerUid: myUid ?? undefined,
                              community:
                                post.megaphone?.cluster_name ??
                                clusterNames[post.cid] ??
                                post.cid.slice(0, 8),
                              author: profile.name,
                              timeAgo: timeAgo(post.created_at),
                              title: post.content?.slice(0, 80) ?? "(no content)",
                              excerpt:
                                post.content && post.content.length > 80
                                  ? post.content.slice(80, 260)
                                  : undefined,
                              votes: (post.likes ?? 0) - (post.dislikes ?? 0),
                              comments: postCommentCounts[post.pid] ?? 0,
                              type: post.type,
                              megaphone: post.megaphone,
                              window_origin: post.window_origin,
                            }}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Comments Tab */}
                {activeTab === "comments" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {loadingComments && <p className="text-muted-foreground text-sm text-center py-8 animate-pulse">Loading comments…</p>}
                    {!loadingComments && comments.length === 0 && (
                      <p className="text-muted-foreground text-center py-12">No comments yet.</p>
                    )}
                    <div className="space-y-3">
                      {comments.map((comment: any, i: number) => (
                        <motion.div
                          key={comment.mid ?? i}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="bg-muted/50 rounded-xl p-4 border border-border"
                        >
                          <Link to={`/post/${comment.pid}`} className="block">
                            <p className="text-sm text-foreground leading-relaxed line-clamp-3 hover:text-accent transition-colors">
                              {comment.content || "(no content)"}
                            </p>
                          </Link>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 text-accent font-medium"><ThumbsUp className="h-3 w-3" />{comment.likes ?? 0}</span>
                            <span>{timeAgo(comment.created_at)}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === "followers" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <h2 className="text-lg font-semibold text-foreground mb-4">
                      Followers ({followersList.length})
                    </h2>
                    {loadingSocial && (
                      <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
                    )}
                    {!loadingSocial && followersList.length === 0 && (
                      <p className="text-muted-foreground text-center py-10">No followers yet.</p>
                    )}
                    {followersList.map((u) => (
                      <Link
                        key={u.uid}
                        to={`/user/${u.uid}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border hover:border-accent/40 hover:bg-muted transition-all"
                      >
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

                {activeTab === "following" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <h2 className="text-lg font-semibold text-foreground mb-4">
                      Following ({followingList.length})
                    </h2>
                    {loadingSocial && (
                      <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
                    )}
                    {!loadingSocial && followingList.length === 0 && (
                      <p className="text-muted-foreground text-center py-10">Not following anyone yet.</p>
                    )}
                    {followingList.map((u) => (
                      <Link
                        key={u.uid}
                        to={`/user/${u.uid}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border hover:border-accent/40 hover:bg-muted transition-all"
                      >
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

                {/* About Tab */}
                {activeTab === "about" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { label: "Member since", value: joinedDate, icon: Calendar },
                        profile.location && { label: "Location", value: profile.location, icon: MapPin },
                        { label: "Last active", value: new Date(profile.last_active).toLocaleDateString(), icon: Clock },
                        {
                          label: "Followers",
                          value: `${followerCount} people`,
                          icon: Users,
                        },
                        ...(profile.following_count != null
                          ? [
                              {
                                label: "Following",
                                value: `${profile.following_count} people`,
                                icon: ArrowRight,
                              },
                            ]
                          : []),
                      ].filter(Boolean).map((item: any, i) => (
                        <div key={i} className="bg-muted/50 rounded-xl p-4 flex items-center gap-3 border border-border">
                          <item.icon className="h-4 w-4 text-accent shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">{item.label}</p>
                            <p className="text-sm font-medium text-foreground">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {profile.bio && (
                      <div className="bg-muted/50 rounded-xl p-4 border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Bio</p>
                        <p className="text-sm text-foreground">{profile.bio}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default UserPublicProfilePage;
