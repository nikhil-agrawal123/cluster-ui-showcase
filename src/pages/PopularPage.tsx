import { motion } from "framer-motion";
import { TrendingUp, Flame } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import PostCard from "@/components/feed/PostCard";

const popularPosts = [
  { id: "p1", community: "CyberSecurity", author: "sec_researcher", timeAgo: "3h ago", title: "Zero-day vulnerability discovered in popular npm package", excerpt: "A critical vulnerability has been found affecting over 2 million downloads. Here's what you need to know.", votes: 4820, comments: 312 },
  { id: "p2", community: "MLResearch", author: "ai_pioneer", timeAgo: "6h ago", title: "We achieved 97% accuracy on ImageNet with a 10x smaller model", excerpt: "Our distillation technique outperforms existing methods while being dramatically more efficient.", votes: 3650, comments: 198 },
  { id: "p3", community: "OpenSource", author: "oss_maintainer", timeAgo: "8h ago", title: "How we got 10,000 GitHub stars in 30 days", excerpt: "A transparent breakdown of our launch strategy, community building, and what actually moved the needle.", votes: 2980, comments: 145 },
  { id: "p4", community: "WebPerformance", author: "perf_ninja", timeAgo: "12h ago", title: "The hidden cost of third-party scripts: a 2024 analysis", excerpt: "We tested the top 1000 sites and found shocking performance regressions from common embeds.", votes: 2140, comments: 89 },
  { id: "p5", community: "GameDev", author: "indie_studio", timeAgo: "1d ago", title: "Our pixel-art RPG just hit 1 million downloads", excerpt: "Two years of development by a team of 3. Here's our full postmortem.", votes: 1890, comments: 234 },
];

const PopularPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
      <div className="flex gap-6">
        <Sidebar />
        <main className="flex-1 min-w-0 space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Flame className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Popular</h1>
              <p className="text-sm text-muted-foreground">Top posts across all clusters right now.</p>
            </div>
          </motion.div>

          {popularPosts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </main>
      </div>
    </div>
  </div>
);

export default PopularPage;
