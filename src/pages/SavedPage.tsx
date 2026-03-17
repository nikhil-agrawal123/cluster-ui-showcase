import { motion } from "framer-motion";
import { Bookmark, Clock, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

const savedWindows = [
  { id: "s1", title: "The future of local-first software and collaborative CRDTs", community: "TechEnthusiasts", savedAt: "2 days ago", comments: 84 },
  { id: "s2", title: "New Tailwind UI patterns for high-density dashboards", community: "DesignSystems", savedAt: "3 days ago", comments: 42 },
  { id: "s3", title: "How we reduced our LCP from 4.2s to 0.8s with streaming SSR", community: "WebPerformance", savedAt: "5 days ago", comments: 31 },
  { id: "s4", title: "Building a custom mechanical keyboard from scratch with RP2040", community: "HardwareHacking", savedAt: "1 week ago", comments: 67 },
  { id: "s5", title: "Zero-trust architecture: Beyond the buzzword", community: "CyberSecurity", savedAt: "1 week ago", comments: 112 },
  { id: "s6", title: "Practical guide to fine-tuning LLMs on consumer hardware", community: "MLResearch", savedAt: "2 weeks ago", comments: 203 },
];

const SavedPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
      <div className="flex gap-6">
        <Sidebar />
        <main className="flex-1 min-w-0 space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Bookmark className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Saved Windows</h1>
              <p className="text-sm text-muted-foreground">{savedWindows.length} windows saved for later.</p>
            </div>
          </motion.div>

          <div className="space-y-2">
            {savedWindows.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <Link to={`/post/${item.id}`}>
                  <div className="bg-card rounded-xl shadow-surface p-4 hover:shadow-surface-hover transition-shadow group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-accent font-medium mb-1">c/{item.community}</p>
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors leading-snug">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Saved {item.savedAt}</span>
                          <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {item.comments} comments</span>
                        </div>
                      </div>
                      <Bookmark className="h-4 w-4 text-accent shrink-0 mt-1 fill-accent" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </main>
      </div>
    </div>
  </div>
);

export default SavedPage;
