import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Users, Calendar, Share2, Code2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import PostCard from "@/components/feed/PostCard";
import { Button } from "@/components/ui/button";
import { clusterData, posts } from "@/lib/mockData";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const ClusterPage = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero with parallax */}
      <div ref={heroRef} className="relative overflow-hidden">
        <motion.div
          style={{ y: heroY }}
          className="absolute inset-0 bg-gradient-to-b from-accent/10 via-accent/5 to-background h-[280px]"
        />
        <motion.div style={{ opacity: heroOpacity }} className="relative max-w-[1000px] mx-auto px-4 lg:px-6 pt-8 pb-6">
          <div className="bg-card rounded-2xl shadow-surface overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary/10 via-accent/20 to-accent/10 relative">
              <div className="absolute bottom-0 left-6 translate-y-1/2">
                <div className="w-24 h-24 rounded-2xl bg-accent flex items-center justify-center shadow-surface">
                  <Code2 className="h-10 w-10 text-accent-foreground" />
                </div>
              </div>
            </div>
            <div className="pt-16 px-6 pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{clusterData.name}</h1>
                  <p className="text-sm text-muted-foreground mt-1 max-w-lg">{clusterData.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" />{clusterData.members} members</span>
                    <span className="text-success font-medium">● {clusterData.active} active</span>
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Joined {clusterData.joined}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl h-10 px-6 font-medium">
                    Join Cluster
                  </Button>
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-6 mt-6 border-t border-border pt-4">
                {["Feed", "Resources", "Projects", "Events"].map((tab, i) => (
                  <button key={tab} className={`text-sm font-medium pb-2 border-b-2 transition-colors ${i === 0 ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-[1000px] mx-auto px-4 lg:px-6 py-6">
        <div className="flex gap-6">
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Latest Windows</h2>
              <div className="flex gap-2">
                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full h-7 px-4 text-xs">Trending</Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground rounded-full h-7 px-4 text-xs">Newest</Button>
              </div>
            </div>
            <div className="space-y-4">
              {posts.slice(0, 3).map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <PostCard post={post} />
                </motion.div>
              ))}
            </div>
          </main>

          <aside className="w-72 shrink-0 hidden lg:block space-y-4">
            {/* Stats */}
            <div className="bg-card rounded-xl shadow-surface p-4">
              <h3 className="font-semibold text-foreground mb-3">Cluster Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-xl font-bold text-accent tabular-nums">{clusterData.stats.engineers}</p>
                  <p className="text-xs text-muted-foreground">Engineers</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-xl font-bold text-accent tabular-nums">{clusterData.stats.dailyPosts}</p>
                  <p className="text-xs text-muted-foreground">Daily Posts</p>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Engagement Rate</span><span className="font-medium">{clusterData.stats.engagementRate}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Verified Experts</span><span className="font-medium tabular-nums">{clusterData.stats.verifiedExperts}</span></div>
              </div>
            </div>

            {/* Rules */}
            <div className="bg-card rounded-xl shadow-surface p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="text-accent">📋</span> Cluster Rules
              </h3>
              <ol className="space-y-3">
                {clusterData.rules.map((rule, i) => (
                  <li key={i}>
                    <p className="text-sm font-medium text-foreground"><span className="text-accent mr-1">{i + 1}.</span>{rule.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{rule.desc}</p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Moderators */}
            <div className="bg-card rounded-xl shadow-surface p-4">
              <h3 className="font-semibold text-foreground mb-3">🛡️ Moderators</h3>
              <div className="space-y-2.5">
                {clusterData.moderators.map((mod) => (
                  <div key={mod.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px] bg-muted">{mod.name[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground">{mod.name}</span>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${mod.role === "FOUNDER" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>
                      {mod.role}
                    </span>
                  </div>
                ))}
              </div>
              <button className="text-sm text-accent font-medium mt-3 hover:underline">View all 12 moderators</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ClusterPage;
