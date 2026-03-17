import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const clusters = [
  { name: "HardwareHacking", members: "4.2k active members" },
  { name: "WebPerformance", members: "2.1k active members" },
  { name: "CyberSecurity", members: "12k active members" },
];

const TrendingClusters = () => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1, duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
    className="bg-card rounded-xl shadow-surface p-4"
  >
    <h3 className="font-semibold text-foreground mb-4">Trending Clusters</h3>
    <div className="space-y-3">
      {clusters.map((c) => (
        <div key={c.name} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
              {c.name[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">c/{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.members}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-xs border-accent text-accent hover:bg-accent hover:text-accent-foreground rounded-full px-4">
            Join
          </Button>
        </div>
      ))}
    </div>
    <button className="w-full text-center text-sm text-accent font-medium mt-4 hover:underline">
      View All
    </button>
  </motion.div>
);

export default TrendingClusters;
