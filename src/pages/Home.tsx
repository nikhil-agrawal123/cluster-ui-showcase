import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Home as HomeIcon, Megaphone } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import PostCard from "@/components/feed/PostCard";
import CreatePostBar from "@/components/feed/CreatePostBar";
import TrendingClusters from "@/components/feed/TrendingClusters";
import {
  fetchPosts,
  fetchCommentsForPost,
  getClusterDetail,
  getUserProfile,
  fetchMyFeed,
  fetchTrendingFeed,
  fetchActiveMegaphones,
  type PostResponse,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const Footer = () => (
  <div className="text-xs text-muted-foreground space-x-3 mt-4">
    <a href="#" className="hover:text-foreground">About</a>
    <a href="#" className="hover:text-foreground">Careers</a>
    <a href="#" className="hover:text-foreground">Help Center</a>
    <a href="#" className="hover:text-foreground">Privacy Policy</a>
    <p className="mt-2">© 2024 Cluster, Inc. All rights reserved.</p>
  </div>
);

const timeAgo = (iso: string) => {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

type FeedTab = "my-feed" | "trending";

const Home = () => {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");
  const [tab, setTab] = useState<FeedTab>(
    urlTab === "trending" ? "trending" : token ? "my-feed" : "trending"
  );
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [megaphones, setMegaphones] = useState<any[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [clusterNames, setClusterNames] = useState<Record<string, string>>({});
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const resolveMeta = async (fetchedPosts: PostResponse[]) => {
    // Comment counts
    const counts: Record<string, number> = {};
    await Promise.all(
      fetchedPosts.map(async (post) => {
        try {
          const c = await fetchCommentsForPost(post.pid);
          counts[post.pid] = c.length;
        } catch {
          counts[post.pid] = 0;
        }
      })
    );
    setCommentCounts(counts);

    // Cluster names
    const uniqueCids = [...new Set(fetchedPosts.map((p) => p.cid))];
    const clusterMap: Record<string, string> = {};
    await Promise.allSettled(
      uniqueCids.map(async (cid) => {
        try {
          const cluster = await getClusterDetail(cid);
          clusterMap[cid] = cluster.name;
        } catch {
          clusterMap[cid] = cid.slice(0, 8);
        }
      })
    );
    setClusterNames(clusterMap);

    // User names
    const uniqueUids = [...new Set(fetchedPosts.map((p) => p.uid))];
    const userMap: Record<string, string> = {};
    await Promise.allSettled(
      uniqueUids.map(async (uid) => {
        try {
          const user = await getUserProfile(uid);
          userMap[uid] = user.name;
        } catch {
          userMap[uid] = uid.slice(0, 8);
        }
      })
    );
    setUserNames(userMap);
  };

  const loadFeed = useCallback(async (t: FeedTab) => {
    setLoading(true);
    try {
      let fetched: PostResponse[] = [];
      if (t === "my-feed" && token) {
        fetched = await fetchMyFeed(40);
        // Fallback to global if no joined clusters
        if (fetched.length === 0) fetched = await fetchPosts(0, 25);
        // Also load megaphones for My Feed
        fetchActiveMegaphones().then(setMegaphones).catch(() => {});
      } else {
        fetched = await fetchTrendingFeed(30);
        if (fetched.length === 0) fetched = await fetchPosts(0, 25);
        setMegaphones([]);
      }
      setPosts(fetched);
      await resolveMeta(fetched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadFeed(tab); }, [tab]);
  // Switch to trending if not logged in
  useEffect(() => { if (!token) setTab("trending"); }, [token]);

  const tabs: { id: FeedTab; label: string; icon: any; requiresAuth?: boolean }[] = [
    { id: "my-feed", label: "My Feed", icon: HomeIcon, requiresAuth: true },
    { id: "trending", label: "Trending", icon: Flame },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        <div className="flex gap-6">
          <Sidebar />
          <main className="flex-1 min-w-0 space-y-4">
            {/* Feed Tab Switcher */}
            <div className="flex items-center gap-1 bg-card rounded-xl px-2 py-1.5 shadow-surface w-fit">
              {tabs.map((t) => {
                const isActive = tab === t.id;
                const isDisabled = t.requiresAuth && !token;
                return (
                  <button
                    key={t.id}
                    onClick={() => !isDisabled && setTab(t.id)}
                    disabled={isDisabled}
                    title={isDisabled ? "Log in to see your personalized feed" : undefined}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : isDisabled
                        ? "text-muted-foreground/40 cursor-not-allowed"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <t.icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            <CreatePostBar onCreated={() => loadFeed(tab)} />

            {loading && <p className="text-sm text-muted-foreground text-center py-8">Loading posts…</p>}
            {!loading && posts.length === 0 && (
              <div className="text-center py-16">
                <p className="text-sm text-muted-foreground mb-2">
                  {tab === "my-feed"
                    ? "No posts from your clusters yet. Join more clusters!"
                    : "No trending posts yet."}
                </p>
              </div>
            )}
            {posts.map((post, i) => (
              <motion.div
                key={post.pid}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <PostCard
                  post={{
                    id: post.pid,
                    cid: post.cid,
                    uid: post.uid,
                    community: clusterNames[post.cid] ?? post.cid.slice(0, 8),
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
              </motion.div>
            ))}
          </main>
          <aside className="w-72 shrink-0 hidden xl:block space-y-4">
            <TrendingClusters />
            <Footer />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Home;
