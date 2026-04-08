import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import PostCard from "@/components/feed/PostCard";
import { fetchPosts, type PostResponse } from "@/lib/api";

function toCardPost(p: PostResponse) {
  const lines = (p.content ?? "").split("\n").filter(Boolean);
  const title = lines[0]?.slice(0, 120) ?? "(no content)";
  const excerpt = lines.slice(1).join(" ").slice(0, 200) || undefined;
  return {
    id: p.pid,
    community: p.cid.slice(0, 8),
    author: p.uid.slice(0, 8),
    timeAgo: new Date(p.created_at).toLocaleDateString(),
    title,
    excerpt,
    votes: (p.likes ?? 0) - (p.dislikes ?? 0),
    comments: 0,
  };
}

const PopularPage = () => {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch a larger batch and sort by likes client-side (trending)
    fetchPosts(0, 100)
      .then((data) => {
        const sorted = [...data].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
        setPosts(sorted.slice(0, 25));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        <div className="flex gap-6">
          <Sidebar />
          <main className="flex-1 min-w-0 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3 mb-2"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Flame className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Popular</h1>
                <p className="text-sm text-muted-foreground">Top posts across all clusters right now.</p>
              </div>
            </motion.div>

            {loading && <p className="text-center text-muted-foreground py-12">Loading popular posts…</p>}

            {posts.map((post, i) => (
              <motion.div
                key={post.pid}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <PostCard post={toCardPost(post)} />
              </motion.div>
            ))}
          </main>
        </div>
      </div>
    </div>
  );
};

export default PopularPage;
