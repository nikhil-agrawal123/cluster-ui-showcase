import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import PostCard from "@/components/feed/PostCard";
import CreatePostBar from "@/components/feed/CreatePostBar";
import TrendingClusters from "@/components/feed/TrendingClusters";
import { fetchPosts, fetchCommentsForPost, type PostResponse } from "@/lib/api";

const Footer = () => (
  <div className="text-xs text-muted-foreground space-x-3 mt-4">
    <a href="#" className="hover:text-foreground">About</a>
    <a href="#" className="hover:text-foreground">Careers</a>
    <a href="#" className="hover:text-foreground">Help Center</a>
    <a href="#" className="hover:text-foreground">Privacy Policy</a>
    <p className="mt-2">© 2024 Cluster, Inc. All rights reserved.</p>
  </div>
);

/** Convert an API PostResponse into the shape PostCard expects */
function toCardPost(p: PostResponse, commentCount: number = 0) {
  return {
    id: p.pid,
    community: p.cid.slice(0, 8), // short cluster id (will be replaced by cluster name later)
    author: p.uid.slice(0, 8),
    timeAgo: new Date(p.created_at).toLocaleDateString(),
    title: p.content?.slice(0, 80) ?? "(no content)",
    excerpt: p.content && p.content.length > 80 ? p.content.slice(80, 260) : undefined,
    votes: (p.likes ?? 0) - (p.dislikes ?? 0),
    comments: commentCount,
  };
}

const Home = () => {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const fetchedPosts = await fetchPosts(0, 25);
      setPosts(fetchedPosts);
      
      // Fetch comment counts for each post
      const counts: Record<string, number> = {};
      await Promise.all(
        fetchedPosts.map(async (post) => {
          try {
            const comments = await fetchCommentsForPost(post.pid);
            counts[post.pid] = comments.length;
          } catch (err) {
            counts[post.pid] = 0;
          }
        })
      );
      setCommentCounts(counts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPosts(); }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        <div className="flex gap-6">
          <Sidebar />
          <main className="flex-1 min-w-0 space-y-4">
            <CreatePostBar onPostCreated={loadPosts} />
            {loading && <p className="text-sm text-muted-foreground text-center py-8">Loading posts…</p>}
            {!loading && posts.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No posts yet. Be the first to post!</p>
            )}
            {posts.map((post, i) => (
              <motion.div
                key={post.pid}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <PostCard post={toCardPost(post, commentCounts[post.pid] ?? 0)} />
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
