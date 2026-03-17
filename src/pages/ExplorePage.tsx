import { motion } from "framer-motion";
import { Compass, Search, Users } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const exploreClusters = [
  { name: "HardwareHacking", tag: "HW", color: "bg-emerald-500", members: "4.2k", desc: "DIY electronics, custom PCBs, and maker culture." },
  { name: "WebPerformance", tag: "WP", color: "bg-blue-500", members: "2.1k", desc: "Core Web Vitals, optimization, and speed." },
  { name: "CyberSecurity", tag: "CS", color: "bg-red-500", members: "12k", desc: "Infosec, pen testing, and vulnerability research." },
  { name: "DesignSystems", tag: "DS", color: "bg-purple-500", members: "8.4k", desc: "Component libraries, tokens, and design ops." },
  { name: "MLResearch", tag: "ML", color: "bg-amber-500", members: "15k", desc: "Machine learning papers, experiments, and tools." },
  { name: "GameDev", tag: "GD", color: "bg-pink-500", members: "6.7k", desc: "Game engines, shaders, and indie development." },
  { name: "CloudNative", tag: "CN", color: "bg-cyan-500", members: "9.3k", desc: "Kubernetes, Docker, and cloud infrastructure." },
  { name: "OpenSource", tag: "OS", color: "bg-green-500", members: "22k", desc: "Contributing, maintaining, and building in the open." },
  { name: "DataViz", tag: "DV", color: "bg-indigo-500", members: "3.8k", desc: "Charts, maps, and visual storytelling with data." },
];

const ExplorePage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
      <div className="flex gap-6">
        <Sidebar />
        <main className="flex-1 min-w-0 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center gap-3 mb-1">
              <Compass className="h-6 w-6 text-accent" />
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Explore Clusters</h1>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Discover communities that match your interests.</p>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search clusters..." className="pl-9 h-10 bg-card border-border rounded-xl text-sm" />
            </div>
          </motion.div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {exploreClusters.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                className="bg-card rounded-xl shadow-surface p-5 hover:shadow-surface-hover transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center text-xs font-bold text-white`}>
                    {c.tag}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">c/{c.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> {c.members} members</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                <Button variant="outline" size="sm" className="mt-4 w-full h-8 text-xs border-accent text-accent hover:bg-accent hover:text-accent-foreground rounded-lg">
                  Join Cluster
                </Button>
              </motion.div>
            ))}
          </div>
        </main>
      </div>
    </div>
  </div>
);

export default ExplorePage;
